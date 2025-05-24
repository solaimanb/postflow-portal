"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
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
const SCHEDULED_COUNT_UPDATE_INTERVAL = 5000;

interface DashboardContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  topics: FacebookTopic[];
  pages: FacebookPage[];
  loading: boolean;
  scheduledPostCount: number;
  notification: { type: "success" | "error"; message: string } | null;
  setNotification: (
    notification: { type: "success" | "error"; message: string } | null
  ) => void;
  handleSearch: (params: TopicSearchParams) => Promise<void>;
  handlePostNow: (params: PostScheduleParams) => Promise<void>;
  handleSchedulePost: (params: PostScheduleParams) => Promise<void>;
}

// ======================================================
// Client-only Dashboard Content Component
// ======================================================
const DashboardContent = ({
  activeTab,
  setActiveTab,
  topics,
  pages,
  loading,
  scheduledPostCount,
  notification,
  setNotification,
  handleSearch,
  handlePostNow,
  handleSchedulePost,
}: DashboardContentProps) => {
  return (
    <>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header */}
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

      {/* Navigation Tabs */}
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

      {/* Tab Content */}
      {activeTab === "topics" && (
        <TopicsTabContent
          topics={topics}
          loading={loading}
          handleSearch={handleSearch}
        />
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
  );
};

interface TopicsTabContentProps {
  topics: FacebookTopic[];
  loading: boolean;
  handleSearch: (params: TopicSearchParams) => Promise<void>;
}

const TopicsTabContent = ({
  topics,
  loading,
  handleSearch,
}: TopicsTabContentProps) => {
  return (
    <>
      <TopicSearch onSearch={handleSearch} isLoading={loading} />
      {topics.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900">Search Results</h3>
          <ul className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic: FacebookTopic) => (
              <li
                key={topic.id}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="px-4 py-5 sm:p-6">
                  <h4 className="text-lg font-semibold">{topic.topic}</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Score: {topic.popularityScore}/100
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {topic.keywords.map((keyword: string) => (
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
  );
};

const ClientOnlyDashboardContent = dynamic(
  () => Promise.resolve(DashboardContent),
  { ssr: false }
);

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

  const fetchUserPages = useCallback(
    async (email: string) => {
      try {
        console.log("Fetching pages for user:", email);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const userPages = await getUserPages(email);
        console.log("Pages fetched successfully:", userPages.length);

        if (userPages.length === 0) {
          console.log("No pages found, adding a mock page for testing");
          setPages([
            {
              id: "mock-page-id",
              name: "Mock Page (For Testing)",
              pageId: "mock-fb-page-id",
              accessToken: "mock-token",
            },
          ]);
          showNotification(
            "error",
            "Using mock page for testing. Add real pages in the Page Setup tab."
          );
        } else {
          setPages(userPages);
        }
      } catch (error) {
        console.error("Error fetching pages:", error);
        console.log("Error occurred, adding a mock page for testing");
        setPages([
          {
            id: "mock-page-id",
            name: "Mock Page (For Testing)",
            pageId: "mock-fb-page-id",
            accessToken: "mock-token",
          },
        ]);

        showNotification(
          "error",
          "Failed to fetch Facebook pages. Using mock page for testing."
        );
      }
    },
    [showNotification]
  );

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
        id: "",
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
        id: "",
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

      updateScheduledPostCount();
    } catch (error) {
      console.error("Error scheduling post:", error);
      showNotification("error", "Failed to schedule post. Please try again.");
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    if (!isLoggedIn()) {
      console.log("User not logged in, redirecting to login page");
      router.push("/login");
      return;
    }

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

  useEffect(() => {
    if (!isClient) return;
    const checkScheduledPosts = async () => {
      try {
        await processScheduledPosts();
        updateScheduledPostCount();
      } catch (error) {
        console.error("Error checking scheduled posts:", error);
      }
    };

    checkScheduledPosts();
    const intervalId = setInterval(
      checkScheduledPosts,
      SCHEDULED_POST_CHECK_INTERVAL
    );

    return () => clearInterval(intervalId);
  }, [isClient, updateScheduledPostCount]);

  useEffect(() => {
    if (!isClient) return;
    updateScheduledPostCount();
    const countInterval = setInterval(
      updateScheduledPostCount,
      SCHEDULED_COUNT_UPDATE_INTERVAL
    );

    return () => clearInterval(countInterval);
  }, [isClient, updateScheduledPostCount]);

  return (
    <div className="container mx-auto px-4 py-8">
      {isClient ? (
        <ClientOnlyDashboardContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          topics={topics}
          pages={pages}
          loading={loading}
          scheduledPostCount={scheduledPostCount}
          notification={notification}
          setNotification={setNotification}
          handleSearch={handleSearch}
          handlePostNow={handlePostNow}
          handleSchedulePost={handleSchedulePost}
        />
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
