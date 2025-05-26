import type { FacebookPost } from "../types";
import { getUserPages } from "../pages";
import { createPost } from "../api/graph";

/**
 * Process scheduled posts that are due for publishing
 */
export const processScheduledPosts = async (
  userId: string
): Promise<string[]> => {
  try {
    // Get scheduled posts from localStorage
    const postsJson = localStorage.getItem("scheduled_posts");
    if (!postsJson) return [];

    const posts = JSON.parse(postsJson) as FacebookPost[];
    const now = new Date();
    const processedPostIds: string[] = [];

    // Filter posts that are scheduled and due
    const duePosts = posts.filter(
      (post) =>
        post.status === "scheduled" &&
        post.scheduledFor &&
        new Date(post.scheduledFor) <= now
    );

    // Process each due post
    for (const post of duePosts) {
      try {
        // Get the page details
        const pages = await getUserPages(userId);

        // Create posts for each selected page
        for (const pageId of post.pageIds) {
          const page = pages.find((p) => p.pageId === pageId);
          if (!page) {
            console.error(`Page not found: ${pageId}`);
            continue;
          }

          // Create the post
          const postId = await createPost(
            page.pageId,
            page.accessToken,
            post.content,
            post.mediaFiles || post.mediaUrls
          );
          processedPostIds.push(postId);
        }

        // Update post status in localStorage
        const updatedPosts = posts.map((p) =>
          p.id === post.id ? { ...p, status: "published" } : p
        );
        localStorage.setItem("scheduled_posts", JSON.stringify(updatedPosts));
      } catch (error) {
        console.error(`Error processing scheduled post ${post.id}:`, error);
      }
    }

    return processedPostIds;
  } catch (error) {
    console.error("Error processing scheduled posts:", error);
    return [];
  }
};
