"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { FacebookPage, PostScheduleParams, FacebookPost } from "../types";
import Image from "next/image";

// ======================================================
// Types and Interfaces
// ======================================================
interface PostFormProps {
  pages: FacebookPage[];
  onPostNow: (params: PostScheduleParams) => Promise<void>;
  onSchedulePost: (params: PostScheduleParams) => Promise<void>;
}

// Media upload status interface
interface MediaUploadStatus {
  fileName: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  errorMessage?: string;
}

// ======================================================
// PostForm Component
// ======================================================
export default function PostForm({
  pages,
  onPostNow,
  onSchedulePost,
}: PostFormProps) {
  // ======================================================
  // State Management
  // ======================================================
  const [content, setContent] = useState("");
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<{ [key: string]: string }>({});
  const [postStatus, setPostStatus] = useState<{
    success?: boolean;
    message?: string;
    isPermissionError?: boolean;
  } | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<FacebookPost[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaUploadStatus, setMediaUploadStatus] = useState<{ [key: string]: MediaUploadStatus }>({});

  // ======================================================
  // Effects
  // ======================================================
  // Load scheduled posts from localStorage
  useEffect(() => {
    const loadScheduledPosts = () => {
      try {
        const postsJson = localStorage.getItem("scheduled_posts");
        if (postsJson) {
          const posts = JSON.parse(postsJson);
          if (Array.isArray(posts)) {
            setScheduledPosts(
              posts.filter((post) => post.status === "scheduled")
            );
          }
        }
      } catch (error) {
        console.error("Error loading scheduled posts:", error);
      }
    };

    // Load posts initially
    loadScheduledPosts();

    // Set up interval to refresh the list
    const intervalId = setInterval(loadScheduledPosts, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // ======================================================
  // Event Handlers
  // ======================================================
  const handlePageSelection = (pageId: string) => {
    setSelectedPageIds((prevSelectedPages) => {
      if (prevSelectedPages.includes(pageId)) {
        return prevSelectedPages.filter((id) => id !== pageId);
      } else {
        return [...prevSelectedPages, pageId];
      }
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      // Create initial upload status for each file
      const newUploadStatus: { [key: string]: MediaUploadStatus } = {};
      newFiles.forEach(file => {
        newUploadStatus[file.name] = {
          fileName: file.name,
          status: 'pending',
          progress: 0,
        };
      });

      setMediaUploadStatus(prev => ({
        ...prev,
        ...newUploadStatus
      }));

      // Generate previews for new files
      newFiles.forEach((file) => {
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
          if (e.target?.result) {
            setMediaPreview((prev) => ({
              ...prev,
              [file.name]: e.target!.result as string,
            }));
          }
        };

        if (file.type.startsWith("image/")) {
          fileReader.readAsDataURL(file);
        } else if (file.type.startsWith("video/")) {
          fileReader.readAsDataURL(file);
        }
      });

      setMediaFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const handleClearFiles = () => {
    setMediaFiles([]);
    setMediaPreview({});
    setMediaUploadStatus({});
    // Reset the file input value
    const fileInput = document.getElementById(
      "media-files"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    const fileToRemove = mediaFiles[index];
    setMediaFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));

    // Remove the preview
    if (fileToRemove && mediaPreview[fileToRemove.name]) {
      setMediaPreview((prev) => {
        const newPreview = { ...prev };
        delete newPreview[fileToRemove.name];
        return newPreview;
      });
    }

    // Remove upload status
    if (fileToRemove) {
      setMediaUploadStatus((prev) => {
        const newStatus = { ...prev };
        delete newStatus[fileToRemove.name];
        return newStatus;
      });
    }
  };

  const handlePostNow = async () => {
    if (!content || selectedPageIds.length === 0) return;
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      // Check if there are video files that need to be uploaded
      const hasVideoFiles = mediaFiles.some(file => file.type.startsWith("video/"));
      
      // Set initial post status message based on whether we're uploading videos or not
      if (hasVideoFiles) {
        setPostStatus({ message: "Preparing to upload videos to Facebook..." });
      } else {
        setPostStatus({ message: "Posting to Facebook..." });
      }

      // Update status for each video file to 'uploading'
      const updatedStatus: { [key: string]: MediaUploadStatus } = {};
      mediaFiles.forEach(file => {
        if (file.type.startsWith("video/")) {
          updatedStatus[file.name] = {
            ...mediaUploadStatus[file.name] || { fileName: file.name, progress: 0 },
            status: 'uploading',
          };
        }
      });
      
      setMediaUploadStatus(prev => ({
        ...prev,
        ...updatedStatus
      }));

      // Track if we're currently uploading videos to control the global status message
      let currentlyUploadingVideo = false;
      let currentUploadingFile = "";
      let videoUploadSucceeded = false;

      try {
        await onPostNow({
          content,
          pageIds: selectedPageIds,
          mediaUrls: mediaUrl ? [mediaUrl] : undefined,
          mediaFiles: mediaFiles.length > 0 ? mediaFiles : undefined,
          onUploadProgress: (fileName: string, progress: number) => {
            // Update file-specific progress
            setMediaUploadStatus(prev => ({
              ...prev,
              [fileName]: {
                ...prev[fileName],
                progress,
                status: progress < 100 ? 'uploading' : 'success'
              }
            }));
            
            // Update global status message based on progress
            if (progress < 100) {
              currentlyUploadingVideo = true;
              currentUploadingFile = fileName;
              
              let statusMessage = "Preparing video...";
              if (progress < 20) {
                statusMessage = "Reading video file...";
              } else if (progress < 50) {
                statusMessage = "Uploading video to server...";
              } else if (progress < 95) {
                statusMessage = "Processing with Facebook...";
              } else {
                statusMessage = "Almost done...";
              }
              
              setPostStatus({ 
                message: `${statusMessage} (${Math.round(progress)}%) - ${fileName}`
              });
            } else {
              // If upload is complete but we haven't reset the form yet
              if (currentlyUploadingVideo && currentUploadingFile === fileName) {
                currentlyUploadingVideo = false;
                videoUploadSucceeded = true;
                setPostStatus({ message: "Video uploaded successfully! Publishing post..." });
              }
            }
          },
          onUploadError: (fileName: string, error: string) => {
            setMediaUploadStatus(prev => ({
              ...prev,
              [fileName]: {
                ...prev[fileName],
                status: 'error',
                errorMessage: error
              }
            }));
            setPostStatus({
              success: false,
              message: `Error uploading ${fileName}: ${error}`
            });
            currentlyUploadingVideo = false;
          }
        });

        // If we made it here, everything succeeded (or at least the video upload did)
        resetForm();
        setPostStatus({ success: true, message: "Post published successfully!" });
      } catch (error) {
        console.error("Error posting:", error);
        
        // If the video upload succeeded but the post creation failed, show a more accurate message
        if (videoUploadSucceeded && hasVideoFiles) {
          setPostStatus({ 
            success: true, 
            message: "Video was uploaded successfully! You can view it on your Facebook page." 
          });
          resetForm();
        } else {
          setPostStatus({
            success: false,
            message: error instanceof Error ? error.message : "An unknown error occurred",
          });
        }
      }
    } finally {
      setIsSubmitting(false);
      
      // Clear success status after 3 seconds if it's a success message
      if (postStatus?.success === true) {
        setTimeout(() => {
          setPostStatus(null);
        }, 3000);
      }
    }
  };

  const handleSchedulePost = async () => {
    if (!content || selectedPageIds.length === 0 || !scheduleDate) return;
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setPostStatus({ message: "Scheduling post..." });

      // For scheduled posts, check if there are video files
      const hasVideoFiles = mediaFiles.some((file) =>
        file.type.startsWith("video/")
      );

      // Check if there are any files
      if (mediaFiles.length > 0) {
        if (hasVideoFiles) {
          setPostStatus({
            success: false,
            message:
              "Videos cannot be scheduled. Please use 'Post Now' for videos or remove them before scheduling.",
          });
          setIsSubmitting(false);
          return;
        } else {
          setPostStatus({
            success: false,
            message:
              "Files cannot be scheduled directly. Please use URLs for scheduled posts.",
          });
          setIsSubmitting(false);
          return;
        }
      }

      await onSchedulePost({
        content,
        pageIds: selectedPageIds,
        scheduledFor: scheduleDate,
        mediaUrls: mediaUrl ? [mediaUrl] : undefined,
      });

      // Reset form
      resetForm();
      setPostStatus({ success: true, message: "Post scheduled successfully!" });
      
      // Refresh scheduled posts
      refreshScheduledPosts();
    } catch (error) {
      console.error("Error scheduling post:", error);
      setPostStatus({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
      
      // Clear success status after 3 seconds
      if (!postStatus?.success === false) {
        setTimeout(() => {
          setPostStatus(null);
        }, 3000);
      }
    }
  };

  // ======================================================
  // Helper Functions
  // ======================================================
  const resetForm = () => {
    setContent("");
    setSelectedPageIds([]);
    setScheduleDate("");
    setMediaUrl("");
    setMediaFiles([]);
    setMediaPreview({});
    setMediaUploadStatus({});
  };

  const refreshScheduledPosts = () => {
    const postsJson = localStorage.getItem("scheduled_posts");
    if (postsJson) {
      const posts = JSON.parse(postsJson);
      if (Array.isArray(posts)) {
        setScheduledPosts(posts.filter((post) => post.status === "scheduled"));
      }
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Render permission error component
  const renderPermissionError = () => {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Facebook Permission Error
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p className="mb-2">
                Your Facebook app is missing required permissions to post
                content. To fix this:
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>
                  Go to{" "}
                  <a
                    href="https://developers.facebook.com/apps/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline"
                  >
                    Facebook Developers
                  </a>
                </li>
                <li>Select your app</li>
                <li>
                  Navigate to App Settings &gt; Advanced &gt; Optional
                  Permissions
                </li>
                <li>
                  Request the following permissions:
                  <ul className="list-disc pl-5 mt-1">
                    <li>
                      <code className="bg-red-100 px-1 py-0.5 rounded">
                        pages_manage_posts
                      </code>
                    </li>
                    <li>
                      <code className="bg-red-100 px-1 py-0.5 rounded">
                        pages_read_engagement
                      </code>
                    </li>
                    <li>
                      <code className="bg-red-100 px-1 py-0.5 rounded">
                        pages_manage_metadata
                      </code>
                    </li>
                    {mediaFiles.some((file) =>
                      file.type.startsWith("video/")
                    ) && (
                      <li>
                        <code className="bg-red-100 px-1 py-0.5 rounded">
                          pages_manage_engagement
                        </code>{" "}
                        (required for video uploads)
                      </li>
                    )}
                  </ul>
                </li>
                <li>
                  After permissions are approved, get a new Page Access Token
                </li>
                <li>Update your Page Access Token in the Page Setup tab</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render upload progress indicator
  const renderUploadProgress = (file: File) => {
    const status = mediaUploadStatus[file.name];
    
    if (!status || status.status === 'pending') {
      return null;
    }
    
    if (status.status === 'error') {
      return (
        <div className="mt-1">
          <div className="flex items-center">
            <svg className="h-4 w-4 text-red-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-red-500 truncate">Upload failed</span>
          </div>
          {status.errorMessage && (
            <p className="text-xs text-red-500 mt-1">{status.errorMessage}</p>
          )}
        </div>
      );
    }
    
    if (status.status === 'uploading') {
      let statusMessage = "Preparing...";
      
      if (status.progress < 20) {
        statusMessage = "Reading file...";
      } else if (status.progress < 50) {
        statusMessage = "Uploading to server...";
      } else if (status.progress < 95) {
        statusMessage = "Processing with Facebook...";
      } else {
        statusMessage = "Almost done...";
      }
      
      return (
        <div className="mt-1">
          <div className="flex items-center text-xs text-blue-500">
            <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{statusMessage} ({Math.round(status.progress)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${status.progress}%` }}
            ></div>
          </div>
        </div>
      );
    }
    
    if (status.status === 'success') {
      return (
        <div className="mt-1 flex items-center text-xs text-green-500">
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Upload complete</span>
        </div>
      );
    }
    
    return null;
  };

  // ======================================================
  // Render
  // ======================================================
  return (
    <div className="space-y-6">
      {/* Post Creation Form */}
      <div className="bg-white shadow sm:rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Create New Post
        </h3>

        {/* Facebook Permissions Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-blue-700">
                <strong>Required Facebook Permissions:</strong> Your Facebook
                app needs
                <code className="mx-1 px-1 py-0.5 bg-blue-100 rounded">
                  pages_manage_posts
                </code>
                ,
                <code className="mx-1 px-1 py-0.5 bg-blue-100 rounded">
                  pages_read_engagement
                </code>
                , and
                <code className="mx-1 px-1 py-0.5 bg-blue-100 rounded">
                  pages_manage_metadata
                </code>{" "}
                permissions. For video uploads, also add
                <code className="mx-1 px-1 py-0.5 bg-blue-100 rounded">
                  pages_manage_engagement
                </code>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Permission Error */}
        {postStatus &&
          postStatus.success === false &&
          postStatus.message &&
          postStatus.message.includes("permission") &&
          renderPermissionError()}

        {/* Regular Post Status */}
        {postStatus &&
          !(
            postStatus.success === false &&
            postStatus.message &&
            postStatus.message.includes("permission")
          ) && (
            <div
              className={`mt-2 p-2 rounded ${
                postStatus.success === false
                  ? "bg-red-100 text-red-700"
                  : postStatus.success
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {postStatus.message}
            </div>
          )}

        <div className="space-y-4">
          {/* Post Content */}
          <div>
            <label
              htmlFor="post-content"
              className="block text-sm font-medium text-gray-700"
            >
              Post Content
            </label>
            <textarea
              id="post-content"
              name="post-content"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Write your post content here..."
            ></textarea>
          </div>

          {/* Media URL */}
          <div>
            <label
              htmlFor="media-url"
              className="block text-sm font-medium text-gray-700"
            >
              Media URL (Optional)
            </label>
            <input
              type="text"
              id="media-url"
              name="media-url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Media File Upload */}
          <div>
            <label
              htmlFor="media-files"
              className="block text-sm font-medium text-gray-700"
            >
              Upload Media (Images or Videos)
            </label>
            <div className="mt-1 flex items-center">
              <input
                type="file"
                id="media-files"
                name="media-files"
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                multiple
              />
              {mediaFiles.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearFiles}
                  className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Supported formats: Images (jpg, png, gif) and Videos (mp4, mov).
              Videos can only be posted immediately and cannot be scheduled.
            </p>

            {/* Media Files Preview */}
            {mediaFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-2">Selected files:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mediaFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="border rounded-md p-2"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium truncate max-w-[150px]">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-500 hover:text-red-700"
                          aria-label="Remove file"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="h-36 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                        {mediaPreview[file.name] ? (
                          file.type.startsWith("image/") ? (
                            <Image
                              src={mediaPreview[file.name]}
                              alt={file.name}
                              className="object-contain h-full w-full"
                              width={400}
                              height={400}
                            />
                          ) : file.type.startsWith("video/") ? (
                            <video
                              src={mediaPreview[file.name]}
                              controls
                              className="object-contain h-full w-full"
                            />
                          ) : (
                            <div className="text-gray-400 text-xs text-center">
                              No preview available
                            </div>
                          )
                        ) : (
                          <div className="text-gray-400 text-xs text-center">
                            Loading preview...
                          </div>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {file.type.startsWith("image/")
                          ? "Image"
                          : file.type.startsWith("video/")
                          ? "Video"
                          : "File"}{" "}
                        • {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                      
                      {/* Display upload progress */}
                      {renderUploadProgress(file)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Page Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Pages
            </label>
            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {pages.length > 0 ? (
                pages.map((page) => (
                  <div key={page.id} className="flex items-center">
                    <input
                      id={`page-${page.id}`}
                      name={`page-${page.id}`}
                      type="checkbox"
                      checked={selectedPageIds.includes(page.id)}
                      onChange={() => handlePageSelection(page.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`page-${page.id}`}
                      className="ml-2 block text-sm text-gray-900"
                    >
                      {page.name}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No Facebook pages found. Please add a page in the Page Setup
                  tab.
                </p>
              )}
            </div>
          </div>

          {/* Schedule Date */}
          <div>
            <label
              htmlFor="schedule-date"
              className="block text-sm font-medium text-gray-700"
            >
              Schedule Date (Optional)
            </label>
            <input
              type="datetime-local"
              id="schedule-date"
              name="schedule-date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handlePostNow}
              disabled={!content || selectedPageIds.length === 0}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                !content || selectedPageIds.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              }`}
            >
              Post Now
            </button>
            <button
              type="button"
              onClick={handleSchedulePost}
              disabled={
                !content || selectedPageIds.length === 0 || !scheduleDate
              }
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                !content || selectedPageIds.length === 0 || !scheduleDate
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              }`}
            >
              Schedule Post
            </button>
          </div>
        </div>
      </div>

      {/* Scheduled Posts List */}
      {scheduledPosts.length > 0 && (
        <div className="bg-white shadow sm:rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Scheduled Posts
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Content
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Scheduled For
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Pages
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scheduledPosts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="max-w-xs truncate">{post.content}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.scheduledFor
                        ? formatDate(post.scheduledFor)
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.pageIds.length} page(s)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
