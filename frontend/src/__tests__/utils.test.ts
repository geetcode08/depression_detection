import { describe, it, expect } from "vitest";
import {
  getSentimentLabel,
  getSentimentColor,
  getRiskColor,
  formatDate,
  formatTime,
} from "@/lib/utils";

describe("getSentimentLabel", () => {
  it("returns Positive for score > 0.05", () => {
    expect(getSentimentLabel(0.5)).toBe("Positive");
    expect(getSentimentLabel(0.06)).toBe("Positive");
  });
  it("returns Negative for score < -0.05", () => {
    expect(getSentimentLabel(-0.5)).toBe("Negative");
    expect(getSentimentLabel(-0.06)).toBe("Negative");
  });
  it("returns Neutral for score between -0.05 and 0.05", () => {
    expect(getSentimentLabel(0)).toBe("Neutral");
    expect(getSentimentLabel(0.04)).toBe("Neutral");
    expect(getSentimentLabel(-0.04)).toBe("Neutral");
  });
});

describe("getSentimentColor", () => {
  it("returns emerald for positive", () => {
    expect(getSentimentColor(0.5)).toContain("emerald");
  });
  it("returns red for negative", () => {
    expect(getSentimentColor(-0.5)).toContain("red");
  });
  it("returns gray for neutral", () => {
    expect(getSentimentColor(0)).toContain("gray");
  });
});

describe("getRiskColor", () => {
  it("returns emerald classes for low risk", () => {
    expect(getRiskColor("low")).toContain("emerald");
  });
  it("returns amber classes for medium risk", () => {
    expect(getRiskColor("medium")).toContain("amber");
  });
  it("returns red classes for high risk", () => {
    expect(getRiskColor("high")).toContain("red");
  });
  it("returns gray classes for unknown", () => {
    expect(getRiskColor(null)).toContain("gray");
    expect(getRiskColor("unknown")).toContain("gray");
  });
});

describe("formatDate", () => {
  it("returns a formatted date string", () => {
    const result = formatDate("2024-01-15T00:00:00.000Z");
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/2024/);
  });
});

describe("formatTime", () => {
  it("returns a time string with AM/PM or colon", () => {
    const result = formatTime("2024-01-15T14:30:00.000Z");
    expect(result).toMatch(/:/);
  });
});
