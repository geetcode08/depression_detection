"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MoodTrendData } from "@/types";

interface MoodLineChartProps {
  data: MoodTrendData | null;
}

export default function MoodLineChart({ data }: MoodLineChartProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mood & Risk Trend (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Loading mood trend...</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.dates.map((date, i) => ({
    date: date.slice(5), // MM-DD
    sentiment: data.sentiment_scores[i],
    risk: data.risk_scores[i],
  }));

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base">Mood & Risk Trend (30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full min-w-0 min-h-[240px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                domain={[-1, 1]}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
                tickFormatter={(v: number) => v.toFixed(1)}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "12px",
                }}
                formatter={(value, name) => [
                  typeof value === "number" ? value.toFixed(3) : String(value),
                  name === "sentiment" ? "Sentiment" : "Risk Score",
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px" }}
                formatter={(value: string) =>
                  value === "sentiment" ? "Sentiment Score" : "Risk Score"
                }
              />
              <Line
                type="monotone"
                dataKey="sentiment"
                stroke="#0d9488"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="risk"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
