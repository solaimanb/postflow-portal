import config from "./config";
import type {
  TopicSearchParams,
  ActorRunInput,
  Topic,
} from "./types";

/**
 * Prepares the input for a specific Apify actor based on its ID
 */
const prepareActorInput = (
  actorId: string,
  params: TopicSearchParams
): ActorRunInput => {
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
      proxyConfiguration: { useApifyProxy: true },
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

  // For easyapi/facebook-posts-search-scraper actor
  if (actorId.includes("facebook-posts-search-scraper")) {
    return {
      searchQuery: params.keyword,
      maxPosts: params.maxItems,
    };
  }

  // Default actor (blf62maenLRO8Rsfv)
  return {
    keyword: params.keyword,
    startDate:
      params.startDate ||
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: params.endDate || new Date().toISOString(),
    maxItems: params.maxItems,
  };
};

/**
 * Transforms raw actor output into standardized topic search results
 */
const transformActorOutput = (
  actorId: string,
  rawData: Record<string, unknown>[],
  params: TopicSearchParams
): Topic[] => {
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
        id: `fb-${item.post_id || index}-${Date.now()}`,
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
        id: `fb-${item.postId || item.postUrl || index}-${Date.now()}`,
        topic: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        date: postDate,
        popularityScore,
        keywords,
        relatedTopics: [authorName],
        likes,
        comments,
        shares,
        url: item.url as string,
        text,
        pageName: authorName,
      };
    });
  }

  // Default transformation
  return limitedData.map((item: Record<string, unknown>, index: number) => ({
    id: `topic-${index}-${Date.now()}`,
    topic:
      (item.title as string) || (item.topic as string) || `Topic ${index + 1}`,
    date: (item.date as string) || new Date().toISOString(),
    popularityScore: (item.score as number) || Math.floor(Math.random() * 100),
    keywords: (item.keywords as string[]) || [params.keyword],
    relatedTopics: [(item.source as string) || "Unknown Source"],
  }));
};

/**
 * Fetches topics from Apify based on search parameters
 */
export const fetchTopics = async (
  params: TopicSearchParams
): Promise<Topic[]> => {
  try {
    const apiKey = config.apiKey;
    if (!apiKey) {
      throw new Error("Apify API key not found in configuration");
    }

    const actorId = config.actorId;
    console.log(`Using Apify actor: ${actorId}`);

    const runInput = prepareActorInput(actorId, params);
    console.log("Apify actor input:", JSON.stringify(runInput));

    // In production (or static export), call Apify API directly
    // In development, use our API route
    const isProduction =
      typeof window !== "undefined" && window.location.hostname !== "localhost";

    // Make the appropriate API call based on environment
    const response = isProduction
      ? await fetch(`https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(runInput),
        })
      : await fetch("/api/apify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        throw new Error(`Apify API error: ${response.status} - ${responseText.substring(0, 100)}`);
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
    console.log("Sample item:", JSON.stringify(rawTopics[0]).substring(0, 200) + "...");

    return transformActorOutput(actorId, rawTopics, params);
  } catch (error) {
    console.error("Error fetching topics from Apify:", error);
    throw error;
  }
};
