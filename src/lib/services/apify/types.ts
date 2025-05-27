export interface TopicSearchParams {
  keyword: string;
  startDate?: string;
  endDate?: string;
  maxItems?: number;
  language?: string;
  filterByRecent?: boolean;
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
  pageUrl?: string;
  pageAvatar?: string;
  postId?: string;
  type?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  imageUrl?: string;
  viewCount?: number;
  playCount?: number;
  author_profile_url?: string;
  author_avatar?: string;
}

export interface ActorRunInput {
  search_type?: "posts" | "pages" | "people";
  keyword?: string;
  filter_by_recent_posts?: boolean;
  results_limit?: number;
  min_wait_time_in_sec?: number;
  max_wait_time_in_sec?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cookies?: any[];
  start_date?: string;
  end_date?: string;
}

export interface ActorRunOutput {
  items: Topic[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
}
