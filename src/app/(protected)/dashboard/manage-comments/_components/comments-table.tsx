"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { PostComment } from "@/types";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function CommentsTable() {
  const [savedComments, setSavedComments] = useState<
    (PostComment & { id: string })[]
  >([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState<"createdAt" | "commentCount">(
    "createdAt"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchComments = () => {
      setLoadingComments(true);
      const commentsRef = collection(db, "post_comments");
      const q = query(
        commentsRef,
        orderBy(sortField, sortDirection),
        limit(itemsPerPage)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const commentsList: (PostComment & { id: string })[] = [];
          snapshot.forEach((doc) => {
            commentsList.push({
              id: doc.id,
              ...(doc.data() as PostComment),
            });
          });
          setSavedComments(commentsList);
          setLoadingComments(false);
        },
        (error) => {
          console.error("Error fetching comments:", error);
          setLoadingComments(false);
        }
      );

      const countQuery = query(commentsRef);
      getDocs(countQuery).then((snapshot) => {
        setTotalItems(snapshot.size);
      });

      return unsubscribe;
    };

    fetchComments();
  }, [itemsPerPage, sortField, sortDirection]);

  const filteredComments = savedComments.filter(
    (item) =>
      item.postLink.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.comments.some((comment) =>
        comment.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handleDeleteComment = useCallback(
    async (postId: string, commentIndex?: number) => {
      setIsDeleting(true);

      try {
        if (typeof commentIndex === "number") {
          // Optimistically update UI for single comment deletion
          setSavedComments((currentComments) => {
            const updatedComments = currentComments.map((post) => {
              if (post.id === postId) {
                const newComments = [...post.comments];
                newComments.splice(commentIndex, 1);
                return {
                  ...post,
                  comments: newComments,
                  commentCount:
                    post.commentCount > 0 ? post.commentCount - 1 : 0,
                };
              }
              return post;
            });

            // Remove the post if it has no comments left
            return updatedComments.filter((post) => post.comments.length > 0);
          });

          // Delete single comment
          const post = savedComments.find((item) => item.id === postId);
          if (!post) return;

          const updatedComments = [...post.comments];
          updatedComments.splice(commentIndex, 1);

          await updateDoc(doc(db, "post_comments", postId), {
            comments: updatedComments,
            commentCount: post.commentCount > 0 ? post.commentCount - 1 : 0,
            updatedAt: serverTimestamp(),
          });

          toast.success("Comment deleted successfully!");

          if (updatedComments.length === 0) {
            setExpandedRow(null);
          }
        } else {
          // Optimistically update UI for comment set deletion
          setSavedComments((currentComments) =>
            currentComments.filter((post) => post.id !== postId)
          );
          setTotalItems((prev) => Math.max(0, prev - 1));

          // Delete entire comment set
          await deleteDoc(doc(db, "post_comments", postId));
          toast.success("Comment set deleted successfully!");
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
        // Revert optimistic update on error by refetching data
        const commentsRef = collection(db, "post_comments");
        const q = query(
          commentsRef,
          orderBy(sortField, sortDirection),
          limit(itemsPerPage)
        );

        const snapshot = await getDocs(q);
        const commentsList: (PostComment & { id: string })[] = [];
        snapshot.forEach((doc) => {
          commentsList.push({
            id: doc.id,
            ...(doc.data() as PostComment),
          });
        });
        setSavedComments(commentsList);

        toast.error(
          `Failed to delete ${
            typeof commentIndex === "number" ? "comment" : "comment set"
          }.`
        );
      } finally {
        setIsDeleting(false);
      }
    },
    [savedComments, sortField, sortDirection, itemsPerPage]
  );

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    const commentsRef = collection(db, "post_comments");
    const lastVisible = savedComments[savedComments.length - 1];

    if (pageNumber > currentPage) {
      const q = query(
        commentsRef,
        orderBy(sortField, sortDirection),
        startAfter(lastVisible.createdAt),
        limit(itemsPerPage)
      );

      setLoadingComments(true);
      getDocs(q).then((snapshot) => {
        const commentsList: (PostComment & { id: string })[] = [];
        snapshot.forEach((doc) => {
          commentsList.push({
            id: doc.id,
            ...(doc.data() as PostComment),
          });
        });
        setSavedComments(commentsList);
        setLoadingComments(false);
      });
    } else if (pageNumber < currentPage) {
      const q = query(
        commentsRef,
        orderBy(sortField, sortDirection),
        limit(itemsPerPage * pageNumber)
      );

      setLoadingComments(true);
      getDocs(q).then((snapshot) => {
        const commentsList: (PostComment & { id: string })[] = [];
        snapshot.forEach((doc) => {
          commentsList.push({
            id: doc.id,
            ...(doc.data() as PostComment),
          });
        });
        const startIndex = (pageNumber - 1) * itemsPerPage;
        setSavedComments(
          commentsList.slice(startIndex, startIndex + itemsPerPage)
        );
        setLoadingComments(false);
      });
    }
  };

  const handleSort = (field: "createdAt" | "commentCount") => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatDate = (
    timestamp: { toDate?: () => Date } | string | Date | null | undefined
  ) => {
    if (!timestamp) return "N/A";

    try {
      if (
        timestamp &&
        typeof timestamp === "object" &&
        "toDate" in timestamp &&
        timestamp.toDate
      ) {
        return timestamp.toDate().toLocaleString();
      }

      return new Date(timestamp as string | Date).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <Card className="border-none shadow-none p-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-0">
        <div className="space-y-1">
          <CardTitle>Saved Comments</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage and view your saved post comments
          </p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search comments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-5 bg-muted/50 border-none"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0 pb-4">
        {loadingComments ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 px-4 py-3">
                <Skeleton className="h-12 w-[60%]" />
                <Skeleton className="h-12 w-[20%]" />
                <Skeleton className="h-12 w-[20%]" />
              </div>
            ))}
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-medium text-muted-foreground mb-2">
              No comments found
            </p>
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? "Try adjusting your search term"
                : "Start saving comments to see them here"}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[45%]">Post Link</TableHead>
                  <TableHead className="w-[25%]">Comments</TableHead>
                  <TableHead className="w-[15%]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 flex items-center gap-1 font-medium -ml-2"
                      onClick={() => handleSort("commentCount")}
                    >
                      Count
                      {sortField === "commentCount" && (
                        <Badge variant="secondary" className="ml-2 font-normal">
                          {sortDirection === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </Badge>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[15%]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 flex items-center gap-1 font-medium -ml-2"
                      onClick={() => handleSort("createdAt")}
                    >
                      Created
                      {sortField === "createdAt" && (
                        <Badge variant="secondary" className="ml-2 font-normal">
                          {sortDirection === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </Badge>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComments.map((item) => (
                  <React.Fragment key={item.id}>
                    <TableRow className="group">
                      <TableCell className="font-medium">
                        <a
                          href={item.postLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-sm truncate block max-w-[400px]"
                        >
                          {item.postLink}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedRow(
                              expandedRow === item.id ? null : item.id
                            )
                          }
                          className="gap-2"
                        >
                          <Badge variant="secondary">
                            {item.comments.length}
                          </Badge>
                          {expandedRow === item.id ? "Hide" : "View"} comments
                        </Button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.commentCount || item.comments.length}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/90"
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Comment Set
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this comment
                                set? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteComment(item.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                    {expandedRow === item.id && (
                      <TableRow>
                        <TableCell colSpan={5} className="p-0 border-0">
                          <div className="py-4 px-6 bg-muted/30 border-y">
                            <ScrollArea className="h-[300px]">
                              <div className="space-y-2">
                                {item.comments.map((comment, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-lg bg-background border gap-4 group/comment hover:shadow-sm transition-shadow"
                                  >
                                    <span className="text-sm flex-1">
                                      {comment}
                                    </span>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 opacity-0 group-hover/comment:opacity-100 transition-opacity text-destructive hover:text-destructive/90"
                                          disabled={isDeleting}
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
                                            Are you sure you want to delete this
                                            comment? This action cannot be
                                            undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleDeleteComment(
                                                item.id,
                                                index
                                              )
                                            }
                                            className="bg-destructive hover:bg-destructive/90"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalItems)}
                  </span>{" "}
                  of <span className="font-medium">{totalItems}</span> results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="gap-2"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="gap-2"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
