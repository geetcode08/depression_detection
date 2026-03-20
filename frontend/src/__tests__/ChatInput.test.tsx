import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ChatInput from "@/components/chat/ChatInput";

describe("ChatInput", () => {
  it("renders the textarea and send button", () => {
    render(<ChatInput onSend={vi.fn()} isLoading={false} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByLabelText("Send message")).toBeInTheDocument();
  });

  it("calls onSend with trimmed text when Enter is pressed", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} isLoading={false} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "  Hello Aura  " } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onSend).toHaveBeenCalledWith("Hello Aura");
  });

  it("clears the input after sending", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} isLoading={false} />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(textarea.value).toBe("");
  });

  it("does NOT send on Shift+Enter", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} isLoading={false} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables input and button when isLoading is true", () => {
    render(<ChatInput onSend={vi.fn()} isLoading={true} />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByLabelText("Send message")).toBeDisabled();
  });

  it("does not call onSend for empty input", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} isLoading={false} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "   " } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onSend).not.toHaveBeenCalled();
  });
});
