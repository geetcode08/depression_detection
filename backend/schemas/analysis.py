from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class AnalysisResult(BaseModel):
    sentiment_score: Optional[float] = None
    risk_score: Optional[float] = None
    risk_label: Optional[str] = None
    top_keywords: List[str] = []
    confidence: Optional[float] = None
    emotion_label: Optional[str] = None
    analysis_tier: str = "gathering"
    words_until_next_tier: Optional[int] = None
    longitudinal_patterns_available: bool = False
    behavioral_profile_available: bool = False
    crisis_alert: bool = False


class AnalysisRequest(BaseModel):
    text: str


class AnalysisHistoryItem(BaseModel):
    id: int
    content: str
    sentiment_score: Optional[float]
    depression_risk_score: Optional[float]
    risk_label: Optional[str]
    emotion_label: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionAnalysisResponse(BaseModel):
    session_id: int
    total_messages: int
    avg_sentiment: float
    avg_risk_score: float
    dominant_risk_label: str
    message_count: int
