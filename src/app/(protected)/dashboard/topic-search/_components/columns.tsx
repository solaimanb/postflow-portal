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
          {text || "No content available"}
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
          Page
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const pageName = row.getValue("pageName") as string;
      return (
        <div className="whitespace-nowrap text-xs">
          {pageName || "Unknown Page"}
        </div>
      );
    },
  },
  {
    accessorKey: "time",
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
      const date = row.getValue("time") as string;
      return (
        <div className="whitespace-nowrap text-xs">
          {new Date(date).toLocaleString()}
        </div>
      );
    },
  },
  {
    accessorKey: "likes",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Engagement
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const likes = row.getValue("likes") as number;
      const comments = row.original.comments as number;
      const shares = row.original.shares as number;

      const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
      };

      return (
        <div className="flex space-x-2 text-xs">
          <span title="Reactions" className="flex items-center">
            <span className="text-blue-600 mr-1">👍</span>
            {formatNumber(likes || 0)}
          </span>
          <span title="Comments" className="flex items-center">
            <span className="text-green-600 mr-1">💬</span>
            {formatNumber(comments || 0)}
          </span>
          <span title="Shares" className="flex items-center">
            <span className="text-orange-600 mr-1">↗️</span>
            {formatNumber(shares || 0)}
          </span>
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
