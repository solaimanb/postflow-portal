import { db } from "../../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { FacebookPage } from "../types";

/**
 * Get all Facebook pages associated with a user
 */
export const getUserPages = async (userId: string): Promise<FacebookPage[]> => {
  try {
    const pagesQuery = query(
      collection(db, "facebook_pages"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(pagesQuery);
    const pages = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as FacebookPage)
    );

    return pages;
  } catch (error) {
    console.error("Error fetching Facebook pages:", error);
    throw new Error("Failed to fetch Facebook pages");
  }
};
