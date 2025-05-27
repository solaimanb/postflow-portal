import { FacebookPage, FacebookPost as BaseFacebookPost } from "../../../types";

export type { FacebookPage };

export type FacebookPostStatus = "scheduled" | "published" | "failed" | "draft";

export interface MediaFileBase64 {
  name: string;
  type: string;
  data: string;
}

export interface FacebookPost extends Omit<BaseFacebookPost, '_mediaFilesBase64'> {
  _mediaFilesBase64?: MediaFileBase64[];
}

export const STORAGE_KEYS = {
  SCHEDULED_POSTS: "scheduled_posts",
  USER_PAGES: "user_pages"
} as const;

export interface FacebookMediaUploadCallbacks {
  onProgress?: (fileName: string, progress: number) => void;
  onError?: (fileName: string, error: string) => void;
}

export interface FacebookTokenInfo {
  userId: string;
  appId: string;
  type: string;
  permissions: string[];
  expiresAt: number;
}
