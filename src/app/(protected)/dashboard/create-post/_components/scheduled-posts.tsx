import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock, Calendar, Users } from "lucide-react";
import type { FacebookPost, FacebookPage } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

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
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
  };

  const getPageNames = (pageIds: string[]) => {
    // Get all pages from localStorage
    const pagesJson = localStorage.getItem("user_pages");
    if (!pagesJson) return pageIds;

    try {
      const allPages = JSON.parse(pagesJson) as FacebookPage[];
      return pageIds.map((id) => {
        const page = allPages.find((p) => p.pageId === id);
        return page ? page.name : id;
      });
    } catch (error) {
      console.error("Error parsing pages:", error);
      return pageIds;
    }
  };

  const renderPageNames = (pageIds: string[]) => {
    const pageNames = getPageNames(pageIds);

    if (pageNames.length === 0) return "No pages";
    if (pageNames.length === 1) return pageNames[0];

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="text-left">
            <span className="flex items-center gap-1">
              <span className="truncate max-w-[150px]">{pageNames[0]}</span>
              <span className="text-muted-foreground">
                +{pageNames.length - 1} more
              </span>
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <ul className="list-none p-0 m-0 space-y-1">
              {pageNames.map((name, index) => (
                <li key={index} className="text-sm">
                  {name}
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card className="bg-background/50 backdrop-blur-[2px]">
      <CardHeader className="flex flex-row items-center gap-2 pb-4 border-b">
        <Clock className="h-5 w-5 text-muted-foreground/70" />
        <h3 className="text-lg font-semibold text-foreground/80">
          Scheduled Posts ({posts.length})
        </h3>
      </CardHeader>
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[45%] py-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Content
                  </div>
                </TableHead>
                <TableHead className="w-[35%]">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    <Calendar className="h-4 w-4" />
                    Scheduled For
                  </div>
                </TableHead>
                <TableHead className="w-[20%]">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    <Users className="h-4 w-4" />
                    Target Pages
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow
                  key={post.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="py-4">
                    <div className="max-w-md">
                      <p className="text-sm text-foreground/90 line-clamp-2">
                        {post.content}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-foreground/80">
                      {post.scheduledFor
                        ? formatDate(post.scheduledFor)
                        : "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-foreground/80">
                      {renderPageNames(post.pageIds)}
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
