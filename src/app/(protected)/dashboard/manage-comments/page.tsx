"use client";

import { useState, useCallback } from "react";
import CommentManager from "@/components/CommentManager";
import Notification from "@/components/Notification";

export default function ManageCommentsPage() {
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const handleCommentSaved = useCallback(
    (success: boolean, message: string) => {
      setNotification({
        type: success ? "success" : "error",
        message,
      });
    },
    []
  );

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Manage Comments</h1>
        <p className="text-muted-foreground">Manage and moderate comments across your Facebook pages.</p>
      </div>

      <CommentManager onCommentSaved={handleCommentSaved} />
    </div>
  );
} 