"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, getCurrentUser } from "../../lib/services/auth";
import {
  searchTopics,
  getUserPages,
  createPost,
} from "../../lib/services/facebook";
import {
  FacebookTopic,
  FacebookPage,
  PostScheduleParams,
  TopicSearchParams,
} from "../../types";
import TopicSearch from "../../../components/TopicSearch";
import TopicTable from "../../../components/TopicTable";
import PostForm from "../../../components/PostForm";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("topics");
  const [topics, setTopics] = useState<FacebookTopic[]>([]);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    // If authenticated, fetch user pages
    const user = getCurrentUser();
    if (user) {
      fetchUserPages(user.email);
    }
  }, [router]);

  const fetchUserPages = async (email: string) => {
    try {
      const userPages = await getUserPages(email);
      setPages(userPages);
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
  };

  const handleSearch = async (params: TopicSearchParams) => {
    setLoading(true);
    try {
      const results = await searchTopics(params);
      setTopics(results);
    } catch (error) {
      console.error("Error searching topics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    // This would handle CSV download logic
    const csvContent =
      "Topic,Date,Popularity Score\n" +
      topics
        .map(
          (topic) =>
            `"${topic.topic}","${new Date(topic.date).toLocaleDateString()}","${
              topic.popularityScore
            }"`
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "facebook_topics.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePostNow = async (params: PostScheduleParams) => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      await createPost(user.email, {
        id: "", // Will be assigned by Firestore
        content: params.content,
        pageIds: params.pageIds,
        authorId: user.email,
        createdAt: new Date().toISOString(),
        status: "published",
        mediaUrls: params.mediaUrls,
      });

      alert("Post published successfully!");
    } catch (error) {
      console.error("Error publishing post:", error);
      alert("Failed to publish post. Please try again.");
    }
  };

  const handleSchedulePost = async (params: PostScheduleParams) => {
    const user = getCurrentUser();
    if (!user || !params.scheduledFor) return;

    try {
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

      alert("Post scheduled successfully!");
    } catch (error) {
      console.error("Error scheduling post:", error);
      alert("Failed to schedule post. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            Facebook Topics & Posting Portal
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab("topics")}
                  className={`${
                    activeTab === "topics"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Topics
                </button>
                <button
                  onClick={() => setActiveTab("posts")}
                  className={`${
                    activeTab === "posts"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Posts
                </button>
              </nav>
            </div>
            <div className="p-6">
              {activeTab === "topics" ? (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900">
                      Facebook Topics
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Search for trending topics on Facebook by keywords and
                      date ranges.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="col-span-full">
                      <TopicSearch
                        onSearch={handleSearch}
                        isLoading={loading}
                      />
                    </div>
                  </div>
                  {topics.length > 0 && (
                    <TopicTable
                      topics={topics}
                      onDownloadCSV={handleDownloadCSV}
                    />
                  )}
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900">
                      Facebook Posts
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Create, schedule, and manage posts for your Facebook
                      pages.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <PostForm
                      pages={pages}
                      onPostNow={handlePostNow}
                      onSchedulePost={handleSchedulePost}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
