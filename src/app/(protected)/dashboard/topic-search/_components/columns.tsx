"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  ArrowUpDown,
  Link as LinkIcon,
  Copy,
  Facebook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import type { Topic } from "@/lib/services/apify/types";
import { toast } from "sonner";
import Image from "next/image";

/**
 * Table column definitions for the Topic Search results
 */
export const getColumns = (): ColumnDef<Topic>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "text",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Content
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const text = row.getValue("text") as string;
      return (
        <div className="max-w-[500px] truncate text-xs">
          {text
            ? text.length > 40
              ? text.slice(0, 40) + "..."
              : text
            : "No content available"}
        </div>
      );
    },
  },
  {
    accessorKey: "pageName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Author
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const pageName = row.getValue("pageName") as string;
      const pageUrl = row.original.pageUrl;
      const pageAvatar = row.original.pageAvatar;

      return (
        <div className="flex items-center space-x-2">
          {pageAvatar && (
            <Image
              src={pageAvatar}
              alt={pageName}
              className="w-6 h-6 rounded-full"
              width={24}
              height={24}
            />
          )}
          <span className="text-xs">
            {pageUrl ? (
              <a
                href={pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {pageName || "Unknown"}
              </a>
            ) : (
              pageName || "Unknown"
            )}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("date") as string;
      return (
        <div className="text-xs">
          {date ? new Date(date).toLocaleString() : "Invalid Date"}
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const dateA = new Date(rowA.getValue("date") as string).getTime();
      const dateB = new Date(rowB.getValue("date") as string).getTime();
      return dateA > dateB ? 1 : dateA < dateB ? -1 : 0;
    },
  },
  {
    id: "engagement",
    header: "Engagement",
    cell: ({ row }) => {
      const likes = row.original.likes || 0;
      const comments = row.original.comments || 0;
      const shares = row.original.shares || 0;
      const views = row.original.viewCount || 0;
      const plays = row.original.playCount || 0;

      const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
      };

      return (
        <div className="flex items-center space-x-4 text-xs">
          <span title="Likes">👍 {formatNumber(likes)}</span>
          <span title="Comments">💬 {formatNumber(comments)}</span>
          <span title="Shares">↗️ {formatNumber(shares)}</span>
          {(views > 0 || plays > 0) && (
            <span title="Views">👁️ {formatNumber(Math.max(views, plays))}</span>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const topic = row.original;

      const handleCopyUrl = async () => {
        if (topic.url) {
          try {
            await navigator.clipboard.writeText(topic.url);
            toast.success("URL copied to clipboard");
          } catch {
            toast.error("Failed to copy URL");
          }
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-7 w-7 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={handleCopyUrl}
              disabled={!topic.url}
              className="flex items-center"
            >
              <Copy className="mr-2 h-3 w-3" />
              Copy URL
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => window.open(topic.url, "_blank")}
              disabled={!topic.url}
              className="flex items-center"
            >
              <LinkIcon className="mr-2 h-3 w-3" />
              Open Link
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => window.open(topic.pageUrl, "_blank")}
              disabled={!topic.pageUrl}
              className="flex items-center"
            >
              <Facebook className="mr-2 h-3 w-3" />
              View Page
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
