"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FacebookTopic } from "@/types"
import { format } from "date-fns"

export const columns: ColumnDef<FacebookTopic>[] = [
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
      )
    },
  },
  {
    accessorKey: "text",
    header: "Content",
    cell: ({ row }) => {
      const text = row.getValue("text") as string
      return <div className="max-w-[500px] truncate">{text}</div>
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
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"))
      return format(date, "MM/dd/yyyy, h:mm a")
    },
  },
  {
    id: "engagement",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Engagement
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const likes = row.original.like || 0
      const comments = row.original.comments || 0
      const shares = row.original.shares || 0
      return (
        <div className="flex items-center gap-4">
          <div>👍 {likes}</div>
          <div>💬 {comments}</div>
          <div>↗️ {shares}</div>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const topic = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(topic.url || "")}
            >
              Copy URL
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.open(topic.url, "_blank")}>
              View Post
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(topic.pageUrl, "_blank")}>
              View Page
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 