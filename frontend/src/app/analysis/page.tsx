"use client";

import { useEffect, useState } from "react";
import { analysisApi } from "@/lib/api";
import type { AnalysisHistoryItem, AnalysisResult, SessionAnalysisResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const riskTone: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

export default function AnalysisPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [sessionSummary, setSessionSummary] = useState<SessionAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    try {
      const items = await analysisApi.getHistory(20);
      setHistory(items);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleAnalyze = async () => {
    setError("");
    if (!text.trim()) {
      setError("Enter text to analyze.");
      return;
    }

    setLoading(true);
    try {
      const res = await analysisApi.analyze(text.trim());
      setResult(res);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze text.");
    } finally {
      setLoading(false);
    }
  };

  const handleSessionSummary = async () => {
    setError("");
    if (!sessionId.trim()) {
      setError("Enter a session id.");
      return;
    }

    setLoading(true);
    try {
      const res = await analysisApi.getSessionAnalysis(Number(sessionId));
      setSessionSummary(res);
    } catch (err) {
      setSessionSummary(null);
      setError(err instanceof Error ? err.message : "Failed to load session summary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Text Analysis</h1>
        <p className="text-sm text-gray-500 mt-1">
          Run manual NLP analysis and review your recent analysis history.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analyze New Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Describe how you are feeling..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
          />
          <Button onClick={handleAnalyze} disabled={loading}>
            Analyze
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge className={riskTone[result.risk_label] ?? ""}>{result.risk_label}</Badge>
              <span>Risk: {(result.risk_score * 100).toFixed(0)}%</span>
              <span>Sentiment: {result.sentiment_score.toFixed(2)}</span>
            </div>
            <p>Confidence: {(result.confidence * 100).toFixed(0)}%</p>
            <p>Keywords: {result.top_keywords.join(", ") || "None"}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Session ID"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              type="number"
            />
            <Button variant="outline" onClick={handleSessionSummary} disabled={loading}>
              Load
            </Button>
          </div>
          {sessionSummary && (
            <div className="text-sm space-y-1 text-gray-700">
              <p>Total messages: {sessionSummary.total_messages}</p>
              <p>Avg sentiment: {sessionSummary.avg_sentiment.toFixed(2)}</p>
              <p>Avg risk: {(sessionSummary.avg_risk_score * 100).toFixed(0)}%</p>
              <p>Dominant risk: {sessionSummary.dominant_risk_label}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Analysis History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500">No history yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                  <p className="text-gray-700 line-clamp-2">{item.content}</p>
                  <div className="mt-1 text-xs text-gray-500 flex items-center gap-3">
                    <span>Risk: {item.risk_label ?? "n/a"}</span>
                    <span>Score: {item.depression_risk_score?.toFixed(2) ?? "n/a"}</span>
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
