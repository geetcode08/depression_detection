from typing import List

from pydantic import BaseModel


class StatsResponse(BaseModel):
    total_messages: int
    avg_sentiment_7d: float
    avg_risk_7d: float
    current_streak_days: int


class MoodTrendResponse(BaseModel):
    dates: List[str]
    sentiment_scores: List[float]
    risk_scores: List[float]


class SentimentDistResponse(BaseModel):
    positive: int
    neutral: int
    negative: int


class BehaviorResponse(BaseModel):
    late_night_days: int
    avg_message_length: float
    most_active_hour: int
    weekly_frequency: List[int]


class RecommendationItem(BaseModel):
    category: str
    title: str
    description: str
    priority: int


class RecommendationResponse(BaseModel):
    recommendations: List[RecommendationItem]
