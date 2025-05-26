export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  twoFactorEnabled: boolean;
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
