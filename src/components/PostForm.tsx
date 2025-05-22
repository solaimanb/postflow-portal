"use client";

import { useState } from "react";
import { FacebookPage, PostScheduleParams } from "../app/types";

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

  const handlePageSelection = (pageId: string) => {
    setSelectedPageIds((prevSelectedPages) => {
      if (prevSelectedPages.includes(pageId)) {
        return prevSelectedPages.filter((id) => id !== pageId);
      } else {
        return [...prevSelectedPages, pageId];
      }
    });
  };

  const handlePostNow = () => {
    if (!content || selectedPageIds.length === 0) return;

    onPostNow({
      content,
      pageIds: selectedPageIds,
    });

    // Reset form
    setContent("");
    setSelectedPageIds([]);
    setScheduleDate("");
  };

  const handleSchedulePost = () => {
    if (!content || selectedPageIds.length === 0 || !scheduleDate) return;

    onSchedulePost({
      content,
      pageIds: selectedPageIds,
      scheduledFor: scheduleDate,
    });

    // Reset form
    setContent("");
    setSelectedPageIds([]);
    setScheduleDate("");
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-4">
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
        </div>

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
            disabled={!content || selectedPageIds.length === 0 || !scheduleDate}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Schedule Post
          </button>
        </div>
      </div>
    </div>
  );
}
