import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";

// Session storage keys
const SESSION_USER_KEY = "user";
const SESSION_AUTH_KEY = "auth_token";
const SESSION_TOKEN_EXPIRY = "token_expiry";
const LOGIN_ATTEMPTS_KEY = "login_attempts";

// Token expiration time (2 hours in milliseconds)
const TOKEN_EXPIRATION = 2 * 60 * 60 * 1000;

// Maximum login attempts before cooldown
const MAX_LOGIN_ATTEMPTS = 5;
// Cooldown period after max attempts (15 minutes in milliseconds)
const LOGIN_COOLDOWN = 15 * 60 * 1000;

// User type definition
export interface AdminUser {
  email: string;
  role: string;
  name: string;
}

// Login attempts tracking interface
interface LoginAttempts {
  count: number;
  lastAttempt: number;
  cooldownUntil?: number;
}

// Get user data from Firestore
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

// Check if the user is an admin
export const isUserAdmin = async (email: string): Promise<boolean> => {
  try {
    const userData = await getUserData(email);
    return Boolean(userData && userData.role === "admin");
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

// Verify password against the stored hash
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

// Generate a secure auth token with expiration
const generateAuthToken = (email: string): string => {
  return btoa(
    `${email}:${new Date().getTime()}:${Math.random()
      .toString(36)
      .substring(2)}`
  );
};

// Get login attempts from session storage
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

// Update login attempts in session storage
const updateLoginAttempts = (email: string, success: boolean): void => {
  try {
    const attemptsJson = sessionStorage.getItem(LOGIN_ATTEMPTS_KEY);
    const attempts = attemptsJson ? JSON.parse(attemptsJson) : {};
    const emailKey = email.toLowerCase();

    if (success) {
      // Reset attempts on successful login
      delete attempts[emailKey];
    } else {
      // Increment attempts on failed login
      const currentAttempts = attempts[emailKey] || {
        count: 0,
        lastAttempt: 0,
      };
      currentAttempts.count += 1;
      currentAttempts.lastAttempt = Date.now();

      // Set cooldown if max attempts reached
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

// Sign in with email and password (using Firestore for verification)
export const loginWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<AdminUser> => {
  try {
    // Check for login attempt limits
    const attempts = getLoginAttempts(email);
    if (attempts.cooldownUntil && Date.now() < attempts.cooldownUntil) {
      const minutesLeft = Math.ceil(
        (attempts.cooldownUntil - Date.now()) / 60000
      );
      throw new Error(
        `Too many login attempts. Please try again in ${minutesLeft} minutes.`
      );
    }

    // First, check if the user exists in Firestore and is an admin
    const userData = await getUserData(email);

    if (!userData) {
      updateLoginAttempts(email, false);
      throw new Error("User not found");
    }

    if (userData.role !== "admin") {
      updateLoginAttempts(email, false);
      throw new Error("Unauthorized access");
    }

    // Verify the password against the stored hash
    const passwordValid = await verifyPassword(password, userData.password);

    if (!passwordValid) {
      updateLoginAttempts(email, false);
      throw new Error("Invalid password");
    }

    // Reset login attempts on successful login
    updateLoginAttempts(email, true);

    // Generate an auth token and set expiration
    const authToken = generateAuthToken(email);
    const expiryTime = Date.now() + TOKEN_EXPIRATION;

    // Save user data and token to session storage
    const user: AdminUser = {
      email: email.toLowerCase(),
      role: userData.role,
      name: userData.name || "Admin User",
    };

    // Store in session storage
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

// Check if user is currently logged in with valid token
export const isLoggedIn = (): boolean => {
  try {
    const token = sessionStorage.getItem(SESSION_AUTH_KEY);
    const expiryTimeStr = sessionStorage.getItem(SESSION_TOKEN_EXPIRY);

    if (!token || !expiryTimeStr) {
      return false;
    }

    // Check if token has expired
    const expiryTime = parseInt(expiryTimeStr, 10);
    if (Date.now() > expiryTime) {
      // Clear expired session
      sessionStorage.removeItem(SESSION_USER_KEY);
      sessionStorage.removeItem(SESSION_AUTH_KEY);
      sessionStorage.removeItem(SESSION_TOKEN_EXPIRY);
      return false;
    }

    return true;
  } catch {
    return false; // Handle cases where sessionStorage is not available
  }
};

// Get current user from session storage
export const getCurrentUser = (): AdminUser | null => {
  try {
    // First check if session is valid
    if (!isLoggedIn()) {
      return null;
    }

    const userJson = sessionStorage.getItem(SESSION_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
};

// Sign out the current user
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
