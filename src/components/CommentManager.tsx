"use client";

import React from "react";
import { useState, FormEvent, useEffect } from "react";
import { PostComment } from "../app/types";
import { db } from "../app/lib/firebase";
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

interface CommentManagerProps {
  onCommentSaved?: (success: boolean, message: string) => void;
}

export default function CommentManager({
  onCommentSaved,
}: CommentManagerProps) {
  const [postLink, setPostLink] = useState("");
  const [comments, setComments] = useState<string[]>([]);
  const [currentComment, setCurrentComment] = useState("");
  const [commentCount, setCommentCount] = useState(1);

  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const [savedComments, setSavedComments] = useState<
    (PostComment & { id: string })[]
  >([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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

  const handleAddComment = () => {
    if (currentComment.trim()) {
      setComments([...comments, currentComment.trim()]);
      setCurrentComment("");
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
      setNotification({
        type: "error",
        message: "Facebook post link is required",
      });
      return;
    }

    if (comments.length === 0) {
      setNotification({
        type: "error",
        message: "At least one comment is required",
      });
      return;
    }

    setLoading(true);

    try {
      const commentsRef = collection(db, "post_comments");
      const q = query(commentsRef, where("postLink", "==", postLink));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        const existingData = existingDoc.data() as PostComment;

        const updatedComments = [...existingData.comments, ...comments];

        await updateDoc(doc(db, "post_comments", existingDoc.id), {
          comments: updatedComments,
          commentCount: commentCount || updatedComments.length,
          updatedAt: serverTimestamp(),
        });

        setNotification({
          type: "success",
          message: "Comments updated successfully!",
        });
      } else {
        const commentData: Omit<PostComment, "createdAt"> = {
          postLink,
          comments,
          commentCount: commentCount || comments.length,
        };

        await addDoc(collection(db, "post_comments"), {
          ...commentData,
          createdAt: serverTimestamp(),
        });

        setNotification({
          type: "success",
          message: "Comments saved successfully!",
        });
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
      setNotification({
        type: "error",
        message: "Failed to save comments. Please try again.",
      });

      if (onCommentSaved) {
        onCommentSaved(false, "Failed to save comments");
      }
    } finally {
      setLoading(false);

      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this comment set?")) {
      setIsDeleting(true);
      try {
        await deleteDoc(doc(db, "post_comments", id));
        setNotification({
          type: "success",
          message: "Comment set deleted successfully!",
        });
      } catch (error) {
        console.error("Error deleting comment:", error);
        setNotification({
          type: "error",
          message: "Failed to delete comment set.",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteSingleComment = async (
    postId: string,
    commentIndex: number
  ) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      setIsDeleting(true);
      try {
        const post = savedComments.find((item) => item.id === postId);
        if (!post) return;

        const updatedComments = [...post.comments];
        updatedComments.splice(commentIndex, 1);

        await updateDoc(doc(db, "post_comments", postId), {
          comments: updatedComments,
          commentCount: post.commentCount > 0 ? post.commentCount - 1 : 0,
          updatedAt: serverTimestamp(),
        });

        setNotification({
          type: "success",
          message: "Comment deleted successfully!",
        });

        if (updatedComments.length === 0) {
          setExpandedRow(null);
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
        setNotification({
          type: "error",
          message: "Failed to delete comment.",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

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

  const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="space-y-8">
      <div className="bg-white shadow sm:rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Manage Comments
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Post Link */}
          <div>
            <label
              htmlFor="post-link"
              className="block text-sm font-medium text-gray-700"
            >
              Facebook Post Link
            </label>
            <input
              type="url"
              id="post-link"
              name="post-link"
              value={postLink}
              onChange={(e) => setPostLink(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="https://www.facebook.com/share/p/ABC123..."
              required
            />
          </div>

          {/* Comment Input */}
          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700"
            >
              Add Comments
            </label>
            <div className="mt-1 flex">
              <input
                type="text"
                id="comment"
                name="comment"
                value={currentComment}
                onChange={(e) => setCurrentComment(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter a comment..."
              />
              <button
                type="button"
                onClick={handleAddComment}
                className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add
              </button>
            </div>
          </div>

          {/* Comments List */}
          {comments.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-2">
                Comments ({comments.length}):
              </p>
              <ul className="space-y-1">
                {comments.map((comment, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded"
                  >
                    <span className="truncate max-w-lg">{comment}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveComment(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Comment Count */}
          <div>
            <label
              htmlFor="comment-count"
              className="block text-sm font-medium text-gray-700"
            >
              Comment Count
            </label>
            <input
              type="number"
              id="comment-count"
              name="comment-count"
              min="1"
              value={commentCount}
              onChange={(e) => setCommentCount(parseInt(e.target.value) || 1)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              How many times to post comments
            </p>
          </div>

          {/* Notification */}
          {notification && (
            <div
              className={`mt-2 p-2 rounded ${
                notification.type === "error"
                  ? "bg-red-100 text-red-700"
                  : notification.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {notification.message}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !postLink || comments.length === 0}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                loading || !postLink || comments.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              }`}
            >
              {loading ? "Saving..." : "Save Comments"}
            </button>
          </div>
        </form>
      </div>

      {/* Saved Comments Table */}
      <div className="bg-white shadow sm:rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Saved Comments</h3>

          {/* Search Box */}
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loadingComments ? (
          <div className="text-center py-4">
            <p className="text-gray-500">Loading saved comments...</p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">
              {searchTerm
                ? "No matching comments found."
                : "No comments saved yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Post Link
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Comments
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("commentCount")}
                    >
                      <div className="flex items-center">
                        Count
                        {sortField === "commentCount" && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("createdAt")}
                    >
                      <div className="flex items-center">
                        Created
                        {sortField === "createdAt" && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredComments.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr
                        className={expandedRow === item.id ? "bg-gray-50" : ""}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <a
                            href={item.postLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {truncateText(item.postLink, 40)}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <button
                            onClick={() =>
                              setExpandedRow(
                                expandedRow === item.id ? null : item.id
                              )
                            }
                            className="text-blue-600 hover:text-blue-800 focus:outline-none"
                          >
                            {expandedRow === item.id ? "Hide" : "View"}{" "}
                            {item.comments.length} comments
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.commentCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleDeleteComment(item.id)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-800 focus:outline-none mr-3"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      {expandedRow === item.id && (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 bg-gray-50">
                            <div className="max-h-60 overflow-y-auto p-3 border border-gray-200 rounded">
                              <h4 className="font-medium text-gray-700 mb-2">
                                All Comments:
                              </h4>
                              {item.comments.map((comment, idx) => (
                                <div
                                  key={idx}
                                  className="mb-2 pb-2 border-b border-gray-100 last:border-0"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start">
                                      <span className="text-gray-400 mr-2">
                                        {idx + 1}.
                                      </span>
                                      <p className="text-gray-700">{comment}</p>
                                    </div>
                                    <button
                                      onClick={() =>
                                        handleDeleteSingleComment(item.id, idx)
                                      }
                                      disabled={isDeleting}
                                      className="text-red-500 hover:text-red-700 focus:outline-none text-sm"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${
                      currentPage === 1
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${
                      currentPage === totalPages
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalItems)}
                      </span>{" "}
                      of <span className="font-medium">{totalItems}</span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                          currentPage === 1
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      {Array.from({ length: Math.min(totalPages, 5) }).map(
                        (_, idx) => {
                          let pageNumber = idx + 1;

                          // If more than 5 pages and current page is near the end
                          if (totalPages > 5 && currentPage > 3) {
                            pageNumber = Math.min(
                              currentPage - 2 + idx,
                              totalPages
                            );
                            if (idx === 0 && pageNumber > 1) {
                              pageNumber = 1; // Always show first page
                            } else if (idx === 4 && pageNumber < totalPages) {
                              pageNumber = totalPages; // Always show last page
                            }
                          }

                          return (
                            <button
                              key={pageNumber}
                              onClick={() => handlePageChange(pageNumber)}
                              aria-current={
                                currentPage === pageNumber ? "page" : undefined
                              }
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                currentPage === pageNumber
                                  ? "z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                  : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        }
                      )}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                          currentPage === totalPages
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
