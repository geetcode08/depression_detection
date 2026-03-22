# Design Document

## Assistant Persona
- **Name**: Aura
- **Role**: Compassionate AI emotional support assistant
- **Tone**: Warm, calm, validating, hopeful — like a thoughtful friend who listens without judgment
- **Constraints**: Never diagnoses, never prescribes, always escalates crisis situations

## User Flows

### 1. Registration & Consent Flow
```
Landing Page → Register (username, email, password)
    → Login → Consent Modal (must accept)
    → Chat Interface unlocked
```

### 2. Chat Flow
```
User types message → POST /chat/send
    → NLP analysis runs in parallel with LLM call
    → Response returned with:
       - AI reply text
       - Sentiment score
       - Depression risk score + label
       - Top keywords (explainability)
       - Crisis alert flag (if high risk)
    → Message stored in DB
    → Mood log aggregated for today
```

### 3. Dashboard Flow
```
User navigates to /dashboard
    → GET /dashboard/stats (overview cards)
    → GET /dashboard/mood?days=30 (line chart)
    → GET /dashboard/sentiment-dist (pie chart)
    → GET /dashboard/behavior (behavioral patterns)
```

### 4. Crisis Escalation Flow
```
User message analyzed → risk_score >= 0.65
    → risk_label = 'high'
    → crisis_alert: true in response
    → Frontend displays CrisisAlert modal
    → Helpline numbers shown:
       - iCall: 9152987821
       - Vandrevala Foundation: 1860-2662-345
```

### 5. Anonymous Mode
```
User opts for anonymous access
    → UUID generated client-side
    → Anonymous user record created (no email/password)
    → Full chat + analysis functionality available
    → No PII stored
```

## Risk Classification Thresholds
| Risk Score Range | Label | Action |
|-----------------|-------|--------|
| 0.0 – 0.35 | low | Normal response + general wellness tips |
| 0.35 – 0.65 | medium | Empathetic response + suggest journaling/activities |
| 0.65 – 1.0 | high | Compassionate response + crisis_alert + helpline info |

## Ethical Design Principles
1. **Consent-first**: No data stored until explicit user consent
2. **Non-clinical**: No diagnostic language ever used
3. **Transparent**: AI always identifies as AI, never claims to be human
4. **Explainable**: Every risk score shows contributing keywords
5. **Minimal data**: Only essential data collected, no location/device tracking
6. **User control**: Account deletion cascades all associated data
7. **Crisis safety**: High-risk always triggers helpline information
