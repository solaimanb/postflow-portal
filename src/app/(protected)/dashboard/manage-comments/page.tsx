"use client";

import { useCallback } from "react";
import CommentManager from "@/components/CommentManager";

export default function ManageCommentsPage() {
  const handleCommentSaved = useCallback(
    (success: boolean, message: string) => {
      //  TODO: Implement comment saved logic & sonner notification
    },
    []
  );

  return <CommentManager onCommentSaved={handleCommentSaved} />;
}
