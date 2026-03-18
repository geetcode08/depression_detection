from datetime import date
from typing import Optional

from sqlalchemy import Integer, Float, String, Boolean, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class MoodLog(Base):
    __tablename__ = "mood_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    avg_sentiment: Mapped[float] = mapped_column(Float, default=0.0)
    avg_risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    dominant_emotion: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    message_count: Mapped[int] = mapped_column(Integer, default=0)
    late_night_activity: Mapped[bool] = mapped_column(Boolean, default=False)

    user = relationship("User", back_populates="mood_logs")
