"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentUser } from "@/lib/services/auth";
import { getUserPages, createPost } from "@/lib/services/facebook";
import { FacebookPage, PostScheduleParams } from "@/types";
import PostForm from "@/components/PostForm";
import Notification from "@/components/Notification";

export default function CreatePostPage() {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
    isPermissionError?: boolean;
  } | null>(null);

  const showNotification = useCallback(
    (
      type: "success" | "error" | "info",
      message: string,
      isPermissionError?: boolean
    ) => {
      setNotification({ type, message, isPermissionError });
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    },
    []
  );

  const fetchUserPages = useCallback(async (email: string) => {
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
  }, []);

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
      let errorMessage = "Failed to publish post. Please try again.";
      let isPermissionError = false;

      if (error instanceof Error) {
        if (error.message.includes("Facebook application permission error")) {
          errorMessage =
            "Permission error: Your Facebook app doesn't have the required permissions. Go to developers.facebook.com, navigate to App Settings > Advanced > Optional Permissions, and request 'pages_manage_posts', 'pages_read_engagement', and 'pages_manage_metadata' permissions.";
          isPermissionError = true;
        } else if (error.message.includes("Permission error")) {
          errorMessage =
            "Token permission error: Your access token doesn't have the required permissions for posting.";
          isPermissionError = true;
        } else if (error.message.includes("Page not found")) {
          errorMessage =
            "Page not found: The Facebook page ID may be incorrect or your app doesn't have access to it.";
        } else {
          errorMessage = error.message;
          if (error.message.includes("permission")) {
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
      if (
        params.mediaFiles &&
        params.mediaFiles.some((file) => file.type.startsWith("video/"))
      ) {
        showNotification(
          "error",
          "Video files cannot be scheduled. Please use the 'Post Now' button for videos, or use image URLs for scheduled posts."
        );
        return;
      }

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

      // Update local storage for scheduled posts count
      try {
        const postsJson = localStorage.getItem("scheduled_posts");
        const posts = postsJson ? JSON.parse(postsJson) : [];
        posts.push({
          content: params.content,
          pageIds: params.pageIds,
          scheduledFor: params.scheduledFor,
          status: "scheduled",
          mediaUrls: params.mediaUrls,
        });
        localStorage.setItem("scheduled_posts", JSON.stringify(posts));
      } catch (error) {
        console.error("Error updating scheduled posts in localStorage:", error);
      }
    } catch (error) {
      console.error("Error scheduling post:", error);
      showNotification("error", "Failed to schedule post. Please try again.");
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      fetchUserPages(user.email);
    }
  }, [fetchUserPages]);

  return (
    <div>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          isPermissionError={notification.isPermissionError}
          onClose={() => setNotification(null)}
        />
      )}

      <PostForm
        pages={pages}
        onPostNow={handlePostNow}
        onSchedulePost={handleSchedulePost}
      />
    </div>
  );
}
