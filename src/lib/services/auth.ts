/**
 * Authentication Service
 *
 * Handles user authentication, session management, and security features
 * for the application's admin users.
 */

import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";

// ======================================================
// Constants and Configuration - Session storage keys
// & Security settings
// ======================================================
const SESSION_USER_KEY = "user";
const SESSION_AUTH_KEY = "auth_token";
const SESSION_TOKEN_EXPIRY = "token_expiry";
const LOGIN_ATTEMPTS_KEY = "login_attempts";

const TOKEN_EXPIRATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_COOLDOWN = 15 * 60 * 1000; // 15 minutes in milliseconds

// ======================================================
// Types and Interfaces
// ======================================================
export interface AdminUser {
  email: string;
  role: string;
  name: string;
}

interface LoginAttempts {
  count: number;
  lastAttempt: number;
  cooldownUntil?: number;
}

// ======================================================
// User Data Access - Retrieves user data from Firestore
// & Checks if a user has admin privileges
// ======================================================
export const getUserData = async (email: string) => {
  try {
    const userRef = doc(db, "authorized_users", email.toLowerCase());
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

export const isUserAdmin = async (email: string): Promise<boolean> => {
  try {
    const userData = await getUserData(email);
    return Boolean(userData && userData.role === "admin");
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

// ======================================================
// Authentication Utilities - Verifies password
// & Generates auth token
// ======================================================
export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
};

const generateAuthToken = (email: string): string => {
  return btoa(
    `${email}:${new Date().getTime()}:${Math.random()
      .toString(36)
      .substring(2)}`
  );
};

// ======================================================
// Security and Rate Limiting - Retrieves login attempt data
// & Updates login attempt tracking data
// ======================================================
const getLoginAttempts = (email: string): LoginAttempts => {
  try {
    const attemptsJson = sessionStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (!attemptsJson) {
      return { count: 0, lastAttempt: 0 };
    }

    const attempts = JSON.parse(attemptsJson);
    return attempts[email.toLowerCase()] || { count: 0, lastAttempt: 0 };
  } catch {
    return { count: 0, lastAttempt: 0 };
  }
};

const updateLoginAttempts = (email: string, success: boolean): void => {
  try {
    const attemptsJson = sessionStorage.getItem(LOGIN_ATTEMPTS_KEY);
    const attempts = attemptsJson ? JSON.parse(attemptsJson) : {};
    const emailKey = email.toLowerCase();

    if (success) {
      delete attempts[emailKey];
    } else {
      const currentAttempts = attempts[emailKey] || {
        count: 0,
        lastAttempt: 0,
      };
      currentAttempts.count += 1;
      currentAttempts.lastAttempt = Date.now();

      if (currentAttempts.count >= MAX_LOGIN_ATTEMPTS) {
        currentAttempts.cooldownUntil = Date.now() + LOGIN_COOLDOWN;
      }

      attempts[emailKey] = currentAttempts;
    }

    sessionStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch (error) {
    console.error("Error updating login attempts:", error);
  }
};

// ======================================================
// Authentication API - Authenticates a user with
// email and password
// ======================================================
export const loginWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<AdminUser> => {
  try {
    const attempts = getLoginAttempts(email);
    if (attempts.cooldownUntil && Date.now() < attempts.cooldownUntil) {
      const minutesLeft = Math.ceil(
        (attempts.cooldownUntil - Date.now()) / 60000
      );
      throw new Error(
        `Too many login attempts. Please try again in ${minutesLeft} minutes.`
      );
    }

    const userData = await getUserData(email);

    if (!userData) {
      updateLoginAttempts(email, false);
      throw new Error("User not found");
    }

    if (userData.role !== "admin") {
      updateLoginAttempts(email, false);
      throw new Error("Unauthorized access");
    }

    const passwordValid = await verifyPassword(password, userData.password);

    if (!passwordValid) {
      updateLoginAttempts(email, false);
      throw new Error("Invalid password");
    }

    updateLoginAttempts(email, true);

    const authToken = generateAuthToken(email);
    const expiryTime = Date.now() + TOKEN_EXPIRATION;

    const user: AdminUser = {
      email: email.toLowerCase(),
      role: userData.role,
      name: userData.name || "Admin User",
    };

    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(SESSION_AUTH_KEY, authToken);
    sessionStorage.setItem(SESSION_TOKEN_EXPIRY, expiryTime.toString());

    return user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error instanceof Error
      ? error
      : new Error("Invalid email or password");
  }
};

// ======================================================
// Session Management - Checks if a user is currently logged in
// & Retrieves the current user, Signs out the current user
// ======================================================
export const isLoggedIn = (): boolean => {
  try {
    const token = sessionStorage.getItem(SESSION_AUTH_KEY);
    const expiryTimeStr = sessionStorage.getItem(SESSION_TOKEN_EXPIRY);

    if (!token || !expiryTimeStr) {
      return false;
    }

    const expiryTime = parseInt(expiryTimeStr, 10);
    if (Date.now() > expiryTime) {
      sessionStorage.removeItem(SESSION_USER_KEY);
      sessionStorage.removeItem(SESSION_AUTH_KEY);
      sessionStorage.removeItem(SESSION_TOKEN_EXPIRY);
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

export const getCurrentUser = (): AdminUser | null => {
  try {
    if (!isLoggedIn()) {
      return null;
    }

    const userJson = sessionStorage.getItem(SESSION_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
};

export const logoutUser = (): void => {
  try {
    sessionStorage.removeItem(SESSION_USER_KEY);
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_EXPIRY);
  } catch (error) {
    console.error("Error signing out:", error);
    throw new Error("Failed to sign out");
  }
};
