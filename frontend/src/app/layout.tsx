import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import ClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: "Aura — AI Emotional Support Assistant",
  description:
    "A compassionate AI assistant for emotional well-being tracking, mood analysis, and personalized support. Not a medical tool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">
        <ClientLayout>{children}</ClientLayout>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
