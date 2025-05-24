"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { isLoggedIn, getCurrentUser } from "../../../lib/services/auth";
import {
  searchTopics,
  getUserPages,
  createPost,
  processScheduledPosts,
} from "../../../lib/services/facebook";
import {
  FacebookTopic,
  FacebookPage,
  PostScheduleParams,
  TopicSearchParams,
} from "../../../types";
import TopicSearch from "../../../components/TopicSearch";
import TopicTable from "../../../components/TopicTable";
import PostForm from "../../../components/PostForm";
import FacebookPageSetup from "../../../components/FacebookPageSetup";
import Notification from "../../../components/Notification";
import ActorSelector from "../../../components/ActorSelector";
import CommentManager from "../../../components/CommentManager";
import config from "../../../lib/config";

const SCHEDULED_POST_CHECK_INTERVAL = 20000;
const SCHEDULED_COUNT_UPDATE_INTERVAL = 5000;

interface DashboardContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  topics: FacebookTopic[];
  pages: FacebookPage[];
  loading: boolean;
  scheduledPostCount: number;
  notification: { 
    type: "success" | "error" | "info"; 
    message: string;
    isPermissionError?: boolean;
  } | null;
  setNotification: (
    notification: { 
      type: "success" | "error" | "info"; 
      message: string;
      isPermissionError?: boolean;
    } | null
  ) => void;
  handleSearch: (params: TopicSearchParams) => Promise<void>;
  handlePostNow: (params: PostScheduleParams) => Promise<void>;
  handleSchedulePost: (params: PostScheduleParams) => Promise<void>;
  handleActorChange: (actorId: string) => void;
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
  handleActorChange,
}: DashboardContentProps) => {
  const currentActorId = config.apify.actorId || "blf62maenLRO8Rsfv";

  // Handle comment saved notification
  const handleCommentSaved = useCallback(
    (success: boolean, message: string) => {
      setNotification({
        type: success ? "success" : "error",
        message,
      });
    },
    [setNotification]
  );

  return (
    <>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          isPermissionError={notification.isPermissionError}
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
            onClick={() => setActiveTab("comments")}
            className={`${
              activeTab === "comments"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Manage Comments
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
          {/* <button
            onClick={() => setActiveTab("actor")}
            className={`${
              activeTab === "actor"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Actor Config
          </button> */}
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
      {activeTab === "comments" && (
        <CommentManager onCommentSaved={handleCommentSaved} />
      )}
      {activeTab === "actor" && (
        <ActorSelector
          currentActorId={currentActorId}
          onActorChange={handleActorChange}
        />
      )}
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
  // Handle CSV export
  const handleDownloadCSV = () => {
    if (topics.length === 0) return;

    // Function to properly escape and format CSV fields
    const escapeCSV = (field: string | number) => {
      // Convert to string if it's a number
      const value = String(field);
      
      // If the field contains commas, quotes, or newlines, we need to:
      // 1. Wrap it in quotes
      // 2. Double-escape any quotes inside the field
      if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Prepare CSV content
    const headers = ["Content", "Page", "Date", "Likes", "Comments", "Shares", "URL"];
    
    // Prepare rows with proper escaping
    const rows = topics.map((topic) => [
      escapeCSV(topic.text || topic.topic || ''),
      escapeCSV(topic.pageName || topic.relatedTopics?.[0] || 'Unknown'),
      escapeCSV(new Date(topic.time || topic.date).toLocaleString()),
      escapeCSV(topic.likes || 0),
      escapeCSV(topic.comments || 0),
      escapeCSV(topic.shares || 0),
      escapeCSV(topic.url || ''),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.join(","))
    ].join("\r\n"); // Use Windows-style line endings for better compatibility

    // Create download link with UTF-8 BOM for Excel compatibility
    const BOM = "\uFEFF"; // UTF-8 BOM
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `facebook-topics-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <TopicSearch onSearch={handleSearch} isLoading={loading} />
      {topics.length > 0 && (
        <TopicTable topics={topics} onDownloadCSV={handleDownloadCSV} />
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
    type: "success" | "error" | "info";
    message: string;
    isPermissionError?: boolean;
  } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  const showNotification = useCallback(
    (type: "success" | "error" | "info", message: string, isPermissionError?: boolean) => {
      setNotification({ type, message, isPermissionError });
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
        const userPages = await getUserPages(email);
        console.log("Pages fetched successfully:", userPages.length);
        setPages(userPages);
      } catch (error) {
        console.error("Error fetching pages:", error);
        setNotification({
          type: "error",
          message:
            "Failed to fetch Facebook pages. Please check your connection and try again.",
        });
      }
    },
    [setNotification]
  );

  const handleSearch = async (params: TopicSearchParams) => {
    setLoading(true);
    setTopics([]);
    try {
      console.log("Searching topics with params:", params);
      const fetchedTopics = await searchTopics(params);
      setTopics(fetchedTopics);

      if (fetchedTopics.length === 0) {
        setNotification({
          type: "info",
          message: "No topics found for the given search criteria.",
        });
      } else {
        setNotification({
          type: "success",
          message: `Found ${fetchedTopics.length} topics for "${params.keyword}"`,
        });
      }
    } catch (error) {
      console.error("Error searching topics:", error);

      let errorMessage = "Failed to search topics";
      let errorType: "error" | "info" = "error";

      if (error instanceof Error) {
        if (error.message.includes("API key not found")) {
          errorMessage =
            "API key configuration error. Please check your environment variables.";
        } else if (error.message.includes("requires a paid subscription")) {
          errorType = "info";
          errorMessage =
            error.message + " The free trial for this actor has expired.";
        } else if (error.message.includes("Apify API error")) {
          errorMessage =
            "Error connecting to the topic search service. Please try again later.";
        } else if (error.message.includes("failed or timed out")) {
          errorMessage =
            "The topic search operation timed out. Please try again with a smaller date range.";
        } else {
          errorMessage = `${error.message}`;
        }
      }

      setNotification({
        type: errorType,
        message: errorMessage,
      });
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
      
      // Extract more specific error messages
      let errorMessage = "Failed to publish post. Please try again.";
      let isPermissionError = false;
      
      if (error instanceof Error) {
        if (error.message.includes("Facebook application permission error")) {
          errorMessage = "Permission error: Your Facebook app doesn't have the required permissions. Go to developers.facebook.com, navigate to App Settings > Advanced > Optional Permissions, and request 'pages_manage_posts', 'pages_read_engagement', and 'pages_manage_metadata' permissions.";
          isPermissionError = true;
        } else if (error.message.includes("Permission error")) {
          errorMessage = "Token permission error: Your access token doesn't have the required permissions for posting.";
          isPermissionError = true;
        } else if (error.message.includes("Page not found")) {
          errorMessage = "Page not found: The Facebook page ID may be incorrect or your app doesn't have access to it.";
        } else if (error.message.includes("Failed to post to any pages")) {
          try {
            // Try to extract the detailed error from the JSON string
            const errorMatch = error.message.match(/Failed to post to any pages: (.+)/);
            if (errorMatch && errorMatch[1]) {
              const errorDetails = JSON.parse(errorMatch[1]);
              if (errorDetails && errorDetails.length > 0 && errorDetails[0].error) {
                errorMessage = `Error posting to page: ${errorDetails[0].error}`;
                
                // Check if it's a permission error
                if (errorDetails[0].error.includes("permission")) {
                  isPermissionError = true;
                }
              }
            }
          } catch {
            // If parsing fails, use the original error message
            errorMessage = error.message;
          }
        } else {
          errorMessage = error.message;
          
          // Check if it's a permission error
          if (error.message.includes("permission") || error.message.includes("Application does not have permission")) {
            isPermissionError = true;
          }
        }
      }
      
      showNotification("error", errorMessage, isPermissionError);
    }
  };

  const handleSchedulePost = async (params: PostScheduleParams) => {
    const user = getCurrentUser();
    if (!user || !params.scheduledFor) return;

    try {
      // Check if there are any video files (which aren't supported for scheduling)
      if (params.mediaFiles && params.mediaFiles.some(file => file.type.startsWith('video/'))) {
        showNotification(
          "error",
          "Video files cannot be scheduled. Please use the 'Post Now' button for videos, or use image URLs for scheduled posts."
        );
        return;
      }
      
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

  const handleActorChange = async (actorId: string) => {
    try {
      // In a real app, you would update this in a database or settings API
      // For this demo, we'll just show a notification
      setNotification({
        type: "success",
        message: `Actor ID updated to: ${actorId}. Please update your .env.local file with this value.`,
      });

      // Clear any previous search results since they might not be compatible with the new actor
      setTopics([]);
    } catch (error) {
      console.error("Error updating actor:", error);
      setNotification({
        type: "error",
        message: "Failed to update actor configuration.",
      });
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
          handleActorChange={handleActorChange}
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
