from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.session import ChatSession
from models.message import Message
from schemas.chat import ChatRequest, ChatResponse
from schemas.analysis import AnalysisResult
from services.auth_service import get_current_user, require_consent
from services.nlp_service import analyze_text
from services.llm_service import get_llm_reply
from services.behavioral_service import aggregate_daily_mood

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/send", response_model=ChatResponse)
async def send_message(
    chat_req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_consent(current_user)

    # Get or create session
    if chat_req.session_id:
        result = await db.execute(
            select(ChatSession).where(
                ChatSession.id == chat_req.session_id,
                ChatSession.user_id == current_user.id,
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    else:
        session = ChatSession(user_id=current_user.id)
        db.add(session)
        await db.flush()
        await db.refresh(session)

    # Analyze user message with NLP pipeline
    analysis = analyze_text(chat_req.message)

    # Store user message
    user_msg = Message(
        session_id=session.id,
        user_id=current_user.id,
        role="user",
        content=chat_req.message,
        sentiment_score=analysis.sentiment_score,
        depression_risk_score=analysis.risk_score,
        risk_label=analysis.risk_label,
        emotion_label=analysis.emotion_label,
        message_length=len(chat_req.message),
    )
    db.add(user_msg)

    # Build conversation history for LLM context
    history_result = await db.execute(
        select(Message)
        .where(Message.session_id == session.id)
        .order_by(Message.created_at.asc())
    )
    history_msgs = history_result.scalars().all()
    conversation_history = [
        {"role": m.role, "content": m.content} for m in history_msgs
    ]

    # Get LLM reply
    reply_text = await get_llm_reply(chat_req.message, conversation_history)

    # Store assistant message
    assistant_msg = Message(
        session_id=session.id,
        user_id=current_user.id,
        role="assistant",
        content=reply_text,
        message_length=len(reply_text),
    )
    db.add(assistant_msg)

    # Update session message count
    session.total_messages += 2
    await db.flush()

    # Aggregate daily mood (non-blocking intent, but we await in this context)
    await aggregate_daily_mood(db, current_user.id)

    return ChatResponse(
        reply=reply_text,
        session_id=session.id,
        analysis=analysis,
    )
