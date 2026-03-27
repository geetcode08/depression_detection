import pytest

from services import nlp_service
from services.nlp_service import analyze_with_threshold, get_risk_label, run_ml_model, run_vader


def test_sentiment_negative():
    score = run_vader("I feel hopeless and sad, nothing matters")
    assert score < 0


def test_sentiment_positive():
    score = run_vader("I am so happy today, everything is wonderful")
    assert score > 0


def test_risk_label_thresholds():
    assert get_risk_label(0.34) == "low"
    assert get_risk_label(0.35) == "medium"
    assert get_risk_label(0.65) == "high"


@pytest.mark.asyncio
async def test_threshold_under_50_words_returns_gathering():
    result = await analyze_with_threshold(
        text="short check in",
        session_word_count=49,
        cumulative_word_count=49,
    )
    assert result.analysis_tier == "gathering"
    assert result.risk_score is None


@pytest.mark.asyncio
async def test_threshold_50_words_returns_sentiment_only():
    text = "calm " * 50
    result = await analyze_with_threshold(
        text=text,
        session_word_count=50,
        cumulative_word_count=50,
    )
    assert result.analysis_tier == "sentiment_only"
    assert result.sentiment_score is not None
    assert result.risk_score is None


@pytest.mark.asyncio
async def test_threshold_150_words_returns_emotion_detected():
    text = "I am tired but trying " * 20
    result = await analyze_with_threshold(
        text=text,
        session_word_count=150,
        cumulative_word_count=150,
    )
    assert result.analysis_tier == "emotion_detected"
    assert result.sentiment_score is not None


@pytest.mark.asyncio
async def test_threshold_300_words_caps_preliminary_risk():
    text = "I hate everything and I am broken " * 35
    result = await analyze_with_threshold(
        text=text,
        session_word_count=300,
        cumulative_word_count=300,
    )
    assert result.analysis_tier == "preliminary_screening"
    assert result.risk_label in {"low", "medium"}
    assert (result.risk_score or 0.0) < 0.65


@pytest.mark.asyncio
async def test_threshold_600_words_allows_full_assessment():
    text = "I have been under pressure and feel low often " * 40
    result = await analyze_with_threshold(
        text=text,
        session_word_count=600,
        cumulative_word_count=600,
    )
    assert result.analysis_tier == "full_assessment"
    assert result.risk_label in {"low", "medium", "high"}


def test_false_positive_phrase_dampening_not_high():
    # Construct long context to satisfy minimum inference length without external fixtures.
    class Msg:
        def __init__(self, content: str):
            self.content = content

    messages = [Msg("Traffic has been bad this week but I am okay overall") for _ in range(4)]
    score, _, _ = run_ml_model(
        current_text="I hate this traffic but otherwise my day is going fine and I feel okay",
        session_messages=messages,
        session_time_hour=14,
        previous_scores=[0.2, 0.25],
    )
    assert score is not None
    assert score < 0.65


def test_no_ml_inference_under_30_words():
    score, keywords, confidence = run_ml_model(
        current_text="too short",
        session_messages=[],
        session_time_hour=11,
        previous_scores=[],
    )
    assert score is None
    assert keywords == []
    assert confidence is None
