import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConsentModal from "@/components/shared/ConsentModal";

describe("ConsentModal", () => {
  it("renders the modal with consent text", () => {
    render(<ConsentModal onAccept={vi.fn()} />);
    expect(screen.getByText("Before We Begin")).toBeInTheDocument();
    expect(screen.getByText(/Not a Medical Tool/i)).toBeInTheDocument();
    expect(screen.getByText(/I Understand/i)).toBeInTheDocument();
  });

  it("calls onAccept when accept button is clicked", () => {
    const onAccept = vi.fn();
    render(<ConsentModal onAccept={onAccept} />);
    fireEvent.click(screen.getByText(/I Understand/i));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it("shows guest button when onGuest prop is provided", () => {
    const onGuest = vi.fn();
    render(<ConsentModal onAccept={vi.fn()} onGuest={onGuest} />);
    expect(screen.getByText(/Continue Anonymously/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Continue Anonymously/i));
    expect(onGuest).toHaveBeenCalledTimes(1);
  });

  it("does not show guest button when onGuest prop is not provided", () => {
    render(<ConsentModal onAccept={vi.fn()} />);
    expect(screen.queryByText(/Continue Anonymously/i)).not.toBeInTheDocument();
  });
});
