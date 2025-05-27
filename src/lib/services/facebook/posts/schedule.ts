import type {
  FacebookPost,
  FacebookPage,
  FacebookPostStatus,
  MediaFileBase64,
} from "../types";
import { STORAGE_KEYS } from "../types";
import { createFacebookPost, FacebookPostError } from "./create";
import { toast } from "sonner";

/**
 * Convert File to base64 string
 */
const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Convert base64 string back to File
 */
const base64ToFile = async (
  base64String: string,
  fileName: string
): Promise<File> => {
  const res = await fetch(base64String);
  const blob = await res.blob();
  return new File([blob], fileName, { type: blob.type });
};

/**
 * Convert WebP to PNG using Canvas
 */
const convertWebPToPNG = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!file.type.includes("webp")) {
      resolve(file);
      return;
    }

    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const newFile = new File([blob], file.name.replace(".webp", ".png"), {
            type: "image/png",
          });
          resolve(newFile);
        } else {
          reject(new Error("Failed to convert WebP to PNG"));
        }
      }, "image/png");
    };

    img.onerror = () => reject(new Error("Failed to load WebP image"));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Process post for storage
 * Converts File objects to base64 strings for localStorage
 * Also converts WebP to PNG if needed
 */
const preparePostForStorage = async (
  post: FacebookPost
): Promise<FacebookPost> => {
  if (!post.mediaFiles?.length) return post;

  // Convert WebP to PNG first
  const convertedFiles = await Promise.all(
    post.mediaFiles.map(async (file) => {
      console.log("Processing file:", file.name, file.type);
      return await convertWebPToPNG(file);
    })
  );

  const base64Files: MediaFileBase64[] = await Promise.all(
    convertedFiles.map(async (file) => ({
      name: file.name,
      type: file.type,
      data: await fileToBase64(file),
    }))
  );

  return {
    ...post,
    mediaFiles: undefined,
    _mediaFilesBase64: base64Files,
  };
};

/**
 * Process post for usage
 * Converts stored base64 strings back to File objects
 */
const preparePostForUse = async (post: FacebookPost): Promise<FacebookPost> => {
  if (!post._mediaFilesBase64?.length) return post;

  const files = await Promise.all(
    post._mediaFilesBase64.map(async (fileData: MediaFileBase64) =>
      base64ToFile(fileData.data, fileData.name)
    )
  );

  return {
    ...post,
    mediaFiles: files,
    _mediaFilesBase64: undefined,
  };
};

/**
 * Get all scheduled posts from localStorage
 */
export const getScheduledPosts = async (): Promise<FacebookPost[]> => {
  try {
    console.log("Getting scheduled posts from storage"); // Debug log
    const postsJson = localStorage.getItem(STORAGE_KEYS.SCHEDULED_POSTS);
    console.log("Raw posts from storage:", postsJson); // Debug log
    if (!postsJson) return [];

    const posts = JSON.parse(postsJson);
    console.log("Parsed posts:", posts); // Debug log
    const preparedPosts = await Promise.all(posts.map(preparePostForUse));
    console.log("Prepared posts for use:", preparedPosts); // Debug log
    return preparedPosts;
  } catch (error) {
    console.error("Error reading scheduled posts:", error);
    throw new FacebookPostError(
      "Failed to read scheduled posts",
      "STORAGE_READ_ERROR"
    );
  }
};

/**
 * Save posts to localStorage
 */
export const saveScheduledPosts = async (
  posts: FacebookPost[]
): Promise<void> => {
  try {
    console.log("Saving scheduled posts:", posts); // Debug log
    const processedPosts = await Promise.all(posts.map(preparePostForStorage));
    console.log("Processed posts for storage:", processedPosts); // Debug log
    localStorage.setItem(
      STORAGE_KEYS.SCHEDULED_POSTS,
      JSON.stringify(processedPosts)
    );
    console.log("Successfully saved posts to localStorage"); // Debug log
  } catch (error) {
    console.error("Error saving scheduled posts:", error);
    throw new FacebookPostError(
      "Failed to save scheduled posts",
      "STORAGE_WRITE_ERROR"
    );
  }
};

/**
 * Get page names for given page IDs
 */
export const getPageNames = (pageIds: string[]): string[] => {
  try {
    const pagesJson = localStorage.getItem(STORAGE_KEYS.USER_PAGES);
    if (!pagesJson) return pageIds;

    const allPages = JSON.parse(pagesJson) as FacebookPage[];
    return pageIds.map((id) => {
      const page = allPages.find((p) => p.pageId === id);
      return page ? page.name : id;
    });
  } catch (error) {
    console.error("Error getting page names:", error);
    throw new FacebookPostError("Failed to get page names", "PAGE_INFO_ERROR");
  }
};

/**
 * Delete a scheduled post
 */
export const deleteScheduledPost = async (postId: string): Promise<void> => {
  try {
    const posts = await getScheduledPosts();
    const remainingPosts = posts.filter((p) => p.id !== postId);
    await saveScheduledPosts(remainingPosts);
    toast.success("Scheduled post deleted successfully!");
  } catch (error) {
    console.error("Failed to delete scheduled post:", error);
    toast.error("Failed to delete scheduled post");
    if (error instanceof FacebookPostError) {
      throw error;
    }
    throw new FacebookPostError(
      "Failed to delete scheduled post",
      "DELETE_POST_ERROR"
    );
  }
};

/**
 * Check if a post is due for publishing
 * Handles both immediate publishing and recovery of missed posts
 */
const isPostDueForPublishing = (
  scheduledTime: Date,
  immediateBuffer = 30000, // 30 seconds forward window
  recoveryBuffer = 300000 // 5 minutes backward window for recovery
): boolean => {
  const now = new Date();
  const timeDiff = now.getTime() - scheduledTime.getTime();

  // Case 1: Post is scheduled within the next 30 seconds
  const isComingUp = timeDiff < 0 && Math.abs(timeDiff) <= immediateBuffer;

  // Case 2: Post was scheduled in the last 5 minutes (recovery case)
  const wasRecentlyMissed = timeDiff > 0 && timeDiff < recoveryBuffer;

  const isDue = isComingUp || wasRecentlyMissed;

  console.log("Checking if post is due:", {
    scheduledTime: scheduledTime.toISOString(),
    now: now.toISOString(),
    timeDiff,
    immediateBuffer,
    recoveryBuffer,
    isComingUp,
    wasRecentlyMissed,
    isDue,
  });

  return isDue;
};

const PROCESSING_POSTS = new Set<string>();

/**
 * Publish a single post
 */
const publishPost = async (
  userId: string,
  post: FacebookPost
): Promise<void> => {
  if (PROCESSING_POSTS.has(post.id)) {
    console.log("Post already being processed:", post.id);
    return;
  }

  PROCESSING_POSTS.add(post.id);

  try {
    // Update status to publishing
    const allPosts = await getScheduledPosts();
    const updatedPosts = allPosts.map((p) =>
      p.id === post.id
        ? { ...p, status: "publishing" as FacebookPostStatus }
        : p
    );
    await saveScheduledPosts(updatedPosts);

    // Convert any base64 media back to files before publishing
    const postWithFiles = await preparePostForUse(post);

    // Attempt to publish with converted files
    await createFacebookPost(userId, {
      ...postWithFiles,
      status: "published" as FacebookPostStatus,
    });

    // Remove successfully published post from scheduled posts
    const currentPosts = await getScheduledPosts();
    const remainingPosts = currentPosts.filter((p) => p.id !== post.id);
    await saveScheduledPosts(remainingPosts);

    toast.success("Scheduled post published successfully!", {
      description:
        post.content.length > 50
          ? `${post.content.substring(0, 50)}...`
          : post.content,
    });
  } catch (error) {
    console.error("Failed to publish scheduled post:", error);

    // Update status to failed on error
    const currentPosts = await getScheduledPosts();
    const updatedPosts = currentPosts.map((p) =>
      p.id === post.id ? { ...p, status: "failed" as FacebookPostStatus } : p
    );
    await saveScheduledPosts(updatedPosts);

    toast.error("Failed to publish scheduled post", {
      description: error instanceof Error ? error.message : "Unknown error",
    });

    if (error instanceof FacebookPostError) {
      throw error;
    }
    throw new FacebookPostError(
      "Failed to publish scheduled post",
      "PUBLISH_POST_ERROR"
    );
  } finally {
    PROCESSING_POSTS.delete(post.id);
  }
};

/**
 * Process all scheduled posts that are due for publishing
 */
export const processScheduledPosts = async (userId: string): Promise<void> => {
  try {
    const posts = await getScheduledPosts();

    for (const post of posts) {
      if (post.status !== "scheduled" || !post.scheduledFor) continue;
      if (PROCESSING_POSTS.has(post.id)) continue;

      const scheduledTime = new Date(post.scheduledFor);
      if (isPostDueForPublishing(scheduledTime)) {
        await publishPost(userId, post);
      }
    }
  } catch (error) {
    console.error("Error processing scheduled posts:", error);
    if (error instanceof FacebookPostError) {
      throw error;
    }
    throw new FacebookPostError(
      "Failed to process scheduled posts",
      "PROCESS_POSTS_ERROR"
    );
  }
};
