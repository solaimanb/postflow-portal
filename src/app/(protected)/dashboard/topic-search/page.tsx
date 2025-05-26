"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { searchTopics } from "@/lib/services/facebook";
import type { TopicSearchParams } from "@/types";
import TopicTable from "@/components/TopicTable";

import { SearchHeader } from "./_components/search-header";
import { ResultsHeader } from "./_components/results-header";
import { EmptyState } from "./_components/empty-state";
import { ResultsSkeleton } from "./_components/results-skeleton";
import { TopicSearch } from "./_components/topic-search";

import { downloadTopicsAsCSV } from "./_components/utils";

const ERROR_MESSAGES = {
  API_KEY:
    "API key configuration error. Please check your environment variables.",
  SUBSCRIPTION:
    "This feature requires a paid subscription. The free trial has expired.",
  DEFAULT: "Failed to search topics",
};

export default function TopicSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Parse search parameters from URL
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

  // Use React Query for data fetching and caching
  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["topics", currentSearchParams],
    queryFn: async () => {
      if (!currentSearchParams) return [];
      try {
        const result = await searchTopics(currentSearchParams);
        if (result.length === 0) {
          toast("No topics found", {
            description: "No topics found for the given search criteria.",
            icon: <Info className="h-4 w-4 text-foreground/70" />,
          });
        } else {
          toast("Topics found", {
            description: `Found ${result.length} topics for "${currentSearchParams.keyword}"`,
            icon: <CheckCircle className="h-4 w-4 text-green-500/80" />,
          });
        }
        return result;
      } catch (error) {
        console.error("Error searching topics:", error);
        let errorMessage = ERROR_MESSAGES.DEFAULT;

        if (error instanceof Error) {
          if (error.message.includes("API key not found")) {
            errorMessage = ERROR_MESSAGES.API_KEY;
          } else if (error.message.includes("requires a paid subscription")) {
            errorMessage = ERROR_MESSAGES.SUBSCRIPTION;
          } else {
            errorMessage = error.message;
          }
        }

        toast.error("Error", {
          description: errorMessage,
          icon: <AlertCircle className="h-4 w-4 text-destructive/80" />,
        });
        throw error;
      }
    },
    enabled: false, // Never auto-fetch
    gcTime: 1000 * 60 * 30, // 30 minutes
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

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
        queryFn: () => searchTopics(params),
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
          <TopicTable topics={topics} onDownloadCSV={handleDownloadCSV} />
        </div>
      </CardContent>
    );
  }, [isLoading, topics, currentSearchParams, handleDownloadCSV]);

  return (
    <div className="h-full w-full space-y-6">
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

      <Card className="border-0 shadow-sm bg-background/95 backdrop-blur-sm rounded-lg">
        <ResultsHeader topicsCount={isLoading ? 0 : topics.length} />
        {resultsContent}
      </Card>
    </div>
  );
}
