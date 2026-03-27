import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConsentModal from "@/components/shared/ConsentModal";

describe("ConsentModal", () => {
  it("does not render when isOpen is false", () => {
    render(<ConsentModal isOpen={false} onAccept={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders when isOpen is true", () => {
    render(<ConsentModal isOpen={true} onAccept={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("calls onAccept exactly once when accept button clicked", () => {
    const onAccept = vi.fn();
    render(<ConsentModal isOpen={true} onAccept={onAccept} />);
    fireEvent.click(screen.getByRole("button", { name: /i understand/i }));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });
});
