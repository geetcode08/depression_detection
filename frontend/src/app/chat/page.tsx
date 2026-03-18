"use client";

import { useChat } from "@/hooks/useChat";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";
import CrisisAlert from "@/components/shared/CrisisAlert";
import Disclaimer from "@/components/shared/Disclaimer";

export default function ChatPage() {
  const {
    messages,
    isLoading,
    showCrisisAlert,
    send,
    dismissCrisisAlert,
  } = useChat();

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Disclaimer bar */}
      <div className="px-4 pt-3">
        <div className="mx-auto max-w-3xl">
          <Disclaimer />
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
