import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CrisisAlert from "@/components/shared/CrisisAlert";

describe("CrisisAlert", () => {
  it("renders helpline numbers", () => {
    render(<CrisisAlert onDismiss={vi.fn()} />);
    expect(screen.getByText(/iCall/i)).toBeInTheDocument();
    expect(screen.getByText(/9152987821/)).toBeInTheDocument();
    expect(screen.getByText(/Vandrevala/i)).toBeInTheDocument();
    expect(screen.getByText(/1860-2662-345/)).toBeInTheDocument();
    expect(screen.getByText(/NIMHANS/i)).toBeInTheDocument();
  });

  it("calls onDismiss when close button is clicked", () => {
    const onDismiss = vi.fn();
    render(<CrisisAlert onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("calls onDismiss when continue chatting button is clicked", () => {
    const onDismiss = vi.fn();
    render(<CrisisAlert onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText(/continue chatting/i));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("renders the empathy headline", () => {
    render(<CrisisAlert onDismiss={vi.fn()} />);
    expect(screen.getByText(/We're Here For You/i)).toBeInTheDocument();
  });
});
