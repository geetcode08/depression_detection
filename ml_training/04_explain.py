"""
04_explain.py — Extract and display top keywords contributing to predictions.

Uses TF-IDF feature names and LogReg coefficient weights for lightweight
explainability (mimics LIME without requiring the LIME library).

Input: outputs/model.pkl, outputs/vectorizer.pkl
"""

import os
import sys

import joblib
import numpy as np

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "outputs")


def get_top_global_keywords(model, vectorizer, n: int = 20) -> dict:
    """Get top N global keywords for each class based on coefficient weights."""
    feature_names = np.array(vectorizer.get_feature_names_out())
    coefficients = model.coef_[0]

    # Top keywords for depression (positive coefficients)
    depression_indices = np.argsort(coefficients)[-n:][::-1]
    depression_keywords = [
        (feature_names[i], round(coefficients[i], 4))
        for i in depression_indices
    ]

    # Top keywords for no-depression (negative coefficients)
    no_depression_indices = np.argsort(coefficients)[:n]
    no_depression_keywords = [
        (feature_names[i], round(coefficients[i], 4))
        for i in no_depression_indices
    ]

    return {
        "depression_indicators": depression_keywords,
        "no_depression_indicators": no_depression_keywords,
    }


def explain_prediction(text: str, model, vectorizer, n: int = 5) -> dict:
    """Explain a single prediction by showing top contributing keywords."""
    tfidf_vector = vectorizer.transform([text])
    feature_names = np.array(vectorizer.get_feature_names_out())
    coefficients = model.coef_[0]

    # Get prediction
    prediction = model.predict(tfidf_vector)[0]
    probability = model.predict_proba(tfidf_vector)[0]

    # Get non-zero features for this text
    nonzero_indices = tfidf_vector.nonzero()[1]

    # Calculate weighted importance
    weighted = {}
    for idx in nonzero_indices:
        weighted[idx] = float(tfidf_vector[0, idx]) * coefficients[idx]

    # Sort by absolute weighted value
    sorted_indices = sorted(weighted, key=lambda x: abs(weighted[x]), reverse=True)
    top_n = sorted_indices[:n]

    top_keywords = [
        {
            "keyword": feature_names[i],
            "weight": round(weighted[i], 4),
            "direction": "depression" if weighted[i] > 0 else "no_depression",
        }
        for i in top_n
    ]

    return {
        "text": text,
        "prediction": "depression" if prediction == 1 else "no_depression",
        "confidence": round(float(max(probability)), 4),
        "probability_depression": round(float(probability[1]), 4),
        "top_keywords": top_keywords,
    }


def main():
    print("=" * 60)
    print("Step 4: Model Explainability")
    print("=" * 60)

    model_path = os.path.join(OUTPUT_DIR, "model.pkl")
    vectorizer_path = os.path.join(OUTPUT_DIR, "vectorizer.pkl")

    for path in [model_path, vectorizer_path]:
        if not os.path.exists(path):
            print(f"ERROR: {path} not found. Run training scripts first.")
            sys.exit(1)

    model = joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)

    # Show global keywords
    print("\n--- Global Feature Importance ---")
    global_keywords = get_top_global_keywords(model, vectorizer, n=15)

    print("\nTop Depression Indicator Words:")
    for word, weight in global_keywords["depression_indicators"]:
        print(f"  {word:25s} → {weight:+.4f}")

    print("\nTop No-Depression Indicator Words:")
    for word, weight in global_keywords["no_depression_indicators"]:
        print(f"  {word:25s} → {weight:+.4f}")

    # Example predictions with explanations
    print("\n--- Example Predictions ---")
    test_texts = [
        "I feel so hopeless and alone, nothing matters anymore",
        "I had a great day today, feeling happy and grateful",
        "I can't stop crying, everything feels empty and meaningless",
        "Looking forward to the weekend with friends",
        "I'm tired all the time and can't find motivation to do anything",
    ]

    for text in test_texts:
        result = explain_prediction(text, model, vectorizer)
        print(f"\nText: '{text}'")
        print(f"  Prediction: {result['prediction']} (confidence: {result['confidence']})")
        print(f"  P(depression): {result['probability_depression']}")
        print(f"  Top keywords:")
        for kw in result["top_keywords"]:
            print(f"    {kw['keyword']:20s} → {kw['weight']:+.4f} ({kw['direction']})")

    print("\nExplainability analysis complete!")


if __name__ == "__main__":
    main()
