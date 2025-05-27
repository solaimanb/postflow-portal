import type { TopicSearchParams, ActorRunInput, Topic } from "./types";

/**
 * Prepares the input for a specific Apify actor based on its ID
 */
const prepareActorInput = (
  actorId: string,
  params: TopicSearchParams
): ActorRunInput => {
  const actorType = actorId.toLowerCase();

  // For alien_force~facebook-search-scraper actor
  if (actorType.includes("alien_force~facebook-search-scraper")) {
    const now = new Date();
    
    // If no dates specified, search recent posts without date constraints
    if (!params.startDate && !params.endDate) {
      return {
        search_type: "posts",
        keyword: params.keyword,
        filter_by_recent_posts: true, // Force recent posts when no dates
        results_limit: params.maxItems || 20,
        min_wait_time_in_sec: 1,
        max_wait_time_in_sec: 4,
        cookies: []
      };
    }

    // If dates are specified, validate them
    let startDate = params.startDate;
    let endDate = params.endDate;

    // Convert dates to Date objects for comparison
    const startDateTime = startDate ? new Date(startDate) : null;
    const endDateTime = endDate ? new Date(endDate) : null;

    // Validate dates are in the past
    if (startDateTime && startDateTime > now) {
      console.warn("Start date is in future, defaulting to 30 days ago");
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      startDate = thirtyDaysAgo.toISOString().split('T')[0];
    }

    if (endDateTime && endDateTime > now) {
      console.warn("End date is in future, defaulting to current date");
      endDate = now.toISOString().split('T')[0];
    }

    return {
      search_type: "posts",
      keyword: params.keyword,
      filter_by_recent_posts: params.filterByRecent || false,
      results_limit: params.maxItems || 20,
      min_wait_time_in_sec: 1,
      max_wait_time_in_sec: 4,
      start_date: startDate,
      end_date: endDate,
      cookies: []
    };
  }

  // Default return for backwards compatibility
  return {
    keyword: params.keyword,
    results_limit: params.maxItems || 20,
    start_date: params.startDate,
    end_date: params.endDate
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

  // For alien_force~facebook-search-scraper actor
  if (actorId.toLowerCase().includes("alien_force~facebook-search-scraper")) {
    return limitedData.map((item: Record<string, unknown>, index: number) => {
      const text = item.text as string || "";
      const createTime = item.create_time as number;
      const postDate = createTime ? new Date(createTime).toISOString() : new Date().toISOString();
      
      const likes = (item.like_count as number) || 0;
      const comments = (item.comment_count as number) || 0;
      const shares = (item.share_count as number) || 0;
      const views = (item.view_count as number) || 0;
      const plays = (item.play_count as number) || 0;
      
      const popularityScore = likes + (comments * 2) + (shares * 3);

      // Enhanced page name handling
      const pageName = item.author_username as string || "Unknown";
      const pageUrl = item.author_profile_url as string;
      const pageAvatar = item.author_avatar as string;

      return {
        id: `fb-${item.post_id || index}-${Date.now()}`,
        topic: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        text,
        date: postDate,
        popularityScore,
        keywords: [params.keyword],
        relatedTopics: [pageName],
        likes,
        comments,
        shares,
        url: item.post_url as string,
        pageName,
        pageUrl,
        pageAvatar,
        postId: item.post_id as string,
        type: item.type as string,
        videoUrl: Array.isArray(item.video_list) ? item.video_list[0] as string : undefined,
        videoThumbnail: Array.isArray(item.video_cover_image) ? item.video_cover_image[0] as string : undefined,
        imageUrl: Array.isArray(item.image_list) ? item.image_list[0] as string : undefined,
        viewCount: views,
        playCount: plays
      };
    });
  }

  // Default transformation for backwards compatibility
  return limitedData.map((item: Record<string, unknown>, index: number) => {
    const text = (item.text as string) || "";
    const postDate = (item.date as string) || new Date().toISOString();
    const likes = typeof item.likesCount === "number" ? item.likesCount : 0;
    const comments = typeof item.commentsCount === "number" ? item.commentsCount : 0;
    const shares = typeof item.sharesCount === "number" ? item.sharesCount : 0;
    const popularityScore = likes + comments * 2 + shares * 3;

    return {
      id: `fb-${item.postId || item.postUrl || index}-${Date.now()}`,
      topic: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
      text,
      date: postDate,
      popularityScore,
      keywords: [params.keyword],
      relatedTopics: [(item.authorName as string) || "Unknown"],
      likes,
      comments,
      shares,
      url: item.url as string,
      pageName: item.authorName as string
    };
  });
};

/**
 * Fetches topics from Apify based on search parameters
 */
export const fetchTopics = async (
  params: TopicSearchParams
): Promise<Topic[]> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_APIFY_API_KEY;
    if (!apiKey) {
      throw new Error("Apify API key not found in environment variables");
    }

    const actorId = process.env.NEXT_PUBLIC_APIFY_ACTOR_ID;
    if (!actorId) {
      throw new Error("Apify actor ID not found in environment variables");
    }

    console.log(`Using Apify actor: ${actorId}`);

    const runInput = prepareActorInput(actorId, params);
    console.log("Apify actor input:", JSON.stringify(runInput));

    const isProduction = process.env.NODE_ENV === "production";
    const apiEndpoint = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items`;

    // Make the appropriate API call based on environment
    const response = isProduction
      ? await fetch(apiEndpoint, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
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

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        console.error("Apify API error response:", JSON.stringify(errorData));
        throw new Error(`Apify API error: ${JSON.stringify(errorData)}`);
      } catch {
        throw new Error(
          `Apify API error: ${response.status} - ${responseText.substring(
            0,
            100
          )}`
        );
      }
    }

    let rawTopics;
    try {
      rawTopics = JSON.parse(responseText);
    } catch (e) {
      console.error("Error parsing dataset response as JSON:", e);
      throw new Error("Failed to parse dataset response as JSON");
    }

    if (!rawTopics || !Array.isArray(rawTopics) || rawTopics.length === 0) {
      console.log("No topics found in Apify dataset or invalid data format");
      return [];
    }

    console.log(`Retrieved ${rawTopics.length} items from Apify dataset`);

    return transformActorOutput(actorId, rawTopics, params);
  } catch (error) {
    console.error("Error fetching topics from Apify:", error);
    throw error;
  }
};
