// User types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  twoFactorEnabled: boolean;
}

// Facebook Topic types
export interface FacebookTopic {
  id: string;
  topic: string;
  date: string;
  popularityScore: number;
  keywords: string[];
  relatedTopics?: string[];
}

export interface TopicSearchParams {
  keyword: string;
  fromDate: string;
  toDate: string;
}

// Facebook Post types
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
}

export interface PostScheduleParams {
  content: string;
  pageIds: string[];
  scheduledFor?: string;
  mediaUrls?: string[];
  mediaFiles?: File[];
}
