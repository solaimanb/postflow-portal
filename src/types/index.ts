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
  text?: string;
  date: string;
  time?: string;
  popularityScore: number;
  keywords: string[];
  relatedTopics: string[];
  like?: number;
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
