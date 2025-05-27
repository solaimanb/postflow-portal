"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { processScheduledPosts } from "@/lib/services/facebook/posts/schedule";
import { getCurrentUser } from "@/lib/services/auth";

const SCHEDULED_POST_CHECK_INTERVAL = 20000;

export function ScheduledPostsProcessor() {
  const router = useRouter();

  useEffect(() => {
    const checkScheduledPosts = async () => {
      const user = getCurrentUser();
      if (!user) {
        toast.error("You must be logged in to check scheduled posts");
        router.push("/login");
        return;
      }

      try {
        await processScheduledPosts(user.email);
      } catch (error) {
        console.error("Error checking scheduled posts:", error);
      }
    };

    checkScheduledPosts();
    const checkInterval = setInterval(
      checkScheduledPosts,
      SCHEDULED_POST_CHECK_INTERVAL
    );
    return () => clearInterval(checkInterval);
  }, [router]);

  return null;
}
