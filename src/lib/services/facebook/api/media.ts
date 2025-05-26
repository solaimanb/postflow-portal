import { FacebookMediaUploadCallbacks } from "../types";

/**
 * Helper function to detect if a string is a URL
 */
const isUrl = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Uploads an image to Facebook from a URL and returns the media ID
 */
export const uploadImageFromUrl = async (
  pageId: string,
  accessToken: string,
  imageUrl: string
): Promise<string> => {
  try {
    const url = `https://graph.facebook.com/v22.0/${pageId}/photos`;

    const params = new URLSearchParams();
    params.append("url", imageUrl);
    params.append("published", "false");
    params.append("access_token", accessToken);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error("Error uploading image URL to Facebook:", error);
    throw error;
  }
};

/**
 * Uploads an image file directly to Facebook and returns the media ID
 */
export const uploadImageFile = async (
  pageId: string,
  accessToken: string,
  imageFile: File
): Promise<string> => {
  try {
    const url = `https://graph.facebook.com/v22.0/${pageId}/photos`;

    const formData = new FormData();
    formData.append("source", imageFile);
    formData.append("published", "false");
    formData.append("access_token", accessToken);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error("Error uploading image file to Facebook:", error);
    throw error;
  }
};

/**
 * Uploads a video file to Facebook
 * Note: Video uploads automatically create a post on Facebook
 */
export const uploadVideoFile = async (
  pageId: string,
  accessToken: string,
  videoFile: File,
  content?: string,
  callbacks?: FacebookMediaUploadCallbacks
): Promise<string> => {
  const { onProgress, onError } = callbacks || {};

  try {
    console.log(`Starting video upload for page ID: ${pageId}`);
    onProgress?.(videoFile.name, 0);

    // Read the file as a base64 data URL
    const fileReader = new FileReader();
    const fileDataPromise = new Promise<string>((resolve, reject) => {
      fileReader.onload = () => {
        onProgress?.(videoFile.name, 20);
        resolve(fileReader.result as string);
      };
      fileReader.onerror = () => {
        const error = fileReader.error?.message || "Error reading file";
        onError?.(videoFile.name, error);
        reject(fileReader.error);
      };
      fileReader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 20);
          onProgress?.(videoFile.name, progress);
        }
      };
      fileReader.readAsDataURL(videoFile);
    });

    const fileData = await fileDataPromise;
    onProgress?.(videoFile.name, 25);

    // Extract the base64 data
    const base64Data = fileData.split(",")[1];
    if (!base64Data) {
      throw new Error("Invalid file data format");
    }

    // Create form data for the Graph API
    const formData = new FormData();
    formData.append("access_token", accessToken);
    formData.append(
      "source",
      new Blob([Buffer.from(base64Data, "base64")], { type: videoFile.type }),
      videoFile.name
    );
    formData.append(
      "title",
      videoFile.name.split(".")[0] || "Video from PostFlow Portal"
    );
    formData.append(
      "description",
      content || "Video uploaded via PostFlow Portal"
    );

    // Send request to Facebook Graph API
    const response = await fetch(
      `https://graph-video.facebook.com/v22.0/${pageId}/videos`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    onProgress?.(videoFile.name, 100);
    console.log(`Video uploaded successfully with ID: ${data.id}`);
    console.log(
      `Note: The video upload has automatically created a post on Facebook.`
    );

    return data.id;
  } catch (error) {
    console.error("Error in video upload process:", error);
    if (error instanceof Error) {
      onError?.(videoFile.name, error.message);
    } else {
      onError?.(videoFile.name, "Unknown error during upload");
    }
    throw error;
  }
};

/**
 * Handles different types of media uploads (URL or File)
 */
export const uploadMedia = async (
  pageId: string,
  accessToken: string,
  media: string | File,
  content?: string,
  callbacks?: FacebookMediaUploadCallbacks
): Promise<string> => {
  if (typeof media === "string") {
    if (isUrl(media)) {
      return await uploadImageFromUrl(pageId, accessToken, media);
    } else {
      throw new Error("Invalid media URL format");
    }
  } else if (media instanceof File) {
    // Check if the file is a video based on its type
    if (media.type.startsWith("video/")) {
      return await uploadVideoFile(
        pageId,
        accessToken,
        media,
        content,
        callbacks
      );
    } else {
      return await uploadImageFile(pageId, accessToken, media);
    }
  } else {
    throw new Error(
      "Unsupported media type. Must be URL string or File object"
    );
  }
};
