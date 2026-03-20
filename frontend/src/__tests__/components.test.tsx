import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { getSentimentLabel, getRiskColor, formatTime } from "@/lib/utils";

// ─── utils.ts tests ────────────────────────────────────────────

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

describe("getRiskColor", () => {
  it("returns emerald classes for low", () => {
    expect(getRiskColor("low")).toContain("emerald");
  });
  it("returns amber classes for medium", () => {
    expect(getRiskColor("medium")).toContain("amber");
  });
  it("returns red classes for high", () => {
    expect(getRiskColor("high")).toContain("red");
  });
  it("returns gray classes for null", () => {
    expect(getRiskColor(null)).toContain("gray");
  });
});

describe("formatTime", () => {
  it("returns a time string from an ISO date", () => {
    const iso = "2024-06-01T14:30:00.000Z";
    const result = formatTime(iso);
    // Should contain digits and colon
    expect(result).toMatch(/\d+:\d+/);
  });
});

// ─── Mock component tests ───────────────────────────────────────

// ConsentModal
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));
vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardFooter: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
}));

import ConsentModal from "@/components/shared/ConsentModal";

describe("ConsentModal", () => {
  it("renders the modal", () => {
    render(<ConsentModal onAccept={() => {}} />);
    expect(screen.getByText(/Before We Begin/i)).toBeInTheDocument();
  });

  it("calls onAccept when accept button is clicked", () => {
    const onAccept = vi.fn();
    render(<ConsentModal onAccept={onAccept} />);
    fireEvent.click(screen.getByText(/I Understand/i));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it("shows guest button when onGuest prop is provided", () => {
    const onGuest = vi.fn();
    render(<ConsentModal onAccept={() => {}} onGuest={onGuest} />);
    expect(screen.getByText(/Continue Anonymously/i)).toBeInTheDocument();
  });

  it("calls onGuest when guest button is clicked", () => {
    const onGuest = vi.fn();
    render(<ConsentModal onAccept={() => {}} onGuest={onGuest} />);
    fireEvent.click(screen.getByText(/Continue Anonymously/i));
    expect(onGuest).toHaveBeenCalledTimes(1);
  });

  it("does not show guest button when onGuest prop is omitted", () => {
    render(<ConsentModal onAccept={() => {}} />);
    expect(screen.queryByText(/Continue Anonymously/i)).not.toBeInTheDocument();
  });
});

// CrisisAlert
import CrisisAlert from "@/components/shared/CrisisAlert";

describe("CrisisAlert", () => {
  it("renders helpline numbers", () => {
    render(<CrisisAlert onDismiss={() => {}} />);
    expect(screen.getByText(/9152987821/)).toBeInTheDocument();
    expect(screen.getByText(/1860-2662-345/)).toBeInTheDocument();
  });

  it("renders NIMHANS helpline", () => {
    render(<CrisisAlert onDismiss={() => {}} />);
    expect(screen.getByText(/080-46110007/)).toBeInTheDocument();
  });

  it("calls onDismiss when close button is clicked", () => {
    const onDismiss = vi.fn();
    render(<CrisisAlert onDismiss={onDismiss} />);
    const closeBtn = screen.getByLabelText("Close");
    fireEvent.click(closeBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("calls onDismiss when continue chatting button is clicked", () => {
    const onDismiss = vi.fn();
    render(<CrisisAlert onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText(/I understand, continue chatting/i));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

// ChatInput
vi.mock("lucide-react", () => ({
  Send: () => <span>Send</span>,
  Loader2: () => <span>Loading</span>,
}));

import ChatInput from "@/components/chat/ChatInput";

describe("ChatInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders textarea and send button", () => {
    render(<ChatInput onSend={() => {}} isLoading={false} />);
    expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument();
  });

  it("calls onSend with trimmed text when Enter is pressed", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} isLoading={false} />);
    const textarea = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(textarea, { target: { value: "  Hello Aura  " } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onSend).toHaveBeenCalledWith("Hello Aura");
  });

  it("does not call onSend on Shift+Enter", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} isLoading={false} />);
    const textarea = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("does not call onSend when input is empty", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} isLoading={false} />);
    const textarea = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("clears input after send", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} isLoading={false} />);
    const textarea = screen.getByPlaceholderText(/Type your message/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Test message" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(textarea.value).toBe("");
  });

  it("disables input when isLoading is true", () => {
    render(<ChatInput onSend={() => {}} isLoading={true} />);
    const textarea = screen.getByPlaceholderText(/Type your message/i);
    expect(textarea).toBeDisabled();
  });
});
