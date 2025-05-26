"use client";

import { useState, FormEvent } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  Link as LinkIcon,
  MessageCircle,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
import { Skeleton } from "@/components/ui/skeleton";

interface AddCommentFormProps {
  onCommentSaved?: (success: boolean, message: string) => void;
}

export function AddCommentForm({ onCommentSaved }: AddCommentFormProps) {
  const [postLink, setPostLink] = useState("");
  const [comments, setComments] = useState<string[]>([]);
  const [currentComment, setCurrentComment] = useState("");
  const [commentCount, setCommentCount] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleAddComment = () => {
    if (currentComment.trim()) {
      setComments([...comments, currentComment.trim()]);
      setCurrentComment("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleRemoveComment = (index: number) => {
    const updatedComments = [...comments];
    updatedComments.splice(index, 1);
    setComments(updatedComments);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!postLink) {
      toast.error("Facebook post link is required");
      return;
    }

    if (comments.length === 0) {
      toast.error("At least one comment is required");
      return;
    }

    setLoading(true);

    try {
      const commentsRef = collection(db, "post_comments");
      const q = query(commentsRef, where("postLink", "==", postLink));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        const existingData = existingDoc.data();

        const updatedComments = [...existingData.comments, ...comments];

        await updateDoc(doc(db, "post_comments", existingDoc.id), {
          comments: updatedComments,
          commentCount: commentCount || updatedComments.length,
          updatedAt: serverTimestamp(),
        });

        toast.success("Comments updated successfully!");
      } else {
        const commentData = {
          postLink,
          comments,
          commentCount: commentCount || comments.length,
        };

        await addDoc(collection(db, "post_comments"), {
          ...commentData,
          createdAt: serverTimestamp(),
        });

        toast.success("Comments saved successfully!");
      }

      setPostLink("");
      setComments([]);
      setCurrentComment("");
      setCommentCount(1);

      if (onCommentSaved) {
        onCommentSaved(true, "Comments saved successfully!");
      }
    } catch (error) {
      console.error("Error saving comments:", error);
      toast.error("Failed to save comments. Please try again.");

      if (onCommentSaved) {
        onCommentSaved(false, "Failed to save comments");
      }
    } finally {
      setLoading(false);
    }
  };

  const CommentSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 rounded-md bg-muted/50"
        >
          <Skeleton className="h-4 w-[80%]" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Add Comments
        </CardTitle>
        <CardDescription>
          Add and manage comments for automated posting on Facebook
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Link Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="post-link"
                className="text-base font-semibold flex items-center gap-2"
              >
                <LinkIcon className="h-4 w-4" />
                Facebook Post Link
              </Label>
              <Input
                type="url"
                id="post-link"
                value={postLink}
                onChange={(e) => setPostLink(e.target.value)}
                placeholder="https://www.facebook.com/share/p/ABC123..."
                className="w-full"
                required
              />
            </div>
          </div>

          <Separator className="my-6" />

          {/* Comments Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="comment"
                className="text-base font-semibold flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Add New Comment
              </Label>
              <div className="flex gap-2">
                <Input
                  id="comment"
                  value={currentComment}
                  onChange={(e) => setCurrentComment(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a comment and press Enter or click Add"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddComment}
                  variant="secondary"
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Press Enter to quickly add a comment
              </p>
            </div>

            {comments.length > 0 && (
              <div className="space-y-2 bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-medium">
                    Added Comments ({comments.length})
                  </Label>
                </div>
                <ScrollArea className="h-[200px] rounded-md border bg-background">
                  <div className="p-4 space-y-2">
                    {loading ? (
                      <CommentSkeleton />
                    ) : (
                      comments.map((comment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-md bg-muted/50 group hover:bg-muted/70 transition-colors"
                        >
                          <span className="text-sm flex-1 mr-4">{comment}</span>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Comment
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this comment?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveComment(index)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Comment Count Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="comment-count"
                className="text-base font-semibold flex items-center gap-2"
              >
                <Hash className="h-4 w-4" />
                Comment Count
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  id="comment-count"
                  min="1"
                  value={commentCount}
                  onChange={(e) =>
                    setCommentCount(parseInt(e.target.value) || 1)
                  }
                  className="max-w-[120px]"
                />
                <p className="text-sm text-muted-foreground">
                  Number of times each comment will be posted
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={loading || !postLink || comments.length === 0}
              className="min-w-[140px]"
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  Save Comments
                  <span className="ml-2 text-xs text-muted">
                    ({comments.length})
                  </span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
