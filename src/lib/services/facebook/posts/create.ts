import type { FacebookPost } from "../types";
import { getUserPages } from "../pages";
import { createPost } from "../api/graph";

/**
 * Create a post on one or more Facebook pages
 */
export const createFacebookPost = async (
  userId: string,
  post: FacebookPost
): Promise<string[]> => {
  try {
    const pages = await getUserPages(userId);
    const postIds: string[] = [];

    for (const pageId of post.pageIds) {
      const page = pages.find((p) => p.pageId === pageId);
      if (!page) {
        throw new Error(`Page not found: ${pageId}`);
      }

      // Create the post
      const postId = await createPost(
        page.pageId,
        page.accessToken,
        post.content,
        post.mediaFiles || post.mediaUrls
      );
      postIds.push(postId);
    }

    return postIds;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
};
