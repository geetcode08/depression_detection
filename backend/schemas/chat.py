"""Fixes: chat response now matches SRS contract shape (reply, session_id, analysis)."""

from typing import Optional

from pydantic import BaseModel, Field

from schemas.analysis import AnalysisResult


class ChatRequest(BaseModel):
    session_id: Optional[int] = None
    message: Optional[str] = Field(default=None, max_length=5000)


class ChatResponse(BaseModel):
    reply: str
    session_id: int
    is_opener: bool = False
    crisis_alert: bool = False
    analysis: AnalysisResult
    tier_just_unlocked: Optional[str] = None
    tier_unlock_message: Optional[str] = None
