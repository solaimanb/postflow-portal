import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";
import FormData from "form-data";
// Add type declarations
declare module "node-fetch";
declare module "form-data";

// Set the maximum size for uploads to 100MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
    responseLimit: "100mb",
  },
};

/**
 * API route to handle Facebook video uploads
 * This proxies the upload request to Facebook to avoid CORS issues
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const data = await req.json();

    const {
      accessToken,
      pageId,
      title,
      description,
      fileData,
      fileType,
      fileName,
    } = data;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      );
    }

    if (!pageId) {
      return NextResponse.json(
        { error: "Page ID is required" },
        { status: 400 }
      );
    }

    if (!fileData) {
      return NextResponse.json(
        { error: "File data is required" },
        { status: 400 }
      );
    }

    // Check file size limitations - Facebook has a 10GB limit but we'll restrict to 1GB
    const base64Data = fileData.split(",")[1];
    if (!base64Data) {
      return NextResponse.json(
        { error: "Invalid file data format" },
        { status: 400 }
      );
    }

    const estimatedSize = Math.ceil((base64Data.length * 3) / 4);
    if (estimatedSize > 1024 * 1024 * 1024) {
      // 1GB
      return NextResponse.json(
        { error: "File too large. Facebook videos must be under 1GB." },
        { status: 400 }
      );
    }

    // Log the initiation of the upload with size information
    console.log(`Starting upload to Facebook for page ID: ${pageId}`);
    console.log(`Video file size: ${(estimatedSize / (1024 * 1024)).toFixed(2)} MB`);

    // Convert base64 data back to binary for uploading
    const binaryData = Buffer.from(base64Data, "base64");

    // Create a FormData object for the upload using the node-fetch compatible FormData
    const formData = new FormData();
    formData.append("access_token", accessToken);
    formData.append("title", title || fileName || "Video from PostFlow Portal");
    formData.append(
      "description",
      description || "Uploaded via PostFlow Portal"
    );

    // Add the video file as a buffer with filename
    formData.append("source", binaryData, {
      filename: fileName || "video.mp4",
      contentType: fileType || "video/mp4",
    });

    console.log(`Uploading video to Facebook page ID: ${pageId}`);
    console.log(`Video title: ${title || fileName || "Video from PostFlow Portal"}`);
    const startTime = Date.now();

    // Create a controller to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minute timeout

    try {
      // Make the request to Facebook's Graph API for videos
      const apiVersion = "v19.0"; // Use a stable version
      const response = await fetch(
        `https://graph-video.facebook.com/${apiVersion}/${pageId}/videos`,
        {
          method: "POST",
          body: formData,
          headers: formData.getHeaders(),
          timeout: 5 * 60 * 1000, // 5 minute timeout
        }
      );

      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      // Log upload time
      const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`Upload completed in ${uploadTime} seconds`);

      const responseText = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
      } catch {
        console.error("Error parsing Facebook API response:", responseText);
        return NextResponse.json(
          {
            error: "Invalid response from Facebook API",
            details: responseText,
          },
          { status: 500 }
        );
      }

      if (!response.ok) {
        console.error("Facebook API error:", responseData);

        // Enhanced error handling with specific messages
        if (responseData.error) {
          const fbError = responseData.error;

          // Handle common Graph API error codes
          switch (fbError.code) {
            case 10:
              return NextResponse.json(
                {
                  error: "Facebook permission error",
                  details: responseData,
                  message:
                    "Your app does not have permission to publish videos. Required permissions: pages_show_list, pages_read_engagement, pages_manage_posts, and publish_video.",
                },
                { status: 403 }
              );

            case 190:
              return NextResponse.json(
                {
                  error: "Invalid access token",
                  details: responseData,
                  message:
                    "The access token is invalid or has expired. Please reconnect your Facebook page.",
                },
                { status: 401 }
              );

            case 368:
              return NextResponse.json(
                {
                  error: "API rate limit exceeded",
                  details: responseData,
                  message:
                    "Too many requests sent to Facebook. Please wait a few minutes and try again.",
                },
                { status: 429 }
              );

            case 100:
              if (fbError.error_subcode === 33) {
                return NextResponse.json(
                  {
                    error: "Invalid Page ID",
                    details: responseData,
                    message:
                      "The specified page ID does not exist or you do not have permission to access it.",
                  },
                  { status: 404 }
                );
              }
              break;

            case 200:
              return NextResponse.json(
                {
                  error: "Video upload failed",
                  details: responseData,
                  message:
                    "Facebook could not process this video. Please check that it meets Facebook's format requirements.",
                },
                { status: 422 }
              );
          }
        }

        return NextResponse.json(
          { 
            error: "Facebook API error", 
            details: responseData,
            message: responseData.error?.message || "An error occurred while uploading to Facebook"
          },
          { status: response.status }
        );
      }

      console.log("Video upload successful:", responseData);

      return NextResponse.json({
        success: true,
        videoId: responseData.id,
        data: responseData,
        uploadTime: uploadTime,
        message: "Video successfully uploaded to Facebook",
        postCreated: true,
        note: "Facebook automatically creates a post when videos are uploaded via the Graph API"
      });
    } catch (fetchError: unknown) {
      // Clear the timeout in case of error
      clearTimeout(timeoutId);

      // Log upload failure time
      const failureTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`Upload failed after ${failureTime} seconds`);

      // Handle timeout errors
      if (
        typeof fetchError === "object" &&
        fetchError &&
        "name" in fetchError &&
        fetchError.name === "AbortError"
      ) {
        console.error("Upload request timed out after 5 minutes");
        return NextResponse.json(
          {
            error: "Upload timeout",
            message:
              "The upload timed out after 5 minutes. Please try a smaller video file or check your network connection.",
          },
          { status: 504 }
        );
      }

      throw fetchError;
    }
  } catch (error: unknown) {
    console.error("Error in video upload proxy:", error);
    return NextResponse.json(
      {
        error: "Server error processing upload",
        details: error instanceof Error ? error.message : String(error),
        message:
          "There was a problem uploading your video. Please try again with a smaller file or different format.",
      },
      { status: 500 }
    );
  }
}
