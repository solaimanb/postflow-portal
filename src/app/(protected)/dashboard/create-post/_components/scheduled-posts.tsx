import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock, Calendar, Users, Trash2 } from "lucide-react";
import type { FacebookPost } from "@/types";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  processScheduledPosts,
  deleteScheduledPost,
  getPageNames,
} from "@/lib/services/facebook/posts/schedule";

interface ScheduledPostsProps {
  userId: string;
  posts: FacebookPost[];
  onRefresh?: () => void;
}

export function ScheduledPosts({
  userId,
  posts,
  onRefresh,
}: ScheduledPostsProps) {
  const [postToDelete, setPostToDelete] = useState<FacebookPost | null>(null);

  useEffect(() => {
    const checkScheduledPosts = () => {
      processScheduledPosts(userId)
        .then(() => {
          if (onRefresh) {
            onRefresh();
          }
        })
        .catch((error) => {
          console.error("Error checking scheduled posts:", error);
        });
    };

    checkScheduledPosts();
    const intervalId = setInterval(checkScheduledPosts, 15000);

    return () => clearInterval(intervalId);
  }, [userId, onRefresh]);

  const handleDelete = async (post: FacebookPost) => {
    try {
      await deleteScheduledPost(post.id);
      if (onRefresh) {
        onRefresh();
      }
      setPostToDelete(null);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  if (posts.length === 0) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString;
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
                <TableHead className="w-[40%] py-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Content
                  </div>
                </TableHead>
                <TableHead className="w-[30%]">
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
                <TableHead className="w-[10%] text-right">
                  <span className="sr-only">Actions</span>
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
                  <TableCell className="text-right">
                    <AlertDialog
                      open={postToDelete?.id === post.id}
                      onOpenChange={(open) => !open && setPostToDelete(null)}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setPostToDelete(post)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete post</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete Scheduled Post
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this scheduled post?
                            This action cannot be undone.
                            <div className="mt-4 p-4 rounded-lg bg-muted/50">
                              <p className="text-sm text-foreground/90 line-clamp-3">
                                {post.content}
                              </p>
                              <p className="text-sm text-muted-foreground mt-2">
                                Scheduled for:{" "}
                                {formatDate(post.scheduledFor || "")}
                              </p>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            onClick={() => setPostToDelete(null)}
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDelete(post)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
