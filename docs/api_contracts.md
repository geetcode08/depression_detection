# API Contracts

**Base URL (dev):** `http://localhost:8000/api/v1`

All endpoints return JSON. Protected endpoints require: `Authorization: Bearer <JWT_TOKEN>`

## Authentication

### POST /auth/register
**Body:** `{ username: string, email: string, password: string }`
**Response:** `{ id: int, username: string, email: string }`
**Notes:** Password hashed with `pbkdf2_sha256` via passlib. Returns 409 if email/username taken.

### POST /auth/login
**Body:** OAuth2 form data: `username=<email>&password=<password>` (`application/x-www-form-urlencoded`)
**Response:** `{ access_token: string, token_type: "bearer" }`
**Notes:** Token expiry: 24 hours.

### GET /auth/me
**Protected.** Returns current user profile from JWT payload.
**Response:** `{ id: int, username: string, email: string, consent_given: bool }`

### PATCH /auth/consent
**Protected.** Sets `consent_given=TRUE`. Required before any analysis.
**Response:** `{ message: "Consent granted" }`

### DELETE /auth/me
**Protected.** Deletes user and all associated data (cascade).
**Response:** `{ message: "Account deleted" }`

## Chat

### POST /chat/send
**Protected.**
**Body:** `{ session_id?: int, message: string }`
**Response:**
```json
{
  "reply": "string",
  "session_id": 123,
  "is_opener": false,
  "crisis_alert": true,
  "analysis": {
    "sentiment_score": -0.45,
    "risk_score": 0.72,
    "risk_label": "high",
    "top_keywords": ["hopeless", "alone", "tired", "empty", "worthless"],
    "confidence": 0.82,
    "emotion_label": "sadness",
    "crisis_alert": true
  }
}
```
**Notes:** If no `session_id`, creates new session. `crisis_alert` is returned both top-level and in `analysis` for frontend compatibility.

### POST /chat/new-session
**Protected.**
**Response:**
```json
{
  "reply": "string",
  "session_id": 123,
  "is_opener": true,
  "crisis_alert": false,
  "analysis": {
    "analysis_tier": "gathering"
  }
}
```

### POST /chat/end-session/{session_id}
**Protected.**
**Response:** `{ "summary": string | null, "message"?: string }`

## Analysis

### POST /analyze
**Protected.** Body: `{ text: string }`. Runs NLP pipeline on arbitrary text.
**Response:** AnalysisResult (same shape as chat analysis).

### GET /analyze/history?limit=50
**Protected.** Returns last N analysis results for current user.

### GET /analyze/session/{session_id}
**Protected.** Returns aggregated analysis for a specific chat session.
**Response:**
```json
{
  "session_id": 123,
  "total_messages": 7,
  "avg_sentiment": -0.14,
  "avg_risk_score": 0.43,
  "dominant_risk_label": "medium",
  "message_count": 7,
  "session_summary": "string | null"
}
```

## Recommendations

### GET /recommend?risk_label=low|medium|high
**Protected.**
**Response:**
```json
{
  "recommendations": [
    {
      "category": "activity",
      "title": "Take a 10-minute walk",
      "description": "...",
      "priority": 1
    }
  ]
}
```

## Dashboard

### GET /dashboard/stats
**Response:** `{ total_messages: int, avg_sentiment_7d: float, avg_risk_7d: float, current_streak_days: int, cumulative_words: int, dashboard_tier: string }`

### GET /dashboard/mood?days=30
**Response:** `{ dates: string[], sentiment_scores: float[], risk_scores: float[] }`

### GET /dashboard/sentiment-dist
**Response:** `{ positive: int, neutral: int, negative: int }`

### GET /dashboard/behavior
**Response:** `{ late_night_days: int, avg_message_length: float, most_active_hour: int, weekly_frequency: int[] }`
