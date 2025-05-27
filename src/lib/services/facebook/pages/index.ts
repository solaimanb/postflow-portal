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

/**
 * Get total count of Facebook pages for a user
 */
export const getTotalPages = async (userId: string): Promise<number> => {
  try {
    const pagesQuery = query(
      collection(db, "facebook_pages"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(pagesQuery);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting total pages count:", error);
    return 0;
  }
};

/**
 * Get pages count by status
 */
export const getPagesByStatus = async (userId: string, status: string): Promise<number> => {
  try {
    const pagesQuery = query(
      collection(db, "facebook_pages"),
      where("userId", "==", userId),
      where("status", "==", status)
    );

    const snapshot = await getDocs(pagesQuery);
    return snapshot.size;
  } catch (error) {
    console.error(`Error getting ${status} pages count:`, error);
    return 0;
  }
};
