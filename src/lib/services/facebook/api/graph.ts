import { uploadMedia } from "./media";
import { getPageAccessToken, verifyTokenPermissions } from "./token";
import type { FacebookMediaUploadCallbacks } from "../types";

/**
 * Posts content to a Facebook page using Graph API
 */
export const createPost = async (
  pageId: string,
  userAccessToken: string,
  content: string,
  mediaItems?: (string | File)[],
  callbacks?: FacebookMediaUploadCallbacks
): Promise<string> => {
  try {
    // First, get a page access token
    console.log("Getting page access token...");
    const pageAccessToken = await getPageAccessToken(pageId, userAccessToken);
    console.log("Successfully got page access token");

    // Verify token permissions
    const tokenInfo = await verifyTokenPermissions(pageAccessToken);
    if (!tokenInfo.isValid) {
      throw new Error(tokenInfo.error || "Invalid token");
    }

    // Check if we have media items
    if (mediaItems && mediaItems.length > 0) {
      const mediaItem = mediaItems[0];

      // Handle media upload
      const mediaId = await uploadMedia(
        pageId,
        pageAccessToken,
        mediaItem,
        content,
        callbacks
      );

      // If it's a video, the upload automatically creates a post
      if (mediaItem instanceof File && mediaItem.type.startsWith("video/")) {
        return mediaId;
      }

      // Create post with media
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

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Facebook API Error Response:", errorData);
        throw new Error(
          errorData.error?.message || "Failed to create post with media"
        );
      }

      const data = await response.json();
      return data.id;
    }

    // Text-only post
    const params = new URLSearchParams();
    params.append("message", content);
    params.append("access_token", pageAccessToken);

    console.log("Attempting to create post...");
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

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Facebook API Error Response:", errorData);
      const error = errorData.error;

      if (error?.code === 190) {
        throw new Error(
          "Invalid or expired access token. Please generate a new Page Access Token from Graph API Explorer."
        );
      } else if (error?.code === 10 || error?.code === 100) {
        throw new Error(
          "Missing required permissions. Please ensure you have admin access to this page and try again."
        );
      } else if (error?.code === 368) {
        throw new Error(
          "Rate limit exceeded. Please wait a few minutes and try again."
        );
      } else {
        throw new Error(
          error?.message || "Failed to create post. Check console for details."
        );
      }
    }

    console.log("Post created successfully");
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error("Error in createPost:", error);
    throw error;
  }
};
