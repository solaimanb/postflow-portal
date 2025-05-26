"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";

import { searchTopics } from "@/lib/services/facebook";
import type { FacebookTopic, TopicSearchParams } from "@/types";
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
  const [topics, setTopics] = useState<FacebookTopic[]>([]);
  const [loading, setLoading] = useState(false);

  const handleError = useCallback((error: unknown) => {
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
    setTopics([]);
  }, []);

  const handleSearch = useCallback(
    async (params: TopicSearchParams) => {
      setLoading(true);
      try {
        const fetchedTopics = await searchTopics(params);
        setTopics(fetchedTopics);

        if (fetchedTopics.length === 0) {
          toast("No topics found", {
            description: "No topics found for the given search criteria.",
            icon: <Info className="h-4 w-4 text-foreground/70" />,
          });
        } else {
          toast("Topics found", {
            description: `Found ${fetchedTopics.length} topics for "${params.keyword}"`,
            icon: <CheckCircle className="h-4 w-4 text-green-500/80" />,
          });
        }
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    },
    [handleError]
  );

  const handleDownloadCSV = useCallback(() => {
    if (topics.length === 0) return;
    downloadTopicsAsCSV(topics);
  }, [topics]);

  const resultsContent = useMemo(() => {
    if (loading) {
      return <ResultsSkeleton />;
    }

    if (topics.length === 0) {
      return <EmptyState />;
    }

    return (
      <CardContent className="p-0">
        <div className="overflow-x-auto w-full rounded-lg bg-background/40 backdrop-blur-[2px]">
          <TopicTable topics={topics} onDownloadCSV={handleDownloadCSV} />
        </div>
      </CardContent>
    );
  }, [loading, topics, handleDownloadCSV]);

  return (
    <div className="h-full w-full space-y-6">
      <Card className="border-0 shadow-sm bg-background/95 backdrop-blur-sm rounded-lg">
        <SearchHeader />
        <CardContent>
          <TopicSearch onSearch={handleSearch} isLoading={loading} />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-background/95 backdrop-blur-sm rounded-lg">
        <ResultsHeader topicsCount={loading ? 5 : topics.length} />
        {resultsContent}
      </Card>
    </div>
  );
}
