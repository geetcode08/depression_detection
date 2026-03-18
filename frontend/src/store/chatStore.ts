import { create } from "zustand";
import type { ChatMessage, ChatSendResponse, RiskLabel } from "@/types";
import { chatApi } from "@/lib/api";

interface ChatState {
  messages: ChatMessage[];
  sessionId: number | null;
  isLoading: boolean;
  error: string | null;
  latestRiskLabel: RiskLabel | null;
  showCrisisAlert: boolean;

  sendMessage: (text: string) => Promise<void>;
  dismissCrisisAlert: () => void;
  clearChat: () => void;
}

let messageIdCounter = 0;

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  sessionId: null,
  isLoading: false,
  error: null,
  latestRiskLabel: null,
  showCrisisAlert: false,

  sendMessage: async (text: string) => {
    const { sessionId } = get();

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: --messageIdCounter, // negative temp IDs for local messages
      session_id: sessionId ?? 0,
      user_id: 1,
      role: "user",
      content: text,
      sentiment_score: null,
      depression_risk_score: null,
      risk_label: null,
      emotion_label: null,
      message_length: text.length,
      created_at: new Date().toISOString(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg],
      isLoading: true,
      error: null,
    }));

    try {
      const response: ChatSendResponse = await chatApi.send({
        session_id: sessionId ?? undefined,
        message: text,
      });

      const assistantMsg: ChatMessage = {
        id: --messageIdCounter,
        session_id: response.session_id,
        user_id: 0,
        role: "assistant",
        content: response.reply,
        sentiment_score: response.analysis.sentiment_score,
        depression_risk_score: response.analysis.risk_score,
        risk_label: response.analysis.risk_label,
        emotion_label: response.analysis.emotion_label ?? null,
        message_length: response.reply.length,
        created_at: new Date().toISOString(),
        analysis: response.analysis,
        crisis_alert: response.crisis_alert,
      };

      set((s) => ({
        messages: [...s.messages, assistantMsg],
        sessionId: response.session_id,
        isLoading: false,
        latestRiskLabel: response.analysis.risk_label,
        showCrisisAlert: response.crisis_alert ? true : s.showCrisisAlert,
      }));
    } catch {
      set({ isLoading: false, error: "Failed to send message. Please try again." });
    }
  },

  dismissCrisisAlert: () => set({ showCrisisAlert: false }),

  clearChat: () =>
    set({
      messages: [],
      sessionId: null,
      isLoading: false,
      error: null,
      latestRiskLabel: null,
      showCrisisAlert: false,
    }),
}));
