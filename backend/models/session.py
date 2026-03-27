from datetime import datetime
from typing import Optional

from sqlalchemy import Integer, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    total_messages: Mapped[int] = mapped_column(Integer, default=0)
    total_user_words: Mapped[int] = mapped_column(Integer, default=0)
    session_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    analysis_tier_reached: Mapped[str] = mapped_column(String(30), default="gathering")
    opener_message_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("messages.id"), nullable=True)

    user = relationship("User", back_populates="sessions")
    messages = relationship(
        "Message",
        back_populates="session",
        cascade="all, delete-orphan",
        foreign_keys="Message.session_id",
    )
    opener_message = relationship("Message", foreign_keys=[opener_message_id], uselist=False)
