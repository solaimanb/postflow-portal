import type { FacebookPost } from "../types";
import { getUserPages } from "../pages";
import { createPost } from "../api/graph";
import { FacebookTokenError } from "../api/token";

export class FacebookPostError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'FacebookPostError';
  }
}

/**
 * Create a post on one or more Facebook pages
 */
export const createFacebookPost = async (
  userId: string,
  post: FacebookPost
): Promise<string[]> => {
  try {
    // Validate input
    if (!post.pageIds || post.pageIds.length === 0) {
      throw new FacebookPostError('No page IDs provided', 'MISSING_PAGE_IDS');
    }

    if (!post.content && !post.mediaFiles && !post.mediaUrls) {
      throw new FacebookPostError(
        'Post must contain either content or media',
        'MISSING_CONTENT'
      );
    }

    // Get pages
    const pages = await getUserPages(userId);
    if (!pages || pages.length === 0) {
      throw new FacebookPostError('No pages found for user', 'NO_PAGES');
    }

    const postIds: string[] = [];
    const errors: Error[] = [];

    // Create posts
    for (const pageId of post.pageIds) {
      const page = pages.find((p) => p.pageId === pageId);
      if (!page) {
        errors.push(
          new FacebookPostError(`Page not found: ${pageId}`, 'PAGE_NOT_FOUND')
        );
        continue;
      }

      try {
        const postId = await createPost(
          page.pageId,
          page.accessToken,
          post.content,
          post.mediaFiles || post.mediaUrls
        );
        postIds.push(postId);
      } catch (error) {
        if (error instanceof FacebookTokenError) {
          errors.push(error);
        } else {
          errors.push(
            new FacebookPostError(
              `Failed to create post on page ${pageId}: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
              'POST_CREATION_FAILED'
            )
          );
        }
      }
    }

    // Handle errors
    if (errors.length > 0) {
      if (postIds.length === 0) {
        // If no posts were created, throw the first error
        throw errors[0];
      } else {
        // If some posts were created, log errors but return successful post IDs
        console.error(
          'Some posts failed to create:',
          errors.map((e) => e.message)
        );
      }
    }

    return postIds;
  } catch (error) {
    console.error('Error creating post:', error);
    if (error instanceof FacebookPostError || error instanceof FacebookTokenError) {
      throw error;
    }
    throw new FacebookPostError(
      error instanceof Error ? error.message : 'Failed to create post'
    );
  }
};
