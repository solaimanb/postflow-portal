/**
 * Facebook Service
 *
 * Handles Facebook API integration, topic searching, post creation,
 * and scheduled post management.
 */

import { db } from "../firebase";
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  FacebookPost,
  FacebookPage,
  FacebookTopic,
  TopicSearchParams,
} from "../../types";

// ======================================================
// Topic Search and Management
// ======================================================

/**
 * Mock implementation of Apify API for topic fetching
 */
const fetchTopicsFromApify = async (
  params: TopicSearchParams
): Promise<FacebookTopic[]> => {
  return [
    {
      id: "1",
      topic: "Trending Indoor Plants",
      date: new Date().toISOString(),
      popularityScore: 85,
      keywords: ["plants", "indoor", "home decor"],
    },
    {
      id: "2",
      topic: "Plant Care Tips",
      date: new Date().toISOString(),
      popularityScore: 72,
      keywords: ["plants", "care", "tips"],
    },
    {
      id: "3",
      topic: `${params.keyword} Trends`,
      date: new Date().toISOString(),
      popularityScore: 91,
      keywords: [params.keyword, "trends", "social media"],
    },
  ];
};

export const searchTopics = async (
  params: TopicSearchParams
): Promise<FacebookTopic[]> => {
  try {
    const topics = await fetchTopicsFromApify(params);
    console.log(`Found ${topics.length} topics for keyword: ${params.keyword}`);

    topics.forEach(async (topic) => {
      try {
        await addDoc(collection(db, "topics"), {
          ...topic,
          searchKeyword: params.keyword,
          createdAt: Timestamp.now(),
        });
      } catch (error) {
        console.error("Error creating topic:", error);
      }
    });

    return topics;
  } catch {
    throw new Error("Failed to fetch topics");
  }
};

// ======================================================
// Facebook Page Management
// ======================================================
export const getUserPages = async (userId: string): Promise<FacebookPage[]> => {
  try {
    console.log(`Querying Firestore for pages with userId: ${userId}`);
    
    const pagesQuery = query(
      collection(db, "facebook_pages"),
      where("userId", "==", userId)
    );

    console.log("Executing Firestore query...");
    const snapshot = await getDocs(pagesQuery);
    console.log(`Query returned ${snapshot.docs.length} documents`);
    
    const pages = snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      } as FacebookPage)
    );

    console.log(`Retrieved ${pages.length} Facebook pages for user`);
    
    return pages;
  } catch (error) {
    console.error("Error fetching Facebook pages:", error);
    throw new Error("Failed to fetch Facebook pages");
  }
};

// ======================================================
// Facebook Graph API Integration
// ======================================================

/**
 * Helper function to detect if a string is a URL
 */
const isUrl = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Uploads an image to Facebook from a URL and returns the media ID
 */
const uploadImageToFacebook = async (
  pageId: string,
  accessToken: string,
  imageUrl: string
): Promise<string> => {
  try {
    const apiVersion = "v22.0";
    const url = `https://graph.facebook.com/${apiVersion}/${pageId}/photos`;

    const params = new URLSearchParams();
    params.append("url", imageUrl);
    params.append("published", "false");
    params.append("access_token", accessToken);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log(`Successfully uploaded image to Facebook with ID: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error("Error uploading image URL to Facebook:", error);
    throw error;
  }
};

/**
 * Uploads an image file directly to Facebook and returns the media ID
 */
const uploadImageFileToFacebook = async (
  pageId: string,
  accessToken: string,
  imageFile: File
): Promise<string> => {
  try {
    const apiVersion = "v22.0";
    const url = `https://graph.facebook.com/${apiVersion}/${pageId}/photos`;

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("source", imageFile);
    formData.append("published", "false");
    formData.append("access_token", accessToken);

    const response = await fetch(url, {
      method: "POST",
      // No Content-Type header needed - browser will set it with the boundary
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log(
      `Successfully uploaded image file to Facebook with ID: ${data.id}`
    );
    return data.id;
  } catch (error) {
    console.error("Error uploading image file to Facebook:", error);
    throw error;
  }
};

/**
 * Handles different types of media uploads (URL or File)
 */
const uploadMediaToFacebook = async (
  pageId: string,
  accessToken: string,
  media: string | File
): Promise<string> => {
  // If media is a string (URL)
  if (typeof media === "string") {
    if (isUrl(media)) {
      return await uploadImageToFacebook(pageId, accessToken, media);
    } else {
      throw new Error("Invalid media URL format");
    }
  }
  // If media is a File object
  else if (media instanceof File) {
    return await uploadImageFileToFacebook(pageId, accessToken, media);
  } else {
    throw new Error(
      "Unsupported media type. Must be URL string or File object"
    );
  }
};

/**
 * Posts content to a Facebook page using Graph API
 * @param mediaItems Can be either URL strings or File objects
 */
const postToFacebookPage = async (
  pageId: string,
  accessToken: string,
  content: string,
  mediaItems?: (string | File)[]
): Promise<string> => {
  try {
    const apiVersion = "v22.0";
    let pageAccessToken = accessToken;

    try {
      const pageTokenUrl = `https://graph.facebook.com/${apiVersion}/${pageId}?fields=access_token&access_token=${accessToken}`;

      const pageTokenResponse = await fetch(pageTokenUrl);
      if (pageTokenResponse.ok) {
        const pageTokenData = await pageTokenResponse.json();
        if (pageTokenData.access_token) {
          pageAccessToken = pageTokenData.access_token;
        }
      }
    } catch (tokenError) {
      console.error("Error fetching page access token:", tokenError);
    }

    // If there are media items, we need to handle them differently
    if (mediaItems && mediaItems.length > 0) {
      if (mediaItems.length === 1) {
        const media = mediaItems[0];
        
        // If the media is a URL string, try direct posting first
        if (typeof media === "string" && isUrl(media)) {
          // For a single image URL, we can post directly with a link
          const url = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
          
          const params = new URLSearchParams();
          params.append("message", content);
          params.append("access_token", pageAccessToken);
          params.append("link", media);
          
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params,
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Successfully posted to Facebook page ${pageId}`);
            return data.id;
          }
        }
        
        // If direct posting failed or it's a file, try the upload approach
        try {
          // Upload the media (handles both URL strings and Files)
          const mediaId = await uploadMediaToFacebook(pageId, pageAccessToken, media);
          
          // Create post with attached media
          const postUrl = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
          const postParams = new URLSearchParams();
          postParams.append("message", content);
          postParams.append("attached_media[0]", JSON.stringify({ media_fbid: mediaId }));
          postParams.append("access_token", pageAccessToken);
          
          const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: postParams,
          });
          
          if (!postResponse.ok) {
            const postErrorData = await postResponse.json();
            throw new Error(`Facebook API error: ${JSON.stringify(postErrorData)}`);
          }
          
          const postData = await postResponse.json();
          console.log(`Successfully posted to Facebook page ${pageId} with image`);
          return postData.id;
        } catch (uploadError) {
          console.error("Error with image upload approach:", uploadError);
          
          // If original token is different, try with original token (only for URL media)
          if (pageAccessToken !== accessToken && typeof media === "string" && isUrl(media)) {
            const url = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
            const params = new URLSearchParams();
            params.append("message", content);
            params.append("access_token", accessToken);
            params.append("link", media);
            
            const retryResponse = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: params,
            });
            
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              return retryData.id;
            } else {
              const retryErrorData = await retryResponse.json();
              throw new Error(`Facebook API error: ${JSON.stringify(retryErrorData)}`);
            }
          } else {
            // Re-throw the original error
            throw uploadError;
          }
        }
      } else {
        // For multiple media items, we need to upload each one separately, then create a post with all of them
        try {
          // Upload each media item and get its media ID
          const mediaIds = [];
          for (let i = 0; i < mediaItems.length; i++) {
            const mediaId = await uploadMediaToFacebook(pageId, pageAccessToken, mediaItems[i]);
            mediaIds.push(mediaId);
          }
          
          // Create a post with all media items attached
          const postUrl = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
          const postParams = new URLSearchParams();
          postParams.append("message", content);
          postParams.append("access_token", pageAccessToken);
          
          // Attach all media IDs
          mediaIds.forEach((id, index) => {
            postParams.append(`attached_media[${index}]`, JSON.stringify({ media_fbid: id }));
          });
          
          const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: postParams,
          });
          
          if (!postResponse.ok) {
            const postErrorData = await postResponse.json();
            throw new Error(`Facebook API error: ${JSON.stringify(postErrorData)}`);
          }
          
          const postData = await postResponse.json();
          console.log(`Successfully posted to Facebook page ${pageId} with ${mediaIds.length} images`);
          return postData.id;
        } catch (uploadError) {
          console.error("Error uploading multiple media items:", uploadError);
          throw uploadError;
        }
      }
    } else {
      // Text-only post
      const url = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;

      const params = new URLSearchParams();
      params.append("message", content);
      params.append("access_token", pageAccessToken);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (pageAccessToken !== accessToken) {
          params.set("access_token", accessToken);
          
          const retryResponse = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params,
          });
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            return retryData.id;
          } else {
            const retryErrorData = await retryResponse.json();
            throw new Error(`Facebook API error: ${JSON.stringify(retryErrorData)}`);
          }
        }
        
        if (errorData.error && errorData.error.code === 200) {
          throw new Error(
            `Permission error: Make sure your token has pages_read_engagement and pages_manage_posts permissions for this page.`
          );
        } else if (errorData.error && errorData.error.code === 100) {
          throw new Error(
            `Page not found or not accessible: Check that the page ID ${pageId} is correct and your app has access to it.`
          );
        } else {
          throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
        }
      }

      const data = await response.json();
      console.log(`Successfully posted to Facebook page ${pageId}`);
      return data.id;
    }
  } catch (error) {
    throw error;
  }
};

// ======================================================
// Post Creation and Publishing
// ======================================================
export const createPost = async (
  userId: string,
  postData: FacebookPost & { mediaFiles?: File[] } // Temporary type extension until FacebookPost is updated
): Promise<string[]> => {
  try {
    const postId = `post_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    
    // Combine both URL strings and File objects for posting
    const allMedia: (string | File)[] = [];
    
    // Add URL strings if they exist
    if (postData.mediaUrls && postData.mediaUrls.length > 0) {
      allMedia.push(...postData.mediaUrls);
    }
    
    // Add File objects if they exist
    if (postData.mediaFiles && postData.mediaFiles.length > 0) {
      allMedia.push(...postData.mediaFiles);
    }
    
    const post = {
      ...postData,
      id: postId,
      authorId: userId,
      createdAt: new Date().toISOString(),
      status: postData.scheduledFor ? "scheduled" : "published",
      mediaUrls: postData.mediaUrls || [], // Keep this for backward compatibility
    };

    if (postData.scheduledFor) {
      // For scheduled posts, we can only store URLs in localStorage, not File objects
      // Files would need to be uploaded and stored as URLs before scheduling
      const scheduledPostsJson = localStorage.getItem("scheduled_posts");
      const scheduledPosts = scheduledPostsJson
        ? JSON.parse(scheduledPostsJson)
        : [];

      scheduledPosts.push(post);
      localStorage.setItem("scheduled_posts", JSON.stringify(scheduledPosts));

      console.log(`Post scheduled for ${postData.scheduledFor}`);
      return [postId];
    }

    const postResults = [];
    const errors = [];

    for (const pageId of postData.pageIds) {
      try {
        const pageDoc = await getDoc(doc(db, "facebook_pages", pageId));

        if (pageDoc.exists()) {
          const page = { id: pageDoc.id, ...pageDoc.data() } as FacebookPage;

          try {
            const fbPostId = await postToFacebookPage(
              page.pageId,
              page.accessToken,
              postData.content,
              allMedia.length > 0 ? allMedia : undefined
            );

            postResults.push(fbPostId);
          } catch (error) {
            const postError = error as Error;
            errors.push({
              pageId: page.pageId,
              pageName: page.name,
              error: postError.message || "Unknown error",
            });
          }
        } else {
          errors.push({
            pageId,
            error: "Page not found in database",
          });
        }
      } catch (error) {
        const fbError = error as Error;
        errors.push({
          pageId,
          error: fbError.message || "Unknown error",
        });
      }
    }

    if (postResults.length > 0) {
      console.log(
        `Successfully posted to ${postResults.length}/${postData.pageIds.length} pages`
      );
      return postResults;
    }

    throw new Error(`Failed to post to any pages: ${JSON.stringify(errors)}`);
  } catch (error) {
    console.error("Error creating post:", error);
    throw new Error("Failed to create post");
  }
};

// ======================================================
// Scheduled Post Management
// ======================================================
export const processScheduledPosts = async (): Promise<void> => {
  try {
    const scheduledPostsJson = localStorage.getItem("scheduled_posts");
    if (!scheduledPostsJson) {
      return;
    }

    const scheduledPosts = JSON.parse(scheduledPostsJson) as FacebookPost[];
    if (
      !scheduledPosts ||
      !Array.isArray(scheduledPosts) ||
      scheduledPosts.length === 0
    ) {
      return;
    }

    const now = new Date();
    const postsToPublish = scheduledPosts.filter((post) => {
      if (!post.scheduledFor) return false;
      const scheduledTime = new Date(post.scheduledFor);
      return scheduledTime <= now && post.status === "scheduled";
    });

    if (postsToPublish.length === 0) {
      return;
    }

    console.log(`Processing ${postsToPublish.length} scheduled posts`);
    let successCount = 0;

    for (const post of postsToPublish) {
      for (const pageId of post.pageIds) {
        try {
          const pageDoc = await getDoc(doc(db, "facebook_pages", pageId));

          if (pageDoc.exists()) {
            const page = { id: pageDoc.id, ...pageDoc.data() } as FacebookPage;

            await postToFacebookPage(
              page.pageId,
              page.accessToken,
              post.content,
              post.mediaUrls
            );

            post.status = "published";
            successCount++;
          } else {
            post.status = "failed";
          }
        } catch {
          post.status = "failed";
        }
      }
    }

    const filteredPosts = scheduledPosts.filter((post) => {
      if (post.status === "scheduled") {
        return true;
      }
      const wasProcessed = postsToPublish.some((p) => p.id === post.id);
      if (wasProcessed && post.status === "failed") {
        return true;
      }
      if (wasProcessed && post.status === "published") {
        return false;
      }
      return true;
    });

    localStorage.setItem("scheduled_posts", JSON.stringify(filteredPosts));

    if (successCount > 0) {
      console.log(`Successfully published ${successCount} scheduled posts`);
    }
  } catch (error) {
    throw error;
  }
};
