"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { dashboardApi, recommendApi } from "@/lib/api";
import type {
  DashboardStats,
  MoodTrendData,
  SentimentDistribution,
  BehavioralPatterns,
  Recommendation,
} from "@/types";
import StatCard from "@/components/dashboard/StatCard";
import MoodLineChart from "@/components/dashboard/MoodLineChart";
import SentimentPieChart from "@/components/dashboard/SentimentPieChart";
import RiskTrendChart from "@/components/dashboard/RiskTrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  TrendingDown,
  ShieldAlert,
  Flame,
  Loader2,
  Lightbulb,
  Activity,
  BookOpen,
  Users,
  Phone,
  Wind,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const categoryIcons: Record<string, typeof Activity> = {
  activity: Activity,
  journaling: BookOpen,
  social: Users,
  professional_help: Phone,
  breathing: Wind,
};

const categoryColors: Record<string, string> = {
  activity: "bg-blue-50 text-blue-600",
  journaling: "bg-purple-50 text-purple-600",
  social: "bg-green-50 text-green-600",
  professional_help: "bg-red-50 text-red-600",
  breathing: "bg-teal-50 text-teal-600",
};

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, consentGiven } = useUserStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [moodTrend, setMoodTrend] = useState<MoodTrendData | null>(null);
  const [sentimentDist, setSentimentDist] = useState<SentimentDistribution | null>(null);
  const [behavior, setBehavior] = useState<BehavioralPatterns | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guard
  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
    else if (!consentGiven) router.push("/");
  }, [isAuthenticated, consentGiven, router]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
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
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && consentGiven) fetchAll();
  }, [isAuthenticated, consentGiven]);

  if (!isAuthenticated || !consentGiven) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="text-sm text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-sm text-gray-600">{error}</p>
          <Button onClick={fetchAll} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wellness Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track your emotional patterns and well-being over time.
        </p>
      </div>

      {/* Stat Cards */}
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {moodTrend && <MoodLineChart data={moodTrend} />}
        {sentimentDist && <SentimentPieChart data={sentimentDist} />}
      </div>

      {/* Activity + Recommendations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {behavior && <RiskTrendChart data={behavior} />}

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Personalized Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No recommendations yet. Start chatting to get personalized suggestions.
              </p>
            )}
            {recommendations.map((rec, i) => {
              const Icon = categoryIcons[rec.category] ?? Activity;
              const colorClass = categoryColors[rec.category] ?? "bg-gray-50 text-gray-600";
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-medium text-gray-800">{rec.title}</p>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {rec.category.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{rec.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-xs text-amber-700">
        <strong>Reminder:</strong> This dashboard shows patterns from your conversations and is not a clinical assessment.
        All risk scores are indicative only. If you are in distress, please contact a mental health professional or call
        iCall at <strong>9152987821</strong>.
      </div>
    </div>
  );
}
