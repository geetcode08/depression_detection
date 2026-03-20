import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RiskBadge from "@/components/chat/RiskBadge";

describe("RiskBadge", () => {
  it("renders Low Risk label", () => {
    render(<RiskBadge label="low" />);
    expect(screen.getByText(/Low Risk/i)).toBeInTheDocument();
  });

  it("renders Medium Risk label", () => {
    render(<RiskBadge label="medium" />);
    expect(screen.getByText(/Medium Risk/i)).toBeInTheDocument();
  });

  it("renders High Risk label", () => {
    render(<RiskBadge label="high" />);
    expect(screen.getByText(/High Risk/i)).toBeInTheDocument();
  });

  it("renders score when provided", () => {
    render(<RiskBadge label="high" score={0.82} />);
    expect(screen.getByText(/82%/)).toBeInTheDocument();
  });

  it("does not render score when not provided", () => {
    render(<RiskBadge label="low" />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
