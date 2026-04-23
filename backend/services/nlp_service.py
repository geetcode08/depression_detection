"""NLP service with threshold-gated analysis and safer risk inference."""

import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import httpx
import joblib
import numpy as np
from sqlalchemy import and_, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from config import settings
from models.message import Message
from schemas.analysis import AnalysisResult

logger = logging.getLogger(__name__)

# Load VADER analyzer once.
vader_analyzer = SentimentIntensityAnalyzer()

ML_DIR = Path(__file__).parent.parent / "ml"
_model = None
_vectorizer = None
_emotion_cache: Dict[int, Optional[str]] = {}

CRISIS_PATTERNS = [
    r"\bsuicid(e|al)\b",
    r"\bkill myself\b",
    r"\bend my life\b",
    r"\bself\s*harm\b",
    r"\bdon'?t want to live\b",
]

HUGGINGFACE_EMOTION_CONFIG = {
    "label_mapping": {
        "anger": "frustrated",
        "disgust": "overwhelmed",
        "fear": "anxious",
        "joy": "positive",
        "neutral": "calm",
        "sadness": "low",
        "surprise": "unsettled",
    },
    "min_confidence": 0.45,
    "chunking_strategy": "sentence_level_average",
    "max_input_chars": 1800,
    "override_neutral_with_vader": True,
    "vader_override_threshold": -0.3,
}

ML_CLASSIFIER_CONFIG = {
    "context_window_messages": 5,
    "minimum_words_for_inference": 15,
    "score_dampening_factor": 0.85,
    "false_positive_keywords": [
        "hate",
        "kill",
        "dead",
        "die",
        "sick",
        "awful",
        "terrible",
        "horrific",
        "disgusting",
        "worst",
        "nightmare",
        "destroyed",
        "broken",
    ],
    "false_positive_dampening": 0.7,
    "prepend_time_context": True,
    "smoothing_window": 3,
}

EMOTION_MODEL_ID = "j-hartmann/emotion-english-distilroberta-base"


def load_ml_models() -> None:
    """Load ML model and vectorizer from disk. Called once at app startup."""
    global _model, _vectorizer
    model_path = ML_DIR / "model.pkl"
    vectorizer_path = ML_DIR / "vectorizer.pkl"

    if model_path.exists() and vectorizer_path.exists():
        try:
            _model = joblib.load(model_path)
            _vectorizer = joblib.load(vectorizer_path)
            logger.info("ML models loaded successfully from %s", ML_DIR)
        except Exception as exc:
            _model = None
            _vectorizer = None
            logger.warning("ML model files found but failed to load: %s", exc)
    else:
        logger.warning(
            "ML model files not found in %s. Risk scoring will use fallback. "
            "Run ml_training scripts to generate model.pkl and vectorizer.pkl.",
            ML_DIR,
        )


async def count_user_words_in_session(session_id: int, db: AsyncSession) -> int:
    """Count total words across all user messages in a session."""
    result = await db.execute(
        select(Message.content).where(
            and_(
                Message.session_id == session_id,
                Message.role == "user",
            )
        )
    )
    rows = result.all()
    return sum(len((row[0] or "").split()) for row in rows)


async def count_user_words_cumulative(user_id: int, db: AsyncSession) -> int:
    """Count total words ever written by a user across sessions."""
    result = await db.execute(
        select(Message.content).where(
            and_(
                Message.user_id == user_id,
                Message.role == "user",
            )
        )
    )
    rows = result.all()
    return sum(len((row[0] or "").split()) for row in rows)


async def get_recent_user_messages(session_id: int, db: AsyncSession, limit: int = 5) -> List[Message]:
    """Fetch latest user messages in a session for context-window ML inference."""
    result = await db.execute(
        select(Message)
        .where(and_(Message.session_id == session_id, Message.role == "user"))
        .order_by(desc(Message.created_at))
        .limit(limit)
    )
    return list(reversed(result.scalars().all()))


async def get_recent_session_risk_scores(session_id: int, db: AsyncSession, limit: int = 2) -> List[float]:
    """Fetch previous non-null risk scores for smoothing."""
    result = await db.execute(
        select(Message.depression_risk_score)
        .where(
            and_(
                Message.session_id == session_id,
                Message.role == "user",
                Message.depression_risk_score.is_not(None),
            )
        )
        .order_by(desc(Message.created_at))
        .limit(limit)
    )
    values = [float(row[0]) for row in result.all() if row[0] is not None]
    return list(reversed(values))


def run_vader(text: str) -> float:
    """Return VADER compound sentiment score (-1.0 to 1.0)."""
    scores = vader_analyzer.polarity_scores(text)
    return float(scores["compound"])


def get_sentiment_score(text: str) -> float:
    """Backward-compatible sentiment function for existing callers/tests."""
    return run_vader(text)


def has_crisis_language(text: str) -> bool:
    lowered = text.lower()
    return any(re.search(pattern, lowered) for pattern in CRISIS_PATTERNS)


def get_risk_label(risk_score: float) -> str:
    if risk_score >= 0.65:
        return "high"
    if risk_score >= 0.35:
        return "medium"
    return "low"


def _extract_top_keywords(vectorized) -> List[str]:
    if _vectorizer is None:
        return []
    feature_names = _vectorizer.get_feature_names_out()
    tfidf_scores = vectorized.toarray()[0]
    top_indices = tfidf_scores.argsort()[-5:][::-1]
    return [str(feature_names[i]) for i in top_indices if tfidf_scores[i] > 0]


async def call_hf_api(model: str, inputs: str) -> list:
    """Call HuggingFace Inference API, failing gracefully if unavailable."""
    if not settings.HF_API_TOKEN:
        return [[{"label": "neutral", "score": 1.0}]]

    headers = {"Authorization": f"Bearer {settings.HF_API_TOKEN}"}
    payload = {"inputs": inputs, "options": {"wait_for_model": True}}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"https://api-inference.huggingface.co/models/{model}",
                headers=headers,
                json=payload,
            )
        if response.status_code != 200:
            return [[{"label": "neutral", "score": 1.0}]]
        return response.json()
    except Exception as exc:
        logger.warning("HF emotion model call failed: %s", exc)
        return [[{"label": "neutral", "score": 1.0}]]


def _split_sentences(text: str) -> List[str]:
    chunks = [chunk.strip() for chunk in re.split(r"(?<=[.!?])\s+", text) if chunk.strip()]
    return chunks or [text.strip()]


async def run_emotion_model(
    text: str,
    session_word_count: int,
    sentiment_score: Optional[float] = None,
) -> Optional[str]:
    """Return friendly emotion label only when enough words are available."""
    if session_word_count < 150:
        return None

    truncated = text[: HUGGINGFACE_EMOTION_CONFIG["max_input_chars"]]
    sentence_chunks = _split_sentences(truncated)

    # Aggregate confidence per label across chunks.
    totals: Dict[str, float] = {}
    counts: Dict[str, int] = {}

    for chunk in sentence_chunks:
        result = await call_hf_api(EMOTION_MODEL_ID, chunk)
        if not result or not isinstance(result, list) or not result[0]:
            continue
        ranked = sorted(result[0], key=lambda x: x.get("score", 0.0), reverse=True)
        top = ranked[0]
        raw_label = str(top.get("label", "neutral")).lower()
        raw_score = float(top.get("score", 0.0))
        totals[raw_label] = totals.get(raw_label, 0.0) + raw_score
        counts[raw_label] = counts.get(raw_label, 0) + 1

    if not totals:
        return None

    averaged = {label: totals[label] / counts[label] for label in totals}
    top_label = max(averaged, key=averaged.get)
    top_score = averaged[top_label]

    if top_score < HUGGINGFACE_EMOTION_CONFIG["min_confidence"]:
        return None

    mapped = HUGGINGFACE_EMOTION_CONFIG["label_mapping"].get(top_label, top_label)
    if (
        mapped == "calm"
        and HUGGINGFACE_EMOTION_CONFIG["override_neutral_with_vader"]
        and (sentiment_score if sentiment_score is not None else run_vader(text))
        < HUGGINGFACE_EMOTION_CONFIG["vader_override_threshold"]
    ):
        return "low"

    return mapped


def run_ml_model(
    current_text: str,
    session_messages: List[Message],
    session_time_hour: int,
    previous_scores: Optional[List[float]] = None,
) -> Tuple[Optional[float], List[str], Optional[float]]:
    """Run TF-IDF + LogReg with context, dampening and smoothing compensations."""
    config = ML_CLASSIFIER_CONFIG
    previous_scores = previous_scores or []

    recent_messages = session_messages[-config["context_window_messages"] :]
    context_text = " ".join((msg.content or "") for msg in recent_messages)
    full_text = (f"{context_text} {current_text}").strip()

    if len(full_text.split()) < config["minimum_words_for_inference"]:
        return None, [], None

    if config["prepend_time_context"] and 0 <= session_time_hour <= 5:
        full_text = "late_night_session " + full_text

    if _model is None or _vectorizer is None:
        # Safe fallback keeps risk conservative when ML artifacts are unavailable.
        fallback_score = max(0.0, min(1.0, -run_vader(current_text) * 0.45))
        return fallback_score, [], 0.0

    vectorized = _vectorizer.transform([full_text])
    probs = _model.predict_proba(vectorized)[0]
    raw_score = float(probs[1]) if len(probs) > 1 else float(probs[0])
    confidence = float(np.max(probs))

    dampened_score = raw_score * config["score_dampening_factor"]
    vader_score = run_vader(current_text)

    if vader_score > 0.0 and any(kw in full_text.lower() for kw in config["false_positive_keywords"]):
        dampened_score *= config["false_positive_dampening"]

    smoothing_window = config["smoothing_window"]
    prior = previous_scores[-(smoothing_window - 1) :] if smoothing_window > 1 else []
    smoothed_values = [*prior, dampened_score]
    smoothed_score = sum(smoothed_values) / len(smoothed_values)

    top_keywords = _extract_top_keywords(vectorized)
    return float(max(0.0, min(1.0, smoothed_score))), top_keywords, confidence


async def analyze_with_threshold(
    text: str,
    session_word_count: int,
    cumulative_word_count: int,
    session_id: Optional[int] = None,
    session_messages: Optional[List[Message]] = None,
    session_time_hour: Optional[int] = None,
    previous_scores: Optional[List[float]] = None,
) -> AnalysisResult:
    """Return analysis appropriate to available conversation depth."""
    result = AnalysisResult(
        sentiment_score=None,
        risk_score=None,
        risk_label=None,
        top_keywords=[],
        confidence=None,
        emotion_label=None,
        analysis_tier="insufficient_data",
        words_until_next_tier=None,
    )

    session_messages = session_messages or []
    session_time_hour = datetime.utcnow().hour if session_time_hour is None else session_time_hour
    previous_scores = previous_scores or []

    if session_word_count < 50:
        result.analysis_tier = "gathering"
        result.words_until_next_tier = 50 - session_word_count
        return result

    if 50 <= session_word_count < 150:
        vader_score = run_vader(text)
        result.sentiment_score = round(vader_score, 4)
        result.analysis_tier = "sentiment_only"
        result.words_until_next_tier = 150 - session_word_count
        return result

    if 150 <= session_word_count < 300:
        vader_score = run_vader(text)
        if session_id is not None and session_id in _emotion_cache:
            emotion = _emotion_cache[session_id]
        else:
            emotion = await run_emotion_model(text, session_word_count=session_word_count, sentiment_score=vader_score)
            if session_id is not None:
                _emotion_cache[session_id] = emotion
        result.sentiment_score = round(vader_score, 4)
        result.emotion_label = emotion
        result.analysis_tier = "emotion_detected"
        result.words_until_next_tier = 300 - session_word_count
        return result

    if 300 <= session_word_count < 600:
        vader_score = run_vader(text)
        if session_id is not None and session_id in _emotion_cache:
            emotion = _emotion_cache[session_id]
        else:
            emotion = await run_emotion_model(text, session_word_count=session_word_count, sentiment_score=vader_score)
            if session_id is not None:
                _emotion_cache[session_id] = emotion
        risk_score, keywords, confidence = run_ml_model(
            current_text=text,
            session_messages=session_messages,
            session_time_hour=session_time_hour,
            previous_scores=previous_scores,
        )
        if risk_score is None:
            risk_score = 0.0
        risk_label = "low" if risk_score < 0.35 else "medium"

        result.sentiment_score = round(vader_score, 4)
        result.emotion_label = emotion
        result.risk_score = round(min(risk_score, 0.64), 4)
        result.risk_label = risk_label
        result.top_keywords = keywords
        result.confidence = round(confidence, 4) if confidence is not None else None
        result.analysis_tier = "preliminary_screening"
        result.words_until_next_tier = 600 - session_word_count
        return result

    vader_score = run_vader(text)
    if session_id is not None and session_id in _emotion_cache:
        emotion = _emotion_cache[session_id]
    else:
        emotion = await run_emotion_model(text, session_word_count=session_word_count, sentiment_score=vader_score)
        if session_id is not None:
            _emotion_cache[session_id] = emotion
    risk_score, keywords, confidence = run_ml_model(
        current_text=text,
        session_messages=session_messages,
        session_time_hour=session_time_hour,
        previous_scores=previous_scores,
    )

    if risk_score is None:
        risk_score = 0.0

    risk_label = "low" if risk_score < 0.35 else "medium" if risk_score < 0.65 else "high"

    result.sentiment_score = round(vader_score, 4)
    result.emotion_label = emotion
    result.risk_score = round(risk_score, 4)
    result.risk_label = risk_label
    result.top_keywords = keywords
    result.confidence = round(confidence, 4) if confidence is not None else None
    result.analysis_tier = "full_assessment"

    if cumulative_word_count >= 1500:
        result.longitudinal_patterns_available = True
    if cumulative_word_count >= 4000:
        result.behavioral_profile_available = True

    if cumulative_word_count < 1500:
        result.words_until_next_tier = 1500 - cumulative_word_count
    elif cumulative_word_count < 4000:
        result.words_until_next_tier = 4000 - cumulative_word_count

    return result


def analyze_text(text: str) -> AnalysisResult:
    """Backward-compatible direct analysis path used by analysis router/tests."""
    sentiment_score = run_vader(text)
    risk_score, keywords, confidence = run_ml_model(
        current_text=text,
        session_messages=[],
        session_time_hour=datetime.utcnow().hour,
        previous_scores=[],
    )

    safe_risk = 0.0 if risk_score is None else risk_score
    return AnalysisResult(
        sentiment_score=round(sentiment_score, 4),
        risk_score=round(safe_risk, 4),
        risk_label=get_risk_label(safe_risk),
        top_keywords=keywords,
        confidence=round(confidence, 4) if confidence is not None else 0.0,
        emotion_label=None,
        analysis_tier="full_assessment",
        crisis_alert=has_crisis_language(text),
    )
