"use client";

import React, { useState } from "react";
import { FacebookTopic } from "../types";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import Image from "next/image";

interface TopicTableProps {
  topics: FacebookTopic[];
  onDownloadCSV: () => void;
}

export default function TopicTable({ topics, onDownloadCSV }: TopicTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Format engagement numbers
  const formatNumber = (num: number | string) => {
    if (typeof num === "string" && num.includes("K")) {
      return num; // Already formatted (e.g. "2.4K")
    }
    const n = Number(num);
    if (isNaN(n)) return "0";
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  // Toggle row expansion
  const toggleRow = (id: string) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Results</h3>
        <button
          className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50"
          onClick={onDownloadCSV}
        >
          Download CSV
        </button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content</TableHead>
              <TableHead>Page</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.length > 0 ? (
              topics.map((topic) => (
                <React.Fragment key={topic.id}>
                  <TableRow
                    className={`cursor-pointer ${
                      expandedRow === topic.id ? "bg-muted" : ""
                    }`}
                    onClick={() => toggleRow(topic.id)}
                  >
                    <TableCell>
                      <div className="max-w-md">
                        <p className="truncate">{topic.text || topic.topic}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {topic.pageName || topic.relatedTopics?.[0] || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {formatDate(topic.time || topic.date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <span title="Reactions" className="flex items-center">
                          <span className="text-blue-600 mr-1">👍</span>
                          {formatNumber(topic.like || 0)}
                        </span>
                        <span title="Comments" className="flex items-center">
                          <span className="text-green-600 mr-1">💬</span>
                          {formatNumber(topic.comments || 0)}
                        </span>
                        <span title="Shares" className="flex items-center">
                          <span className="text-orange-600 mr-1">↗️</span>
                          {formatNumber(topic.shares || 0)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {expandedRow === topic.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        {topic.url && (
                          <a
                            href={topic.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRow === topic.id && (
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={5} className="p-4">
                        <div className="text-sm">
                          <p className="font-medium mb-2">Full Content:</p>
                          <p className="whitespace-pre-line">
                            {topic.text || topic.topic}
                          </p>

                          {/* Media Preview */}
                          {(topic.videoThumbnail || topic.imageUrl) && (
                            <div className="mt-3">
                              <p className="font-medium mb-2">Media:</p>
                              <div className="relative w-full max-w-md rounded-lg overflow-hidden">
                                <Image
                                  src={
                                    topic.videoThumbnail || topic.imageUrl || ""
                                  }
                                  alt="Post media"
                                  className="w-full h-auto object-cover rounded-lg"
                                />
                                {topic.videoUrl && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <span className="text-white text-4xl">
                                      ▶️
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Page/Author Info */}
                          {topic.pageName && (
                            <div className="mt-3">
                              <p className="font-medium mb-1">Posted by:</p>
                              <a
                                href={topic.pageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                {topic.pageName}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </div>
                          )}

                          {topic.keywords && topic.keywords.length > 0 && (
                            <div className="mt-3">
                              <p className="font-medium mb-1">Keywords:</p>
                              <div className="flex flex-wrap gap-1">
                                {topic.keywords.map((keyword, idx) => (
                                  <span
                                    key={`${topic.id}-keyword-${idx}`}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {topic.url && (
                            <div className="mt-3">
                              <a
                                href={topic.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                              >
                                <span className="mr-1">View on Facebook</span>
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No data available. Try searching for topics.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
