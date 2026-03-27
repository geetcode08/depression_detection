import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Navbar from "@/components/shared/Navbar";
import { useUserStore } from "@/store/userStore";
import { useChatStore } from "@/store/chatStore";
import { useRouter as useNextRouter, usePathname } from "next/navigation";

vi.mock("@/store/userStore", () => ({
  useUserStore: vi.fn(),
}));

vi.mock("@/store/chatStore", () => ({
  useChatStore: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

describe("Navbar Component", () => {
  const mockReplace = vi.fn();
  const mockClearUser = vi.fn();
  const mockClearChat = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useUserStore).mockReturnValue({
      user: {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        consent_given: true,
        is_anonymous: false,
        created_at: "2026-01-01T00:00:00Z",
      },
      clearUser: mockClearUser,
    } as never);

    vi.mocked(useChatStore).mockReturnValue({
      clearChat: mockClearChat,
    } as never);

    vi.mocked(useNextRouter).mockReturnValue({
      replace: mockReplace,
      push: vi.fn(),
    } as never);

    vi.mocked(usePathname).mockReturnValue("/dashboard");
  });

  it("renders logged-in navigation links", () => {
    render(<Navbar />);
    expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /chat/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /analysis/i })).toBeInTheDocument();
  });

  it("renders logged-out auth buttons", () => {
    vi.mocked(useUserStore).mockReturnValue({ user: null, clearUser: mockClearUser } as never);
    render(<Navbar />);
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
  });

  it("logs out and redirects to login", async () => {
    render(<Navbar />);
    await userEvent.click(screen.getByRole("button", { name: /logout/i }));
    expect(mockClearUser).toHaveBeenCalledTimes(1);
    expect(mockClearChat).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });
});
