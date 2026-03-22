"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BehavioralPatterns } from "@/types";

interface RiskTrendChartProps {
  data: BehavioralPatterns;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function RiskTrendChart({ data }: RiskTrendChartProps) {
  const chartData = data.weekly_frequency.map((count, i) => ({
    day: DAY_LABELS[i],
    messages: count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weekly Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "12px",
                }}
                formatter={(value) => [`${value} messages`, "Messages"]}
              />
              <Bar
                dataKey="messages"
                fill="#0d9488"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Behavioral insights */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Late Night Days</p>
            <p className="text-lg font-semibold text-gray-800">
              {data.late_night_days}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Avg Msg Length</p>
            <p className="text-lg font-semibold text-gray-800">
              {data.avg_message_length.toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Peak Hour</p>
            <p className="text-lg font-semibold text-gray-800">
              {data.most_active_hour}:00
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
