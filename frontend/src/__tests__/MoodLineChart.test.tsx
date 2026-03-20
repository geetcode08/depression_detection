import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MoodLineChart from "@/components/dashboard/MoodLineChart";
import type { MoodTrendData } from "@/types";

// Recharts uses ResizeObserver which isn't available in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 500, height: 300 }}>
        {children}
      </div>
    ),
  };
});

const mockData: MoodTrendData = {
  dates: ["2024-01-01", "2024-01-02", "2024-01-03"],
  sentiment_scores: [0.2, -0.1, 0.4],
  risk_scores: [0.3, 0.5, 0.2],
};

describe("MoodLineChart", () => {
  it("renders the chart container", () => {
    render(<MoodLineChart data={mockData} />);
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("renders the card title", () => {
    render(<MoodLineChart data={mockData} />);
    expect(screen.getByText(/Mood & Risk Trend/i)).toBeInTheDocument();
  });
});
