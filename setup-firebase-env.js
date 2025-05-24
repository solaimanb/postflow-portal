/* eslint-disable */
const fs = require("fs");
const dotenv = require("dotenv");

// Load environment variables from .env.local
console.log("Loading environment variables from .env.local");
const envConfig = dotenv.parse(fs.readFileSync(".env.local"));

// Create a firebase-env.json file for deployment
console.log("Creating firebase-env.json for deployment");
const firebaseEnv = {
  hosting: {
    env: {},
  },
};

// Add all NEXT_PUBLIC_ variables to the firebase-env.json file
Object.entries(envConfig).forEach(([key, value]) => {
  if (key.startsWith("NEXT_PUBLIC_")) {
    firebaseEnv.hosting.env[key] = value;
  }
});

// Write the firebase-env.json file
fs.writeFileSync("firebase-env.json", JSON.stringify(firebaseEnv, null, 2));
console.log("firebase-env.json created successfully");

// Merge with firebase.json
console.log("Merging environment variables with firebase.json");
const firebaseJson = JSON.parse(fs.readFileSync("firebase.json", "utf8"));
firebaseJson.hosting.env = firebaseEnv.hosting.env;
fs.writeFileSync("firebase.json", JSON.stringify(firebaseJson, null, 2));
console.log("Environment variables merged with firebase.json successfully");

console.log("Setup complete! You can now deploy with: npm run deploy");
