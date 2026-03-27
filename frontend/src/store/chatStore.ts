import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnalysisResult, ChatMessage } from "@/types";

interface ChatState {
  messages: ChatMessage[];
  sessionId: number | null;
  isLoading: boolean;
  crisisAlert: boolean;

  addMessage: (message: {
    role: "user" | "assistant";
    content: string;
    analysis?: AnalysisResult;
    isOpener?: boolean;
  }) => void;
  setSessionId: (sessionId: number | null) => void;
  setLoading: (isLoading: boolean) => void;
  setCrisisAlert: (crisisAlert: boolean) => void;
  clearMessages: () => void;
  clearChat: () => void;
}

let messageIdCounter = 0;

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      sessionId: null,
      isLoading: false,
      crisisAlert: false,

      addMessage: ({ role, content, analysis, isOpener }) => {
        const { sessionId } = get();
        const message: ChatMessage = {
          id: --messageIdCounter,
          session_id: sessionId ?? 0,
          user_id: role === "user" ? 1 : 0,
          role,
          content,
          sentiment_score: analysis?.sentiment_score ?? null,
          depression_risk_score: analysis?.risk_score ?? null,
          risk_label: analysis?.risk_label ?? null,
          emotion_label: analysis?.emotion_label ?? null,
          message_length: content.length,
          created_at: new Date().toISOString(),
          analysis,
          crisis_alert: analysis?.crisis_alert ?? false,
          isOpener,
        };

        set((s) => ({ messages: [...s.messages, message] }));
      },

      setSessionId: (sessionId) => set({ sessionId }),
      setLoading: (isLoading) => set({ isLoading }),
      setCrisisAlert: (crisisAlert) => set({ crisisAlert }),
      clearMessages: () => set({ messages: [] }),
      clearChat: () =>
        set({
          messages: [],
          sessionId: null,
          isLoading: false,
          crisisAlert: false,
        }),
    }),
    {
      name: "depression-ai-chat",
      partialize: (state) => ({ sessionId: state.sessionId }),
    }
  )
);
