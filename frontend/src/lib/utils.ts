import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getRiskColor(label: string | null): string {
  switch (label) {
    case "low":
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "medium":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "high":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function getSentimentLabel(score: number): string {
  if (score > 0.05) return "Positive";
  if (score < -0.05) return "Negative";
  return "Neutral";
}

export function getSentimentColor(score: number): string {
  if (score > 0.05) return "text-emerald-600";
  if (score < -0.05) return "text-red-600";
  return "text-gray-500";
}
