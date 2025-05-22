import admin from "firebase-admin";
import bcrypt from "bcryptjs";

// Initialize Firebase Admin SDK using environment variable pointing to service account
admin.initializeApp();
const db = admin.firestore();

// List of authorized admin users with proper password hashing
const adminUsers = [
  {
    email: "admin@portal.com",
    role: "admin",
    name: "Primary Admin",
    createdAt: new Date(),
    // Password will be hashed before storing
    plainPassword: "admin122",
  },
];

// Add the admin users to Firestore
async function initializeAdminUsers() {
  try {
    console.log("Starting to initialize admin users in Firestore...");

    // Process each user and hash their password
    for (const user of adminUsers) {
      const { plainPassword, ...userWithoutPlainPw } = user;

      // Hash the password with bcrypt (10 rounds)
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Create the user object with hashed password
      const userToStore = {
        ...userWithoutPlainPw,
        password: hashedPassword,
      };

      // Store in Firestore
      const userRef = db
        .collection("authorized_users")
        .doc(user.email.toLowerCase());

      await userRef.set(userToStore);
      console.log(`Prepared admin user: ${user.email}`);
    }

    console.log(
      `Successfully added ${adminUsers.length} admin users to authorized_users collection.`
    );
    console.log(
      "These users can now sign in with email and password to access the portal."
    );
  } catch (error) {
    console.error("Error initializing admin users:", error);
  }
}

// Run the initialization
initializeAdminUsers()
  .then(() => {
    console.log("Admin user initialization completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  }); 