# Deployment Guide

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cp .env.example .env  # fill in API keys
alembic upgrade head
uvicorn main:app --reload --port 8000
```

### ML Training (one-time)
```bash
cd ml_training
pip install -r requirements.txt
# Place dataset CSV in data/raw/
python 01_preprocess.py
python 02_train_model.py
python 03_evaluate.py
cp outputs/model.pkl ../backend/ml/
cp outputs/vectorizer.pkl ../backend/ml/
```

### Frontend (planned)
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## Production Deployment

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Connect repo to Vercel
3. Set Root Directory to `frontend/`
4. Set env vars: `NEXT_PUBLIC_API_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
5. Deploy (auto-builds on push to main)

### Backend → Render.com
1. Create `Dockerfile` in `backend/`
2. Push to GitHub
3. Create Web Service on Render, connect repo
4. Set all `.env` variables in Render dashboard
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### SQLite Production Note
SQLite on Render uses ephemeral filesystem. For production, upgrade `DATABASE_URL` to PostgreSQL (Render free tier). SQLAlchemy ORM makes this a one-line change.

## Environment Variables

### Backend (.env)
| Variable | Example | Required |
|----------|---------|----------|
| DATABASE_URL | sqlite+aiosqlite:///./depression_ai.db | YES |
| SECRET_KEY | (use secrets.token_hex(32)) | YES |
| ACCESS_TOKEN_EXPIRE_MINUTES | 1440 | YES |
| GROQ_API_KEY | gsk_xxxx | YES |
| OPENAI_API_KEY | sk-xxxx | Optional |
| HF_API_TOKEN | hf_xxxx | Optional |
| CORS_ORIGINS | http://localhost:3000 | YES |
| ENVIRONMENT | development | YES |

### Frontend (.env.local)
| Variable | Example | Required |
|----------|---------|----------|
| NEXT_PUBLIC_API_URL | http://localhost:8000/api/v1 | YES |
| NEXTAUTH_SECRET | (random string) | YES |
| NEXTAUTH_URL | http://localhost:3000 | YES |
