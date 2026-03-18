from fastapi import APIRouter, Depends, Query

from models.user import User
from schemas.dashboard import RecommendationResponse
from services.auth_service import get_current_user, require_consent
from services.recommendation_service import get_recommendations

router = APIRouter(prefix="/recommend", tags=["Recommendations"])


@router.get("", response_model=RecommendationResponse)
async def recommend(
    risk_label: str = Query(..., pattern="^(low|medium|high)$"),
    current_user: User = Depends(get_current_user),
):
    require_consent(current_user)
    recommendations = get_recommendations(risk_label)
    return RecommendationResponse(recommendations=recommendations)
