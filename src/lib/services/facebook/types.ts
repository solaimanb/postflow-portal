import { FacebookPage, FacebookPost } from "../../../types";

export type { FacebookPage, FacebookPost };

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
