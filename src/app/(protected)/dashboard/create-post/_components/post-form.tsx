"use client";

import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, Send, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { FacebookPage, PostScheduleParams } from "@/types";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock as ClockIcon } from "lucide-react";

interface PostFormProps {
  pages: FacebookPage[];
  onPostNow: (params: PostScheduleParams) => Promise<void>;
  onSchedulePost: (params: PostScheduleParams) => Promise<void>;
}

interface MediaUploadStatus {
  fileName: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  errorMessage?: string;
}

// Add type definition for time groups
interface TimeGroups {
  Morning: string[];
  Afternoon: string[];
  Evening: string[];
  Night: string[];
}

export default function PostForm({
  pages,
  onPostNow,
  onSchedulePost,
}: PostFormProps) {
  const [content, setContent] = useState("");
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<{ [key: string]: string }>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaUploadStatus, setMediaUploadStatus] = useState<{
    [key: string]: MediaUploadStatus;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      // Create initial upload status for each file
      const newUploadStatus: { [key: string]: MediaUploadStatus } = {};
      newFiles.forEach((file) => {
        newUploadStatus[file.name] = {
          fileName: file.name,
          status: "pending",
          progress: 0,
        };
      });

      setMediaUploadStatus((prev) => ({
        ...prev,
        ...newUploadStatus,
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

        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
          fileReader.readAsDataURL(file);
        }
      });

      setMediaFiles((prevFiles) => [...prevFiles, ...newFiles]);
      setMediaUrl(""); // Clear media URL when files are selected
    }
  };

  const handleRemoveFile = (index: number) => {
    const fileToRemove = mediaFiles[index];
    setMediaFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));

    if (fileToRemove && mediaPreview[fileToRemove.name]) {
      setMediaPreview((prev) => {
        const newPreview = { ...prev };
        delete newPreview[fileToRemove.name];
        return newPreview;
      });
    }

    if (fileToRemove) {
      setMediaUploadStatus((prev) => {
        const newStatus = { ...prev };
        delete newStatus[fileToRemove.name];
        return newStatus;
      });
    }
  };

  const handleClearFiles = () => {
    setMediaFiles([]);
    setMediaPreview({});
    setMediaUploadStatus({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePostNow = async () => {
    if (!content || selectedPageIds.length === 0) return;
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const toastId = toast.loading("Publishing your post...");

      try {
        await onPostNow({
          content,
          pageIds: selectedPageIds,
          mediaUrls: mediaUrl ? [mediaUrl] : undefined,
          mediaFiles: mediaFiles.length > 0 ? mediaFiles : undefined,
          onUploadProgress: (fileName: string, progress: number) => {
            setMediaUploadStatus((prev) => ({
              ...prev,
              [fileName]: {
                ...prev[fileName],
                progress,
                status: progress < 100 ? "uploading" : "success",
              },
            }));
          },
          onUploadError: (fileName: string, error: string) => {
            if (!error.toLowerCase().includes("facebook")) {
              toast.error(`Error uploading ${fileName}: ${error}`, {
                id: toastId,
              });
            }
          },
        });

        resetForm();
        toast.success("Post published successfully!", { id: toastId });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";

        // Only show errors that are actual failures, not permission/fallback messages
        if (
          !errorMessage.toLowerCase().includes("facebook") &&
          !errorMessage.toLowerCase().includes("permission") &&
          !errorMessage.toLowerCase().includes("token")
        ) {
          toast.error(errorMessage, { id: toastId });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSchedulePost = async () => {
    if (
      !content ||
      selectedPageIds.length === 0 ||
      !scheduleDate ||
      !selectedTime
    )
      return;
    if (isSubmitting) return;

    const toastId = toast.loading("Scheduling post...");

    try {
      setIsSubmitting(true);

      // For scheduled posts, check if there are video files
      const hasVideoFiles = mediaFiles.some((file) =>
        file.type.startsWith("video/")
      );

      // Check if there are any files
      if (mediaFiles.length > 0) {
        if (hasVideoFiles) {
          toast.error(
            "Videos cannot be scheduled. Please use 'Post Now' for videos or remove them before scheduling.",
            { id: toastId }
          );
          return;
        } else {
          toast.error(
            "Files cannot be scheduled directly. Please use URLs for scheduled posts.",
            { id: toastId }
          );
          return;
        }
      }

      // Combine date and time
      const scheduledDateTime = new Date(scheduleDate);
      const [timeStr, period] = selectedTime.split(" ");
      const [hours, minutes] = timeStr.split(":").map(Number);
      let adjustedHours = hours;
      if (period === "PM" && hours !== 12) {
        adjustedHours = hours + 12;
      } else if (period === "AM" && hours === 12) {
        adjustedHours = 0;
      }
      scheduledDateTime.setHours(adjustedHours, minutes, 0, 0);

      await onSchedulePost({
        content,
        pageIds: selectedPageIds,
        scheduledFor: scheduledDateTime.toISOString(),
        mediaUrls: mediaUrl ? [mediaUrl] : undefined,
      });

      resetForm();
      toast.success("Post scheduled successfully!", { id: toastId });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to schedule post",
        { id: toastId }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setContent("");
    setSelectedPageIds([]);
    setScheduleDate(undefined);
    setSelectedTime("");
    setMediaUrl("");
    setMediaFiles([]);
    setMediaPreview({});
    setMediaUploadStatus({});
  };

  // Generate time options in 15-minute intervals with better organization
  const generateTimeOptions = (): TimeGroups => {
    const timeGroups: TimeGroups = {
      Morning: [],
      Afternoon: [],
      Evening: [],
      Night: [],
    };

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const h = hour % 12 || 12;
        const period = hour < 12 ? "AM" : "PM";
        const timeStr = `${h}:${minute.toString().padStart(2, "0")} ${period}`;

        if (hour >= 5 && hour < 12) {
          timeGroups["Morning"].push(timeStr);
        } else if (hour >= 12 && hour < 17) {
          timeGroups["Afternoon"].push(timeStr);
        } else if (hour >= 17 && hour < 21) {
          timeGroups["Evening"].push(timeStr);
        } else {
          timeGroups["Night"].push(timeStr);
        }
      }
    }

    return timeGroups;
  };

  const timeGroups = generateTimeOptions();

  // Quick time slots for common posting times
  const quickTimeSlots = [
    { label: "Morning Post", time: "9:00 AM" },
    { label: "Lunch Break", time: "12:00 PM" },
    { label: "Afternoon", time: "3:00 PM" },
    { label: "Evening", time: "6:00 PM" },
    { label: "Night", time: "9:00 PM" },
  ];

  return (
    <div className="space-y-8">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        {/* Content Section */}
        <div className="space-y-4">
          <Textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post content here..."
            className="min-h-[180px] resize-none text-base"
          />
        </div>

        <div className="space-y-6">
          {/* Media Section */}
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>
                Add images or videos to your post (optional).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload */}
              <div className="space-y-3">
                <Label htmlFor="file-upload" className="sr-only">
                  Choose file
                </Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Media
                  </Button>
                  <input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    multiple
                  />
                  {mediaFiles.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFiles}
                      className="text-destructive hover:text-destructive/90"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              {/* Media URL */}
              <div className="space-y-2">
                <Label htmlFor="media-url">Or add media via URL</Label>
                <Input
                  id="media-url"
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="font-mono"
                  disabled={mediaFiles.length > 0}
                />
              </div>
            </CardContent>
          </Card>

          {/* Media Preview */}
          {mediaFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mediaFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="relative group border rounded-lg p-2"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium truncate max-w-[150px]">
                          {file.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="aspect-video bg-muted rounded-md overflow-hidden">
                        {mediaPreview[file.name] ? (
                          file.type.startsWith("image/") ? (
                            <Image
                              src={mediaPreview[file.name]}
                              alt={file.name}
                              width={400}
                              height={400}
                              className="object-contain w-full h-full"
                            />
                          ) : file.type.startsWith("video/") ? (
                            <video
                              src={mediaPreview[file.name]}
                              controls
                              className="w-full h-full object-contain"
                            />
                          ) : null
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-sm text-muted-foreground">
                              Loading preview...
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">
                        {file.type.startsWith("image/") ? "Image" : "Video"} •{" "}
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </div>

                      {/* Upload Progress - Only show if actively uploading */}
                      {mediaUploadStatus[file.name]?.status === "uploading" && (
                        <div className="mt-2">
                          <Progress
                            value={mediaUploadStatus[file.name].progress}
                            className="h-1"
                          />
                        </div>
                      )}

                      {mediaUploadStatus[file.name]?.status === "error" && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertDescription className="text-xs">
                            {mediaUploadStatus[file.name].errorMessage}
                          </AlertDescription>
                        </Alert>
                      )}

                      {mediaUploadStatus[file.name]?.status === "success" && (
                        <Alert variant="default" className="mt-2">
                          <AlertDescription className="text-xs">
                            Upload complete
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Page Selection */}
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Target Pages</Label>
                {pages.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all"
                      checked={
                        pages.length > 0 &&
                        selectedPageIds.length === pages.length
                      }
                      onCheckedChange={(checked: CheckedState) => {
                        setSelectedPageIds(
                          checked ? pages.map((page) => page.pageId) : []
                        );
                      }}
                    />
                    <Label
                      htmlFor="select-all"
                      className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    >
                      Select All
                    </Label>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Select the Facebook pages for this post.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-2">
              {pages.length > 0 ? (
                pages.map((page) => (
                  <label
                    key={page.pageId}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                      selectedPageIds.includes(page.pageId) &&
                        "bg-primary/5 border-primary"
                    )}
                  >
                    <Checkbox
                      checked={selectedPageIds.includes(page.pageId)}
                      onCheckedChange={(checked: CheckedState) => {
                        setSelectedPageIds((prev) =>
                          checked
                            ? [...prev, page.pageId]
                            : prev.filter((id) => id !== page.pageId)
                        );
                      }}
                    />
                    <span className="text-sm font-medium flex-1">
                      {page.name}
                    </span>
                  </label>
                ))
              ) : (
                <div className="text-center py-6 bg-muted/50 rounded-lg col-span-2">
                  <p className="text-sm text-muted-foreground">
                    No Facebook pages found. Please add a page in the Page Setup
                    tab.
                  </p>
                </div>
              )}
            </div>

            {pages.length > 0 && (
              <p className="text-sm text-muted-foreground border-t pt-3">
                Selected: {selectedPageIds.length} of {pages.length} pages
              </p>
            )}
          </div>

          {/* Schedule Section */}
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-base font-semibold">
                Publishing Schedule
              </Label>
              <p className="text-sm text-muted-foreground">
                Choose when to publish (optional).
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label className="text-sm">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !scheduleDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduleDate
                        ? format(new Date(scheduleDate), "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduleDate}
                      onSelect={setScheduleDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <Label className="text-sm">Time</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time">
                      {selectedTime ? (
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedTime}</span>
                        </div>
                      ) : (
                        <span>Select time</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-80">
                      {/* Quick Time Slots */}
                      <SelectGroup>
                        <SelectLabel className="text-xs font-semibold text-muted-foreground/70 px-2 py-1.5">
                          Quick Select
                        </SelectLabel>
                        {quickTimeSlots.map((slot) => (
                          <SelectItem
                            key={slot.time}
                            value={slot.time}
                            className="flex items-center gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <ClockIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium">{slot.label}</span>
                              <span className="text-xs text-muted-foreground">
                                ({slot.time})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>

                      <div className="h-px bg-border/50 my-2" />

                      {/* Time Groups */}
                      {(
                        Object.entries(timeGroups) as [
                          keyof TimeGroups,
                          string[]
                        ][]
                      ).map(([group, times]) => (
                        <SelectGroup key={group}>
                          <SelectLabel className="text-xs font-semibold text-muted-foreground/70 px-2 py-1.5">
                            {group}
                          </SelectLabel>
                          {times.map((time) => (
                            <SelectItem
                              key={time}
                              value={time}
                              className="flex items-center gap-2"
                            >
                              <span className="font-medium">{time}</span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {scheduleDate && selectedTime && (
              <p className="text-sm text-muted-foreground border-t pt-3">
                Will be published at {selectedTime} on{" "}
                {format(new Date(scheduleDate), "PPP")}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            onClick={handlePostNow}
            disabled={Boolean(
              !content ||
                selectedPageIds.length === 0 ||
                isSubmitting ||
                scheduleDate ||
                selectedTime
            )}
            className="gap-2 min-w-[120px]"
          >
            <Send className="h-4 w-4" />
            Post Now
          </Button>
          <Button
            type="button"
            onClick={handleSchedulePost}
            disabled={
              !content ||
              selectedPageIds.length === 0 ||
              !scheduleDate ||
              !selectedTime ||
              isSubmitting
            }
            variant="outline"
            className="gap-2 min-w-[120px]"
          >
            <CalendarIcon className="h-4 w-4" />
            Schedule Post
          </Button>
        </div>
      </form>
    </div>
  );
}
