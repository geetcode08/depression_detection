import axios from "axios";
import type {
  AuthResponse,
  ChatSendRequest,
  ChatSendResponse,
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

// ----------------------------------------------------------------
// Axios instance — all API calls go through this.
// When the backend is ready, set NEXT_PUBLIC_API_URL in .env.local
// ----------------------------------------------------------------
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

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

// ===================== API FUNCTIONS ============================

export const authApi = {
  register: async (data: RegisterRequest): Promise<User> => {
    try {
      const res = await api.post<User>("/auth/register", data);
      return res.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Registration failed."));
    }
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const form = new URLSearchParams();
      // Backend uses OAuth2PasswordRequestForm (username field carries email).
      form.append("username", data.email);
      form.append("password", data.password);

      const res = await api.post<AuthResponse>("/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      localStorage.setItem("access_token", res.data.access_token);
      return res.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Login failed."));
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
    localStorage.removeItem("access_token");
  },

  deleteAccount: async (): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>("/auth/me");
    localStorage.removeItem("access_token");
    return res.data;
  },

  createAnonymous: async (): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/anonymous");
    localStorage.setItem("access_token", res.data.access_token);
    return res.data;
  },
};

export const chatApi = {
  send: async (data: ChatSendRequest): Promise<ChatSendResponse> => {
    const res = await api.post<ChatSendResponse>("/chat/send", data);
    return res.data;
  },
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
    const res = await api.get<SessionAnalysisResponse>(`/analyze/session/${sessionId}`);
    return res.data;
  },
};

export const recommendApi = {
  get: async (riskLabel: string): Promise<RecommendationsResponse> => {
    const res = await api.get<RecommendationsResponse>(`/recommend?risk_label=${encodeURIComponent(riskLabel)}`);
    return res.data;
  },
};

export default api;
