# Session Context

## Purpose
This document provides continuity between AI development sessions. Update at the END of every session.

## Last Session Summary
- **Date**: 2026-04-23 (Session 3)
- **Agent**: GitHub Copilot (GPT-5.3-Codex)
- **Work Done**:
  - Fixed dashboard unlock rendering so tier gating and data sufficiency are handled independently.
  - Added tier-relative progress bar behavior in `AnalysisProgress`.
  - Fixed chat crisis alert behavior to trigger from explicit crisis language in all tiers.
  - Added top-level `crisis_alert` in backend `ChatResponse` schema and router returns (new-session/send opener/send reply).
  - Added auth duplicate username check and standardized duplicate conflicts to HTTP 409.
  - Added defensive `cumulative_words` handling and startup schema warning for missing column.
  - Extended session analysis API to include `session_summary`; surfaced this on the frontend analysis page.
  - Wired chat `end-session` to the frontend "New conversation" flow with optional summary toast.
  - Added assistant analysis chips in chat bubbles (emotion + risk, excluding gathering tier).
  - Completed guest flow wiring from landing page using `startAnonymous` and consent redirect.
  - Updated ML scripts/configs (sample cap 150k, TF-IDF 15k with bigrams, balanced LR C=0.5, CV/Test AUC eval).
  - Updated backend/frontend contracts and required docs (`database_schema`, `api_contracts`, `feature_registry`, `session_context`).

## Current State
- **Backend**: Critical safety + auth + schema-contract fixes applied; tests pending run in this session.
- **Frontend**: Dashboard/chat/analysis/guest/navbar wiring fixes applied; production build pending run in this session.
- **ML**: Training/evaluation scripts updated for stronger features and AUC-centric validation.
- **Docs**: Core API/database/feature/session context docs synchronized with code changes.

## What Needs Attention
1. **Deploy to Production**: Execute Render backend and Vercel frontend deployment
2. **Configure Secrets**: Set up GitHub Actions secrets (GROQ_API_KEY, OPENAI_API_KEY)
3. **Database**: Set up Render PostgreSQL for production (optional but recommended)
4. **CI/CD Activation**: Monitor first GitHub Actions workflow run; fix any failures
5. **Branch Protection**: Enable branch protection rules requiring test pass
6. **Monitoring**: Set up Codecov dashboard and Uptimerobot for uptime monitoring
7. **Environment Setup**: Create `.env.production` files for production secrets
8. **Frontend Testing**: Run `npm install` and execute Vitest suite (pending npm setup)
9. **Local Runtime Check**: Keep backend and frontend startup commands validated on macOS

## Key Decisions Made
- Using async SQLAlchemy with aiosqlite for async SQLite support (dev), PostgreSQL recommended for prod
- Groq API as primary LLM, OpenAI as fallback
- VADER for sentiment, TF-IDF + LogReg for risk scoring
- JWT auth with 24h expiry (ACCESS_TOKEN_EXPIRE_MINUTES=1440)
- Rule-based recommendations with curated pool
- Frontend and backend contracts prioritize real API integration over mock data
- ML training uses deterministic sampling (50K samples) for speed; can retrain with higher MAX_SAMPLES
- Vitest + React Testing Library for frontend unit tests
- GitHub Actions for automated testing on push/PR (backend: pytest, frontend: eslint+vitest)
- Render.com for backend deployment (free tier available, spins down after 15min inactivity)
- Vercel for frontend deployment (free tier includes all features)
- PostgreSQL on Render recommended for production (100MB free tier, $7/month for 1GB)
- Crisis alert available in both top-level chat response and analysis payload for compatibility
- Keep `UNDERSTAND.md` intentionally untracked (per explicit user request)