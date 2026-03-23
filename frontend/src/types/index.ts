// ============================================================
// Shared TypeScript Interfaces — Depression AI System Frontend
// ============================================================

// --- User ---
export interface User {
  id: number;
  username: string;
  email: string;
  is_anonymous: boolean;
  consent_given: boolean;
  created_at: string;
}

// --- Auth ---
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
}

// --- Chat ---
export type RiskLabel = "low" | "medium" | "high";
export type MessageRole = "user" | "assistant";

export interface AnalysisResult {
  sentiment_score: number; // -1.0 to 1.0
  risk_score: number; // 0.0 to 1.0
  risk_label: RiskLabel;
  top_keywords: string[];
  confidence: number;
  emotion_label?: string;
  crisis_alert?: boolean;
}

export interface AnalysisHistoryItem {
  id: number;
  content: string;
  sentiment_score: number | null;
  depression_risk_score: number | null;
  risk_label: RiskLabel | null;
  emotion_label: string | null;
  created_at: string;
}

export interface SessionAnalysisResponse {
  session_id: number;
  total_messages: number;
  avg_sentiment: number;
  avg_risk_score: number;
  dominant_risk_label: RiskLabel;
  message_count: number;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  user_id: number;
  role: MessageRole;
  content: string;
  sentiment_score: number | null;
  depression_risk_score: number | null;
  risk_label: RiskLabel | null;
  emotion_label: string | null;
  message_length: number;
  created_at: string;
  // Frontend-only fields
  analysis?: AnalysisResult;
  crisis_alert?: boolean;
}

export interface ChatSendRequest {
  session_id?: number;
  message: string;
}

export interface ChatSendResponse {
  reply: string;
  session_id: number;
  analysis: AnalysisResult;
  crisis_alert: boolean;
}

export interface ChatSession {
  id: number;
  user_id: number;
  started_at: string;
  ended_at: string | null;
  total_messages: number;
}

// --- Dashboard ---
export interface DashboardStats {
  total_messages: number;
  avg_sentiment_7d: number;
  avg_risk_7d: number;
  current_streak_days: number;
}

export interface MoodTrendData {
  dates: string[];
  sentiment_scores: number[];
  risk_scores: number[];
}

export interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

export interface BehavioralPatterns {
  late_night_days: number;
  avg_message_length: number;
  most_active_hour: number;
  weekly_frequency: number[];
}

// --- Mood Log ---
export interface MoodLog {
  id: number;
  user_id: number;
  date: string;
  avg_sentiment: number;
  avg_risk_score: number;
  dominant_emotion: string | null;
  message_count: number;
  late_night_activity: boolean;
}

// --- Recommendations ---
export type RecommendationCategory =
  | "activity"
  | "journaling"
  | "social"
  | "professional_help"
  | "breathing";

export interface Recommendation {
  category: RecommendationCategory;
  title: string;
  description: string;
  priority: number;
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
}
