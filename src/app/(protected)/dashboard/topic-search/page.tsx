"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import React from "react";

import { SearchHeader } from "./_components/search-header";
import { ResultsHeader } from "./_components/results-header";
import { EmptyState } from "./_components/empty-state";
import { ResultsSkeleton } from "./_components/results-skeleton";
import { TopicSearch } from "./_components/topic-search";
import { DataTable } from "./_components/data-table";
import { getColumns } from "./_components/columns";
import { TopicDialog } from "./_components/topic-dialog";

import { fetchTopics } from "@/lib/services/apify";
import type { TopicSearchParams, Topic } from "@/lib/services/apify/types";
import { downloadTopicsAsCSV } from "./_components/utils";

const QUERY_CONFIG = {
  gcTime: 1000 * 60 * 30, // 30 minutes
  staleTime: 1000 * 60 * 5, // 5 minutes
} as const;

type ErrorType = "API_KEY" | "SUBSCRIPTION" | "DEFAULT";

const ERROR_MESSAGES: Record<ErrorType, string> = {
  API_KEY:
    "API key configuration error. Please check your environment variables.",
  SUBSCRIPTION:
    "This feature requires a paid subscription. The free trial has expired.",
  DEFAULT: "Failed to search topics",
};

/**
 * Topic Search Page Component
 * Provides functionality to search and display Facebook topics
 */
export default function TopicSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedTopic, setSelectedTopic] = React.useState<Topic | null>(null);

  /**
   * Parse search parameters from URL
   */
  const currentSearchParams: TopicSearchParams | null = useMemo(() => {
    const keyword = searchParams.get("keyword");
    if (!keyword) return null;

    return {
      keyword,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      maxItems: searchParams.get("maxItems")
        ? parseInt(searchParams.get("maxItems")!)
        : undefined,
    };
  }, [searchParams]);

  /**
   * Topic search query with React Query
   */
  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["topics", currentSearchParams],
    queryFn: async () => {
      if (!currentSearchParams) return [];

      try {
        const result = await fetchTopics(currentSearchParams);
        handleSearchSuccess(result, currentSearchParams.keyword);
        return result;
      } catch (error) {
        handleSearchError(error);
        throw error;
      }
    },
    enabled: false, // Never auto-fetch
    ...QUERY_CONFIG,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  /**
   * Event Handlers
   */
  const handleSearch = useCallback(
    (params: TopicSearchParams) => {
      const searchQuery = new URLSearchParams();
      searchQuery.set("keyword", params.keyword);
      if (params.startDate) searchQuery.set("startDate", params.startDate);
      if (params.endDate) searchQuery.set("endDate", params.endDate);
      if (params.maxItems)
        searchQuery.set("maxItems", params.maxItems.toString());

      router.push(`?${searchQuery.toString()}`);
      queryClient.fetchQuery({
        queryKey: ["topics", params],
        queryFn: () => fetchTopics(params),
      });
    },
    [router, queryClient]
  );

  const handleClearSearch = useCallback(() => {
    router.push("");
    queryClient.removeQueries({ queryKey: ["topics"] });
  }, [router, queryClient]);

  const handleDownloadCSV = useCallback(() => {
    if (topics.length === 0) return;
    downloadTopicsAsCSV(topics);
  }, [topics]);

  /**
   * Helper functions for search results handling
   */
  const handleSearchSuccess = (result: Topic[], keyword: string) => {
    if (result.length === 0) {
      toast("No topics found", {
        description: "No topics found for the given search criteria.",
        icon: <Info className="h-4 w-4 text-foreground/70" />,
      });
    } else {
      toast("Topics found", {
        description: `Found ${result.length} topics for "${keyword}"`,
        icon: <CheckCircle className="h-4 w-4 text-green-500/80" />,
      });
    }
  };

  const handleSearchError = (error: unknown) => {
    console.error("Error searching topics:", error);
    let errorType: ErrorType = "DEFAULT";

    if (error instanceof Error) {
      if (error.message.includes("API key not found")) {
        errorType = "API_KEY";
      } else if (error.message.includes("requires a paid subscription")) {
        errorType = "SUBSCRIPTION";
      }
    }

    toast.error("Error", {
      description: ERROR_MESSAGES[errorType],
      icon: <AlertCircle className="h-4 w-4 text-destructive/80" />,
    });
  };

  /**
   * Render content based on state
   */
  const resultsContent = useMemo(() => {
    if (isLoading) {
      return <ResultsSkeleton />;
    }

    if (!currentSearchParams || topics.length === 0) {
      return <EmptyState />;
    }

    return (
      <CardContent className="p-0">
        <div className="overflow-x-auto w-full rounded-lg bg-background/40 backdrop-blur-[2px]">
          <DataTable
            columns={getColumns}
            data={topics}
            onDownloadCSV={handleDownloadCSV}
            onRowClick={setSelectedTopic}
          />
        </div>
        <TopicDialog
          topic={selectedTopic}
          open={!!selectedTopic}
          onOpenChange={(open) => !open && setSelectedTopic(null)}
        />
      </CardContent>
    );
  }, [
    isLoading,
    topics,
    currentSearchParams,
    handleDownloadCSV,
    selectedTopic,
  ]);

  return (
    <div className="h-full w-full space-y-6">
      {/* Search Form Card */}
      <Card className="border-0 shadow-sm bg-background/95 backdrop-blur-sm rounded-lg">
        <SearchHeader
          onClear={handleClearSearch}
          hasResults={topics.length > 0}
        />
        <CardContent>
          <TopicSearch
            onSearch={handleSearch}
            isLoading={isLoading}
            initialValues={currentSearchParams}
          />
        </CardContent>
      </Card>

      {/* Results Card */}
      <Card className="border-0 shadow-sm bg-background/95 backdrop-blur-sm rounded-lg">
        <ResultsHeader topicsCount={isLoading ? 0 : topics.length} />
        {resultsContent}
      </Card>
    </div>
  );
}
