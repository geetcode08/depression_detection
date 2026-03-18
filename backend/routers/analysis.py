from typing import List\n\nfrom fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.message import Message
from schemas.analysis import AnalysisRequest, AnalysisResult, AnalysisHistoryItem, SessionAnalysisResponse
from services.auth_service import get_current_user, require_consent
from services.nlp_service import analyze_text

router = APIRouter(prefix="/analyze", tags=["Analysis"])


@router.post("", response_model=AnalysisResult)
async def analyze(
    req: AnalysisRequest,
    current_user: User = Depends(get_current_user),
):
    require_consent(current_user)
    return analyze_text(req.text)


@router.get("/history", response_model=List[AnalysisHistoryItem])
async def get_analysis_history(
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_consent(current_user)
    result = await db.execute(
        select(Message)
        .where(
            and_(
                Message.user_id == current_user.id,
                Message.role == "user",
            )
        )
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    messages = result.scalars().all()
    return [
        AnalysisHistoryItem(
            id=m.id,
            content=m.content,
            sentiment_score=m.sentiment_score,
            depression_risk_score=m.depression_risk_score,
            risk_label=m.risk_label,
            emotion_label=m.emotion_label,
            created_at=m.created_at,
        )
        for m in messages
    ]


@router.get("/session/{session_id}", response_model=SessionAnalysisResponse)
async def get_session_analysis(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_consent(current_user)

    # Get user messages from this session
    result = await db.execute(
        select(Message).where(
            and_(
                Message.session_id == session_id,
                Message.user_id == current_user.id,
                Message.role == "user",
            )
        )
    )
    messages = result.scalars().all()

    if not messages:
        raise HTTPException(status_code=404, detail="No messages found for this session")

    sentiments = [m.sentiment_score for m in messages if m.sentiment_score is not None]
    risks = [m.depression_risk_score for m in messages if m.depression_risk_score is not None]
    risk_labels = [m.risk_label for m in messages if m.risk_label]

    avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0.0
    avg_risk = sum(risks) / len(risks) if risks else 0.0

    # Determine dominant risk label
    from collections import Counter
    label_counts = Counter(risk_labels)
    dominant_label = label_counts.most_common(1)[0][0] if label_counts else "low"

    return SessionAnalysisResponse(
        session_id=session_id,
        total_messages=len(messages),
        avg_sentiment=round(avg_sentiment, 4),
        avg_risk_score=round(avg_risk, 4),
        dominant_risk_label=dominant_label,
        message_count=len(messages),
    )
