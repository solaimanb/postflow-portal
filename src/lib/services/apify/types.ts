export interface TopicSearchParams {
  keyword: string;
  startDate?: string;
  endDate?: string;
  maxItems?: number;
  language?: string;
}

export interface Topic {
  id: string;
  topic: string;
  text?: string;
  date: string;
  time?: string;
  popularityScore: number;
  keywords: string[];
  relatedTopics: string[];
  likes?: number;
  comments?: number;
  shares?: number;
  url?: string;
  pageName?: string;
  postId?: string;
  type?: string;
  pageUrl?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  imageUrl?: string;
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
