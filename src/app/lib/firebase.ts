// Import the necessary Firebase modules
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5RtPuwb0c3V0U2nl-8nR9ENYDqfFxGyU",
  authDomain: "postflow-portal.firebaseapp.com",
  projectId: "postflow-portal",
  storageBucket: "postflow-portal.firebasestorage.app",
  messagingSenderId: "964887768204",
  appId: "1:964887768204:web:7a3fc7d8a72b090c299fa9"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
