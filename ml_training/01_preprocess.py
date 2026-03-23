"""
01_preprocess.py — Clean and tokenize dataset for depression classification.

Expected input: data/raw/ directory containing a CSV with 'text' and 'label' columns.
  - label: 0 = no depression, 1 = depression
Output: data/processed/clean_data.csv with 'cleaned_text' and 'label' columns.
"""

import os
import re
import sys
from typing import List

import nltk
import pandas as pd
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

# Download required NLTK data
nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)
nltk.download("stopwords", quiet=True)

RAW_DIR = os.path.join(os.path.dirname(__file__), "data", "raw")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "data", "processed")
MAX_SAMPLES = int(os.getenv("MAX_SAMPLES", "50000"))
USE_STEMMING = os.getenv("USE_STEMMING", "0") == "1"


def find_dataset() -> str:
    """Find the first CSV file in data/raw/."""
    if not os.path.exists(RAW_DIR):
        os.makedirs(RAW_DIR, exist_ok=True)
        print(f"ERROR: No dataset found. Place a CSV file in {RAW_DIR}")
        print("Expected columns: 'text' (string), 'label' (0 or 1)")
        sys.exit(1)

    csv_files = [f for f in os.listdir(RAW_DIR) if f.endswith(".csv")]
    if not csv_files:
        print(f"ERROR: No CSV files found in {RAW_DIR}")
        sys.exit(1)

    return os.path.join(RAW_DIR, csv_files[0])


def clean_text(text: str, stemmer: PorterStemmer, stop_words: set) -> str:
    """Clean a single text entry."""
    # Lowercase
    text = text.lower()
    # Remove URLs
    text = re.sub(r"http\S+|www\.\S+", "", text)
    # Remove email addresses
    text = re.sub(r"\S+@\S+", "", text)
    # Remove special characters and numbers
    text = re.sub(r"[^a-zA-Z\s]", "", text)
    # Remove extra whitespace
    text = re.sub(r"\s+", " ", text).strip()

    # Lightweight tokenization keeps preprocessing practical on very large datasets.
    tokens: List[str] = text.split()
    # Remove stopwords and stem
    tokens = [w for w in tokens if w not in stop_words and len(w) > 2]
    if USE_STEMMING:
        tokens = [stemmer.stem(w) for w in tokens]

    return " ".join(tokens)


def main():
    print("=" * 60)
    print("Step 1: Preprocessing Dataset")
    print("=" * 60)

    # Find and load dataset
    dataset_path = find_dataset()
    print(f"Loading dataset: {dataset_path}")
    # Some public datasets contain malformed rows; skip unreadable lines.
    df = pd.read_csv(dataset_path, on_bad_lines="skip", engine="python")
    print(f"Raw dataset shape: {df.shape}")

    # Validate columns
    if "text" not in df.columns or "label" not in df.columns:
        # Try common column name variations
        col_map = {}
        for col in df.columns:
            lower = col.lower().strip()
            if lower in (
                "text",
                "clean_text",
                "message",
                "content",
                "tweet",
                "post",
                "body",
                "selftext",
                "title",
            ):
                col_map["text"] = col
            elif lower in ("label", "class", "target", "is_depression", "depression"):
                col_map["label"] = col

        if "text" in col_map and "label" in col_map:
            df = df.rename(columns={col_map["text"]: "text", col_map["label"]: "label"})
        else:
            print(f"ERROR: CSV must have 'text' and 'label' columns. Found: {list(df.columns)}")
            sys.exit(1)

    # Drop NaN and short texts
    df = df.dropna(subset=["text", "label"])
    df = df[df["text"].str.len() >= 10]

    # Use a deterministic sample for very large corpora to keep training time practical.
    if len(df) > MAX_SAMPLES:
        print(f"Sampling {MAX_SAMPLES} rows from {len(df)} for MVP training speed...")
        df = df.sample(n=MAX_SAMPLES, random_state=42)

    print(f"After removing NaN/short texts: {df.shape}")

    # Ensure label is binary
    df["label"] = df["label"].astype(int)
    print(f"Label distribution:\n{df['label'].value_counts()}")

    # Initialize NLP tools
    stemmer = PorterStemmer()
    stop_words = set(stopwords.words("english"))

    # Clean texts
    print("Cleaning texts...")
    df["cleaned_text"] = df["text"].apply(lambda x: clean_text(str(x), stemmer, stop_words))

    # Remove empty cleaned texts
    df = df[df["cleaned_text"].str.len() > 0]

    # Save processed data
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    output_path = os.path.join(PROCESSED_DIR, "clean_data.csv")
    df[["cleaned_text", "label"]].to_csv(output_path, index=False)

    print(f"\nProcessed dataset saved to: {output_path}")
    print(f"Final shape: {df[['cleaned_text', 'label']].shape}")
    print(f"Label distribution:\n{df['label'].value_counts()}")
    print("\nPreprocessing complete!")


if __name__ == "__main__":
    main()
