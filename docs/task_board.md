# Task Board

## Current Sprint: Full-Stack Integration

### Completed ✅
- [x] Project documentation structure created
- [x] SRS analyzed and decomposed
- [x] Backend scaffold (main.py, config.py, database.py)
- [x] SQLAlchemy models (users, chat_sessions, messages, mood_logs)
- [x] Pydantic v2 schemas (user, chat, analysis, dashboard)
- [x] Auth service (JWT + bcrypt) + auth router
- [x] NLP service (VADER + ML inference + keyword extraction)
- [x] LLM service (Groq API + system prompt)
- [x] Chat router (POST /chat/send with full pipeline)
- [x] Analysis router (POST /analyze, GET /analyze/history, GET /analyze/session)
- [x] Recommendation service + router
- [x] Behavioral service (mood aggregation, pattern analysis)
- [x] Dashboard router (stats, mood, sentiment-dist, behavior)
- [x] ML training scripts (preprocess, train, evaluate, explain)
- [x] Alembic migration setup
- [x] Backend tests structure
- [x] requirements.txt for backend and ml_training

### Completed (2026-03-22) ✅
- [x] Frontend branch integrated into backend branch
- [x] Auth pages (login/register) connected to backend API
- [x] Consent modal wired to backend `/auth/consent`
- [x] Chat interface connected to real `/chat/send`
- [x] Dashboard connected to `/dashboard/*`
- [x] Recommendations connected to `/recommend`
- [x] Crisis alert contract aligned (`crisis_alert`)
- [x] Frontend production build passes
- [x] Backend tests pass (`26 passed`)

### In Progress
- [ ] Final git integration to `main` branch and push

### Backlog
- [ ] Frontend tests (Vitest)
- [ ] Local runbook hardening (macOS setup + troubleshooting)
- [ ] Optional cloud deployment docs refresh (Render/Vercel)
- [ ] PostgreSQL migration for production

## Update Rules
- Move tasks from "Next Sprint" to "In Progress" when starting
- Move to "Completed" with date when done
- Add blockers inline with ⚠️ prefix
