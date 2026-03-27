"use client";

import { useCallback, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { chatApi, sendMessage as sendMessageApi } from "@/lib/api";
import { useChatStore } from "@/store/chatStore";
import { useUserStore } from "@/store/userStore";
import { toast } from "@/lib/toast";

let initSessionPromiseGlobal: Promise<number | null> | null = null;

export function useChat() {
  const router = useRouter();
  const clearUser = useUserStore((s) => s.clearUser);
  const {
    messages,
    isLoading,
    sessionId,
    crisisAlert,
    addMessage,
    setSessionId,
    setLoading,
    setCrisisAlert,
    clearChat,
  } =
    useChatStore();

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) {
        return;
      }

      setCrisisAlert(false);
      addMessage({ role: "user", content: trimmed });
      setLoading(true);

      try {
        let activeSessionId = sessionId ?? useChatStore.getState().sessionId;
        if (!activeSessionId && initSessionPromiseGlobal) {
          activeSessionId = await initSessionPromiseGlobal;
        }

        const response = await sendMessageApi({
          session_id: activeSessionId ?? undefined,
          message: trimmed,
        }, 15_000);

        setSessionId(response.session_id);
        addMessage({
          role: "assistant",
          content: response.reply,
          analysis: response.analysis,
          isOpener: response.is_opener,
        });

        if (response.tier_just_unlocked && response.tier_unlock_message) {
          toast.success(response.tier_unlock_message);
        }

        if (response.analysis.crisis_alert) {
          window.setTimeout(() => setCrisisAlert(true), 0);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.code === "ECONNABORTED") {
            toast.error("This is taking longer than expected. Please try again.");
            return;
          }

          const status = error.response?.status;
          if (status === 401) {
            clearUser();
            router.replace("/login?expired=true");
            return;
          }

          if (status === 500) {
            toast.error("Our AI is temporarily unavailable. Please try again in a moment.");
            return;
          }

          if (status === 403) {
            const detail = String(error.response?.data?.detail ?? "").toLowerCase();
            if (detail.includes("consent")) {
              toast.error("Please accept consent before starting chat.");
              router.replace("/consent?next=%2Fchat");
              return;
            }
          }

          if (!error.response) {
            toast.error("Message failed to send. Please check your connection.");
            return;
          }
        }

        toast.error("Message failed to send. Please check your connection.");
      } finally {
        setLoading(false);
      }
    },
    [addMessage, clearUser, isLoading, router, sessionId, setCrisisAlert, setLoading, setSessionId]
  );

  const initSession = useCallback(async () => {
    const existingSessionId = useChatStore.getState().sessionId;
    if (existingSessionId) {
      return existingSessionId;
    }

    if (initSessionPromiseGlobal) {
      return initSessionPromiseGlobal;
    }

    const initPromise = (async (): Promise<number | null> => {
      setLoading(true);
      try {
        const response = await chatApi.newSession();
        setSessionId(response.session_id);
        addMessage({
          role: "assistant",
          content: response.reply,
          analysis: response.analysis,
          isOpener: true,
        });
        return response.session_id;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          const detail = String(error.response?.data?.detail ?? "").toLowerCase();
          if (detail.includes("consent")) {
            router.replace("/consent?next=%2Fchat");
            return null;
          }
        }

        toast.error("Could not start a new conversation right now.");
        return null;
      } finally {
        setLoading(false);
        initSessionPromiseGlobal = null;
      }

    })();

    initSessionPromiseGlobal = initPromise;
    return initPromise;
  }, [addMessage, router, setLoading, setSessionId]);

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
    sessionId,
    crisisAlert,
    send,
    initSession,
    dismissCrisisAlert: () => setCrisisAlert(false),
    clearChat,
  };
}
