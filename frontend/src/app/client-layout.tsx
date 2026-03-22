"use client";

import { useEffect } from "react";
import Navbar from "@/components/shared/Navbar";
import { useUserStore } from "@/store/userStore";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
    </>
  );
}
