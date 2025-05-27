"use client";

import { Topic } from "@/lib/services/apify/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Calendar,
  Facebook,
  MessageCircle,
  ThumbsUp,
  Share2,
  Eye,
  Play,
  User,
  Globe,
  Video,
} from "lucide-react";
import Image from "next/image";

interface TopicDialogProps {
  topic: Topic | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TopicDialog({ topic, open, onOpenChange }: TopicDialogProps) {
  if (!topic) return null;

  const formatDate = (date: string | undefined) => {
    if (!date) return "Unknown date";
    return new Date(date).toLocaleString();
  };

  const formatNumber = (num: number | undefined) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-[85vw] lg:max-w-[75vw] xl:max-w-[65vw] 2xl:max-w-[55vw] h-[90vh] p-6">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl">
            {topic.pageAvatar && (
              <Image
                src={topic.pageAvatar}
                alt={topic.pageName || "Author"}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <span>{topic.pageName || "Unknown Author"}</span>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-sm mt-2">
            <Calendar className="h-4 w-4" />
            {formatDate(topic.date)}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-10rem)] pr-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Section */}
            <div className="space-y-3 lg:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Content
              </h3>
              <p className="text-base whitespace-pre-wrap leading-relaxed">
                {topic.text}
              </p>
            </div>

            {/* Media Section */}
            {(topic.imageUrl || topic.videoUrl) && (
              <div className="space-y-3 lg:col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Media
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {topic.imageUrl && (
                    <div className="overflow-hidden rounded-xl">
                      <AspectRatio ratio={16 / 9} className="bg-muted">
                        <Image
                          src={topic.imageUrl}
                          alt="Post image"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 85vw, 75vw"
                        />
                      </AspectRatio>
                    </div>
                  )}
                  {topic.videoUrl && (
                    <div className="space-y-3">
                      <div className="overflow-hidden rounded-xl">
                        <AspectRatio ratio={16 / 9} className="bg-muted">
                          {topic.videoThumbnail && (
                            <Image
                              src={topic.videoThumbnail}
                              alt="Video thumbnail"
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 85vw, 75vw"
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30">
                            <div className="rounded-full bg-background/90 p-4 transition-transform hover:scale-110">
                              <Play className="h-16 w-16 text-foreground" />
                            </div>
                          </div>
                        </AspectRatio>
                      </div>
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full"
                        onClick={() => window.open(topic.videoUrl, "_blank")}
                      >
                        <Video className="mr-2 h-5 w-5" />
                        Watch Video
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Author Information */}
            <div className="space-y-3 border-t pt-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Author Information
              </h3>
              <div className="space-y-3 bg-background/50 p-4 rounded-xl h-full">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">{topic.pageName}</span>
                </div>
                {topic.pageUrl && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <a
                      href={topic.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View Profile
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Engagement Stats */}
            <div className="space-y-3 border-t pt-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Engagement
              </h3>
              <div className="grid grid-cols-2 gap-2 h-full">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-background/50">
                  <ThumbsUp className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium text-base">
                      {formatNumber(topic.likes)}
                    </div>
                    <div className="text-xs text-muted-foreground">Likes</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-background/50">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium text-base">
                      {formatNumber(topic.comments)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Comments
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-background/50">
                  <Share2 className="h-5 w-5 text-orange-500" />
                  <div>
                    <div className="font-medium text-base">
                      {formatNumber(topic.shares)}
                    </div>
                    <div className="text-xs text-muted-foreground">Shares</div>
                  </div>
                </div>
                {(topic.viewCount || topic.playCount) && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-background/50">
                    <Eye className="h-5 w-5 text-purple-500" />
                    <div>
                      <div className="font-medium text-base">
                        {formatNumber(
                          Math.max(topic.viewCount || 0, topic.playCount || 0)
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">Views</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="w-full bg-background border-t lg:col-span-2 pt-2 px-6">
              <div className="flex flex-col sm:flex-row items-stretch gap-2 max-w-full md:max-w-[85vw] lg:max-w-[75vw] xl:max-w-[65vw] 2xl:max-w-[55vw] mx-auto">
                {topic.url && (
                  <Button
                    variant="default"
                    size="lg"
                    className="flex-1 text-base font-medium py-1 lg:py-0"
                    onClick={() => window.open(topic.url, "_blank")}
                  >
                    <Facebook className="mr-3 h-5 w-5 shrink-0" />
                    View on Facebook
                  </Button>
                )}
                {topic.pageUrl && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 text-base font-medium py-1 lg:py-0"
                    onClick={() => window.open(topic.pageUrl, "_blank")}
                  >
                    <User className="mr-3 h-5 w-5 shrink-0" />
                    View Author Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
