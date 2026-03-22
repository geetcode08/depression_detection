# Glossary

| Term | Definition |
|------|-----------|
| **Aura** | The AI assistant persona used in the chatbot. Warm, empathetic, non-clinical. |
| **VADER** | Valence Aware Dictionary and sEntiment Reasoner. Rule-based sentiment analysis tool. Returns compound score from -1.0 (most negative) to +1.0 (most positive). |
| **TF-IDF** | Term Frequency–Inverse Document Frequency. Text vectorization technique that weights words by importance. |
| **LogReg** | Logistic Regression. Binary classifier used for depression risk scoring. |
| **Risk Score** | Float 0.0–1.0 from ML model indicating depression risk probability. |
| **Risk Label** | Categorical: `low` (0–0.35), `medium` (0.35–0.65), `high` (0.65–1.0). |
| **Sentiment Score** | VADER compound score for a message. Range: -1.0 to +1.0. |
| **Crisis Alert** | Flag set when `risk_label == 'high'`. Triggers helpline display on frontend. |
| **Consent Gate** | Mechanism requiring explicit user consent before any analysis data is stored. |
| **Mood Log** | Daily aggregation of user's sentiment, risk, and behavioral data. One row per user per day. |
| **Groq API** | LLM inference API using llama3-8b-8192 model. Primary chatbot backend. |
| **JWT** | JSON Web Token. Stateless authentication token with 24h expiry. |
| **Session** | A `chat_session` in the DB, grouping messages in a single conversation. |
| **Behavioral Analytics** | Pattern analysis: late-night messaging, message length trends, activity frequency. |
| **Explainability** | Feature: showing top TF-IDF keywords that contributed to risk prediction. |
| **DAIC-WOZ** | Distress Analysis Interview Corpus. Research dataset for depression detection. |
| **MVP** | Minimum Viable Product. The initial working version of the system. |
| **PII** | Personally Identifiable Information. Must be minimized and protected. |
