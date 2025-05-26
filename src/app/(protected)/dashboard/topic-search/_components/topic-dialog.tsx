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
import {
  Calendar,
  Link as LinkIcon,
  Facebook,
  MessageCircle,
  ThumbsUp,
  Share2,
} from "lucide-react";

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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader className="pb-4">
          <DialogTitle>Topic Details</DialogTitle>
          <DialogDescription>
            Posted on {formatDate(topic.time)}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(80vh-8rem)] pr-4">
          <div className="space-y-6">
            {/* Content Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Content
              </h3>
              <p className="text-base whitespace-pre-wrap">{topic.text}</p>
            </div>

            {/* Page Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Page Information
              </h3>
              <p className="text-base">{topic.pageName}</p>
            </div>

            {/* Engagement Stats */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Engagement
              </h3>
              <div className="flex space-x-6">
                <div className="flex items-center space-x-2">
                  <ThumbsUp className="h-4 w-4 text-blue-500" />
                  <span>{formatNumber(topic.likes || 0)} reactions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <span>{formatNumber(topic.comments || 0)} comments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Share2 className="h-4 w-4 text-orange-500" />
                  <span>{formatNumber(topic.shares || 0)} shares</span>
                </div>
              </div>
            </div>

            {/* Time Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Timing
              </h3>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(topic.time)}</span>
              </div>
            </div>

            {/* Links */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Links
              </h3>
              <div className="space-y-2">
                {topic.url && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(topic.url, "_blank")}
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Open Post
                  </Button>
                )}
                {topic.pageUrl && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(topic.pageUrl, "_blank")}
                  >
                    <Facebook className="mr-2 h-4 w-4" />
                    View Page
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
