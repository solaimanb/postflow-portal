"use client";

import { useEffect, useState } from "react";
import { processScheduledPosts } from "@/lib/services/facebook";

const SCHEDULED_POST_CHECK_INTERVAL = 20000;

export default function DashboardPage() {
  const [scheduledPostCount, setScheduledPostCount] = useState(0);

  useEffect(() => {
    const updateScheduledPostCount = () => {
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
    };

    const checkScheduledPosts = async () => {
      try {
        await processScheduledPosts();
        updateScheduledPostCount();
      } catch (error) {
        console.error("Error checking scheduled posts:", error);
      }
    };

    // Initial check
    checkScheduledPosts();
    updateScheduledPostCount();

    // Set up intervals
    const checkInterval = setInterval(
      checkScheduledPosts,
      SCHEDULED_POST_CHECK_INTERVAL
    );
    const countInterval = setInterval(updateScheduledPostCount, 5000);

    return () => {
      clearInterval(checkInterval);
      clearInterval(countInterval);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Welcome to FB Topics Portal</h1>
        <p className="text-muted-foreground">
          Manage your social media content and scheduled posts.
          {scheduledPostCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {scheduledPostCount} scheduled post
              {scheduledPostCount !== 1 && "s"}
            </span>
          )}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-medium">Topic Search</h3>
          <p className="text-sm text-muted-foreground">
            Search and analyze Facebook topics across pages.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-medium">Create Post</h3>
          <p className="text-sm text-muted-foreground">
            Create and schedule posts for your Facebook pages.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-medium">Manage Comments</h3>
          <p className="text-sm text-muted-foreground">
            Manage and moderate comments across your pages.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-medium">Page Setup</h3>
          <p className="text-sm text-muted-foreground">
            Configure and manage your Facebook page connections.
          </p>
        </div>
      </div>
    </div>
  );
}
