"use client";

import { useCallback, useEffect } from "react";
import { useChatStore } from "@/store/chatStore";

export function useChat() {
  const { messages, isLoading, error, sessionId, latestRiskLabel, showCrisisAlert, sendMessage, dismissCrisisAlert, clearChat } =
    useChatStore();

  const send = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage]
  );

  // Listen for suggestion clicks from ChatWindow
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) send(detail);
    };
    window.addEventListener("chat:suggestion", handler);
    return () => window.removeEventListener("chat:suggestion", handler);
  }, [send]);

  return {
    messages,
    isLoading,
    error,
    sessionId,
    latestRiskLabel,
    showCrisisAlert,
    send,
    dismissCrisisAlert,
    clearChat,
  };
}
