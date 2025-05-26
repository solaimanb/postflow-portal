import type { FacebookPost } from "../types";
import { createFacebookPost } from "./create";

/**
 * Process scheduled posts that are due for publishing
 */
export const processScheduledPosts = async (userId: string): Promise<void> => {
  try {
    // Get scheduled posts from localStorage
    const postsJson = localStorage.getItem("scheduled_posts");
    if (!postsJson) return;

    const posts = JSON.parse(postsJson);
    if (!Array.isArray(posts)) return;

    const now = new Date();
    const updatedPosts: FacebookPost[] = [];

    // Process each post
    for (const post of posts) {
      if (post.status !== "scheduled" || !post.scheduledFor) {
        updatedPosts.push(post);
        continue;
      }

      const scheduledTime = new Date(post.scheduledFor);
      if (scheduledTime <= now) {
        try {
          // Attempt to publish the post using new implementation
          await createFacebookPost(userId, {
            ...post,
            status: "published",
          });

          // Update post status to published
          updatedPosts.push({
            ...post,
            status: "published",
          });
        } catch (error) {
          console.error(`Failed to publish scheduled post: ${error}`);
          // Keep the post in scheduled state if publishing fails
          updatedPosts.push(post);
        }
      } else {
        // Keep posts that aren't due yet
        updatedPosts.push(post);
      }
    }

    // Update localStorage with processed posts
    localStorage.setItem("scheduled_posts", JSON.stringify(updatedPosts));
  } catch (error) {
    console.error("Error processing scheduled posts:", error);
    throw error;
  }
};
