"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/services/auth";
import { getDashboardStats } from "@/lib/services/statistics";
import { getUserPages } from "@/lib/services/facebook/pages";
import { ScheduledPostsProcessor } from "@/components/scheduled-posts-processor";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { FeatureCards } from "@/components/dashboard/feature-cards";
import { DashboardHeader } from "@/components/dashboard/header";
import { useMemo } from "react";

export default function DashboardPage() {
  const router = useRouter();

  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const user = getCurrentUser();
      if (!user) {
        toast.error("You must be logged in");
        router.push("/login");
        return null;
      }

      try {
        const [pagesData, statsData] = await Promise.all([
          getUserPages(user.email),
          getDashboardStats(),
        ]);

        statsData.activePages = {
          count: pagesData.length,
          monthlyChange: statsData.activePages.monthlyChange,
        };

        return {
          pages: pagesData,
          stats: statsData,
        };
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
        return null;
      }
    },
    staleTime: 30000,
    refetchInterval: 30000,
    retry: 2,
  });

  const statsData = useMemo(() => {
    if (!dashboardData?.stats) return [];

    return [
      {
        label: "Active Pages",
        value: dashboardData.stats.activePages.count.toString(),
        badge: {
          text: `${
            dashboardData.stats.activePages.monthlyChange > 0 ? "+" : ""
          }${dashboardData.stats.activePages.monthlyChange} this month`,
          color: "green",
        },
        pages: dashboardData.pages,
      },
      {
        label: "This Month Usage",
        value: dashboardData.stats.monthlyUsage.searches.toString(),
        subValue: "searches",
        badge: {
          text: `${dashboardData.stats.monthlyUsage.comments} comments placed`,
          color: "emerald",
        },
      },
      {
        label: "Posts Distributed",
        value: dashboardData.stats.postsDistributed.total.toString(),
        badge: {
          text: "Across all pages",
          color: "green",
        },
      },
      {
        label: "Current Bill",
        value: dashboardData.stats.currentBill.amount.toString(),
        prefix: "$",
        badge: {
          text: "Bills monthly",
          color: "green",
        },
      },
    ];
  }, [dashboardData]);

  if (error) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-semibold text-red-600">
          Failed to load dashboard
        </h2>
        <p className="text-muted-foreground">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* <ErrorBoundary fallback={<div>Something went wrong</div>}> */}
      <ScheduledPostsProcessor />
      <DashboardHeader />
      {statsData ? null : (
        <StatsCards isLoading={isLoading} stats={statsData} />
      )}
      <FeatureCards pagesCount={dashboardData?.pages?.length || 0} />
      {/* </ErrorBoundary> */}
    </div>
  );
}
