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
 * Real implementation of Apify API for topic fetching
 */
const fetchTopicsFromApify = async (
  params: TopicSearchParams
): Promise<FacebookTopic[]> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_APIFY_API_KEY;
    if (!apiKey) {
      throw new Error("Apify API key not found in environment variables");
    }

    const actorId =
      process.env.NEXT_PUBLIC_APIFY_ACTOR_ID || "blf62maenLRO8Rsfv";
    console.log(`Using Apify actor: ${actorId}`);

    const runInput = prepareActorInput(actorId, params);
    const response = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run: { input: runInput } }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Apify API error response:", JSON.stringify(errorData, null, 2));
      
      // Handle different error types from Apify API
      if (errorData.error) {
        // Case: Actor is not rented/paid
        if (errorData.error.type === "actor-is-not-rented") {
          const actorStoreUrl = `https://apify.com/store?search=${actorId}`;
          throw new Error(
            `This Apify actor requires a paid subscription. Please visit ${actorStoreUrl} to rent the actor or choose a different one.`
          );
        }
        
        // Case: Actor not found
        if (errorData.error.type === "actor-not-found") {
          throw new Error(
            `The specified Apify actor (${actorId}) was not found. Please check your NEXT_PUBLIC_APIFY_ACTOR_ID environment variable.`
          );
        }
        
        // Case: Invalid input
        if (errorData.error.type === "invalid-parameter") {
          throw new Error(
            `Invalid input parameters for Apify actor: ${errorData.error.message}`
          );
        }
      }
      
      throw new Error(`Apify API error: ${JSON.stringify(errorData)}`);
    }

    const runData = await response.json();
    const runId = runData.data.id;

    let runStatus = "RUNNING";
    const maxAttempts = 30;
    let attempts = 0;

    while (runStatus === "RUNNING" && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/${actorId}/runs/${runId}?token=${apiKey}`
      );
      const statusData = await statusResponse.json();
      runStatus = statusData.data.status;
      attempts++;
    }

    if (runStatus !== "SUCCEEDED") {
      throw new Error(
        `Apify run failed or timed out with status: ${runStatus}`
      );
    }

    const datasetResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs/${runId}/dataset/items?token=${apiKey}`
    );

    if (!datasetResponse.ok) {
      const errorData = await datasetResponse.json();
      throw new Error(`Apify dataset error: ${JSON.stringify(errorData)}`);
    }

    const rawTopics = await datasetResponse.json();
    if (!rawTopics || !Array.isArray(rawTopics) || rawTopics.length === 0) {
      return [];
    }

    return transformActorOutput(actorId, rawTopics, params);
  } catch (error) {
    console.error("Error fetching topics from Apify:", error);
    throw error;
  }
};

/**
 * Prepares the input for a specific Apify actor based on its ID
 */
const prepareActorInput = (
  actorId: string,
  params: TopicSearchParams
): Record<string, unknown> => {
  if (actorId === "blf62maenLRO8Rsfv") {
    return {
      keyword: params.keyword,
      startDate:
        params.startDate ||
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: params.endDate || new Date().toISOString(),
      maxItems: 20,
    };
  }

  if (actorId === "your-twitter-actor-id") {
    return {
      query: params.keyword,
      fromDate: params.startDate,
      toDate: params.endDate,
      limit: 30,
    };
  }

  if (actorId === "your-generic-actor-id") {
    return {
      searchTerm: params.keyword,
      dateFrom: params.startDate,
      dateTo: params.endDate,
      platform: "facebook",
      maxResults: 25,
    };
  }

  return {
    query: params.keyword,
    startDate: params.startDate,
    endDate: params.endDate,
  };
};

/**
 * Transforms the output from a specific Apify actor to match our FacebookTopic interface
 */
const transformActorOutput = (
  actorId: string,
  rawData: Record<string, unknown>[],
  params: TopicSearchParams
): FacebookTopic[] => {
  if (actorId === "blf62maenLRO8Rsfv") {
    return rawData.map((item: Record<string, unknown>, index: number) => ({
      id: `apify-${index}-${Date.now()}`,
      topic:
        (item.title as string) ||
        (item.topic as string) ||
        `Topic ${index + 1}`,
      date: (item.date as string) || new Date().toISOString(),
      popularityScore:
        (item.score as number) || Math.floor(Math.random() * 100),
      keywords: (item.keywords as string[]) || [params.keyword],
    }));
  }

  if (actorId === "your-twitter-actor-id") {
    return rawData.map((item: Record<string, unknown>, index: number) => ({
      id: `twitter-${index}-${Date.now()}`,
      topic: (item.text as string) || `Tweet ${index + 1}`,
      date: (item.created_at as string) || new Date().toISOString(),
      popularityScore: calculateScore(item),
      keywords: extractKeywords(item, params.keyword),
    }));
  }

  if (actorId === "your-generic-actor-id") {
    return rawData.map((item: Record<string, unknown>, index: number) => ({
      id: `social-${index}-${Date.now()}`,
      topic: (item.content as string) || `Post ${index + 1}`,
      date: (item.timestamp as string) || new Date().toISOString(),
      popularityScore: Number(item.engagement) || 50,
      keywords: (item.tags as string[]) || [params.keyword],
    }));
  }

  return rawData.map((item: Record<string, unknown>, index: number) => {
    const topic =
      (item.title as string) ||
      (item.topic as string) ||
      (item.text as string) ||
      (item.content as string) ||
      `Item ${index + 1}`;

    const date =
      (item.date as string) ||
      (item.created_at as string) ||
      (item.timestamp as string) ||
      new Date().toISOString();

    const score =
      (item.score as number) ||
      (item.popularity as number) ||
      (item.engagement as number) ||
      50;

    const keywords = (item.keywords as string[]) ||
      (item.tags as string[]) ||
      (item.hashtags as string[]) || [params.keyword];

    return {
      id: `generic-${index}-${Date.now()}`,
      topic,
      date,
      popularityScore: typeof score === "number" ? score : 50,
      keywords,
    };
  });
};

/**
 * Helper function to calculate a popularity score from various metrics
 */
const calculateScore = (item: Record<string, unknown>): number => {
  let score = 50;

  if (item.favorite_count || item.retweet_count) {
    const favorites = Number(item.favorite_count) || 0;
    const retweets = Number(item.retweet_count) || 0;
    score = Math.min(Math.floor((favorites + retweets * 2) / 10), 100);
  }

  return score;
};

/**
 * Helper function to extract keywords from content
 */
const extractKeywords = (
  item: Record<string, unknown>,
  defaultKeyword: string
): string[] => {
  const keywords: string[] = [defaultKeyword];

  if (Array.isArray(item.hashtags)) {
    item.hashtags.forEach((tag: unknown) => {
      if (typeof tag === "string") {
        keywords.push(tag);
      }
    });
  }

  return keywords;
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
  } catch (error) {
    console.error("Error in searchTopics:", error);
    throw new Error("Failed to fetch topics");
  }
};

// ======================================================
// Facebook Page Management
// ======================================================
export const getUserPages = async (userId: string): Promise<FacebookPage[]> => {
  try {
    const pagesQuery = query(
      collection(db, "facebook_pages"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(pagesQuery);
    const pages = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as FacebookPage)
    );

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
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
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

    const formData = new FormData();
    formData.append("source", imageFile);
    formData.append("published", "false");
    formData.append("access_token", accessToken);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
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
  if (typeof media === "string") {
    if (isUrl(media)) {
      return await uploadImageToFacebook(pageId, accessToken, media);
    } else {
      throw new Error("Invalid media URL format");
    }
  } else if (media instanceof File) {
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

    if (mediaItems && mediaItems.length > 0) {
      if (mediaItems.length === 1) {
        const media = mediaItems[0];

        if (typeof media === "string" && isUrl(media)) {
          const url = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
          const params = new URLSearchParams();
          params.append("message", content);
          params.append("access_token", pageAccessToken);
          params.append("link", media);

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params,
          });

          if (response.ok) {
            const data = await response.json();
            return data.id;
          }
        }

        try {
          const mediaId = await uploadMediaToFacebook(
            pageId,
            pageAccessToken,
            media
          );
          const postUrl = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
          const postParams = new URLSearchParams();
          postParams.append("message", content);
          postParams.append(
            "attached_media[0]",
            JSON.stringify({ media_fbid: mediaId })
          );
          postParams.append("access_token", pageAccessToken);

          const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: postParams,
          });

          if (!postResponse.ok) {
            const postErrorData = await postResponse.json();
            throw new Error(
              `Facebook API error: ${JSON.stringify(postErrorData)}`
            );
          }

          const postData = await postResponse.json();
          return postData.id;
        } catch (uploadError) {
          if (
            pageAccessToken !== accessToken &&
            typeof media === "string" &&
            isUrl(media)
          ) {
            const url = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
            const params = new URLSearchParams();
            params.append("message", content);
            params.append("access_token", accessToken);
            params.append("link", media);

            const retryResponse = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: params,
            });

            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              return retryData.id;
            } else {
              const retryErrorData = await retryResponse.json();
              throw new Error(
                `Facebook API error: ${JSON.stringify(retryErrorData)}`
              );
            }
          } else {
            throw uploadError;
          }
        }
      } else {
        try {
          const mediaIds = [];
          for (let i = 0; i < mediaItems.length; i++) {
            const mediaId = await uploadMediaToFacebook(
              pageId,
              pageAccessToken,
              mediaItems[i]
            );
            mediaIds.push(mediaId);
          }

          const postUrl = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
          const postParams = new URLSearchParams();
          postParams.append("message", content);
          postParams.append("access_token", pageAccessToken);

          mediaIds.forEach((id, index) => {
            postParams.append(
              `attached_media[${index}]`,
              JSON.stringify({ media_fbid: id })
            );
          });

          const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: postParams,
          });

          if (!postResponse.ok) {
            const postErrorData = await postResponse.json();
            throw new Error(
              `Facebook API error: ${JSON.stringify(postErrorData)}`
            );
          }

          const postData = await postResponse.json();
          return postData.id;
        } catch (uploadError) {
          throw uploadError;
        }
      }
    } else {
      const url = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
      const params = new URLSearchParams();
      params.append("message", content);
      params.append("access_token", pageAccessToken);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (pageAccessToken !== accessToken) {
          params.set("access_token", accessToken);
          const retryResponse = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params,
          });

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            return retryData.id;
          } else {
            const retryErrorData = await retryResponse.json();
            throw new Error(
              `Facebook API error: ${JSON.stringify(retryErrorData)}`
            );
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
  postData: FacebookPost & { mediaFiles?: File[] }
): Promise<string[]> => {
  try {
    const postId = `post_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const allMedia: (string | File)[] = [];

    if (postData.mediaUrls && postData.mediaUrls.length > 0) {
      allMedia.push(...postData.mediaUrls);
    }

    if (postData.mediaFiles && postData.mediaFiles.length > 0) {
      allMedia.push(...postData.mediaFiles);
    }

    const post = {
      ...postData,
      id: postId,
      authorId: userId,
      createdAt: new Date().toISOString(),
      status: postData.scheduledFor ? "scheduled" : "published",
      mediaUrls: postData.mediaUrls || [],
    };

    if (postData.scheduledFor) {
      const scheduledPostsJson = localStorage.getItem("scheduled_posts");
      const scheduledPosts = scheduledPostsJson
        ? JSON.parse(scheduledPostsJson)
        : [];
      scheduledPosts.push(post);
      localStorage.setItem("scheduled_posts", JSON.stringify(scheduledPosts));
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
  } catch (error) {
    throw error;
  }
};
