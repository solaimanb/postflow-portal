// Runtime configuration for the application
// This file is used to provide environment variables at runtime
// It's especially useful for Firebase Hosting where environment variables
// might not be properly loaded

const config = {
  // Apify configuration
  apify: {
    apiKey: process.env.NEXT_PUBLIC_APIFY_API_KEY,
    actorId: process.env.NEXT_PUBLIC_APIFY_ACTOR_ID,
  },

  // Firebase configuration
  firebase: {
    apiKey:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      "AIzaSyC5RtPuwb0c3V0U2nl-8nR9ENYDqfFxGyU",
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      "postflow-portal.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "postflow-portal",
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      "postflow-portal.firebasestorage.app",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "964887768204",
    appId:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
      "1:964887768204:web:7a3fc7d8a72b090c299fa9",
  },

  // Facebook configuration
  facebook: {
    appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
    accessToken: process.env.NEXT_PUBLIC_ACCESS_TOKEN,
  },
};

export default config;
