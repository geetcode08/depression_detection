from typing import Optional

from pydantic import BaseModel, Field

from schemas.analysis import AnalysisResult


class ChatRequest(BaseModel):
    session_id: Optional[int] = None
    message: str = Field(..., min_length=1, max_length=5000)


class ChatResponse(BaseModel):
    reply: str
    session_id: int
    analysis: AnalysisResult
    crisis_alert: bool = False
