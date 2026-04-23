"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { useUserStore } from "@/store/userStore";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";
import CrisisAlert from "@/components/shared/CrisisAlert";
import Disclaimer from "@/components/shared/Disclaimer";
import { Button } from "@/components/ui/button";
import { chatApi } from "@/lib/api";
import { toast } from "@/lib/toast";

export default function ChatPage() {
  const router = useRouter();
  const {
    isLoading,
    sessionId,
    crisisAlert,
    send,
    initSession,
    dismissCrisisAlert,
    clearChat,
  } = useChat();
  const { isAuthenticated, consentGiven, hasHydratedSession } = useUserStore();

  const canChat = isAuthenticated && consentGiven;

  useEffect(() => {
    if (!hasHydratedSession) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login?next=%2Fchat");
      return;
    }

    if (!consentGiven) {
      router.replace("/consent?next=%2Fchat");
      return;
    }

    if (canChat) {
      void initSession();
    }
  }, [canChat, consentGiven, hasHydratedSession, initSession, isAuthenticated, router]);

  if (!hasHydratedSession) {
    return <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-gray-500">Loading session...</div>;
  }

  if (!isAuthenticated || !consentGiven) {
    return null;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Disclaimer bar */}
      <div className="px-4 pt-3">
        <div className="mx-auto max-w-3xl">
          <Disclaimer />
          <div className="mt-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (sessionId) {
                  try {
                    const summary = await chatApi.endSession(sessionId);
                    if (summary.summary) {
                      toast.success(`Session Summary: ${summary.summary}`, { duration: 8000 });
                    }
                  } catch {
                    // Non-critical: proceed with reset even if summary endpoint fails.
                  }
                }
                clearChat();
                void initSession();
              }}
              disabled={isLoading && !sessionId}
            >
              New conversation
            </Button>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <ChatWindow />

      {/* Input */}
      <ChatInput onSend={send} disabled={isLoading || !canChat} isSending={isLoading} />

      {/* Crisis alert modal */}
      <CrisisAlert isOpen={crisisAlert} onClose={dismissCrisisAlert} />
    </div>
  );
}
