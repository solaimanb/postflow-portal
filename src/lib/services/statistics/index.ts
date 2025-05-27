import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getCurrentUser } from "../auth";
import { getTotalPages } from "../facebook/pages";

export interface DashboardStats {
  activePages: {
    count: number;
    monthlyChange: number;
  };
  monthlyUsage: {
    searches: number;
    comments: number;
  };
  postsDistributed: {
    total: number;
  };
  currentBill: {
    amount: number;
  };
}

// Initialize default statistics in Firestore
export const initializeDefaultStats = async (userId: string) => {
  try {
    // Add a default page
    await addDoc(collection(db, "facebook_pages"), {
      userId,
      name: "Demo Page",
      pageId: "demo123",
      createdAt: serverTimestamp(),
      status: "active",
    });

    // Add some default topic searches
    await addDoc(collection(db, "topic_searches"), {
      userId,
      keyword: "Example Search",
      month: new Date().getMonth(),
      createdAt: serverTimestamp(),
    });

    // Add some default comments
    await addDoc(collection(db, "post_comments"), {
      userId,
      postLink: "https://facebook.com/example",
      comments: ["Great post!"],
      month: new Date().getMonth(),
      createdAt: serverTimestamp(),
    });

    // Add a default post
    await addDoc(collection(db, "posts"), {
      userId,
      content: "Example Post",
      status: "distributed",
      createdAt: serverTimestamp(),
    });

    // Add a default billing record
    await addDoc(collection(db, "billing"), {
      userId,
      amount: 0,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error initializing default stats:", error);
  }
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    // Get total pages count using the new function
    const activePages = await getTotalPages(user.email);

    // If no data exists, initialize with defaults
    if (activePages === 0) {
      await initializeDefaultStats(user.email);
      return {
        activePages: {
          count: 1,
          monthlyChange: 1,
        },
        monthlyUsage: {
          searches: 1,
          comments: 1,
        },
        postsDistributed: {
          total: 1,
        },
        currentBill: {
          amount: 0,
        },
      };
    }

    // Get monthly change in pages (comparing with last month)
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastMonthPagesQuery = query(
      collection(db, "facebook_pages"),
      where("userId", "==", user.email),
      where("createdAt", "<=", lastMonthDate)
    );
    const lastMonthPagesSnapshot = await getDocs(lastMonthPagesQuery);
    const monthlyChange = activePages - lastMonthPagesSnapshot.size;

    // Get monthly searches
    const currentMonth = new Date().getMonth();
    const searchesQuery = query(
      collection(db, "topic_searches"),
      where("userId", "==", user.email),
      where("month", "==", currentMonth)
    );
    const searchesSnapshot = await getDocs(searchesQuery);
    const monthlySearches = searchesSnapshot.size;

    // Get monthly comments
    const commentsQuery = query(
      collection(db, "post_comments"),
      where("userId", "==", user.email),
      where("month", "==", currentMonth)
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    const monthlyComments = commentsSnapshot.size;

    // Get total distributed posts
    const postsQuery = query(
      collection(db, "posts"),
      where("userId", "==", user.email),
      where("status", "==", "distributed")
    );
    const postsSnapshot = await getDocs(postsQuery);
    const totalPosts = postsSnapshot.size;

    // Get current bill (most recent billing record)
    const billsQuery = query(
      collection(db, "billing"),
      where("userId", "==", user.email),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const billsSnapshot = await getDocs(billsQuery);
    const currentBill = billsSnapshot.empty ? 0 : billsSnapshot.docs[0].data().amount;

    return {
      activePages: {
        count: activePages,
        monthlyChange,
      },
      monthlyUsage: {
        searches: monthlySearches,
        comments: monthlyComments,
      },
      postsDistributed: {
        total: totalPosts,
      },
      currentBill: {
        amount: currentBill,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    // Return default values if there's an error
    return {
      activePages: {
        count: 0,
        monthlyChange: 0,
      },
      monthlyUsage: {
        searches: 0,
        comments: 0,
      },
      postsDistributed: {
        total: 0,
      },
      currentBill: {
        amount: 0,
      },
    };
  }
};
