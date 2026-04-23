"use client";

import type { DashboardTier } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalysisProgressProps {
  currentTier: DashboardTier;
  wordsUntilNext: number | null;
  totalWords: number;
}

function getTierProgress(totalWords: number, tier: DashboardTier): number {
  const ranges: Record<DashboardTier, [number, number]> = {
    no_data: [0, 50],
    sentiment_active: [50, 150],
    emotions_active: [150, 300],
    screening_active: [300, 600],
    full_active: [600, 1500],
    longitudinal: [1500, 4000],
    behavioral: [4000, 4000],
  };
  const [start, end] = ranges[tier] ?? [0, 4000];
  if (end === start) return 100;
  return Math.min(100, Math.max(5, ((totalWords - start) / (end - start)) * 100));
}

const tierMessages: Record<
  DashboardTier,
  {
    label: string;
    message: string;
    cta: ((wordsUntilNext: number | null, totalWords: number) => string | null) | null;
  }
> = {
  no_data: {
    label: "Just getting started",
    message: "Share a little more and Aura will begin to understand your emotional patterns.",
    cta: (wordsUntilNext) => (wordsUntilNext ? `${wordsUntilNext} words until your first insight` : null),
  },
  sentiment_active: {
    label: "Feeling the vibe",
    message: "Aura is picking up on the general tone of your conversations.",
    cta: (wordsUntilNext) =>
      wordsUntilNext ? `${wordsUntilNext} words to unlock emotion tracking` : null,
  },
  emotions_active: {
    label: "Emotions coming into focus",
    message: "Your emotional landscape is starting to become clearer.",
    cta: (wordsUntilNext) =>
      wordsUntilNext ? `${wordsUntilNext} words to unlock preliminary wellbeing screening` : null,
  },
  screening_active: {
    label: "Wellbeing picture forming",
    message: "Aura has a solid sense of your emotional patterns now.",
    cta: (wordsUntilNext) => (wordsUntilNext ? `${wordsUntilNext} words to unlock full assessment` : null),
  },
  full_active: {
    label: "Full picture available",
    message: "Your analysis is complete. Keep talking to track changes over time.",
    cta: (wordsUntilNext) =>
      wordsUntilNext ? `${wordsUntilNext} more words to unlock pattern tracking` : null,
  },
  longitudinal: {
    label: "Tracking your journey",
    message: "Aura can now see how your wellbeing shifts over time.",
    cta: null,
  },
  behavioral: {
    label: "Deep insights unlocked",
    message: "Full behavioral analytics are now available.",
    cta: null,
  },
};

export default function AnalysisProgress({ currentTier, wordsUntilNext, totalWords }: AnalysisProgressProps) {
  const copy = tierMessages[currentTier];
  const cta = copy.cta ? copy.cta(wordsUntilNext, totalWords) : null;

  return (
    <Card className="overflow-hidden border-teal-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{copy.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-2 w-full rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-lime-400 transition-all duration-500"
            style={{ width: `${getTierProgress(totalWords, currentTier)}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-slate-600">{copy.message}</p>
        {cta && <p className="mt-2 text-xs font-medium text-teal-700">{cta}</p>}
      </CardContent>
    </Card>
  );
}
