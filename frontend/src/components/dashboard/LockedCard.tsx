"use client";

import Link from "next/link";

interface LockedCardProps {
  message: string;
  wordsNeeded?: number;
}

export default function LockedCard({ message, wordsNeeded }: LockedCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-2 text-sm font-semibold text-slate-700">Locked Insight</div>
      <p className="text-sm text-slate-600">{message}</p>
      {typeof wordsNeeded === "number" && wordsNeeded > 0 && (
        <span className="mt-2 block text-xs font-medium text-teal-700">~{wordsNeeded} words away</span>
      )}
      <Link href="/chat" className="mt-4 inline-block text-sm font-medium text-teal-700 hover:text-teal-800">
        {"Start talking with Aura ->"}
      </Link>
    </div>
  );
}
