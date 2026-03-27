# Deployment Guide (Render + Vercel)

**Last Updated**: 2026-03-23  
**Status**: ✅ Documentation Ready

---

## Overview

This guide covers deploying the depression-ai-system full-stack application:

- **Backend**: FastAPI on [Render](https://render.com) (Web Service)
- **Frontend**: Next.js on [Vercel](https://vercel.com) (Hobby or Pro plan)
- **Database**: SQLite → PostgreSQL (production recommended)

**Estimated Time**: 30-45 minutes per service

---

## Prerequisites

### Accounts Required

- [Render account](https://render.com) (free tier available)
- [Vercel account](https://vercel.com) (free tier available)
- GitHub repository access (OAuth integration)
- API keys ready (GROQ_API_KEY, OPENAI_API_KEY)

### Local Testing

Before deploying:
```bash
# Test backend
cd backend
pytest tests/ -v
python main.py  # Manual test

# Test frontend
cd frontend
npm run build
npm run start
```

# Local Run Guide

**Last Updated**: 2026-03-23  
**Status**: Local-first workflow

---

## Overview

This project is designed to run directly on your local machine without Docker.

Services:
- Backend: FastAPI on `http://localhost:8000`
- Frontend: Next.js on `http://localhost:3000`
- Database: SQLite (`depression_ai.db`)

---

## 1. Backend Setup

From project root:

```bash
cd backend
python -m venv ../.venv
source ../.venv/bin/activate
pip install -r requirements.txt
cp .env.example ../.env
```

Then edit root `.env` and set real values for:
- `SECRET_KEY`
- `GROQ_API_KEY`
- `OPENAI_API_KEY` (optional fallback)

Run backend:

```bash
cd backend
source ../.venv/bin/activate
uvicorn main:app --reload --port 8000
```

Health check:

```bash
curl http://localhost:8000/api/v1/health
```

---

## 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Confirm `frontend/.env.local` contains:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXTAUTH_URL=http://localhost:3000
```

---

## 3. ML Artifacts (One-Time / As Needed)

If models already exist in `backend/ml/`, skip this section.

```bash
cd ml_training
source ../.venv/bin/activate
pip install -r requirements.txt
python 01_preprocess.py
python 02_train_model.py
python 03_evaluate.py
cp outputs/model.pkl ../backend/ml/
cp outputs/vectorizer.pkl ../backend/ml/
```

---

## 4. Local Validation

Backend tests:

```bash
cd backend
source ../.venv/bin/activate
pytest tests/ -v
```

Frontend lint and build:

```bash
cd frontend
npm run lint
npm run build
```

Frontend tests (Vitest):

```bash
cd frontend
npm run test -- --run
```

---

## 5. Common Local Issues

1. `ModuleNotFoundError` on backend:
  Activate `.venv` and reinstall with `pip install -r backend/requirements.txt`.
2. CORS errors in browser:
  Ensure `.env` has `CORS_ORIGINS=http://localhost:3000`.
3. Frontend cannot reach backend:
  Ensure backend is running on port `8000` and `NEXT_PUBLIC_API_URL` is correct.
4. Missing model artifacts:
  Run ML training scripts and copy `model.pkl` and `vectorizer.pkl` to `backend/ml/`.

---

## 6. Optional Cloud Deployment

Cloud deployment (Render/Vercel) is optional and not required for local development.
If needed later, use this local run guide as the source of truth for env vars and validation.
| Variable | Example | Required |
|----------|---------|----------|
| NEXT_PUBLIC_API_URL | http://localhost:8000/api/v1 | YES |
| NEXTAUTH_SECRET | (random string) | YES |
| NEXTAUTH_URL | http://localhost:3000 | YES |
