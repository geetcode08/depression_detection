import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MoodLineChart from "@/components/dashboard/MoodLineChart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: unknown }) => <div>{children as never}</div>,
  LineChart: ({ children }: { children: unknown }) => <div data-testid="line-chart">{children as never}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  CartesianGrid: () => <div />,
}));

describe("MoodLineChart", () => {
  it("renders without crashing with valid data", () => {
    const mockData = {
      dates: ["2024-01-01", "2024-01-02"],
      sentiment_scores: [0.3, -0.1],
      risk_scores: [0.2, 0.6],
    };

    render(<MoodLineChart data={mockData} />);
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("renders with empty data without crashing", () => {
    render(<MoodLineChart data={{ dates: [], sentiment_scores: [], risk_scores: [] }} />);
    expect(screen.queryByTestId("line-chart")).toBeInTheDocument();
  });

  it("renders loading state when data is null", () => {
    render(<MoodLineChart data={null} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
