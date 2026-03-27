import axios from "axios";
import type {
  AuthResponse,
  ChatResponse,
  ChatSendRequest,
  DashboardStats,
  MoodTrendData,
  SentimentDistribution,
  BehavioralPatterns,
  RecommendationsResponse,
  User,
  AnalysisResult,
  AnalysisHistoryItem,
  SessionAnalysisResponse,
  LoginRequest,
  RegisterRequest,
} from "@/types";

const ACCESS_TOKEN_KEY = "access_token";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      const requestUrl = String(error?.config?.url ?? "");
      const isAuthEndpoint =
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/register") ||
        requestUrl.includes("/auth/anonymous");
      const isAuthPage =
        window.location.pathname === "/login" || window.location.pathname === "/register";

      if (isAuthEndpoint || isAuthPage) {
        return Promise.reject(error);
      }

      const { useUserStore } = await import("@/store/userStore");
      useUserStore.getState().clearUser();
      window.location.href = "/login?expired=true";
    }

    if (typeof window !== "undefined" && error.response?.status === 403) {
      const detail = String(error.response?.data?.detail ?? "");
      const isConsentError = detail.toLowerCase().includes("consent");

      if (isConsentError && window.location.pathname !== "/consent") {
        const current = `${window.location.pathname}${window.location.search}`;
        window.location.href = `/consent?next=${encodeURIComponent(current)}`;
      }
    }

    return Promise.reject(error);
  }
);

function getErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const detail = error.response?.data?.detail;
  if (typeof detail === "string" && detail.length > 0) {
    return detail;
  }
  return fallback;
}

export const authApi = {
  register: async (data: RegisterRequest): Promise<User> => {
    const res = await api.post<User>("/auth/register", data);
    return res.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const form = new URLSearchParams();
      form.append("username", data.email);
      form.append("password", data.password);

      const res = await api.post<AuthResponse>("/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<User>("/auth/me");
    return res.data;
  },

  giveConsent: async (): Promise<void> => {
    await api.patch("/auth/consent");
  },

  logout: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  deleteAccount: async (): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>("/auth/me");
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return res.data;
  },

  createAnonymous: async (): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/anonymous");
    return res.data;
  },
};

export const chatApi = {
  send: async (data: ChatSendRequest): Promise<ChatResponse> => {
    return sendMessage(data);
  },
  newSession: async (): Promise<ChatResponse> => {
    const res = await api.post<ChatResponse>("/chat/new-session");
    return res.data;
  },
  endSession: async (sessionId: number): Promise<{ summary: string | null; message?: string }> => {
    const res = await api.post<{ summary: string | null; message?: string }>(`/chat/end-session/${sessionId}`);
    return res.data;
  },
};

export const sendMessage = async (
  payload: {
    session_id?: number;
    message: string;
  },
  timeoutMs?: number
): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>("/chat/send", payload, {
    timeout: timeoutMs,
  });
  return response.data;
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get<DashboardStats>("/dashboard/stats");
    return res.data;
  },

  getMoodTrend: async (days = 30): Promise<MoodTrendData> => {
    const res = await api.get<MoodTrendData>(`/dashboard/mood?days=${days}`);
    return res.data;
  },

  getSentimentDistribution: async (): Promise<SentimentDistribution> => {
    const res = await api.get<SentimentDistribution>("/dashboard/sentiment-dist");
    return res.data;
  },

  getBehavior: async (): Promise<BehavioralPatterns> => {
    const res = await api.get<BehavioralPatterns>("/dashboard/behavior");
    return res.data;
  },
};

export const analysisApi = {
  analyze: async (text: string): Promise<AnalysisResult> => {
    const res = await api.post<AnalysisResult>("/analyze", { text });
    return res.data;
  },

  getHistory: async (limit = 50): Promise<AnalysisHistoryItem[]> => {
    const res = await api.get<AnalysisHistoryItem[]>(`/analyze/history?limit=${limit}`);
    return res.data;
  },

  getSessionAnalysis: async (sessionId: number): Promise<SessionAnalysisResponse> => {
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      throw new Error("Session ID must be a positive integer.");
    }
    const res = await api.get<SessionAnalysisResponse>(`/analyze/session/${sessionId}`);
    return res.data;
  },
};

export const recommendApi = {
  get: async (riskLabel: string): Promise<RecommendationsResponse> => {
    const res = await api.get<RecommendationsResponse>(
      `/recommend?risk_label=${encodeURIComponent(riskLabel)}`
    );
    return res.data;
  },
};

export default api;
