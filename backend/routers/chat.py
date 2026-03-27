"""Chat router with threshold-gated analysis and AI-first session flow."""

from datetime import datetime
import logging
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.message import Message
from models.session import ChatSession
from models.user import User
from schemas.analysis import AnalysisResult
from schemas.chat import ChatRequest, ChatResponse
from services import llm_service, nlp_service
from services.auth_service import get_current_user
from services.behavioral_service import aggregate_daily_mood

logger = logging.getLogger("chat_router")
router = APIRouter(tags=["chat"])

TIER_UNLOCK_MESSAGES = {
    "sentiment_only": "Aura is now picking up on your emotional tone. Check your dashboard.",
    "emotion_detected": "Your emotion patterns are coming into focus. Visit your dashboard to see more.",
    "preliminary_screening": "Aura has enough context for a preliminary wellbeing overview.",
    "full_assessment": "Your full wellbeing picture is now available in your dashboard.",
}

TIER_ORDER = {
    "gathering": 0,
    "sentiment_only": 1,
    "emotion_detected": 2,
    "preliminary_screening": 3,
    "full_assessment": 4,
}


async def _create_new_session(user_id: int, db: AsyncSession) -> ChatSession:
    session = ChatSession(user_id=user_id)
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return session


async def _store_message(
    session_id: int,
    user_id: int,
    role: str,
    content: str,
    db: AsyncSession,
    analysis: Optional[AnalysisResult] = None,
) -> Message:
    msg = Message(
        session_id=session_id,
        user_id=user_id,
        role=role,
        content=content,
        sentiment_score=analysis.sentiment_score if analysis and role == "user" else None,
        depression_risk_score=analysis.risk_score if analysis and role == "user" else None,
        risk_label=analysis.risk_label if analysis and role == "user" else None,
        emotion_label=analysis.emotion_label if analysis and role == "user" else None,
        message_length=len(content),
    )
    db.add(msg)
    await db.flush()
    return msg


async def _get_session_for_user(session_id: int, user_id: int, db: AsyncSession) -> Optional[ChatSession]:
    result = await db.execute(
        select(ChatSession).where(
            and_(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id,
            )
        )
    )
    return result.scalar_one_or_none()


async def _get_conversation_history(session_id: int, user_id: int, db: AsyncSession) -> List[Dict[str, str]]:
    result = await db.execute(
        select(Message)
        .where(and_(Message.session_id == session_id, Message.user_id == user_id))
        .order_by(Message.created_at.asc())
    )
    rows = result.scalars().all()
    return [{"role": row.role, "content": row.content} for row in rows]


async def get_llm_reply(
    user_message: str,
    history: List[Dict[str, str]],
    session_word_count: int,
    crisis_mode: bool,
) -> str:
    return await llm_service.get_reply(
        message=user_message,
        history=history,
        session_word_count=session_word_count,
        crisis_mode=crisis_mode,
    )


def _max_tier(previous: str, current: str) -> str:
    previous_rank = TIER_ORDER.get(previous, 0)
    current_rank = TIER_ORDER.get(current, 0)
    return current if current_rank >= previous_rank else previous


async def _aggregate_session_analysis(session_id: int, user_id: int, db: AsyncSession) -> AnalysisResult:
    result = await db.execute(
        select(Message).where(
            and_(
                Message.session_id == session_id,
                Message.user_id == user_id,
                Message.role == "user",
            )
        )
    )
    messages = result.scalars().all()

    sentiments = [m.sentiment_score for m in messages if m.sentiment_score is not None]
    risks = [m.depression_risk_score for m in messages if m.depression_risk_score is not None]
    labels = [m.risk_label for m in messages if m.risk_label]

    avg_sentiment = (sum(sentiments) / len(sentiments)) if sentiments else None
    avg_risk = (sum(risks) / len(risks)) if risks else None

    dominant_label = None
    if labels:
        dominant_label = max(set(labels), key=labels.count)

    return AnalysisResult(
        sentiment_score=round(avg_sentiment, 4) if avg_sentiment is not None else None,
        risk_score=round(avg_risk, 4) if avg_risk is not None else None,
        risk_label=dominant_label,
        top_keywords=[],
        confidence=None,
        emotion_label=None,
        analysis_tier="full_assessment" if avg_risk is not None else "gathering",
    )


@router.post("/new-session", response_model=ChatResponse)
async def start_new_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new session and return AI opener so Aura always speaks first."""
    if not current_user.consent_given:
        raise HTTPException(status_code=403, detail="Consent required before using chat")

    session = await _create_new_session(current_user.id, db)
    opener = await llm_service.get_session_opener(user=current_user, db=db)
    opener_msg = await _store_message(
        session_id=session.id,
        user_id=current_user.id,
        role="assistant",
        content=opener,
        db=db,
    )

    session.opener_message_id = opener_msg.id
    session.total_messages = (session.total_messages or 0) + 1

    return ChatResponse(
        reply=opener,
        session_id=session.id,
        is_opener=True,
        analysis=AnalysisResult(analysis_tier="gathering"),
    )


@router.post("/send", response_model=ChatResponse)
async def send_message(
    chat_req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.consent_given:
        raise HTTPException(status_code=403, detail="Consent required before using chat")

    text = (chat_req.message or "").strip()
    is_new_session = chat_req.session_id is None

    if is_new_session:
        session = await _create_new_session(current_user.id, db)
        # Only generate/store opener when client explicitly asks for a new session opener.
        if not text:
            opener = await llm_service.get_session_opener(user=current_user, db=db)
            opener_msg = await _store_message(
                session_id=session.id,
                user_id=current_user.id,
                role="assistant",
                content=opener,
                db=db,
            )
            session.opener_message_id = opener_msg.id
            session.total_messages = (session.total_messages or 0) + 1

            return ChatResponse(
                reply=opener,
                session_id=session.id,
                is_opener=True,
                analysis=AnalysisResult(analysis_tier="gathering"),
            )
    else:
        if chat_req.session_id is None:
            raise HTTPException(status_code=422, detail="Session id is required")
        session = await _get_session_for_user(chat_req.session_id, current_user.id, db)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

    if not text:
        raise HTTPException(status_code=422, detail="Message cannot be empty")

    previous_tier = session.analysis_tier_reached or "gathering"

    # Count words before writing current message, then include current message words.
    session_word_count = await nlp_service.count_user_words_in_session(session.id, db)
    cumulative_word_count = await nlp_service.count_user_words_cumulative(current_user.id, db)
    new_words = len(text.split())
    session_word_count += new_words
    cumulative_word_count += new_words

    recent_messages = await nlp_service.get_recent_user_messages(session.id, db, limit=5)
    previous_scores = await nlp_service.get_recent_session_risk_scores(session.id, db, limit=2)

    analysis = await nlp_service.analyze_with_threshold(
        text=text,
        session_word_count=session_word_count,
        cumulative_word_count=cumulative_word_count,
        session_id=session.id,
        session_messages=recent_messages,
        session_time_hour=datetime.utcnow().hour,
        previous_scores=previous_scores,
    )

    if analysis.analysis_tier == "full_assessment" and analysis.risk_label == "high":
        analysis.crisis_alert = True

    conversation_history = await _get_conversation_history(session.id, current_user.id, db)
    crisis_mode = analysis.analysis_tier == "full_assessment" and analysis.risk_label == "high"
    reply_text = await get_llm_reply(
        user_message=text,
        history=conversation_history,
        session_word_count=session_word_count,
        crisis_mode=crisis_mode,
    )

    await _store_message(
        session_id=session.id,
        user_id=current_user.id,
        role="user",
        content=text,
        db=db,
        analysis=analysis,
    )

    await _store_message(
        session_id=session.id,
        user_id=current_user.id,
        role="assistant",
        content=reply_text,
        db=db,
    )

    session.total_messages = (session.total_messages or 0) + 2
    session.total_user_words = session_word_count
    session.analysis_tier_reached = _max_tier(previous_tier, analysis.analysis_tier)
    current_user.cumulative_words = cumulative_word_count

    await aggregate_daily_mood(db, current_user.id)

    tier_just_unlocked = None
    tier_unlock_message = None
    if analysis.analysis_tier != previous_tier:
        tier_just_unlocked = analysis.analysis_tier
        tier_unlock_message = TIER_UNLOCK_MESSAGES.get(analysis.analysis_tier)

    return ChatResponse(
        reply=reply_text,
        session_id=session.id,
        analysis=analysis,
        tier_just_unlocked=tier_just_unlocked,
        tier_unlock_message=tier_unlock_message,
    )


@router.post("/end-session/{session_id}")
async def end_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Close a session and store a warm summary when enough user data exists."""
    session = await _get_session_for_user(session_id, current_user.id, db)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    word_count = await nlp_service.count_user_words_in_session(session_id, db)
    session.total_user_words = word_count
    session.ended_at = datetime.utcnow()

    if word_count < 50:
        return {"summary": None, "message": "Session closed."}

    result = await db.execute(
        select(Message.content)
        .where(
            and_(
                Message.session_id == session_id,
                Message.user_id == current_user.id,
                Message.role == "user",
            )
        )
        .order_by(Message.created_at.asc())
    )
    messages = [row[0] for row in result.all()]

    session_analysis = await _aggregate_session_analysis(session_id, current_user.id, db)
    summary = await llm_service.generate_session_summary(
        messages=messages,
        analysis=session_analysis,
        word_count=word_count,
    )

    session.session_summary = summary
    return {"summary": summary}
