/**
 * Firebase Configuration
 *
 * This file initializes the Firebase app and exports the necessary services
 * for use throughout the application.
 */

// Core Firebase imports
import { initializeApp, getApps, getApp } from "firebase/app";

// Firebase service imports
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * Firebase configuration object
 * Contains API keys and identifiers for the Firebase project
 */
const firebaseConfig = {
  apiKey: "AIzaSyC5RtPuwb0c3V0U2nl-8nR9ENYDqfFxGyU",
  authDomain: "postflow-portal.firebaseapp.com",
  projectId: "postflow-portal",
  storageBucket: "postflow-portal.firebasestorage.app",
  messagingSenderId: "964887768204",
  appId: "1:964887768204:web:7a3fc7d8a72b090c299fa9",
};

/**
 * Initialize Firebase
 * This prevents re-initializing the app if it already exists
 */
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * Firebase services
 */
const db = getFirestore(app);
const auth = getAuth(app);

// Export initialized services
export { app, db, auth };
