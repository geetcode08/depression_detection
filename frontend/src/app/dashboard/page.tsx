"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { dashboardApi, recommendApi } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import type {
  DashboardStats,
  DashboardTier,
  MoodTrendData,
  SentimentDistribution,
  BehavioralPatterns,
  Recommendation,
} from "@/types";
import StatCard from "@/components/dashboard/StatCard";
import MoodLineChart from "@/components/dashboard/MoodLineChart";
import SentimentPieChart from "@/components/dashboard/SentimentPieChart";
import RiskTrendChart from "@/components/dashboard/RiskTrendChart";
import AnalysisProgress from "@/components/dashboard/AnalysisProgress";
import LockedCard from "@/components/dashboard/LockedCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  TrendingDown,
  ShieldAlert,
  Flame,
  Lightbulb,
  Activity,
  BookOpen,
  Users,
  Phone,
  Wind,
} from "lucide-react";

const categoryIcons: Record<string, typeof Activity> = {
  activity: Activity,
  journaling: BookOpen,
  social: Users,
  professional_help: Phone,
  breathing: Wind,
};

const TIER_ORDER: DashboardTier[] = [
  "no_data",
  "sentiment_active",
  "emotions_active",
  "screening_active",
  "full_active",
  "longitudinal",
  "behavioral",
];

function tierAtLeast(current: DashboardTier, expected: DashboardTier): boolean {
  return TIER_ORDER.indexOf(current) >= TIER_ORDER.indexOf(expected);
}

function wordsUntilNextTier(words: number, tier: DashboardTier): number | null {
  if (tier === "no_data") return Math.max(0, 50 - words);
  if (tier === "sentiment_active") return Math.max(0, 150 - words);
  if (tier === "emotions_active") return Math.max(0, 300 - words);
  if (tier === "screening_active") return Math.max(0, 600 - words);
  if (tier === "full_active") return Math.max(0, 1500 - words);
  if (tier === "longitudinal") return Math.max(0, 4000 - words);
  return null;
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx}>
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="mx-auto max-w-3xl">
      <CardContent className="flex flex-col items-center py-14 text-center">
        <div className="mb-4 h-20 w-20 rounded-full bg-teal-100" />
        <h2 className="text-xl font-semibold text-gray-900">No data yet</h2>
        <p className="mt-2 max-w-lg text-sm text-gray-500">
          Start a conversation to see your mood trends here.
        </p>
        <Link href="/chat" className="mt-6">
          <Button>Go to Chat</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, consentGiven, hasHydratedSession } = useUserStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [moodTrend, setMoodTrend] = useState<MoodTrendData | null>(null);
  const [sentimentDist, setSentimentDist] = useState<SentimentDistribution | null>(null);
  const [behavior, setBehavior] = useState<BehavioralPatterns | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydratedSession) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login?next=%2Fdashboard");
      return;
    }

    if (!consentGiven) {
      router.replace("/consent?next=%2Fdashboard");
    }
  }, [consentGiven, hasHydratedSession, isAuthenticated, router]);

  useEffect(() => {
    if (!hasHydratedSession || !isAuthenticated || !consentGiven) {
      setLoading(false);
      return;
    }

    async function fetchAll() {
      try {
        const [s, m, sd, b] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getMoodTrend(30),
          dashboardApi.getSentimentDistribution(),
          dashboardApi.getBehavior(),
        ]);
        setStats(s);
        setMoodTrend(m);
        setSentimentDist(sd);
        setBehavior(b);

        const riskLabel =
          s.avg_risk_7d >= 0.65 ? "high" : s.avg_risk_7d >= 0.35 ? "medium" : "low";
        const recs = await recommendApi.get(riskLabel);
        setRecommendations(recs.recommendations);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [consentGiven, hasHydratedSession, isAuthenticated]);

  if (!hasHydratedSession) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated || !consentGiven) {
    return null;
  }

  const hasNoData = useMemo(() => {
    if (!stats) {
      return false;
    }
    return stats.dashboard_tier === "no_data" && stats.total_messages === 0;
  }, [moodTrend, stats]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (hasNoData) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <EmptyState />
      </div>
    );
  }

  const hasEnoughTrendData = Boolean(moodTrend && moodTrend.dates.length >= 2);
  const currentTier = stats?.dashboard_tier ?? "no_data";
  const wordsNeeded = wordsUntilNextTier(stats?.cumulative_words ?? 0, currentTier);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wellness Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track your emotional patterns and well-being over time.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Messages"
            value={stats.total_messages}
            icon={MessageSquare}
            subtitle="All time"
          />
          <StatCard
            title="Avg Sentiment (7d)"
            value={stats.avg_sentiment_7d.toFixed(2)}
            icon={TrendingDown}
            trend={stats.avg_sentiment_7d > 0 ? "up" : "down"}
            subtitle={stats.avg_sentiment_7d > 0 ? "Positive trend" : "Needs attention"}
          />
          <StatCard
            title="Avg Risk (7d)"
            value={(stats.avg_risk_7d * 100).toFixed(0) + "%"}
            icon={ShieldAlert}
            trend={stats.avg_risk_7d < 0.35 ? "up" : "down"}
            subtitle={
              stats.avg_risk_7d < 0.35
                ? "Looking good"
                : stats.avg_risk_7d < 0.65
                ? "Moderate"
                : "Elevated"
            }
          />
          <StatCard
            title="Active Streak"
            value={stats.current_streak_days + " days"}
            icon={Flame}
            subtitle="Keep going!"
            trend="up"
          />
        </div>
      )}

      {stats && (
        <AnalysisProgress
          currentTier={stats.dashboard_tier}
          wordsUntilNext={wordsNeeded}
          totalWords={stats.cumulative_words}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tierAtLeast(currentTier, "sentiment_active") && hasEnoughTrendData ? (
          moodTrend && <MoodLineChart data={moodTrend} />
        ) : (
          <LockedCard
            message="Start a conversation with Aura to unlock your wellbeing insights."
            wordsNeeded={Math.max(0, 50 - (stats?.cumulative_words ?? 0))}
          />
        )}

        {tierAtLeast(currentTier, "emotions_active") && sentimentDist ? (
          <SentimentPieChart data={sentimentDist} />
        ) : (
          <LockedCard
            message="Emotion patterns unlock after a bit more sharing."
            wordsNeeded={Math.max(0, 150 - (stats?.cumulative_words ?? 0))}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tierAtLeast(currentTier, "full_active") && behavior ? (
          <RiskTrendChart data={behavior} />
        ) : (
          <LockedCard
            message="Keep chatting to unlock deeper trend insights."
            wordsNeeded={Math.max(0, 600 - (stats?.cumulative_words ?? 0))}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Personalized Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-sm text-gray-500">Recommendations will appear as you use the app.</p>
            ) : (
              recommendations.map((rec, i) => {
                const Icon = categoryIcons[rec.category] ?? Activity;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50">
                      <Icon className="h-4 w-4 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-gray-800">{rec.title}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {rec.category.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">{rec.description}</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
