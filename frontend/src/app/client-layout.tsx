"use client";

import { useEffect } from "react";
import Navbar from "@/components/shared/Navbar";
import { useUserStore } from "@/store/userStore";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchUser, hydrateSession } = useUserStore();

  useEffect(() => {
    hydrateSession();
    const hasToken = typeof window !== "undefined" && Boolean(localStorage.getItem("access_token"));
    if (hasToken) {
      fetchUser();
    }
  }, [fetchUser, hydrateSession]);

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
    </>
  );
}
