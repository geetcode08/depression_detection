from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from schemas.dashboard import StatsResponse, MoodTrendResponse, SentimentDistResponse, BehaviorResponse
from services.auth_service import get_current_user, require_consent
from services.behavioral_service import (
    get_dashboard_stats,
    get_mood_trend,
    get_sentiment_distribution,
    get_behavioral_patterns,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=StatsResponse)
async def stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_consent(current_user)
    data = await get_dashboard_stats(db, current_user.id)
    return StatsResponse(**data)


@router.get("/mood", response_model=MoodTrendResponse)
async def mood_trend(
    days: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_consent(current_user)
    data = await get_mood_trend(db, current_user.id, days)
    return MoodTrendResponse(**data)


@router.get("/sentiment-dist", response_model=SentimentDistResponse)
async def sentiment_distribution(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_consent(current_user)
    data = await get_sentiment_distribution(db, current_user.id)
    return SentimentDistResponse(**data)


@router.get("/behavior", response_model=BehaviorResponse)
async def behavior(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_consent(current_user)
    data = await get_behavioral_patterns(db, current_user.id)
    return BehaviorResponse(**data)
