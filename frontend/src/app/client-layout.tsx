"use client";

import Navbar from "@/components/shared/Navbar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
    </>
  );
}
