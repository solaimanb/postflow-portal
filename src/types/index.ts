export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  twoFactorEnabled: boolean;
}

export interface FacebookTopic {
  id: string;
  topic: string;
  date: string;
  keywords: string[];
  relatedTopics?: string[];
  likes?: number;
  comments?: number;
  shares?: string | number;
  url?: string;
  text?: string;
  pageName?: string;
  postId?: string;
  facebookId?: string;
  postFacebookId?: string;
  timestamp?: number;
  time?: string;
  topLevelUrl?: string;
}

export interface TopicSearchParams {
  keyword: string;
  fromDate?: string;
  toDate?: string;
  startDate?: string;
  endDate?: string;
  maxItems?: number;
  language?: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
  pageId: string;
}

export interface FacebookPost {
  id: string;
  content: string;
  pageIds: string[];
  authorId: string;
  createdAt: string;
  scheduledFor?: string;
  status: "draft" | "scheduled" | "published" | "failed";
  mediaUrls?: string[];
  mediaFiles?: File[];
  onUploadProgress?: (fileName: string, progress: number) => void;
  onUploadError?: (fileName: string, error: string) => void;
}

export interface PostScheduleParams {
  content: string;
  pageIds: string[];
  scheduledFor?: string;
  mediaUrls?: string[];
  mediaFiles?: File[];
  onUploadProgress?: (fileName: string, progress: number) => void;
  onUploadError?: (fileName: string, error: string) => void;
}

export interface PostComment {
  postLink: string;
  comments: string[];
  commentCount: number;
  createdAt: string;
}
