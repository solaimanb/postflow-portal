"use client";

import { useState } from "react";
import { TopicSearchParams } from "../app/types";

interface TopicSearchProps {
  onSearch: (params: TopicSearchParams) => void;
  isLoading?: boolean;
}

export default function TopicSearch({
  onSearch,
  isLoading = false,
}: TopicSearchProps) {
  const [keyword, setKeyword] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!keyword || !fromDate || !toDate) return;

    onSearch({
      keyword,
      fromDate,
      toDate,
      startDate: new Date(fromDate).toISOString(),
      endDate: new Date(toDate).toISOString(),
    });
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-4">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="keyword"
            className="block text-sm font-medium text-gray-700"
          >
            Keyword
          </label>
          <input
            type="text"
            name="keyword"
            id="keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="e.g. Indoor plant"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="from"
              className="block text-sm font-medium text-gray-700"
            >
              From
            </label>
            <input
              type="datetime-local"
              name="from"
              id="from"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="to"
              className="block text-sm font-medium text-gray-700"
            >
              To
            </label>
            <input
              type="datetime-local"
              name="to"
              id="to"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
        <div>
          <button
            type="submit"
            disabled={isLoading || !keyword || !fromDate || !toDate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? "Searching..." : "Search Topics"}
          </button>
        </div>
      </form>
    </div>
  );
}
