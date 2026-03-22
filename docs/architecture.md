# Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│               Next.js 14 (App Router) + React               │
│        Tailwind CSS + shadcn/ui + Recharts + Zustand        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / REST (JSON)
                           │ Authorization: Bearer <JWT>
┌──────────────────────────▼──────────────────────────────────┐
│                       API GATEWAY                           │
│                    FastAPI (Uvicorn)                         │
│              CORS Middleware + JWT Auth                       │
├─────────────────────────────────────────────────────────────┤
│  Routers:  auth | chat | analysis | recommend | dashboard   │
├─────────────────────────────────────────────────────────────┤
│  Services:                                                   │
│    auth_service    → JWT + bcrypt                            │
│    llm_service     → Groq API (llama3-8b-8192)              │
│    nlp_service     → VADER + TF-IDF/LogReg inference        │
│    recommendation  → rule-based recommendation engine       │
│    behavioral      → pattern analysis + mood aggregation    │
├─────────────────────────────────────────────────────────────┤
│  ML Layer (loaded at startup):                               │
│    model.pkl       → Trained Logistic Regression             │
│    vectorizer.pkl  → Fitted TF-IDF Vectorizer               │
├─────────────────────────────────────────────────────────────┤
│  Database: SQLite (SQLAlchemy ORM + Alembic migrations)     │
│    Tables: users | chat_sessions | messages | mood_logs      │
└─────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     ┌──────────────┐          ┌──────────────┐
     │   Groq API   │          │  HuggingFace │
     │ llama3-8b    │          │  (optional)  │
     └──────────────┘          └──────────────┘
```

## Data Flow: Chat Message Lifecycle

1. User types message in frontend ChatInput
2. Frontend sends `POST /api/v1/chat/send` with JWT
3. Backend receives message:
   a. Creates/retrieves `chat_session`
   b. Stores user message in `messages` table
   c. Runs NLP pipeline (VADER sentiment + ML risk scoring)
   d. Calls Groq LLM with conversation context + system prompt
   e. Stores assistant reply in `messages` table
   f. Triggers mood_log aggregation for current day
4. Returns `{reply, session_id, analysis}` to frontend
5. Frontend displays reply, risk badge, and crisis alert if needed

## Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LLM Provider | Groq (llama3-8b-8192) | Free tier, ~0.5s latency, no credit card |
| Database | SQLite | Zero-config, file-based, easy PostgreSQL upgrade |
| ML Model | LogReg + TF-IDF | Fast inference (~5ms), explainable, no GPU needed |
| Sentiment | VADER | Rule-based, instant, tuned for social media text |
| Frontend | Next.js 14 App Router | Industry standard, built-in API routes, easy Vercel deploy |
| Auth | JWT (stateless) | No session DB needed for MVP |
| API Style | REST (JSON) | Simple, well-understood, sufficient for MVP |

## Directory Structure
See [repo_map.md](repo_map.md) for complete file tree.
