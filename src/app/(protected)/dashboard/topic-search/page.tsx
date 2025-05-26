"use client";

import { useState } from "react";
import { searchTopics } from "@/lib/services/facebook";
import { FacebookTopic, TopicSearchParams } from "@/types";
import TopicSearch from "@/components/TopicSearch";
import TopicTable from "@/components/TopicTable";
import Notification from "@/components/Notification";

export default function TopicSearchPage() {
  const [topics, setTopics] = useState<FacebookTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const handleSearch = async (params: TopicSearchParams) => {
    setLoading(true);
    setTopics([]);
    try {
      console.log("Searching topics with params:", params);
      const fetchedTopics = await searchTopics(params);
      setTopics(fetchedTopics);

      if (fetchedTopics.length === 0) {
        setNotification({
          type: "info",
          message: "No topics found for the given search criteria.",
        });
      } else {
        setNotification({
          type: "success",
          message: `Found ${fetchedTopics.length} topics for "${params.keyword}"`,
        });
      }
    } catch (error) {
      console.error("Error searching topics:", error);
      let errorMessage = "Failed to search topics";
      let errorType: "error" | "info" = "error";

      if (error instanceof Error) {
        if (error.message.includes("API key not found")) {
          errorMessage =
            "API key configuration error. Please check your environment variables.";
        } else if (error.message.includes("requires a paid subscription")) {
          errorType = "info";
          errorMessage =
            error.message + " The free trial for this actor has expired.";
        } else {
          errorMessage = error.message;
        }
      }

      setNotification({
        type: errorType,
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle CSV export
  const handleDownloadCSV = () => {
    if (topics.length === 0) return;

    const escapeCSV = (field: string | number) => {
      const value = String(field);
      if (
        value.includes(",") ||
        value.includes('"') ||
        value.includes("\n") ||
        value.includes("\r")
      ) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const headers = [
      "Content",
      "Page",
      "Date",
      "Likes",
      "Comments",
      "Shares",
      "URL",
    ];
    const rows = topics.map((topic) => [
      escapeCSV(topic.text || topic.topic || ""),
      escapeCSV(topic.pageName || topic.relatedTopics?.[0] || "Unknown"),
      escapeCSV(new Date(topic.time || topic.date).toLocaleString()),
      escapeCSV(topic.likes || 0),
      escapeCSV(topic.comments || 0),
      escapeCSV(topic.shares || 0),
      escapeCSV(topic.url || ""),
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\r\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `facebook-topics-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <TopicSearch onSearch={handleSearch} isLoading={loading} />
      {topics.length > 0 && (
        <TopicTable topics={topics} onDownloadCSV={handleDownloadCSV} />
      )}
    </div>
  );
}
