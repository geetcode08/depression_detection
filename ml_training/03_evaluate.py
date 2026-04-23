"""
03_evaluate.py — Evaluate trained model with detailed metrics.

Input: data/processed/clean_data.csv, outputs/model.pkl, outputs/vectorizer.pkl
Output: Prints metrics, saves confusion matrix plot to outputs/confusion_matrix.png
"""

import os
import sys

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
    f1_score,
)

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "data", "processed")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "outputs")


def main():
    print("=" * 60)
    print("Step 3: Evaluating Model")
    print("=" * 60)

    # Load data
    data_path = os.path.join(PROCESSED_DIR, "clean_data.csv")
    model_path = os.path.join(OUTPUT_DIR, "model.pkl")
    vectorizer_path = os.path.join(OUTPUT_DIR, "vectorizer.pkl")

    for path in [data_path, model_path, vectorizer_path]:
        if not os.path.exists(path):
            print(f"ERROR: {path} not found. Run previous scripts first.")
            sys.exit(1)

    df = pd.read_csv(data_path)
    _ = joblib.load(model_path)
    _ = joblib.load(vectorizer_path)

    X = df["cleaned_text"]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    max_features=15000,
                    ngram_range=(1, 2),
                    sublinear_tf=True,
                    min_df=3,
                    max_df=0.90,
                    strip_accents="unicode",
                    analyzer="word",
                ),
            ),
            (
                "logreg",
                LogisticRegression(
                    C=0.5,
                    class_weight="balanced",
                    solver="lbfgs",
                    max_iter=1000,
                    random_state=42,
                ),
            ),
        ]
    )

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=skf, scoring="roc_auc")
    print(f"\nCV AUC: {cv_scores.mean():.4f} +- {cv_scores.std():.4f}")

    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    # Metrics
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="weighted")
    roc_auc = roc_auc_score(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred)

    print(f"\nAccuracy:  {accuracy:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print(f"ROC-AUC:   {roc_auc:.4f}")

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["No Depression", "Depression"]))
    print(f"Test AUC: {roc_auc:.4f}")

    print("Confusion Matrix:")
    print(cm)

    # Save confusion matrix plot
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        fig, ax = plt.subplots(figsize=(8, 6))
        im = ax.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
        ax.set_title("Confusion Matrix")
        plt.colorbar(im, ax=ax)

        classes = ["No Depression", "Depression"]
        tick_marks = np.arange(len(classes))
        ax.set_xticks(tick_marks)
        ax.set_xticklabels(classes)
        ax.set_yticks(tick_marks)
        ax.set_yticklabels(classes)

        # Add text annotations
        thresh = cm.max() / 2.0
        for i in range(cm.shape[0]):
            for j in range(cm.shape[1]):
                ax.text(j, i, format(cm[i, j], "d"),
                        ha="center", va="center",
                        color="white" if cm[i, j] > thresh else "black")

        ax.set_ylabel("True Label")
        ax.set_xlabel("Predicted Label")
        plt.tight_layout()

        plot_path = os.path.join(OUTPUT_DIR, "confusion_matrix.png")
        plt.savefig(plot_path, dpi=150)
        print(f"\nConfusion matrix saved to: {plot_path}")
    except ImportError:
        print("\nmatplotlib not installed — skipping confusion matrix plot")

    # Check if F1 meets threshold
    if f1 >= 0.75:
        print(f"\n✅ F1-Score ({f1:.4f}) meets the minimum threshold (0.75)")
    else:
        print(f"\n⚠️ F1-Score ({f1:.4f}) is below the minimum threshold (0.75)")
        print("Consider: adjusting C, using SGDClassifier, or using more data")

    print("\nEvaluation complete!")


if __name__ == "__main__":
    main()
