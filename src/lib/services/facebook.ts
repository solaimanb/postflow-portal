/**
 * Facebook Service
 *
 * Handles Facebook API integration, topic searching, post creation,
 * and scheduled post management.
 */

import { db } from "../firebase";
import {
  collection,
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

    // Use the easyapi/facebook-posts-search-scraper actor
    const actorId = "easyapi~facebook-posts-search-scraper";
    console.log(`Using Apify actor: ${actorId}`);

    const runInput = prepareActorInput(actorId, params);
    console.log("Apify actor input:", JSON.stringify(runInput));

    // Use the run-sync-get-dataset-items endpoint which runs the actor and returns results in one call
    const response = await fetch("/api/apify", {
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

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Apify API error response:", JSON.stringify(errorData));
      throw new Error(`Apify API error: ${JSON.stringify(errorData)}`);
    }

    const responseText = await response.text();
    console.log(`Raw dataset response: ${responseText}`);
    
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
    console.log("Sample item:", JSON.stringify(rawTopics[0]).substring(0, 200) + "...");
    
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
  // For facebook-posts-scraper actor
  if (actorId.includes("facebook-posts-scraper") || 
      actorId.includes("facebook-scraper")) {
    return {
      // Use search term as a page name to scrape
      startUrls: [
        {
          "url": `https://www.facebook.com/search/posts/?q=${encodeURIComponent(params.keyword)}`
        }
      ],
      maxPosts: params.maxItems || 20,
      commentsMode: "NONE",
      reactionsMode: "NONE",
      language: params.language || "en",
      maxComments: 0,
      maxPostDate: params.endDate || undefined,
      minPostDate: params.startDate || undefined,
      proxyConfiguration: {
        useApifyProxy: true
      }
    };
  }
  
  // Handle both slash and tilde formats for easyapi actor
  if (actorId.includes("facebook-posts-search-scraper")) {
    return {
      searchQuery: params.keyword,
      maxPosts: params.maxItems || 20
    };
  }

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
      maxTweets: 20,
    };
  }

  // Default input format
  return {
    keyword: params.keyword,
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
  // For facebook-posts-scraper actor
  if (actorId.includes("facebook-posts-scraper") || 
      actorId.includes("facebook-scraper")) {
    return rawData.map((item: Record<string, unknown>, index: number) => {
      // Extract post text
      const text = item.text as string || '';
      
      // Extract date
      const postDate = item.postDate as string || 
                     item.date as string || 
                     new Date().toISOString();
      
      // Extract engagement metrics
      const likes = typeof item.likesCount === 'number' ? item.likesCount : 0;
      const comments = typeof item.commentsCount === 'number' ? item.commentsCount : 0;
      const shares = typeof item.sharesCount === 'number' ? item.sharesCount : 0;
      
      // Calculate popularity score
      const popularityScore = likes + (comments * 2) + (shares * 3);
      
      // Extract keywords from text
      const extractedKeywords = text
        .split(/\s+/)
        .filter(word => word.length > 4)
        .slice(0, 5);
      
      const keywords = [params.keyword, ...extractedKeywords]
        .filter((v, i, a) => a.indexOf(v) === i);
      
      // Get author info
      const authorName = 
        (item.authorName as string) || 
        ((item.pageInfo as Record<string, unknown>)?.name as string) || 
        'Facebook User';
      
      return {
        id: `fb-${item.postId || item.postUrl || index}-${Date.now()}`,
        topic: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        date: postDate,
        popularityScore,
        keywords,
        relatedTopics: [authorName]
      };
    });
  }

  if (actorId.includes("facebook-posts-search-scraper")) {
    return rawData.map((item: Record<string, unknown>, index: number) => {
      // Extract engagement metrics for popularity score
      const likes = typeof item.likes === 'number' ? item.likes : 0;
      const comments = typeof item.comments === 'number' ? item.comments : 0;
      const shares = typeof item.shares === 'string' 
        ? item.shares
        : (typeof item.shares === 'number' ? item.shares : 0);
      
      // Calculate popularity score based on engagement
      const popularityScore = likes + (comments * 2) + (typeof shares === 'number' ? shares * 3 : 0);
      
      // Extract keywords from post text
      const text = item.text as string || '';
      const extractedKeywords = text
        .split(/\s+/)
        .filter(word => word.length > 4)
        .slice(0, 5);
      
      const keywords = [params.keyword, ...extractedKeywords].filter((v, i, a) => a.indexOf(v) === i);
      
      return {
        id: `fb-${item.postId || index}-${Date.now()}`,
        topic: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        date: item.time as string || new Date().toISOString(),
        popularityScore,
        keywords,
        // Additional metadata
        relatedTopics: [item.pageName as string || 'Facebook Page'],
        // Include raw data fields
        likes,
        comments,
        shares,
        url: item.url as string,
        text,
        pageName: item.pageName as string
      };
    });
  }

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

  // Default transformation for unknown actors
  return rawData.map((item: Record<string, unknown>, index: number) => {
    const text = 
      (item.text as string) || 
      (item.content as string) || 
      (item.title as string) || 
      `Item ${index + 1}`;
      
    return {
      id: `topic-${index}-${Date.now()}`,
      topic: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      date: (item.date as string) || 
            (item.timestamp as string) || 
            (item.created_at as string) || 
            new Date().toISOString(),
      popularityScore: Math.floor(Math.random() * 100),
      keywords: [params.keyword],
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
  content?: string // Optional post content to include with the video
): Promise<string> => {
  try {
    console.log(`Starting video upload for page ID: ${pageId}`);

    // Set initial progress
    onProgress?.(videoFile.name, 0);

    // Read the file as a base64 data URL
    const fileReader = new FileReader();
    const fileDataPromise = new Promise<string>((resolve, reject) => {
      fileReader.onload = () => {
        onProgress?.(videoFile.name, 20); // File read complete
        resolve(fileReader.result as string);
      };
      fileReader.onerror = () => {
        const error = fileReader.error?.message || "Error reading file";
        onError?.(videoFile.name, error);
        reject(fileReader.error);
      };
      fileReader.onprogress = (event) => {
        if (event.lengthComputable) {
          // Calculate file reading progress (0-20%)
          const progress = Math.round((event.loaded / event.total) * 20);
          onProgress?.(videoFile.name, progress);
        }
      };
      fileReader.readAsDataURL(videoFile);
    });

    const fileData = await fileDataPromise;

    // Create payload for the proxy endpoint
    const payload = {
      accessToken,
      pageId,
      title: videoFile.name.split(".")[0] || "Video from PostFlow Portal",
      description: content || "Video uploaded via PostFlow Portal", // Use the post content as description
      fileData,
      fileName: videoFile.name,
      fileType: videoFile.type,
    };

    console.log(
      `Sending video upload request to proxy API for page ID: ${pageId}`
    );
    onProgress?.(videoFile.name, 25); // Prepare to send
    
    // Start progress animation - simulate upload to server (25-50%)
    let currentProgress = 25;
    const progressInterval = setInterval(() => {
      if (currentProgress < 50) {
        currentProgress += 1;
        onProgress?.(videoFile.name, currentProgress);
      }
    }, 200);

    // Create a controller for the fetch request so we can abort if needed
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minute timeout

    try {
      // Send request to our proxy API endpoint
      const response = await fetch("/api/facebook/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      // Clear the progress interval
      clearInterval(progressInterval);
      
      // First stage complete - our API received the data
      onProgress?.(videoFile.name, 50);
      
      // Start progress animation - simulate Facebook processing (50-95%)
      let fbProgress = 50;
      const fbProgressInterval = setInterval(() => {
        if (fbProgress < 95) {
          fbProgress += 1;
          onProgress?.(videoFile.name, fbProgress);
        }
      }, 300);

      if (!response.ok) {
        // Clear the Facebook progress interval
        clearInterval(fbProgressInterval);
        
        const errorData = await response.json();
        console.error(`Video upload proxy error: ${JSON.stringify(errorData)}`);

        // Handle specific error codes from the response
        if (errorData.details?.error) {
          if (errorData.details.error.code === 10) {
            const errorMsg = `Facebook application permission error: Your app does not have permission to publish videos. Make sure you have these permissions: 'pages_show_list', 'pages_read_engagement', 'pages_manage_posts', and 'publish_video'.`;
            onError?.(videoFile.name, errorMsg);
            throw new Error(errorMsg);
          } else if (errorData.details.error.code === 190) {
            const errorMsg = `Invalid or expired access token: The access token used for this page has expired or is invalid. Please reconnect your Facebook page.`;
            onError?.(videoFile.name, errorMsg);
            throw new Error(errorMsg);
          } else if (errorData.details.error.type === "OAuthException") {
            const errorMsg = `Facebook OAuth error: ${errorData.details.error.message}. Please check your app permissions and page access token.`;
            onError?.(videoFile.name, errorMsg);
            throw new Error(errorMsg);
          }
        }

        // Get the error message from the response if available
        const errorMsg = errorData.message || `Facebook API error: ${JSON.stringify(errorData)}`;
        onError?.(videoFile.name, errorMsg);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      // Clear the Facebook progress interval
      clearInterval(fbProgressInterval);
      
      console.log(`Video uploaded successfully with ID: ${data.videoId}`);
      console.log(`Note: The video upload has automatically created a post on Facebook.`);

      // Upload complete
      onProgress?.(videoFile.name, 100);

      return data.videoId;
    } catch (fetchError: unknown) {
      // Clear the timeout in case of error
      clearTimeout(timeoutId);
      // Clear the progress interval
      clearInterval(progressInterval);

      if (
        typeof fetchError === "object" &&
        fetchError &&
        "name" in fetchError &&
        fetchError.name === "AbortError"
      ) {
        const errorMsg =
          "Upload timed out after 5 minutes. Please try a smaller video or check your network connection.";
        onError?.(videoFile.name, errorMsg);
        throw new Error(errorMsg);
      }

      throw fetchError;
    }
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
      return await uploadVideoFileToFacebook(pageId, accessToken, media, onProgress, onError, content);
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
 * Posts content to a Facebook page using Graph API
 * @param mediaItems Can be either URL strings or File objects
 */
const postToFacebookPage = async (
  pageId: string,
  accessToken: string,
  content: string,
  mediaItems?: (string | File)[],
  onUploadProgress?: (fileName: string, progress: number) => void,
  onUploadError?: (fileName: string, error: string) => void
): Promise<string> => {
  try {
    const apiVersion = "v22.0";
    console.log(`Attempting to post to Facebook page ID: ${pageId}`);
    console.log(
      `Initial access token (first 10 chars): ${accessToken.substring(
        0,
        10
      )}...`
    );

    // Check if we're dealing with a video file - if so, skip the direct post attempt
    const hasVideoFile = mediaItems && 
      mediaItems.length === 1 && 
      mediaItems[0] instanceof File && 
      mediaItems[0].type.startsWith("video/");

    // Only try direct posting if it's not a video file
    if (!hasVideoFile) {
      // First, try posting directly with the user token
      console.log(`Trying direct post with user token first...`);
      try {
        const url = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
        const params = new URLSearchParams();
        params.append("message", content);
        params.append("access_token", accessToken);

        if (
          mediaItems &&
          mediaItems.length === 1 &&
          typeof mediaItems[0] === "string" &&
          isUrl(mediaItems[0])
        ) {
          params.append("link", mediaItems[0]);
        }

        console.log(`Direct user token post URL: ${url}`);
        console.log(
          `Direct post parameters: message=${content.substring(
            0,
            20
          )}..., access_token=${accessToken.substring(0, 10)}...`
        );

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params,
        });

        console.log(`Direct user token post response status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          console.log(`Direct user token post success: ${JSON.stringify(data)}`);
          return data.id;
        } else {
          const errorData = await response.json();
          console.error(
            `Direct user token post error: ${JSON.stringify(errorData)}`
          );
          console.log(`Falling back to page token approach...`);
        }
      } catch (directError) {
        console.error(`Error with direct user token post:`, directError);
        console.log(`Falling back to page token approach...`);
      }
    } else {
      console.log(`Detected video upload - skipping direct post attempt and using dedicated video upload flow`);
    }

    // Continue with the regular page token approach
    let pageAccessToken = accessToken;

    // Try to get a page-specific access token
    try {
      const pageTokenUrl = `https://graph.facebook.com/${apiVersion}/${pageId}?fields=access_token&access_token=${accessToken}`;
      console.log(`Requesting page access token from: ${pageTokenUrl}`);

      const pageTokenResponse = await fetch(pageTokenUrl);
      console.log(`Page token response status: ${pageTokenResponse.status}`);

      if (pageTokenResponse.ok) {
        const pageTokenData = await pageTokenResponse.json();
        console.log(`Page token response: ${JSON.stringify(pageTokenData)}`);

        if (pageTokenData.access_token) {
          console.log(
            `Retrieved page access token (first 10 chars): ${pageTokenData.access_token.substring(
              0,
              10
            )}...`
          );
          pageAccessToken = pageTokenData.access_token;
        } else {
          console.log(`No page access token found in response`);
        }
      } else {
        const errorData = await pageTokenResponse.json();
        console.error(
          `Error getting page access token: ${JSON.stringify(errorData)}`
        );
      }
    } catch (tokenError) {
      console.error("Error fetching page access token:", tokenError);
    }

    // Direct post attempt with parameters logged
    if (mediaItems && mediaItems.length > 0) {
      console.log(`Posting with ${mediaItems.length} media items`);
      if (typeof mediaItems[0] === "string") {
        console.log(`Media type: URL - ${mediaItems[0].substring(0, 30)}...`);
      } else {
        console.log(
          `Media type: File - ${mediaItems[0].name} (${mediaItems[0].type})`
        );
      }

      if (mediaItems.length === 1) {
        const media = mediaItems[0];
        
        try {
          console.log(`Uploading media to Facebook...`);
          const mediaId = await uploadMediaToFacebook(
            pageId,
            pageAccessToken,
            media,
            onUploadProgress,
            onUploadError,
            content
          );
          console.log(`Media upload success, got media ID: ${mediaId}`);
          
          // For videos, we need to use a different endpoint and approach
          if (media instanceof File && media.type.startsWith("video/")) {
            // For videos, the upload already created the post, so we just need to return the ID
            console.log(`Video upload created post with ID: ${mediaId}`);
            return mediaId;
          }
          
          // For images and other media, continue with the feed post
          const url = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
          const params = new URLSearchParams();
          params.append("message", content);
          params.append("access_token", pageAccessToken);
          
          if (typeof media === "string" && isUrl(media)) {
            params.append("link", media);
          } else {
            params.append("attached_media[0]", JSON.stringify({ media_fbid: mediaId }));
          }
          
          console.log(`Posting with attached media: ${url}`);
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params,
          });
          
          console.log(`Media post response status: ${response.status}`);
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Media post error:`, errorData);
            throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
          }
          
          const postData = await response.json();
          console.log(`Media post success: ${JSON.stringify(postData)}`);
          return postData.id;
        } catch (mediaError) {
          console.error(`Error uploading media:`, mediaError);
          throw mediaError;
        }
      } else {
        try {
          console.log(
            `Uploading multiple media items (${mediaItems.length})...`
          );
          const mediaIds = [];
          for (let i = 0; i < mediaItems.length; i++) {
            console.log(
              `Uploading media item ${i + 1}/${mediaItems.length}...`
            );
            const mediaId = await uploadMediaToFacebook(
              pageId,
              pageAccessToken,
              mediaItems[i],
              onUploadProgress,
              onUploadError,
              content
            );
            console.log(`Media ${i + 1} uploaded, got ID: ${mediaId}`);
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

          console.log(
            `Posting with ${mediaIds.length} attached media items: ${postUrl}`
          );

          const postResponse = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: postParams,
          });

          console.log(
            `Multiple media post response status: ${postResponse.status}`
          );

          if (!postResponse.ok) {
            const postErrorData = await postResponse.json();
            console.error(
              `Multiple media post error: ${JSON.stringify(postErrorData)}`
            );
            throw new Error(
              `Facebook API error: ${JSON.stringify(postErrorData)}`
            );
          }

          const postData = await postResponse.json();
          console.log(
            `Multiple media post success: ${JSON.stringify(postData)}`
          );
          return postData.id;
        } catch (mediaError) {
          console.error(`Multiple media upload error:`, mediaError);
          throw mediaError;
        }
      }
    } else {
      console.log(`Posting without media items`);

      // Debug post parameters
      const url = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
      const params = new URLSearchParams();
      params.append("message", content);
      params.append("access_token", pageAccessToken);

      console.log(`Posting to URL: ${url}`);
      console.log(
        `Post parameters: message=${content.substring(
          0,
          20
        )}..., access_token=${pageAccessToken.substring(0, 10)}...`
      );

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });

      console.log(`Post response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Post error response: ${JSON.stringify(errorData)}`);

        // Try with original token if page token failed
        if (pageAccessToken !== accessToken) {
          console.log(`Retrying with original user token...`);
          params.set("access_token", accessToken);
          const retryResponse = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params,
          });

          console.log(`Retry response status: ${retryResponse.status}`);

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            console.log(`Retry succeeded: ${JSON.stringify(retryData)}`);
            return retryData.id;
          } else {
            const retryErrorData = await retryResponse.json();
            console.error(`Retry error: ${JSON.stringify(retryErrorData)}`);
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
        } else if (errorData.error && errorData.error.code === 10) {
          throw new Error(
            `Facebook application permission error: Your app does not have permission for this action. Go to developers.facebook.com, open your app, navigate to App Settings > Advanced > Optional Permissions, and request 'pages_manage_posts', 'pages_read_engagement' and 'pages_manage_metadata' permissions. For video posts, also add 'pages_manage_engagement' permission.`
          );
        } else {
          throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
        }
      }

      const data = await response.json();
      console.log(`Post success: ${JSON.stringify(data)}`);
      return data.id;
    }
  } catch (error) {
    console.error("Error in postToFacebookPage:", error);
    throw error;
  }
};

// ======================================================
// Post Creation and Publishing
// ======================================================
export const createPost = async (
  userId: string,
  postData: FacebookPost & { 
    mediaFiles?: File[];
    onUploadProgress?: (fileName: string, progress: number) => void;
    onUploadError?: (fileName: string, error: string) => void;
  }
): Promise<string[]> => {
  try {
    console.log(`Creating post for user ${userId}`);
    console.log(
      `Post content (truncated): ${postData.content.substring(0, 30)}...`
    );
    console.log(
      `Target pages (${postData.pageIds.length}): ${postData.pageIds.join(
        ", "
      )}`
    );

    // Keep track of successful video uploads to avoid showing errors for video posts
    // that have already been uploaded successfully
    const successfulVideoUploads = new Set<string>();

    const postId = `post_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const allMedia: (string | File)[] = [];

    if (postData.mediaUrls && postData.mediaUrls.length > 0) {
      console.log(`Post includes ${postData.mediaUrls.length} media URLs`);
      allMedia.push(...postData.mediaUrls);
    }

    if (postData.mediaFiles && postData.mediaFiles.length > 0) {
      console.log(`Post includes ${postData.mediaFiles.length} media files`);
      console.log(
        `Media file types: ${postData.mediaFiles
          .map((file) => file.type)
          .join(", ")}`
      );
      allMedia.push(...postData.mediaFiles);
    }

    // Check if we have a video file (for error suppression logic)
    const hasVideoFile = postData.mediaFiles && 
      postData.mediaFiles.length === 1 && 
      postData.mediaFiles[0].type.startsWith("video/");

    // Extract progress callbacks
    const { onUploadProgress, onUploadError } = postData;

    // Create a post object for storage/tracking
    const post = {
      ...postData,
      id: postId,
      authorId: userId,
      createdAt: new Date().toISOString(),
      status: postData.scheduledFor ? "scheduled" : "published",
      mediaUrls: postData.mediaUrls || [],
    };

    if (postData.scheduledFor) {
      console.log(`Scheduling post for: ${postData.scheduledFor}`);
      const scheduledPostsJson = localStorage.getItem("scheduled_posts");
      const scheduledPosts = scheduledPostsJson
        ? JSON.parse(scheduledPostsJson)
        : [];
      scheduledPosts.push(post);
      localStorage.setItem("scheduled_posts", JSON.stringify(scheduledPosts));
      return [postId];
    }

    console.log(`Posting immediately to ${postData.pageIds.length} pages`);
    const postResults = [];
    const errors = [];

    for (const pageId of postData.pageIds) {
      try {
        console.log(`Fetching page data for pageId: ${pageId}`);
        const pageDoc = await getDoc(doc(db, "facebook_pages", pageId));

        if (pageDoc.exists()) {
          const page = { id: pageDoc.id, ...pageDoc.data() } as FacebookPage;
          console.log(`Found page: ${page.name} (FB ID: ${page.pageId})`);

          try {
            console.log(
              `Attempting to post to page: ${page.name} (${page.pageId})`
            );
            const fbPostId = await postToFacebookPage(
              page.pageId,
              page.accessToken,
              postData.content,
              allMedia.length > 0 ? allMedia : undefined,
              onUploadProgress,
              onUploadError
            );

            console.log(
              `Successfully posted to page ${page.name}, got post ID: ${fbPostId}`
            );
            postResults.push(fbPostId);
            
            // If we have a video file and got a post ID, mark this as a successful video upload
            if (hasVideoFile) {
              successfulVideoUploads.add(page.pageId);
            }
          } catch (error) {
            const postError = error as Error;
            console.error(`Error posting to page ${page.name}:`, postError);
            
            // Special handling for video uploads
            if (hasVideoFile) {
              // Check if this is just the "create post" error after video upload
              if (postError.message.includes("insufficient_scope") && 
                  successfulVideoUploads.has(page.pageId)) {
                // Video was already uploaded successfully, so we can ignore this error
                console.log(`Ignoring post creation error for page ${page.name} as video was already uploaded successfully`);
                // We still want to return a success result
                postResults.push(`video_upload_${Date.now()}`);
                continue;
              }
            }
            
            // Call onUploadError for any media file in the post
            if (postData.mediaFiles && onUploadError) {
              postData.mediaFiles.forEach(file => {
                if (file.type.startsWith("video/")) {
                  onUploadError(file.name, postError.message || "Unknown error posting to Facebook");
                }
              });
            }
            
            errors.push({
              pageId: page.pageId,
              pageName: page.name,
              error: postError.message || "Unknown error",
            });
          }
        } else {
          console.error(`Page not found in database: ${pageId}`);
          errors.push({
            pageId,
            error: "Page not found in database",
          });
        }
      } catch (error) {
        const fbError = error as Error;
        console.error(`Error processing page ${pageId}:`, fbError);
        errors.push({
          pageId,
          error: fbError.message || "Unknown error",
        });
      }
    }

    if (postResults.length > 0) {
      console.log(
        `Successfully posted to ${postResults.length} of ${postData.pageIds.length} pages`
      );
      return postResults;
    }

    console.error(`Failed to post to any pages. Errors:`, errors);
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
              post.mediaUrls,
              undefined,
              undefined
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
