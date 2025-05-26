"use client";

import { useCallback } from "react";
import { AddCommentForm } from "./_components/add-comment-form";
import { CommentsTable } from "./_components/comments-table";
import { toast } from "sonner";

export default function ManageCommentsPage() {
  const handleCommentSaved = useCallback(
    (success: boolean, message: string) => {
      if (success) {
        toast.success(message);
      } else {
        toast.error(message);
      }
    },
    []
  );

  return (
    <div className="space-y-6">
      <AddCommentForm onCommentSaved={handleCommentSaved} />
      <CommentsTable />
    </div>
  );
}
