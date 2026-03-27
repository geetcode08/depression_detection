"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ConsentModal from "@/components/shared/ConsentModal";
import { useUserStore } from "@/store/userStore";

function sanitizeNextPath(raw: string | null): string {
  const value = raw ?? "/chat";
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/chat";
}

export default function ConsentPage() {
  const router = useRouter();
  const { isAuthenticated, consentGiven, giveConsent } = useUserStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const nextPath = useMemo(() => {
    if (typeof window === "undefined") {
      return "/chat";
    }
    return sanitizeNextPath(new URLSearchParams(window.location.search).get("next"));
  }, []);

  const handleAccept = async () => {
    if (submitting) {
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await giveConsent();
      router.replace(nextPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save consent. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    if (consentGiven) {
      router.replace(nextPath);
    }
  }, [consentGiven, isAuthenticated, nextPath, router]);

  if (!isAuthenticated) {
    return null;
  }

  if (consentGiven) {
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <ConsentModal isOpen onAccept={handleAccept} />
      {submitting && <p className="text-sm text-gray-600">Saving your consent...</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}