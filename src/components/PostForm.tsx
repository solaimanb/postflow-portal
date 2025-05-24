"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { FacebookPage, PostScheduleParams, FacebookPost } from "../app/types";

// ======================================================
// Types and Interfaces
// ======================================================
interface PostFormProps {
  pages: FacebookPage[];
  onPostNow: (params: PostScheduleParams) => void;
  onSchedulePost: (params: PostScheduleParams) => void;
}

// ======================================================
// PostForm Component
// ======================================================
export default function PostForm({
  pages,
  onPostNow,
  onSchedulePost,
}: PostFormProps) {
  // ======================================================
  // State Management
  // ======================================================
  const [content, setContent] = useState("");
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [postStatus, setPostStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<FacebookPost[]>([]);

  // ======================================================
  // Effects
  // ======================================================
  // Load scheduled posts from localStorage
  useEffect(() => {
    const loadScheduledPosts = () => {
      try {
        const postsJson = localStorage.getItem("scheduled_posts");
        if (postsJson) {
          const posts = JSON.parse(postsJson);
          if (Array.isArray(posts)) {
            setScheduledPosts(
              posts.filter((post) => post.status === "scheduled")
            );
          }
        }
      } catch (error) {
        console.error("Error loading scheduled posts:", error);
      }
    };

    // Load posts initially
    loadScheduledPosts();

    // Set up interval to refresh the list
    const intervalId = setInterval(loadScheduledPosts, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // ======================================================
  // Event Handlers
  // ======================================================
  const handlePageSelection = (pageId: string) => {
    setSelectedPageIds((prevSelectedPages) => {
      if (prevSelectedPages.includes(pageId)) {
        return prevSelectedPages.filter((id) => id !== pageId);
      } else {
        return [...prevSelectedPages, pageId];
      }
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setMediaFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const handleClearFiles = () => {
    setMediaFiles([]);
    // Reset the file input value
    const fileInput = document.getElementById(
      "media-files"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setMediaFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handlePostNow = () => {
    if (!content || selectedPageIds.length === 0) return;

    setPostStatus({ message: "Posting to Facebook..." });

    onPostNow({
      content,
      pageIds: selectedPageIds,
      mediaUrls: mediaUrl ? [mediaUrl] : undefined,
      mediaFiles: mediaFiles.length > 0 ? mediaFiles : undefined,
    });

    // Reset form
    resetForm();
    setPostStatus({ success: true, message: "Post published successfully!" });

    // Clear status after 3 seconds
    setTimeout(() => {
      setPostStatus(null);
    }, 3000);
  };

  const handleSchedulePost = () => {
    if (!content || selectedPageIds.length === 0 || !scheduleDate) return;

    setPostStatus({ message: "Scheduling post..." });

    // For scheduled posts, we'll need to warn users that files cannot be scheduled directly
    if (mediaFiles.length > 0) {
      setPostStatus({
        success: false,
        message:
          "Files cannot be scheduled directly. Please use URLs for scheduled posts.",
      });
      return;
    }

    onSchedulePost({
      content,
      pageIds: selectedPageIds,
      scheduledFor: scheduleDate,
      mediaUrls: mediaUrl ? [mediaUrl] : undefined,
    });

    // Reset form
    resetForm();
    setPostStatus({ success: true, message: "Post scheduled successfully!" });

    // Clear status after 3 seconds
    setTimeout(() => {
      setPostStatus(null);
    }, 3000);

    // Refresh scheduled posts
    refreshScheduledPosts();
  };

  // ======================================================
  // Helper Functions
  // ======================================================
  const resetForm = () => {
    setContent("");
    setSelectedPageIds([]);
    setScheduleDate("");
    setMediaUrl("");
    setMediaFiles([]);
  };

  const refreshScheduledPosts = () => {
    const postsJson = localStorage.getItem("scheduled_posts");
    if (postsJson) {
      const posts = JSON.parse(postsJson);
      if (Array.isArray(posts)) {
        setScheduledPosts(posts.filter((post) => post.status === "scheduled"));
      }
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // ======================================================
  // Render
  // ======================================================
  return (
    <div className="space-y-6">
      {/* Post Creation Form */}
      <div className="bg-white shadow sm:rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Create New Post
        </h3>
        <div className="space-y-4">
          {/* Post Content */}
          <div>
            <label
              htmlFor="post-content"
              className="block text-sm font-medium text-gray-700"
            >
              Post Content
            </label>
            <textarea
              id="post-content"
              name="post-content"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Write your post content here..."
            ></textarea>
          </div>

          {/* Media URL */}
          <div>
            <label
              htmlFor="media-url"
              className="block text-sm font-medium text-gray-700"
            >
              Media URL (Optional)
            </label>
            <input
              type="text"
              id="media-url"
              name="media-url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Media File Upload */}
          <div>
            <label
              htmlFor="media-files"
              className="block text-sm font-medium text-gray-700"
            >
              Upload Media (Optional)
            </label>
            <div className="mt-1 flex items-center">
              <input
                type="file"
                id="media-files"
                name="media-files"
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                multiple
              />
              {mediaFiles.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearFiles}
                  className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Media Files Preview */}
            {mediaFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-2">Selected files:</p>
                <ul className="space-y-1">
                  {mediaFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded"
                    >
                      <span className="truncate max-w-xs">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Page Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Pages
            </label>
            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {pages.length > 0 ? (
                pages.map((page) => (
                  <div key={page.id} className="flex items-center">
                    <input
                      id={`page-${page.id}`}
                      name={`page-${page.id}`}
                      type="checkbox"
                      checked={selectedPageIds.includes(page.id)}
                      onChange={() => handlePageSelection(page.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`page-${page.id}`}
                      className="ml-2 block text-sm text-gray-900"
                    >
                      {page.name}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No Facebook pages found. Please add a page in the Page Setup
                  tab.
                </p>
              )}
            </div>
          </div>

          {/* Schedule Date */}
          <div>
            <label
              htmlFor="schedule-date"
              className="block text-sm font-medium text-gray-700"
            >
              Schedule Date (Optional)
            </label>
            <input
              type="datetime-local"
              id="schedule-date"
              name="schedule-date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          {/* Post Status */}
          {postStatus && (
            <div
              className={`mt-2 p-2 rounded ${
                postStatus.success === false
                  ? "bg-red-100 text-red-700"
                  : postStatus.success
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {postStatus.message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handlePostNow}
              disabled={!content || selectedPageIds.length === 0}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                !content || selectedPageIds.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              }`}
            >
              Post Now
            </button>
            <button
              type="button"
              onClick={handleSchedulePost}
              disabled={
                !content || selectedPageIds.length === 0 || !scheduleDate
              }
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                !content || selectedPageIds.length === 0 || !scheduleDate
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              }`}
            >
              Schedule Post
            </button>
          </div>
        </div>
      </div>

      {/* Scheduled Posts List */}
      {scheduledPosts.length > 0 && (
        <div className="bg-white shadow sm:rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Scheduled Posts
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Content
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Scheduled For
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Pages
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scheduledPosts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="max-w-xs truncate">{post.content}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.scheduledFor
                        ? formatDate(post.scheduledFor)
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.pageIds.length} page(s)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
