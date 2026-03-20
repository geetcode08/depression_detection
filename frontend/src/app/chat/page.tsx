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
import { Trash2 } from "lucide-react";
import { useChatStore } from "@/store/chatStore";

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, consentGiven } = useUserStore();
  const {
    messages,
    isLoading,
    showCrisisAlert,
    send,
    dismissCrisisAlert,
    clearChat,
  } = useChat();

  // Guard: if not authenticated or no consent, redirect
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!consentGiven) {
      router.push("/");
    }
  }, [isAuthenticated, consentGiven, router]);

  if (!isAuthenticated || !consentGiven) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Disclaimer bar */}
      <div className="px-4 pt-3">
        <div className="mx-auto max-w-3xl flex items-center gap-2">
          <div className="flex-1">
            <Disclaimer />
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="shrink-0 text-gray-400 hover:text-gray-600 text-xs gap-1"
              title="Clear chat"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Chat messages */}
      <ChatWindow messages={messages} isLoading={isLoading} />

      {/* Input */}
      <ChatInput onSend={send} isLoading={isLoading} />

      {/* Crisis alert modal */}
      {showCrisisAlert && <CrisisAlert onDismiss={dismissCrisisAlert} />}
    </div>
  );
}
