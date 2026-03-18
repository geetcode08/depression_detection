import pytest

from services.nlp_service import analyze_text, get_sentiment_score, get_risk_label


def test_sentiment_negative():
    score = get_sentiment_score("I feel hopeless and sad, nothing matters")
    assert score < 0


def test_sentiment_positive():
    score = get_sentiment_score("I am so happy today, everything is wonderful")
    assert score > 0


def test_sentiment_range():
    score = get_sentiment_score("Just a normal day")
    assert -1.0 <= score <= 1.0


def test_risk_label_low():
    assert get_risk_label(0.1) == "low"
    assert get_risk_label(0.34) == "low"


def test_risk_label_medium():
    assert get_risk_label(0.35) == "medium"
    assert get_risk_label(0.64) == "medium"


def test_risk_label_high():
    assert get_risk_label(0.65) == "high"
    assert get_risk_label(1.0) == "high"


def test_analyze_text_returns_all_fields():
    result = analyze_text("I feel quite sad and alone today")
    assert hasattr(result, "sentiment_score")
    assert hasattr(result, "risk_score")
    assert hasattr(result, "risk_label")
    assert hasattr(result, "top_keywords")
    assert hasattr(result, "confidence")
    assert hasattr(result, "crisis_alert")
    assert result.risk_label in ("low", "medium", "high")
    assert 0.0 <= result.risk_score <= 1.0
    assert -1.0 <= result.sentiment_score <= 1.0


def test_analyze_text_crisis_alert():
    # With fallback model, very negative text should trigger higher risk
    result = analyze_text("I want to end it all, there is no hope left for me")
    # crisis_alert should be True only if risk_label is 'high'
    assert result.crisis_alert == (result.risk_label == "high")
