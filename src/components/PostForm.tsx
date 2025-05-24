"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { FacebookPage, PostScheduleParams, FacebookPost } from "../app/types";

interface PostFormProps {
  pages: FacebookPage[];
  onPostNow: (params: PostScheduleParams) => void;
  onSchedulePost: (params: PostScheduleParams) => void;
}

export default function PostForm({
  pages,
  onPostNow,
  onSchedulePost,
}: PostFormProps) {
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
    setContent("");
    setSelectedPageIds([]);
    setScheduleDate("");
    setMediaUrl("");
    setMediaFiles([]);
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
    setContent("");
    setSelectedPageIds([]);
    setScheduleDate("");
    setMediaUrl("");
    setMediaFiles([]);
    setPostStatus({ success: true, message: "Post scheduled successfully!" });

    // Clear status after 3 seconds
    setTimeout(() => {
      setPostStatus(null);
    }, 3000);

    // Refresh scheduled posts
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

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Create New Post
        </h3>
        <div className="space-y-4">
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
            <p className="mt-1 text-xs text-gray-500">
              Enter a URL to an image or video to include with your post
            </p>
          </div>

          <div>
            <label
              htmlFor="media-files"
              className="block text-sm font-medium text-gray-700"
            >
              Upload Images (Optional)
            </label>
            <div className="mt-1 flex items-center">
              <input
                type="file"
                id="media-files"
                name="media-files"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              {mediaFiles.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearFiles}
                  className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Clear all
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              <strong>You can select multiple images</strong> - Click
              &quot;Browse&quot; again to add more images
            </p>
            {mediaFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-700">
                  {mediaFiles.length} file(s) selected
                </p>
                <ul className="mt-1 text-xs text-gray-500 max-h-32 overflow-y-auto">
                  {mediaFiles.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span>
                        {file.name} ({Math.round(file.size / 1024)} KB)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {mediaFiles.length > 0 && mediaUrl && (
              <p className="mt-1 text-xs text-amber-600 font-medium">
                Both URL and files selected. Both will be included in your post.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Pages
            </label>
            <div className="mt-1 space-y-2">
              {pages.map((page) => (
                <div key={page.id} className="flex items-center">
                  <input
                    id={`page-${page.id}`}
                    name={`page-${page.id}`}
                    type="checkbox"
                    checked={selectedPageIds.includes(page.id)}
                    onChange={() => handlePageSelection(page.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`page-${page.id}`}
                    className="ml-2 block text-sm text-gray-900"
                  >
                    {page.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="schedule"
              className="block text-sm font-medium text-gray-700"
            >
              Schedule (Optional)
            </label>
            <input
              type="datetime-local"
              name="schedule"
              id="schedule"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {scheduleDate && mediaFiles.length > 0 && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                Warning: Files cannot be scheduled directly. Please use URLs for
                scheduled posts.
              </p>
            )}
          </div>

          {postStatus && (
            <div
              className={`p-2 rounded ${
                postStatus.success !== false
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {postStatus.message}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handlePostNow}
              disabled={!content || selectedPageIds.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Post Now
            </button>
            <button
              type="button"
              onClick={handleSchedulePost}
              disabled={
                !content ||
                selectedPageIds.length === 0 ||
                !scheduleDate ||
                mediaFiles.length > 0
              }
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Schedule Post
            </button>
          </div>
        </div>
      </div>

      {scheduledPosts.length > 0 && (
        <div className="bg-white shadow sm:rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upcoming Scheduled Posts
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Posts will be automatically published when their scheduled time
            arrives. The system checks every 30 seconds.
          </p>
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    Content
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Scheduled For
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Pages
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {scheduledPosts.map((post) => (
                  <tr key={post.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {post.content.length > 50
                        ? `${post.content.substring(0, 50)}...`
                        : post.content}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {post.scheduledFor
                        ? formatDate(post.scheduledFor)
                        : "N/A"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {post.pageIds
                        .map((id) => {
                          const page = pages.find((p) => p.id === id);
                          return page ? page.name : id;
                        })
                        .join(", ")}
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
