"""
02_train_model.py — Train TF-IDF + Logistic Regression model for depression classification.

Input: data/processed/clean_data.csv (from 01_preprocess.py)
Output: outputs/model.pkl, outputs/vectorizer.pkl
"""

import os
import sys

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "data", "processed")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "outputs")


def main():
    print("=" * 60)
    print("Step 2: Training Model")
    print("=" * 60)

    # Load processed data
    data_path = os.path.join(PROCESSED_DIR, "clean_data.csv")
    if not os.path.exists(data_path):
        print(f"ERROR: {data_path} not found. Run 01_preprocess.py first.")
        sys.exit(1)

    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} samples")

    X = df["cleaned_text"]
    y = df["label"]

    # Train/test split (80/20, stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train: {len(X_train)}, Test: {len(X_test)}")

    # TF-IDF Vectorization
    print("\nFitting TF-IDF vectorizer...")
    vectorizer = TfidfVectorizer(
        max_features=10000,
        ngram_range=(1, 2),
        min_df=3,
        max_df=0.90,
        sublinear_tf=True,
    )
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)
    print(f"Vocabulary size: {len(vectorizer.vocabulary_)}")

    # Train Logistic Regression
    print("\nTraining Logistic Regression...")
    model = LogisticRegression(
        solver="liblinear",
        C=1.0,
        max_iter=1000,
        class_weight="balanced",
        random_state=42,
    )
    model.fit(X_train_tfidf, y_train)

    # Evaluate on test set
    y_pred = model.predict(X_test_tfidf)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nAccuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["No Depression", "Depression"]))

    # Save model and vectorizer
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    model_path = os.path.join(OUTPUT_DIR, "model.pkl")
    vectorizer_path = os.path.join(OUTPUT_DIR, "vectorizer.pkl")

    joblib.dump(model, model_path)
    joblib.dump(vectorizer, vectorizer_path)

    print(f"\nModel saved to: {model_path}")
    print(f"Vectorizer saved to: {vectorizer_path}")
    print(f"\nCopy these files to backend/ml/:")
    print(f"  cp {model_path} ../backend/ml/model.pkl")
    print(f"  cp {vectorizer_path} ../backend/ml/vectorizer.pkl")
    print("\nTraining complete!")


if __name__ == "__main__":
    main()
