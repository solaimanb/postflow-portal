"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, getCurrentUser } from "../../lib/services/auth";
import {
  searchTopics,
  getUserPages,
  createPost,
  processScheduledPosts,
} from "../../lib/services/facebook";
import {
  FacebookTopic,
  FacebookPage,
  PostScheduleParams,
  TopicSearchParams,
} from "../../types";
import TopicSearch from "../../../components/TopicSearch";
import PostForm from "../../../components/PostForm";
import FacebookPageSetup from "../../../components/FacebookPageSetup";
import Notification from "../../../components/Notification";

const SCHEDULED_POST_CHECK_INTERVAL = 20000;

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("topics");
  const [topics, setTopics] = useState<FacebookTopic[]>([]);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [scheduledPostCount, setScheduledPostCount] = useState(0);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  const showNotification = useCallback(
    (type: "success" | "error", message: string) => {
      setNotification({ type, message });
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    },
    []
  );

  const fetchUserPages = useCallback(
    async (email: string) => {
      try {
        console.log("Fetching pages for user:", email);
        const userPages = await getUserPages(email);
        console.log("Pages fetched successfully:", userPages.length);
        setPages(userPages);

        // If no pages found, show a helpful message
        if (userPages.length === 0) {
          showNotification(
            "error",
            "No Facebook pages found. Please add pages in the Page Setup tab."
          );
        }
      } catch (error) {
        console.error("Error fetching pages:", error);
        showNotification(
          "error",
          "Failed to fetch Facebook pages. Please check console for details."
        );
      }
    },
    [showNotification]
  );

  // This effect runs once to mark that we're on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run authentication check on the client side
    if (!isClient) return;

    // Check if user is authenticated
    if (!isLoggedIn()) {
      console.log("User not logged in, redirecting to login page");
      router.push("/login");
      return;
    }

    // If authenticated, fetch user pages
    const user = getCurrentUser();
    if (user) {
      console.log("User authenticated:", user.email);
      fetchUserPages(user.email);
    } else {
      console.error(
        "getCurrentUser() returned null despite isLoggedIn() being true"
      );
      showNotification(
        "error",
        "Authentication error. Please try logging in again."
      );
      router.push("/login");
    }
  }, [router, isClient, fetchUserPages, showNotification]);

  // Update the count of scheduled posts
  const updateScheduledPostCount = useCallback(() => {
    try {
      const postsJson = localStorage.getItem("scheduled_posts");
      if (postsJson) {
        const posts = JSON.parse(postsJson);
        if (Array.isArray(posts)) {
          setScheduledPostCount(
            posts.filter((post) => post.status === "scheduled").length
          );
        }
      } else {
        setScheduledPostCount(0);
      }
    } catch (error) {
      console.error("Error counting scheduled posts:", error);
      setScheduledPostCount(0);
    }
  }, []);

  // Automatically check for scheduled posts that need to be published
  useEffect(() => {
    // Only run on the client side
    if (!isClient) return;

    // Process any scheduled posts immediately when dashboard loads
    const checkScheduledPosts = async () => {
      try {
        await processScheduledPosts();
        updateScheduledPostCount();
      } catch (error) {
        console.error("Error checking scheduled posts:", error);
      }
    };

    // Run immediately on component mount
    checkScheduledPosts();

    // Set up interval to check regularly
    const intervalId = setInterval(
      checkScheduledPosts,
      SCHEDULED_POST_CHECK_INTERVAL
    );

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [isClient, updateScheduledPostCount]);

  // Set up another effect to update the count regularly
  useEffect(() => {
    // Only run on the client side
    if (!isClient) return;

    updateScheduledPostCount();

    const countInterval = setInterval(updateScheduledPostCount, 5000);

    return () => clearInterval(countInterval);
  }, [isClient, updateScheduledPostCount]);

  const handleSearch = async (params: TopicSearchParams) => {
    setLoading(true);
    try {
      const results = await searchTopics(params);
      setTopics(results);
      console.log(
        `Found ${results.length} topics related to "${params.keyword}"`
      );
    } catch (error) {
      console.error("Error searching topics:", error);
      showNotification("error", "Failed to search topics");
    } finally {
      setLoading(false);
    }
  };

  const handlePostNow = async (params: PostScheduleParams) => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      const postIds = await createPost(user.email, {
        id: "", // Will be assigned by Firestore
        content: params.content,
        pageIds: params.pageIds,
        authorId: user.email,
        createdAt: new Date().toISOString(),
        status: "published",
        mediaUrls: params.mediaUrls,
        mediaFiles: params.mediaFiles,
      });

      if (postIds.length === params.pageIds.length) {
        showNotification(
          "success",
          `Successfully posted to all ${postIds.length} selected pages.`
        );
      } else {
        showNotification(
          "success",
          `Posted to ${postIds.length} of ${params.pageIds.length} selected pages.`
        );
      }
    } catch (error) {
      console.error("Error publishing post:", error);
      showNotification("error", "Failed to publish post. Please try again.");
    }
  };

  const handleSchedulePost = async (params: PostScheduleParams) => {
    const user = getCurrentUser();
    if (!user || !params.scheduledFor) return;

    try {
      // Note: mediaFiles are not supported for scheduled posts
      // This should be prevented in the UI already
      await createPost(user.email, {
        id: "", // Will be assigned by Firestore
        content: params.content,
        pageIds: params.pageIds,
        authorId: user.email,
        createdAt: new Date().toISOString(),
        scheduledFor: params.scheduledFor,
        status: "scheduled",
        mediaUrls: params.mediaUrls,
      });

      showNotification(
        "success",
        `Post scheduled for ${new Date(params.scheduledFor).toLocaleString()}`
      );

      // Update the scheduled post count
      updateScheduledPostCount();
    } catch (error) {
      console.error("Error scheduling post:", error);
      showNotification("error", "Failed to schedule post. Please try again.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {isClient ? (
        <>
          {notification && (
            <Notification
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          )}

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">
              Manage your social media content and scheduled posts.
              {scheduledPostCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {scheduledPostCount} scheduled post
                  {scheduledPostCount !== 1 && "s"}
                </span>
              )}
            </p>
          </div>

          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("topics")}
                className={`${
                  activeTab === "topics"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Topic Search
              </button>
              <button
                onClick={() => setActiveTab("post")}
                className={`${
                  activeTab === "post"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Create Post
              </button>
              <button
                onClick={() => setActiveTab("pages")}
                className={`${
                  activeTab === "pages"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Page Setup
              </button>
            </nav>
          </div>

          {activeTab === "topics" && (
            <>
              <TopicSearch onSearch={handleSearch} isLoading={loading} />
              {topics.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Search Results
                  </h3>
                  <ul className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {topics.map((topic) => (
                      <li
                        key={topic.id}
                        className="bg-white overflow-hidden shadow rounded-lg"
                      >
                        <div className="px-4 py-5 sm:p-6">
                          <h4 className="text-lg font-semibold">
                            {topic.topic}
                          </h4>
                          <p className="mt-1 text-sm text-gray-500">
                            Score: {topic.popularityScore}/100
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {topic.keywords.map((keyword) => (
                              <span
                                key={keyword}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {activeTab === "post" && (
            <PostForm
              pages={pages}
              onPostNow={handlePostNow}
              onSchedulePost={handleSchedulePost}
            />
          )}

          {activeTab === "pages" && <FacebookPageSetup />}
        </>
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading dashboard...</h2>
            <p className="text-gray-600">
              Please wait while we set up your dashboard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
