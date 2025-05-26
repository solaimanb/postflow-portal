"use client";

import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { X, Download } from "lucide-react";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  onDownload?: () => void;
}

export function DataTableToolbar<TData>({
  table,
  onDownload,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter content..."
          value={(table.getColumn("text")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("text")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {onDownload && (
          <Button
            variant="outline"
            onClick={onDownload}
            className="h-8 px-2 lg:px-3"
          >
            Download
            <Download className="ml-2 h-4 w-4" />
          </Button>
        )}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
} 