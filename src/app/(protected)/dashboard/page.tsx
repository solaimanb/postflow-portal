"use client";

import { useEffect } from "react";
import { processScheduledPosts } from "@/lib/services/facebook/posts/schedule";
import { getCurrentUser } from "@/lib/services/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Target, FileEdit, MessageCircle, Settings } from "lucide-react";

const SCHEDULED_POST_CHECK_INTERVAL = 20000;

// Stats data
const statsData = [
  {
    label: "Active Pages",
    value: "24",
    badge: { text: "+3 this month", color: "green" },
  },
  {
    label: "This Month Usage",
    value: "67",
    subValue: "searches",
    badge: { text: "142 comments placed", color: "emerald" },
  },
  {
    label: "Posts Distributed",
    value: "189",
    badge: { text: "Across all pages", color: "green" },
  },
  {
    label: "Current Bill",
    value: "521",
    prefix: "$",
    badge: { text: "Bills monthly", color: "green" },
  },
];

// Feature cards data
const featureCardsData = [
  {
    title: "Topic Search",
    icon: Target,
    iconBg: "indigo",
    description:
      "Search and analyze Facebook topics across pages. Monitor brand mentions, competitor activities, trending discussions, and potential PR issues in real-time.",
    cost: { value: "$1.42", label: "Cost per search" },
    stats: { value: "67", label: "Searches this month" },
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
    stats: { value: "189", label: "Posts this month" },
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
    cost: { value: "$3.00", label: "Cost per comment" },
    stats: { value: "142", label: "Comments this month" },
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
    stats: { value: "24", label: "Connected pages" },
    features: [
      "Page authentication",
      "Connection management",
      "Access control",
      "Bulk configuration",
      "Status monitoring",
    ],
  },
];

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const checkScheduledPosts = async () => {
      const user = getCurrentUser();
      if (!user) {
        toast.error("You must be logged in to check scheduled posts");
        router.push("/login");
        return;
      }

      try {
        await processScheduledPosts(user.email);
      } catch (error) {
        console.error("Error checking scheduled posts:", error);
      }
    };

    // Initial check
    checkScheduledPosts();

    // Set up interval
    const checkInterval = setInterval(
      checkScheduledPosts,
      SCHEDULED_POST_CHECK_INTERVAL
    );

    return () => {
      clearInterval(checkInterval);
    };
  }, [router]);

  return (
    <div className="space-y-6">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl lg:text-3xl font-semibold">Welcome to FB Topics Portal</h1>
        <p className="text-muted-foreground">
          Advanced social media intelligence and management for enterprise
          teams. Monitor, influence, and distribute content across your Facebook
          presence.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <div className="flex items-baseline gap-0.5">
                  {stat.prefix && (
                    <span className="text-base">{stat.prefix}</span>
                  )}
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
        ))}
      </div>

      {/* Feature Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {featureCardsData.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className={`rounded-xl bg-${feature.iconBg}-100 p-3`}>
                      <Icon
                        className={`h-12 w-12 text-${feature.iconBg}-600`}
                      />
                    </div>
                    <CardTitle className="text-2xl font-bold">{feature.title}</CardTitle>
                  </div>

                  <CardDescription>{feature.description}</CardDescription>

                  <div className="space-y-4">
                    {/* Cost and Stats */}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {feature.cost.label}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`bg-${feature.iconBg}-100 text-${feature.iconBg}-600`}
                      >
                        {feature.cost.value}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {feature.stats.label}
                      </span>
                      <span className="font-medium">{feature.stats.value}</span>
                    </div>
                    <Separator />

                    {/* Features List */}
                    <div className="space-y-2">
                      {feature.features.map((item, i) => (
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
        })}
      </div>
    </div>
  );
}
