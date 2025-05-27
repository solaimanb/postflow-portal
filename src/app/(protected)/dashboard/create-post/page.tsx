"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/services/auth";
import { getUserPages } from "@/lib/services/facebook/pages";
import { createFacebookPost } from "@/lib/services/facebook/posts/create";
import { FacebookPostError } from "@/lib/services/facebook/posts/create";
import { FacebookTokenError } from "@/lib/services/facebook/api/token";
import type { FacebookPage, PostScheduleParams, FacebookPost } from "@/types";
import { getScheduledPosts } from "@/lib/services/facebook/posts/schedule";
import { saveScheduledPosts } from "@/lib/services/facebook/posts/schedule";

import { PostHeader } from "./_components/post-header";
import { PermissionError } from "./_components/permission-error";
import { ScheduledPosts } from "./_components/scheduled-posts";
import { CARD_STYLES } from "./_components/shared-styles";
import PostForm from "./_components/post-form";

export default function CreatePostPage() {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<FacebookPost[]>([]);
  const [showPermissionError, setShowPermissionError] = useState(false);

  const fetchUserPages = useCallback(async (email: string) => {
    try {
      const userPages = await getUserPages(email);
      setPages(userPages);
    } catch (error) {
      console.error("Error fetching pages:", error);
      toast.error("Failed to fetch pages", {
        description: "Please check your connection and try again.",
      });
    }
  }, []);

  const refreshScheduledPosts = useCallback(async () => {
    try {
      const posts = await getScheduledPosts();
      setScheduledPosts(
        posts.filter((post: FacebookPost) => post.status === "scheduled")
      );
    } catch (error) {
      console.error("Error loading scheduled posts:", error);
    }
  }, []);

  const handlePostNow = async (params: PostScheduleParams) => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      const postIds = await createFacebookPost(user.email, {
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
        toast.success("Posts created", {
          description: `Successfully posted to all ${postIds.length} selected pages.`,
        });
      } else {
        toast("Posts partially created", {
          description: `Posted to ${postIds.length} of ${params.pageIds.length} selected pages.`,
        });
      }
    } catch (error) {
      console.error("Error publishing post:", error);

      if (error instanceof FacebookTokenError) {
        setShowPermissionError(true);
        toast.error("Permission Error", {
          description: "Your app is missing required permissions.",
        });
      } else if (error instanceof FacebookPostError) {
        if (error.code === "PAGE_NOT_FOUND") {
          toast.error("Page not found", {
            description:
              "One or more selected pages were not found or are not accessible.",
          });
        } else {
          toast.error("Failed to publish", {
            description: error.message,
          });
        }
      } else {
        toast.error("Failed to publish", {
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
      }
    }
  };

  const handleSchedulePost = async (params: PostScheduleParams) => {
    const user = getCurrentUser();
    if (!user || !params.scheduledFor) return;

    try {
      const newPost: FacebookPost = {
        id: crypto.randomUUID(),
        content: params.content,
        pageIds: params.pageIds,
        authorId: user.email,
        createdAt: new Date().toISOString(),
        scheduledFor: params.scheduledFor,
        status: "scheduled",
        mediaUrls: params.mediaUrls,
        mediaFiles: params.mediaFiles,
      };

      // Get current posts
      const posts = await getScheduledPosts();

      // Add new post and save
      const updatedPosts = [...posts, newPost];
      await saveScheduledPosts(updatedPosts);

      toast.success("Post scheduled", {
        description: `Post scheduled for ${new Date(
          params.scheduledFor
        ).toLocaleString()}`,
      });

      await refreshScheduledPosts();
    } catch (error) {
      console.error("Error scheduling post:", error);
      if (error instanceof FacebookTokenError) {
        setShowPermissionError(true);
        toast.error("Permission Error", {
          description: "Your app is missing required permissions.",
        });
      } else if (error instanceof FacebookPostError) {
        toast.error("Failed to schedule", {
          description: error.message,
        });
      } else {
        toast.error("Failed to schedule", {
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
      }
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      fetchUserPages(user.email);
      refreshScheduledPosts();
    }

    const checkScheduledPosts = async () => {
      await refreshScheduledPosts();
    };

    const intervalId = setInterval(checkScheduledPosts, 10000);
    return () => clearInterval(intervalId);
  }, [fetchUserPages, refreshScheduledPosts]);

  return (
    <div className="h-full w-full space-y-6">
      <Card className={CARD_STYLES}>
        <PostHeader />
        <CardContent className="space-y-6">
          {/* <PermissionsInfo /> */}
          {showPermissionError && <PermissionError />}
          <PostForm
            pages={pages}
            onPostNow={handlePostNow}
            onSchedulePost={handleSchedulePost}
          />
        </CardContent>
      </Card>

      <ScheduledPosts
        userId={getCurrentUser()?.email || ""}
        posts={scheduledPosts}
        onRefresh={refreshScheduledPosts}
      />
    </div>
  );
}
