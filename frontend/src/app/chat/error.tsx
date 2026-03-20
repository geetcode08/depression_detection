"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ChatError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="text-center max-w-sm space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Chat Error</h2>
          <p className="mt-1 text-sm text-gray-500">
            {error.message || "Something went wrong loading the chat. Please try again."}
          </p>
        </div>
        <Button onClick={reset} size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    </div>
  );
}
