import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatCard from "@/components/dashboard/StatCard";
import { MessageSquare } from "lucide-react";

describe("StatCard", () => {
  it("renders title and value", () => {
    render(<StatCard title="Total Messages" value={42} icon={MessageSquare} />);
    expect(screen.getByText("Total Messages")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <StatCard
        title="Streak"
        value="5 days"
        icon={MessageSquare}
        subtitle="Keep going!"
      />
    );
    expect(screen.getByText("Keep going!")).toBeInTheDocument();
  });

  it("renders without subtitle when not provided", () => {
    const { container } = render(
      <StatCard title="Total" value={10} icon={MessageSquare} />
    );
    expect(container).toBeInTheDocument();
  });
});
