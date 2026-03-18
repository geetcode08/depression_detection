import logging
from pathlib import Path
from typing import List, Tuple

import joblib
import numpy as np
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from schemas.analysis import AnalysisResult

logger = logging.getLogger(__name__)

# Load VADER analyzer
vader_analyzer = SentimentIntensityAnalyzer()

# Load ML model and vectorizer
ML_DIR = Path(__file__).parent.parent / "ml"
_model = None
_vectorizer = None


def load_ml_models() -> None:
    """Load ML model and vectorizer from disk. Called once at app startup."""
    global _model, _vectorizer
    model_path = ML_DIR / "model.pkl"
    vectorizer_path = ML_DIR / "vectorizer.pkl"

    if model_path.exists() and vectorizer_path.exists():
        _model = joblib.load(model_path)
        _vectorizer = joblib.load(vectorizer_path)
        logger.info("ML models loaded successfully from %s", ML_DIR)
    else:
        logger.warning(
            "ML model files not found in %s. Risk scoring will use fallback. "
            "Run ml_training scripts to generate model.pkl and vectorizer.pkl.",
            ML_DIR,
        )


def get_sentiment_score(text: str) -> float:
    """Return VADER compound sentiment score (-1.0 to 1.0)."""
    scores = vader_analyzer.polarity_scores(text)
    return scores["compound"]


def get_risk_score(text: str) -> Tuple[float, float]:
    """
    Return (risk_score, confidence) from the ML model.
    Falls back to sentiment-based heuristic if model not loaded.
    """
    if _model is None or _vectorizer is None:
        # Fallback: use inverted sentiment as a rough proxy
        sentiment = get_sentiment_score(text)
        risk_score = max(0.0, min(1.0, (1.0 - sentiment) / 2.0))
        return risk_score, 0.5

    tfidf_vector = _vectorizer.transform([text])
    probabilities = _model.predict_proba(tfidf_vector)[0]
    # Assuming class 1 = depression
    risk_score = float(probabilities[1]) if len(probabilities) > 1 else float(probabilities[0])
    confidence = float(np.max(probabilities))
    return risk_score, confidence


def get_risk_label(risk_score: float) -> str:
    """Map risk score to label."""
    if risk_score >= 0.65:
        return "high"
    elif risk_score >= 0.35:
        return "medium"
    return "low"


def get_top_keywords(text: str, n: int = 5) -> List[str]:
    """
    Extract top N keywords contributing to the risk prediction
    using TF-IDF feature weights and LogReg coefficients.
    """
    if _model is None or _vectorizer is None:
        # Fallback: return most significant words by length
        words = text.lower().split()
        unique_words = list(dict.fromkeys(w for w in words if len(w) > 3))
        return unique_words[:n]

    tfidf_vector = _vectorizer.transform([text])
    feature_names = np.array(_vectorizer.get_feature_names_out())
    coefficients = _model.coef_[0]

    # Get indices of non-zero TF-IDF features for this text
    nonzero_indices = tfidf_vector.nonzero()[1]
    if len(nonzero_indices) == 0:
        return []

    # Weight = TF-IDF value * coefficient (positive coeff = depression class)
    weighted_scores = {}
    for idx in nonzero_indices:
        weighted_scores[idx] = float(tfidf_vector[0, idx]) * coefficients[idx]

    # Sort by weighted score descending (most contributing to depression)
    sorted_indices = sorted(weighted_scores, key=weighted_scores.get, reverse=True)
    top_indices = sorted_indices[:n]

    return [feature_names[i] for i in top_indices]


def analyze_text(text: str) -> AnalysisResult:
    """Run the full NLP analysis pipeline on a text input."""
    sentiment_score = get_sentiment_score(text)
    risk_score, confidence = get_risk_score(text)
    risk_label = get_risk_label(risk_score)
    top_keywords = get_top_keywords(text)
    crisis_alert = risk_label == "high"

    return AnalysisResult(
        sentiment_score=round(sentiment_score, 4),
        risk_score=round(risk_score, 4),
        risk_label=risk_label,
        top_keywords=top_keywords,
        confidence=round(confidence, 4),
        emotion_label=None,
        crisis_alert=crisis_alert,
    )
