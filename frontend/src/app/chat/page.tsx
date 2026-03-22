"use client";

import { useChat } from "@/hooks/useChat";
import { useUserStore } from "@/store/userStore";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";
import CrisisAlert from "@/components/shared/CrisisAlert";
import Disclaimer from "@/components/shared/Disclaimer";
import ConsentModal from "@/components/shared/ConsentModal";

export default function ChatPage() {
  const {
    messages,
    isLoading,
    showCrisisAlert,
    send,
    dismissCrisisAlert,
  } = useChat();
  const { isAuthenticated, consentGiven, giveConsent } = useUserStore();

  const handleConsentAccept = async () => {
    try {
      await giveConsent();
    } catch {
      // Ignore here; auth store and API surface error handling elsewhere.
    }
  };

  const canChat = isAuthenticated && consentGiven;

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
      <ChatInput onSend={send} isLoading={isLoading || !canChat} />

      {/* Crisis alert modal */}
      {showCrisisAlert && <CrisisAlert onDismiss={dismissCrisisAlert} />}

      {/* Enforce consent before protected chat endpoint usage */}
      {isAuthenticated && !consentGiven && <ConsentModal onAccept={handleConsentAccept} />}
    </div>
  );
}
