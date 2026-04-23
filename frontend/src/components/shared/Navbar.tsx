"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, MessageCircle, LayoutDashboard, LineChart, X, Heart, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";
import { useChatStore } from "@/store/chatStore";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analysis", label: "Analysis", icon: LineChart },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, clearUser } = useUserStore();
  const { clearChat } = useChatStore();

  const isLoggedIn = Boolean(user);

  const initials = useMemo(() => {
    const first = user?.username?.trim().charAt(0);
    return first ? first.toUpperCase() : "U";
  }, [user?.username]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) {
        return;
      }

      const target = event.target as Node;
      if (!menuRef.current.contains(target)) {
        setMobileOpen(false);
      }
    };

    if (mobileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    clearUser();
    clearChat();
    document.cookie = "access_token=; path=/; max-age=0; samesite=lax";
    router.replace("/login");
    toast.success("You've been logged out.");
  };

  const handleMobileNavClick = (href: string) => {
    setMobileOpen(false);
    router.push(href);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-teal-700">
            <Heart className="h-6 w-6 fill-teal-600 text-teal-600" />
            <span className="text-lg font-bold tracking-tight">Aura</span>
          </Link>

          {isLoggedIn && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "text-teal-700 underline underline-offset-8 decoration-2"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="hidden md:flex items-center gap-3">
            {!isLoggedIn ? (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Register</Button>
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-full border border-gray-200 px-2 py-1">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-700">{user?.username}</span>
                  {user?.is_anonymous && (
                    <span className="ml-1 text-xs font-medium text-amber-600">Guest</span>
                  )}
                </div>
                {user?.is_anonymous && (
                  <Link href="/register">
                    <Button size="sm" variant="outline" className="text-teal-700">
                      Create Account
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden rounded p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div ref={menuRef} className="border-t border-gray-200 bg-white px-4 py-3 md:hidden">
            {!isLoggedIn ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleMobileNavClick("/login")}
                  className="block w-full rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => handleMobileNavClick("/register")}
                  className="block w-full rounded bg-teal-600 px-3 py-2 text-left text-sm text-white hover:bg-teal-700"
                >
                  Register
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => handleMobileNavClick(link.href)}
                    className="block w-full rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {link.label}
                  </button>
                ))}
                {user?.is_anonymous && (
                  <button
                    type="button"
                    onClick={() => handleMobileNavClick("/register")}
                    className="block w-full rounded px-3 py-2 text-left text-sm text-teal-700 hover:bg-teal-50"
                  >
                    Create Account
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="block w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
        ⚠️ This is not a medical tool. For clinical concerns, consult a licensed professional.
      </div>
    </>
  );
}
