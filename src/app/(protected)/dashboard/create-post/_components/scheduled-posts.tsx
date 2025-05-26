import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock } from "lucide-react";
import type { FacebookPost } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect } from "react";
import { toast } from "sonner";

interface ScheduledPostsProps {
  posts: FacebookPost[];
  onPostNow: (params: {
    content: string;
    pageIds: string[];
    mediaUrls?: string[];
  }) => Promise<void>;
}

export function ScheduledPosts({ posts, onPostNow }: ScheduledPostsProps) {
  useEffect(() => {
    const checkScheduledPosts = async () => {
      const now = new Date();
      const postsToPublish = posts.filter((post) => {
        if (!post.scheduledFor) return false;
        const scheduledTime = new Date(post.scheduledFor);
        return scheduledTime <= now && post.status === "scheduled";
      });

      for (const post of postsToPublish) {
        try {
          await onPostNow({
            content: post.content,
            pageIds: post.pageIds,
            mediaUrls: post.mediaUrls,
          });

          const allPosts = JSON.parse(
            localStorage.getItem("scheduled_posts") || "[]"
          ) as FacebookPost[];
          const remainingPosts = allPosts.filter((p) => p.id !== post.id);
          localStorage.setItem(
            "scheduled_posts",
            JSON.stringify(remainingPosts)
          );
          toast.success(
            `Scheduled post published successfully: ${post.content.substring(
              0,
              30
            )}...`
          );
        } catch (error) {
          console.error("Failed to publish scheduled post:", error);
          toast.error(
            `Failed to publish scheduled post: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    };

    checkScheduledPosts();
    const intervalId = setInterval(checkScheduledPosts, 60000);

    return () => clearInterval(intervalId);
  }, [posts, onPostNow]);

  if (posts.length === 0) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="bg-background/50 backdrop-blur-[2px]">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Clock className="h-5 w-5 text-muted-foreground/70" />
        <h3 className="text-lg font-semibold text-foreground/80">
          Scheduled Posts ({posts.length})
        </h3>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50">
                <TableHead className="text-xs font-medium text-muted-foreground/70">
                  Content
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground/70">
                  Scheduled For
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground/70">
                  Pages
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow
                  key={post.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <div className="max-w-xs truncate text-sm text-foreground/70">
                      {post.content}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground/70">
                      {post.scheduledFor
                        ? formatDate(post.scheduledFor)
                        : "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground/70">
                      {post.pageIds.length} page(s)
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
