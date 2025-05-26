/**
 * Facebook Service
 *
 * Handles Facebook API integration, topic searching, post creation,
 * and scheduled post management.
 */

import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  FacebookPage,
  FacebookPost,
  FacebookTopic,
  TopicSearchParams,
} from "../../types";
import config from "../config";

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
    const apiKey = config.apify.apiKey;
    if (!apiKey) {
      throw new Error("Apify API key not found in configuration");
    }

    // Use the easyapi/facebook-posts-search-scraper actor
    const actorId = config.apify.actorId;
    console.log(`Using Apify actor: ${actorId}`);

    const runInput = prepareActorInput(actorId, params);
    console.log("Apify actor input:", JSON.stringify(runInput));

    // In production (or static export), call Apify API directly
    // In development, use our API route
    const isProduction =
      typeof window !== "undefined" && window.location.hostname !== "localhost";

    // Make the appropriate API call based on environment
    const response = isProduction
      ? await fetch(
          `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(runInput),
          }
        )
      : await fetch("/api/apify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint: `acts/${actorId}/run-sync-get-dataset-items`,
            method: "POST",
            payload: runInput,
            token: apiKey,
          }),
        });

    // Get response text first
    const responseText = await response.text();
    console.log(`Raw dataset response: ${responseText}`);

    // Then check if response was ok
    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        console.error("Apify API error response:", JSON.stringify(errorData));
        throw new Error(`Apify API error: ${JSON.stringify(errorData)}`);
      } catch {
        // If response is not JSON
        throw new Error(
          `Apify API error: ${response.status} - ${responseText.substring(0, 100)}`
        );
      }
    }

    let rawTopics;
    try {
      rawTopics = JSON.parse(responseText);
    } catch (e) {
      console.error("Error parsing dataset response as JSON:", e);
      console.log("Full response text:", responseText);
      throw new Error("Failed to parse dataset response as JSON");
    }

    if (!rawTopics || !Array.isArray(rawTopics) || rawTopics.length === 0) {
      console.log("No topics found in Apify dataset or invalid data format");
      console.log("Raw response:", JSON.stringify(rawTopics));
      return [];
    }

    console.log(`Retrieved ${rawTopics.length} items from Apify dataset`);
    console.log(
      "Sample item:",
      JSON.stringify(rawTopics[0]).substring(0, 200) + "..."
    );

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
  // For danek~facebook-search-ppr actor
  if (actorId.includes("danek~facebook-search-ppr")) {
    return {
      query: params.keyword,
      search_type: "posts",
      max_posts: params.maxItems || 20,
      limit: params.maxItems || 20,
      maxResults: params.maxItems || 20,
      ...(params.startDate && { dateFrom: params.startDate }),
      ...(params.endDate && { dateTo: params.endDate }),
      ...(params.language && { language: params.language }),
      proxyConfiguration: {
        useApifyProxy: true,
      },
    };
  }

  // For facebook-posts-scraper actor
  if (
    actorId.includes("facebook-posts-scraper") ||
    actorId.includes("facebook-scraper")
  ) {
    return {
      startUrls: [
        {
          url: `https://www.facebook.com/search/posts/?q=${encodeURIComponent(
            params.keyword
          )}`,
        },
      ],
      maxPosts: params.maxItems,
      commentsMode: "NONE",
      reactionsMode: "NONE",
      language: params.language || "en",
      maxComments: 0,
      maxPostDate: params.endDate || undefined,
      minPostDate: params.startDate || undefined,
      proxyConfiguration: {
        useApifyProxy: true,
      },
    };
  }

  // Handle both slash and tilde formats for easyapi actor
  if (actorId.includes("facebook-posts-search-scraper")) {
    return {
      searchQuery: params.keyword,
      maxPosts: params.maxItems,
    };
  }

  if (actorId === "blf62maenLRO8Rsfv") {
    return {
      keyword: params.keyword,
      startDate:
        params.startDate ||
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: params.endDate || new Date().toISOString(),
      maxItems: params.maxItems,
    };
  }

  if (actorId === "your-twitter-actor-id") {
    return {
      query: params.keyword,
      maxTweets: params.maxItems,
    };
  }

  return {
    keyword: params.keyword,
    startDate: params.startDate,
    endDate: params.endDate,
    maxItems: params.maxItems,
  };
};

/**
 * Transforms the output from a specific Apify actor to match our FacebookTopic interface
 */
let uniqueCounter = 0;
const getUniqueId = () => {
  uniqueCounter += 1;
  return `${Date.now()}-${uniqueCounter}`;
};

const transformActorOutput = (
  actorId: string,
  rawData: Record<string, unknown>[],
  params: TopicSearchParams
): FacebookTopic[] => {
  const limitedData = params.maxItems
    ? rawData.slice(0, params.maxItems)
    : rawData;

  if (actorId.includes("danek~facebook-search-ppr")) {
    return limitedData.map((item: Record<string, unknown>, index: number) => {
      const text = (item.message as string) || "";
      const timestamp = item.timestamp as number;
      const postDate = timestamp
        ? new Date(timestamp * 1000).toISOString()
        : new Date().toISOString();
      const comments = (item.comments_count as number) || 0;
      const shares = (item.reshare_count as number) || 0;
      const reactions = (item.reactions as Record<string, number>) || {};
      const totalReactions = Object.values(reactions).reduce(
        (sum, count) => sum + count,
        0
      );
      const popularityScore = totalReactions + comments * 2 + shares * 3;
      const extractedKeywords = text
        .split(/\s+/)
        .filter((word) => word.length > 4)
        .slice(0, 5);

      const keywords = [params.keyword, ...extractedKeywords].filter(
        (v, i, a) => a.indexOf(v) === i
      );

      const author = (item.author as Record<string, unknown>) || {};
      const pageName = (author.name as string) || "Facebook Page";
      const pageUrl = (author.url as string) || "";

      const videoUrl = item.video as string;
      const videoThumbnail = item.video_thumbnail as string;
      const imageUrl = item.image as string;

      return {
        id: `fb-${item.post_id || index}-${getUniqueId()}`,
        topic: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        date: postDate,
        popularityScore,
        keywords,
        relatedTopics: [pageName],
        comments,
        shares,
        url: item.url as string,
        text,
        pageName,
        pageUrl,
        postId: item.post_id as string,
        type: item.type as string,
        videoUrl,
        videoThumbnail,
        imageUrl,
        time: postDate,
      };
    });
  }

  if (
    actorId.includes("facebook-posts-scraper") ||
    actorId.includes("facebook-scraper")
  ) {
    return limitedData.map((item: Record<string, unknown>, index: number) => {
      const text = (item.text as string) || "";
      const postDate =
        (item.postDate as string) ||
        (item.date as string) ||
        new Date().toISOString();
      const likes = typeof item.likesCount === "number" ? item.likesCount : 0;
      const comments =
        typeof item.commentsCount === "number" ? item.commentsCount : 0;
      const shares =
        typeof item.sharesCount === "number" ? item.sharesCount : 0;
      const popularityScore = likes + comments * 2 + shares * 3;
      const extractedKeywords = text
        .split(/\s+/)
        .filter((word) => word.length > 4)
        .slice(0, 5);
      const keywords = [params.keyword, ...extractedKeywords].filter(
        (v, i, a) => a.indexOf(v) === i
      );

      const authorName =
        (item.authorName as string) ||
        ((item.pageInfo as Record<string, unknown>)?.name as string) ||
        "Facebook User";

      return {
        id: `fb-${item.postId || item.postUrl || index}-${getUniqueId()}`,
        topic: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        date: postDate,
        popularityScore,
        keywords,
        relatedTopics: [authorName],
      };
    });
  }

  if (actorId.includes("facebook-posts-search-scraper")) {
    return limitedData.map((item: Record<string, unknown>, index: number) => {
      const likes = typeof item.likes === "number" ? item.likes : 0;
      const comments = typeof item.comments === "number" ? item.comments : 0;
      const shares =
        typeof item.shares === "string"
          ? parseInt(item.shares, 10) || 0
          : typeof item.shares === "number"
          ? item.shares
          : 0;
      const popularityScore = likes + comments * 2 + shares * 3;
      const text = (item.text as string) || "";
      const extractedKeywords = text
        .split(/\s+/)
        .filter((word) => word.length > 4)
        .slice(0, 5);

      const keywords = [params.keyword, ...extractedKeywords].filter(
        (v, i, a) => a.indexOf(v) === i
      );

      return {
        id: `fb-${item.postId || index}-${getUniqueId()}`,
        topic: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        date: (item.time as string) || new Date().toISOString(),
        popularityScore,
        keywords,
        relatedTopics: [(item.pageName as string) || "Facebook Page"],
        likes,
        comments,
        shares,
        url: item.url as string,
        text,
        pageName: item.pageName as string,
      };
    });
  }

  if (actorId === "blf62maenLRO8Rsfv") {
    return limitedData.map((item: Record<string, unknown>, index: number) => ({
      id: `apify-${index}-${getUniqueId()}`,
      topic:
        (item.title as string) ||
        (item.topic as string) ||
        `Topic ${index + 1}`,
      date: (item.date as string) || new Date().toISOString(),
      popularityScore:
        (item.score as number) || Math.floor(Math.random() * 100),
      keywords: (item.keywords as string[]) || [params.keyword],
      relatedTopics: [(item.source as string) || "Unknown Source"],
    }));
  }

  if (actorId === "your-twitter-actor-id") {
    return limitedData.map((item: Record<string, unknown>, index: number) => {
      const user = item.user as Record<string, unknown> | undefined;
      return {
        id: `twitter-${index}-${getUniqueId()}`,
        topic: (item.text as string) || `Tweet ${index + 1}`,
        date: (item.created_at as string) || new Date().toISOString(),
        popularityScore: calculateScore(item),
        keywords: extractKeywords(item, params.keyword),
        relatedTopics: [(user?.name as string) || "Twitter User"],
      };
    });
  }

  return limitedData.map((item: Record<string, unknown>, index: number) => {
    const text =
      (item.text as string) ||
      (item.content as string) ||
      (item.title as string) ||
      `Item ${index + 1}`;

    return {
      id: `topic-${index}-${getUniqueId()}`,
      topic: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
      date:
        (item.date as string) ||
        (item.timestamp as string) ||
        (item.created_at as string) ||
        new Date().toISOString(),
      popularityScore: Math.floor(Math.random() * 100),
      keywords: [params.keyword],
      relatedTopics: ["Unknown Source"],
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

    // Skip saving to Firebase due to permission issues
    // topics.forEach(async (topic) => {
    //   try {
    //     await addDoc(collection(db, "topics"), {
    //       ...topic,
    //       searchKeyword: params.keyword,
    //       createdAt: Timestamp.now(),
    //     });
    //   } catch (error) {
    //     console.error("Error creating topic:", error);
    //   }
    // });

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
 * Uploads a video file to Facebook via server-side proxy to avoid CORS issues
 * Uses our API route to handle the upload server-side
 * Note: Video uploads automatically create a post on Facebook
 */
const uploadVideoFileToFacebook = async (
  pageId: string,
  accessToken: string,
  videoFile: File,
  onProgress?: (fileName: string, progress: number) => void,
  onError?: (fileName: string, error: string) => void,
  content?: string
): Promise<string> => {
  try {
    console.log(`Starting video upload for page ID: ${pageId}`);
    const apiVersion = "v22.0";
    onProgress?.(videoFile.name, 0);

    // Read the file as a base64 data URL
    const fileReader = new FileReader();
    const fileDataPromise = new Promise<string>((resolve, reject) => {
      fileReader.onload = () => {
        onProgress?.(videoFile.name, 20);
        resolve(fileReader.result as string);
      };
      fileReader.onerror = () => {
        const error = fileReader.error?.message || "Error reading file";
        onError?.(videoFile.name, error);
        reject(fileReader.error);
      };
      fileReader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 20);
          onProgress?.(videoFile.name, progress);
        }
      };
      fileReader.readAsDataURL(videoFile);
    });

    const fileData = await fileDataPromise;
    onProgress?.(videoFile.name, 25);

    // Extract the base64 data
    const base64Data = fileData.split(",")[1];
    if (!base64Data) {
      throw new Error("Invalid file data format");
    }

    // Create form data for the Graph API
    const formData = new FormData();
    formData.append("access_token", accessToken);
    formData.append(
      "source",
      new Blob([Buffer.from(base64Data, "base64")], { type: videoFile.type }),
      videoFile.name
    );
    formData.append(
      "title",
      videoFile.name.split(".")[0] || "Video from PostFlow Portal"
    );
    formData.append(
      "description",
      content || "Video uploaded via PostFlow Portal"
    );

    // Send direct request to Facebook Graph API
    const response = await fetch(
      `https://graph-video.facebook.com/${apiVersion}/${pageId}/videos`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    onProgress?.(videoFile.name, 100);
    console.log(`Video uploaded successfully with ID: ${data.id}`);
    console.log(
      `Note: The video upload has automatically created a post on Facebook.`
    );

    return data.id;
  } catch (error) {
    console.error("Error in video upload process:", error);
    if (error instanceof Error) {
      onError?.(videoFile.name, error.message);
    } else {
      onError?.(videoFile.name, "Unknown error during upload");
    }
    throw error;
  }
};

/**
 * Handles different types of media uploads (URL or File)
 */
const uploadMediaToFacebook = async (
  pageId: string,
  accessToken: string,
  media: string | File,
  onProgress?: (fileName: string, progress: number) => void,
  onError?: (fileName: string, error: string) => void,
  content?: string // Add post content parameter
): Promise<string> => {
  if (typeof media === "string") {
    if (isUrl(media)) {
      return await uploadImageToFacebook(pageId, accessToken, media);
    } else {
      throw new Error("Invalid media URL format");
    }
  } else if (media instanceof File) {
    // Check if the file is a video based on its type
    if (media.type.startsWith("video/")) {
      return await uploadVideoFileToFacebook(
        pageId,
        accessToken,
        media,
        onProgress,
        onError,
        content
      );
    } else {
      return await uploadImageFileToFacebook(pageId, accessToken, media);
    }
  } else {
    throw new Error(
      "Unsupported media type. Must be URL string or File object"
    );
  }
};

/**
 * Verify access token permissions before posting
 */
const verifyTokenPermissions = async (
  accessToken: string
): Promise<boolean> => {
  try {
    // First, debug the token to get its type
    const response = await fetch(
      `https://graph.facebook.com/v22.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error("Failed to verify token permissions");
    }

    const data = await response.json();
    console.log("Token debug data:", data);

    if (data.error) {
      throw new Error(`Token error: ${data.error.message}`);
    }

    // Only check permissions for USER tokens
    if (data.data?.type === "USER") {
      const permResponse = await fetch(
        `https://graph.facebook.com/v22.0/me/permissions?access_token=${accessToken}`
      );
      const permData = await permResponse.json();
      console.log("Token permissions (USER):", permData);
    } else if (data.data?.type === "PAGE") {
      // For PAGE tokens, we just verify it's valid and has the correct type
      console.log(
        "Using PAGE access token - permissions are inherited from the page role"
      );
    }

    return true;
  } catch (error) {
    console.error("Token verification error:", error);
    throw error;
  }
};

/**
 * Get a page access token from a user access token
 */
const getPageAccessToken = async (
  pageId: string,
  userAccessToken: string
): Promise<string> => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${pageId}?fields=access_token&access_token=${userAccessToken}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to get page access token: ${errorData.error?.message}`
      );
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error getting page access token:", error);
    throw error;
  }
};

/**
 * Posts content to a Facebook page using Graph API
 */
export const postToFacebookPage = async (
  pageId: string,
  userAccessToken: string,
  content: string,
  mediaItems?: (string | File)[]
): Promise<string> => {
  try {
    // First, get a page access token
    console.log("Getting page access token...");
    const pageAccessToken = await getPageAccessToken(pageId, userAccessToken);
    console.log("Successfully got page access token");

    // Verify token permissions
    await verifyTokenPermissions(pageAccessToken);

    const apiVersion = "v22.0";

    // Check if we have media items
    if (mediaItems && mediaItems.length > 0) {
      const mediaItem = mediaItems[0];

      // Handle video upload
      if (mediaItem instanceof File && mediaItem.type.startsWith("video/")) {
        const formData = new FormData();
        formData.append("source", mediaItem);
        formData.append("description", content);
        formData.append("access_token", pageAccessToken); // Use page token

        const response = await fetch(
          `https://graph-video.facebook.com/${apiVersion}/${pageId}/videos`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Facebook API Error Response:", errorData);
          throw new Error(
            errorData.error?.message || "Failed to upload video to Facebook"
          );
        }

        const data = await response.json();
        return data.id;
      }

      // Handle image upload
      if (typeof mediaItem === "string" || mediaItem instanceof File) {
        const mediaId = await uploadMediaToFacebook(
          pageId,
          pageAccessToken, // Use page token
          mediaItem
        );

        // Create post with media
        const params = new URLSearchParams();
        params.append("message", content);
        params.append("attached_media[0]", `{"media_fbid":"${mediaId}"}`);
        params.append("access_token", pageAccessToken); // Use page token

        const response = await fetch(
          `https://graph.facebook.com/${apiVersion}/${pageId}/feed`,
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
    }

    // Text-only post
    const params = new URLSearchParams();
    params.append("message", content);
    params.append("access_token", pageAccessToken); // Use page token

    console.log("Attempting to create post...");
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${pageId}/feed`,
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
    console.error("Error in postToFacebookPage:", error);
    throw error;
  }
};

export const createPost = async (
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
      const postId = await postToFacebookPage(
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

/**
 * Processes scheduled posts that are due for publishing
 * @returns Array of processed post IDs
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
        // Create the post
        const postIds = await createPost(userId, {
          ...post,
          status: "published",
        });
        processedPostIds.push(...postIds);

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
