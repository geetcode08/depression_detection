from datetime import date, datetime, timedelta
from collections import Counter

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.message import Message
from models.mood_log import MoodLog


async def aggregate_daily_mood(db: AsyncSession, user_id: int) -> None:
    """Aggregate today's messages into a mood_log entry. Upsert pattern."""
    today = date.today()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())

    # Get today's user messages
    result = await db.execute(
        select(Message).where(
            and_(
                Message.user_id == user_id,
                Message.role == "user",
                Message.created_at >= start_of_day,
                Message.created_at <= end_of_day,
            )
        )
    )
    messages = result.scalars().all()

    if not messages:
        return

    # Calculate aggregates
    sentiment_scores = [m.sentiment_score for m in messages if m.sentiment_score is not None]
    risk_scores = [m.depression_risk_score for m in messages if m.depression_risk_score is not None]
    emotion_labels = [m.emotion_label for m in messages if m.emotion_label]

    avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0.0
    avg_risk = sum(risk_scores) / len(risk_scores) if risk_scores else 0.0
    dominant_emotion = Counter(emotion_labels).most_common(1)[0][0] if emotion_labels else None
    message_count = len(messages)

    # Check for late-night activity (00:00 - 05:00)
    late_night = any(0 <= m.created_at.hour < 5 for m in messages)

    # Upsert mood_log
    existing = await db.execute(
        select(MoodLog).where(
            and_(MoodLog.user_id == user_id, MoodLog.date == today)
        )
    )
    mood_log = existing.scalar_one_or_none()

    if mood_log:
        mood_log.avg_sentiment = round(avg_sentiment, 4)
        mood_log.avg_risk_score = round(avg_risk, 4)
        mood_log.dominant_emotion = dominant_emotion
        mood_log.message_count = message_count
        mood_log.late_night_activity = late_night
    else:
        mood_log = MoodLog(
            user_id=user_id,
            date=today,
            avg_sentiment=round(avg_sentiment, 4),
            avg_risk_score=round(avg_risk, 4),
            dominant_emotion=dominant_emotion,
            message_count=message_count,
            late_night_activity=late_night,
        )
        db.add(mood_log)

    await db.flush()


async def get_dashboard_stats(db: AsyncSession, user_id: int) -> dict:
    """Get overview stats for the dashboard."""
    # Total user messages
    total_result = await db.execute(
        select(func.count(Message.id)).where(
            and_(Message.user_id == user_id, Message.role == "user")
        )
    )
    total_messages = total_result.scalar() or 0

    # 7-day averages
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_result = await db.execute(
        select(
            func.avg(Message.sentiment_score),
            func.avg(Message.depression_risk_score),
        ).where(
            and_(
                Message.user_id == user_id,
                Message.role == "user",
                Message.created_at >= seven_days_ago,
            )
        )
    )
    row = recent_result.one()
    avg_sentiment_7d = round(float(row[0] or 0.0), 4)
    avg_risk_7d = round(float(row[1] or 0.0), 4)

    # Current streak (consecutive days with messages)
    streak = await _calculate_streak(db, user_id)

    return {
        "total_messages": total_messages,
        "avg_sentiment_7d": avg_sentiment_7d,
        "avg_risk_7d": avg_risk_7d,
        "current_streak_days": streak,
    }


async def _calculate_streak(db: AsyncSession, user_id: int) -> int:
    """Calculate consecutive days with at least one message, ending today."""
    result = await db.execute(
        select(MoodLog.date)
        .where(MoodLog.user_id == user_id)
        .order_by(MoodLog.date.desc())
    )
    dates = [row[0] for row in result.all()]

    if not dates:
        return 0

    streak = 0
    expected = date.today()
    for d in dates:
        if d == expected:
            streak += 1
            expected -= timedelta(days=1)
        else:
            break
    return streak


async def get_mood_trend(db: AsyncSession, user_id: int, days: int = 30) -> dict:
    """Get mood trend data for line chart."""
    start_date = date.today() - timedelta(days=days)
    result = await db.execute(
        select(MoodLog)
        .where(and_(MoodLog.user_id == user_id, MoodLog.date >= start_date))
        .order_by(MoodLog.date.asc())
    )
    logs = result.scalars().all()

    return {
        "dates": [log.date.isoformat() for log in logs],
        "sentiment_scores": [round(log.avg_sentiment, 4) for log in logs],
        "risk_scores": [round(log.avg_risk_score, 4) for log in logs],
    }


async def get_sentiment_distribution(db: AsyncSession, user_id: int) -> dict:
    """Get sentiment distribution for pie chart."""
    result = await db.execute(
        select(Message.sentiment_score).where(
            and_(
                Message.user_id == user_id,
                Message.role == "user",
                Message.sentiment_score.isnot(None),
            )
        )
    )
    scores = [row[0] for row in result.all()]

    positive = sum(1 for s in scores if s > 0.05)
    negative = sum(1 for s in scores if s < -0.05)
    neutral = len(scores) - positive - negative

    return {"positive": positive, "neutral": neutral, "negative": negative}


async def get_behavioral_patterns(db: AsyncSession, user_id: int) -> dict:
    """Get behavioral pattern data."""
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    result = await db.execute(
        select(Message).where(
            and_(
                Message.user_id == user_id,
                Message.role == "user",
                Message.created_at >= thirty_days_ago,
            )
        )
    )
    messages = result.scalars().all()

    if not messages:
        return {
            "late_night_days": 0,
            "avg_message_length": 0.0,
            "most_active_hour": 0,
            "weekly_frequency": [0] * 7,
        }

    # Late-night days (distinct days with msgs between 00:00-05:00)
    late_night_dates = set()
    for m in messages:
        if 0 <= m.created_at.hour < 5:
            late_night_dates.add(m.created_at.date())

    # Average message length
    avg_length = sum(m.message_length for m in messages) / len(messages)

    # Most active hour
    hour_counts = Counter(m.created_at.hour for m in messages)
    most_active_hour = hour_counts.most_common(1)[0][0]

    # Weekly frequency (Mon=0 to Sun=6)
    day_counts = Counter(m.created_at.weekday() for m in messages)
    weekly_frequency = [day_counts.get(i, 0) for i in range(7)]

    return {
        "late_night_days": len(late_night_dates),
        "avg_message_length": round(avg_length, 1),
        "most_active_hour": most_active_hour,
        "weekly_frequency": weekly_frequency,
    }
