"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RiskBadge from "@/components/chat/RiskBadge";
import { getSentimentColor, getSentimentLabel, formatTime } from "@/lib/utils";
import type { AnalysisResult, RiskLabel } from "@/types";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Activity,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HistoryItem extends AnalysisResult {
  id: number;
  created_at: string;
}

function generateMockHistory(): HistoryItem[] {
  const emotions = ["sadness", "joy", "fear", "neutral", "anger", "surprise"];
  return Array.from({ length: 15 }, (_, i) => {
    const risk = Math.random();
    const riskLabel: RiskLabel = risk >= 0.65 ? "high" : risk >= 0.35 ? "medium" : "low";
    const sentiment = -0.6 + Math.random() * 1.2;
    return {
      id: i + 1,
      sentiment_score: parseFloat(sentiment.toFixed(3)),
      risk_score: parseFloat(risk.toFixed(3)),
      risk_label: riskLabel,
      top_keywords: ["feeling", "today", "stress", "work", "sleep", "tired", "hopeful"]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3 + Math.floor(Math.random() * 3)),
      confidence: parseFloat((0.55 + Math.random() * 0.45).toFixed(3)),
      emotion_label: emotions[Math.floor(Math.random() * emotions.length)],
      created_at: new Date(Date.now() - i * 1000 * 60 * 60 * 6).toISOString(),
    };
  });
}

type FilterType = "all" | "low" | "medium" | "high";

export default function AnalysisPage() {
  const router = useRouter();
  const { isAuthenticated } = useUserStore();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setHistory(generateMockHistory());
    } catch {
      setError("Failed to load analysis history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchHistory();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const filtered = filter === "all" ? history : history.filter((h) => h.risk_label === filter);

  const summary = {
    total: history.length,
    high: history.filter((h) => h.risk_label === "high").length,
    medium: history.filter((h) => h.risk_label === "medium").length,
    low: history.filter((h) => h.risk_label === "low").length,
    avgRisk: history.length
      ? (history.reduce((a, b) => a + b.risk_score, 0) / history.length).toFixed(2)
      : "—",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-teal-600" />
            Analysis History
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sentiment and risk analyses from your recent conversations.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchHistory}
          disabled={loading}
          className="gap-2 shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary strip */}
      {!loading && !error && history.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Analyses", value: summary.total, color: "text-gray-800" },
            { label: "High Risk", value: summary.high, color: "text-red-600" },
            { label: "Medium Risk", value: summary.medium, color: "text-amber-600" },
            { label: "Low Risk", value: summary.low, color: "text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-3 text-center shadow-sm">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter buttons */}
      {!loading && !error && history.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-gray-400 shrink-0" />
          {(["all", "low", "medium", "high"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize ${
                filter === f
                  ? f === "high"
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : f === "medium"
                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                    : f === "low"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-teal-100 text-teal-700 border border-teal-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? `All (${summary.total})` : `${f} (${summary[f]})`}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <p className="text-sm text-gray-500">Loading analysis history…</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm text-gray-500">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchHistory} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 space-y-2">
          <Activity className="h-10 w-10 mx-auto opacity-30" />
          <p className="text-sm">
            {filter === "all"
              ? "No analysis data yet. Start chatting to see your history here."
              : `No ${filter}-risk entries found.`}
          </p>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="text-xs text-teal-600 hover:underline"
            >
              Show all entries
            </button>
          )}
        </div>
      )}

      {/* History items */}
      {!loading && !error && filtered.map((item) => (
        <Card key={item.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2 flex-wrap">
            <RiskBadge label={item.risk_label} score={item.risk_score} />
            <div className="flex items-center gap-2">
              {item.emotion_label && (
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {item.emotion_label}
                </Badge>
              )}
              <span className="text-xs text-gray-400">{formatTime(item.created_at)}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Metrics grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
                <p className="text-[10px] text-gray-400 mb-0.5">Sentiment</p>
                <p className={`text-sm font-semibold ${getSentimentColor(item.sentiment_score)}`}>
                  {getSentimentLabel(item.sentiment_score)}
                </p>
                <p className="text-[10px] text-gray-400">{item.sentiment_score.toFixed(3)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
                <p className="text-[10px] text-gray-400 mb-0.5">Risk Score</p>
                <p className="text-sm font-semibold text-gray-800">
                  {(item.risk_score * 100).toFixed(0)}%
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
                <p className="text-[10px] text-gray-400 mb-0.5">Confidence</p>
                <p className="text-sm font-semibold text-gray-800">
                  {(item.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Keywords */}
            {item.top_keywords.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-gray-400 mr-0.5">Keywords:</span>
                {item.top_keywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded bg-gray-50 border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Ethical disclaimer */}
      {!loading && history.length > 0 && (
        <p className="text-center text-xs text-gray-400 pb-4">
          ⚠️ These analyses are non-clinical indicators only. Do not use as a basis for self-diagnosis.
        </p>
      )}
    </div>
  );
}
