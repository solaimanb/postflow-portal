export interface TopicSearchParams {
  keyword: string;
  maxItems?: number;
  startDate?: string;
  endDate?: string;
  language?: string;
}

export interface TopicSearchResult {
  id: string;
  topic: string;
  date: string;
  popularityScore: number;
  keywords: string[];
  relatedTopics: string[];
  url?: string;
  text?: string;
  pageName?: string;
  pageUrl?: string;
  postId?: string;
  type?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  imageUrl?: string;
  time?: string;
  likes?: number;
  comments?: number;
  shares?: number;
}

export interface ActorRunInput {
  query?: string;
  keyword?: string;
  search_type?: string;
  max_posts?: number;
  limit?: number;
  maxResults?: number;
  dateFrom?: string;
  dateTo?: string;
  language?: string;
  startUrls?: { url: string }[];
  maxPosts?: number;
  commentsMode?: string;
  reactionsMode?: string;
  maxComments?: number;
  maxPostDate?: string;
  minPostDate?: string;
  proxyConfiguration?: {
    useApifyProxy: boolean;
  };
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  maxItems?: number;
}
