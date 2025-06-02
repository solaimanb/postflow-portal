import { uploadMedia, uploadVideoFile } from "./media";
import { getPageAccessToken, verifyTokenPermissions } from "./token";
import type { FacebookMediaUploadCallbacks } from "../types";

/**
 * Creates a post on a Facebook page using the Graph API.
 * Supports text-only posts and posts with media attachments (images, videos, or URLs).
 *
 * @param pageId - The ID of the Facebook page to post to
 * @param userAccessToken - The user's access token with page management permissions
 * @param content - The text content of the post
 * @param mediaItems - Optional array of media items (File objects or URLs)
 * @param callbacks - Optional callbacks for tracking media upload progress
 * @returns Promise resolving to the created post ID
 */
export const createPost = async (
  pageId: string,
  userAccessToken: string,
  content: string,
  mediaItems?: (string | File)[],
  callbacks?: FacebookMediaUploadCallbacks
): Promise<string> => {
  try {
    // Step 1: Get and verify page access token
    const pageAccessToken = await getPageToken(pageId, userAccessToken);
    await verifyTokenPermissions(pageAccessToken, [], "PAGE");

    // Step 2: Handle media upload if present
    if (mediaItems?.length) {
      if (mediaItems.length === 1) {
        return await createMediaPost(
          pageId,
          pageAccessToken,
          content,
          mediaItems[0],
          callbacks
        );
      } else {
        return await createMultiMediaPost(
          pageId,
          pageAccessToken,
          content,
          mediaItems
        );
      }
    }

    // Step 3: Create text-only post
    return await createTextPost(pageId, pageAccessToken, content);
  } catch (error) {
    console.error("Error in createPost:", error);
    throw error;
  }
};

/**
 * Helper function to get and verify page access token
 */
async function getPageToken(
  pageId: string,
  userAccessToken: string
): Promise<string> {
  console.log("Getting page access token...");
  const pageAccessToken = await getPageAccessToken(pageId, userAccessToken);
  console.log("Successfully got page access token");
  return pageAccessToken;
}

/**
 * Creates a post with media attachment (image, video, or URL)
 */
async function createMediaPost(
  pageId: string,
  pageAccessToken: string,
  content: string,
  mediaItem: string | File,
  callbacks?: FacebookMediaUploadCallbacks
): Promise<string> {
  // Handle video uploads separately as they create posts automatically
  if (mediaItem instanceof File && mediaItem.type.startsWith("video/")) {
    return await uploadVideoFile(
      pageId,
      pageAccessToken,
      mediaItem,
      content,
      callbacks
    );
  }

  // Handle image/URL uploads
  const mediaId = await uploadMedia(pageId, pageAccessToken, mediaItem);
  return await attachMediaToPost(pageId, pageAccessToken, content, mediaId);
}

/**
 * Creates a text-only post
 */
async function createTextPost(
  pageId: string,
  pageAccessToken: string,
  content: string
): Promise<string> {
  console.log("Creating text-only post...");
  const params = new URLSearchParams();
  params.append("message", content);
  params.append("access_token", pageAccessToken);
  
  const response = await fetch(
    `https://graph.facebook.com/v22.0/${pageId}/feed`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    }
  );

  await handleApiResponse(response);
  const data = await response.json();
  console.log("Post created successfully with ID:", data.id);
  console.log("Post URL:", `https://facebook.com/${data.id}`);
  return data.id;
}

/**
 * Attaches uploaded media to a new post
 */
async function attachMediaToPost(
  pageId: string,
  pageAccessToken: string,
  content: string,
  mediaId: string
): Promise<string> {
  const params = new URLSearchParams();
  params.append("message", content);
  params.append("attached_media[0]", `{"media_fbid":"${mediaId}"}`);
  params.append("access_token", pageAccessToken); 

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${pageId}/feed`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    }
  );

  await handleApiResponse(response);
  const data = await response.json();
  console.log("Media post created successfully with ID:", data.id);
  console.log("Post URL:", `https://facebook.com/${data.id}`);
  return data.id;
}

/**
 * Creates a post with multiple media attachments
 */
async function createMultiMediaPost(
  pageId: string,
  pageAccessToken: string,
  content: string,
  mediaItems: (string | File)[]
): Promise<string> {
  // Upload all media items first
  const mediaIds = await Promise.all(
    mediaItems.map(async (item) => {
      if (item instanceof File && item.type.startsWith("video/")) {
        throw new Error("Multiple videos in a single post are not supported");
      }
      return await uploadMedia(pageId, pageAccessToken, item);
    })
  );

  // Create the post with all media attachments
  const params = new URLSearchParams();
  params.append("message", content);
  mediaIds.forEach((id, index) => {
    params.append(`attached_media[${index}]`, `{"media_fbid":"${id}"}`);
  });
  params.append("access_token", pageAccessToken);

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${pageId}/feed`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    }
  );

  await handleApiResponse(response);
  const data = await response.json();
  return data.id;
}

/**
 * Handles Facebook API response and throws appropriate errors
 */
async function handleApiResponse(response: Response): Promise<void> {
  if (!response.ok) {
    const errorData = await response.json();
    console.error("Facebook API Error Response:", errorData);
    const error = errorData.error;

    switch (error?.code) {
      case 190:
        throw new Error(
          "Invalid or expired access token. Please generate a new Page Access Token from Graph API Explorer."
        );
      case 10:
      case 100:
        throw new Error(
          "Missing required permissions. Please ensure you have admin access to this page and try again."
        );
      case 368:
        throw new Error(
          "Rate limit exceeded. Please wait a few minutes and try again."
        );
      case 200:
        throw new Error(
          "Permission error: The user must be an admin of the page to post."
        );
      case 294:
        throw new Error(
          "Post visibility error: The post might be restricted. Check page settings."
        );
      default:
        throw new Error(
          error?.message || "Failed to create post. Check console for details."
        );
    }
  }
}
