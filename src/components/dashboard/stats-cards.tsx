"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FacebookPage } from "@/lib/services/facebook/types";

interface StatData {
  label: string;
  value: string;
  prefix?: string;
  subValue?: string;
  badge: {
    text: string;
    color: string;
  };
  pages?: FacebookPage[];
}

interface StatsCardsProps {
  isLoading: boolean;
  stats: StatData[];
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-8 w-16 bg-muted rounded animate-pulse" />
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ stat }: { stat: StatData }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          <div className="flex items-baseline gap-0.5">
            {stat.prefix && <span className="text-base">{stat.prefix}</span>}
            <h2 className="text-4xl font-bold">{stat.value}</h2>
          </div>
          {stat.subValue && (
            <p className="text-xl font-medium">{stat.subValue}</p>
          )}
          <Badge
            variant="secondary"
            className={`text-${stat.badge.color}-500 bg-${stat.badge.color}-50`}
          >
            {stat.badge.text}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

const MemoizedStatCard = memo(StatCard);

export function StatsCards({ isLoading, stats }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, index) => (
            <LoadingSkeleton key={index} />
          ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <MemoizedStatCard key={index} stat={stat} />
      ))}
    </div>
  );
}
