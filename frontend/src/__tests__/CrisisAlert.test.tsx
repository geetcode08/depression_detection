import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CrisisAlert from "@/components/shared/CrisisAlert";

describe("CrisisAlert", () => {
  it("does not render when crisis_alert is false", () => {
    render(<CrisisAlert isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText(/iCall/i)).not.toBeInTheDocument();
  });

  it("shows both helpline numbers when open", () => {
    render(<CrisisAlert isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/9152987821/)).toBeInTheDocument();
    expect(screen.getByText(/1860-2662-345/)).toBeInTheDocument();
  });

  it("calls onClose when dismiss button clicked", () => {
    const onClose = vi.fn();
    render(<CrisisAlert isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /continue chatting/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
