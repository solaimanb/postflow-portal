import { FacebookPage, FacebookPost } from "../../../types";

export type { FacebookPage, FacebookPost };

export interface FacebookMediaUploadCallbacks {
  onProgress?: (fileName: string, progress: number) => void;
  onError?: (fileName: string, error: string) => void;
}

export interface FacebookTokenInfo {
  type: "USER" | "PAGE";
  permissions?: string[];
  isValid: boolean;
  error?: string;
}
