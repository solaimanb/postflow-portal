"use client";

import { memo } from "react";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Target, FileEdit, MessageCircle, Settings } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface FeatureData {
  title: string;
  icon: LucideIcon;
  iconBg: string;
  description: string;
  cost: {
    value: string;
    label: string;
  };
  stats?: {
    label: string;
    value: string;
  };
  features: string[];
}

interface FeatureCardsProps {
  pagesCount: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function FeatureCards({ pagesCount }: FeatureCardsProps) {
  const featureCardsData: FeatureData[] = [
    {
      title: "Topic Search",
      icon: Target,
      iconBg: "indigo",
      description:
        "Search and analyze Facebook topics across pages. Monitor brand mentions, competitor activities, trending discussions, and potential PR issues in real-time.",
      cost: { value: "৳ 1.42", label: "Cost per search" },
      //   stats: {
      //     label: "Searches this month",
      //     value: "142",
      //   },
      features: [
        "Real-time topic monitoring",
        "Historical data analysis",
        "Crisis prevention alerts",
        "Competitor intelligence",
        "Trend identification",
      ],
    },
    {
      title: "Create Post",
      icon: FileEdit,
      iconBg: "pink",
      description:
        "Create and schedule posts for your Facebook pages. Distribute the same content across multiple pages simultaneously for consistent brand messaging.",
      cost: { value: "FREE", label: "Cost" },
      features: [
        "Multi-page posting",
        "Content scheduling",
        "Brand consistency",
        "Time-saving automation",
        "Centralized management",
      ],
    },
    {
      title: "Manage Comments",
      icon: MessageCircle,
      iconBg: "blue",
      description:
        "Manage and moderate comments across your pages. Add unlimited strategic comments to shift conversations and boost positive engagement.",
      cost: { value: "৳ 3.00", label: "Cost per comment" },
      //   stats: {
      //     label: "Comments this month",
      //     value: "142",
      //   },
      features: [
        "Strategic comment placement",
        "Conversation influence",
        "Reputation management",
        "Engagement boosting",
        "Crisis response",
      ],
    },
    {
      title: "Page Setup",
      icon: Settings,
      iconBg: "emerald",
      description:
        "Configure and manage your Facebook page connections. Add, remove, and organize pages for streamlined social media management.",
      cost: { value: "FREE", label: "Cost" },
      // stats: {
      //   label: "Connected pages",
      //   value: pagesCount.toString(),
      // },
      features: [
        "Page authentication",
        "Connection management",
        "Access control",
        "Bulk configuration",
        "Status monitoring",
      ],
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {featureCardsData.map((feature, index) => (
        <MemoizedFeatureCard key={index} feature={feature} />
      ))}
    </div>
  );
}

interface FeatureCardProps {
  feature: FeatureData;
}

function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = feature.icon;

  const getBgColorClass = (color: string) => {
    switch (color) {
      case "indigo":
        return "bg-indigo-100 text-indigo-600";
      case "pink":
        return "bg-pink-100 text-pink-600";
      case "blue":
        return "bg-blue-100 text-blue-600";
      case "emerald":
        return "bg-emerald-100 text-emerald-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getBadgeColorClass = (color: string) => {
    switch (color) {
      case "indigo":
        return "bg-indigo-100 text-indigo-600";
      case "pink":
        return "bg-pink-100 text-pink-600";
      case "blue":
        return "bg-blue-100 text-blue-600";
      case "emerald":
        return "bg-emerald-100 text-emerald-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const iconColorClass = getBgColorClass(feature.iconBg);
  const badgeColorClass = getBadgeColorClass(feature.iconBg);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className={`rounded-xl p-3 ${iconColorClass}`}>
              <Icon className="h-12 w-12" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {feature.title}
            </CardTitle>
          </div>

          <CardDescription>{feature.description}</CardDescription>

          <div className="space-y-4">
            {/* Cost and Stats */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {feature.cost.label}
              </span>
              <Badge variant="secondary" className={badgeColorClass}>
                {feature.cost.value}
              </Badge>
            </div>

            {/* Additional Stats */}
            {feature.stats && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {feature.stats.label}
                </span>
                <span className="font-medium">{feature.stats.value}</span>
              </div>
            )}
            <Separator />

            {/* Features List */}
            <div className="space-y-2">
              {feature.features.map((item: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-500" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const MemoizedFeatureCard = memo(FeatureCard);
