# Session Context

## Purpose
This document provides continuity between AI development sessions. Update at the END of every session.

## Last Session Summary
- **Date**: 2026-03-22
- **Agent**: GitHub Copilot (GPT-5.3-Codex)
- **Work Done**: 
  - Imported completed frontend app from `frontend` git branch
  - Rewired frontend from dummy/mock API calls to real backend endpoints
  - Fixed auth login payload to OAuth2 form format
  - Added consent enforcement in chat UI flow
  - Aligned backend chat response with `crisis_alert` contract
  - Fixed backend typing/import issues (`analysis.py`, `mood_log.py`)
  - Switched password hashing scheme to `pbkdf2_sha256` for environment stability
  - Verified quality: backend tests pass (`26 passed`), frontend build passes
  - Updated key docs for full-stack state

## Current State
- **Backend**: Implemented and test-passing; API contracts aligned with frontend
- **Frontend**: Implemented and integrated with backend APIs (no dummy API mode)
- **ML Models**: Training scripts ready; artifacts still required in `backend/ml/` for full NLP inference
- **Database**: Schema defined and created on startup in dev; Alembic configured

## What Needs Attention
1. Run `ml_training/` scripts to generate model.pkl and vectorizer.pkl
2. Copy .pkl artifacts to `backend/ml/`
3. Ensure `.env` values are configured for local/prod secrets
4. Create/verify `main` branch integration commit and push
5. Add frontend test suite (Vitest) and CI checks

## Key Decisions Made
- Using async SQLAlchemy with aiosqlite for async SQLite support
- Groq API as primary LLM, OpenAI as fallback
- VADER for sentiment, TF-IDF + LogReg for risk scoring
- JWT auth with 24h expiry
- Rule-based recommendations with curated pool
- Frontend and backend contracts should prioritize real API integration over mock data
- Keep `crisis_alert` available in both top-level chat response and analysis payload for compatibility