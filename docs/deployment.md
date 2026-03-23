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

---

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

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

---

## Part 1: Backend Deployment (Render)

### Step 1: Prepare Backend for Production

#### 1.1 Update Configuration

Create `backend/.env.production`:
```bash
# Production database URL (PostgreSQL recommended)
DATABASE_URL=postgresql+asyncpg://username:password@host:5432/depression_ai

# Generate new JWT secret
JWT_SECRET=$(python -c "import secrets; print(secrets.token_hex(32))")

# Backend configuration
SECRET_KEY=$JWT_SECRET
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GROQ_API_KEY=gsk_your_production_key_here
OPENAI_API_KEY=sk_your_production_key_here
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ENVIRONMENT=production
```

#### 1.2 Update CORS for Production

```python
# backend/config.py
CORS_ORIGINS: str = "https://yourdomain.com,https://www.yourdomain.com"
```

### Step 2: Create Render Account & Services

#### 2.1 Connect GitHub Repository

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "Connect to GitHub"
3. Authorize Render to access your repository
4. Grant access to `depression_detection` repository

#### 2.2 Create PostgreSQL Database (Optional but Recommended)

1. Dashboard → New → PostgreSQL
2. **Name**: `depression-ai-db`
3. **Region**: Choose closest to users
4. **Plan**: Free tier (enough for MVP)
5. **Create Database**
6. Copy connection string: `postgresql+asyncpg://username:password@host:5432/database`

#### 2.3 Create Web Service

1. Dashboard → New → Web Service
2. **Repository**: Select `depression_detection`
3. **Name**: `depression-ai-backend`
4. **Region**: Same as database (if created)
5. **Branch**: `main`
6. **Runtime**: Python 3.11
7. **Build Command**: 
   ```bash
   cd backend && pip install -r requirements.txt
   ```
8. **Start Command**:
   ```bash
   cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

#### 2.4 Configure Environment Variables

In Render dashboard, go to Web Service → Environment:

Add all variables:
```
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
SECRET_KEY=<generated-secret-hex-32>
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GROQ_API_KEY=gsk_your_key
OPENAI_API_KEY=sk_your_key
CORS_ORIGINS=https://yourdomain.com
ENVIRONMENT=production
```

#### 2.5 Deploy

- Click "Deploy"
- Wait 3-5 minutes for environment setup
- Monitor logs for any errors
- Verify: `curl https://depression-ai-backend.onrender.com/api/v1/health`

**Expected Response**:
```json
{"status": "ok", "version": "1.0"}
```

### Step 3: Verify Backend Deployment

```bash
# Check health
curl https://depression-ai-backend.onrender.com/api/v1/health

# Test endpoints
curl https://depression-ai-backend.onrender.com/api/v1/auth/status

# Check logs in Render dashboard
# Services → depression-ai-backend → Logs
```

**Common Issues**:

| Issue | Solution |
|-------|----------|
| `Application failed to start` | Check logs, verify build command |
| `Database connection refused` | Verify DATABASE_URL environment variable |
| `CORS error` | Update CORS_ORIGINS to match frontend domain |
| `Port 5000 already in use` | Render assigns PORT automatically; use `$PORT` |

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend for Production

#### 1.1 Create `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "devCommand": "npm run dev",
  "framework": "nextjs",
  "env": [
    "NEXT_PUBLIC_API_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL"
  ]
}
```

#### 1.2 Update Environment Variables

Create `frontend/.env.production.local`:
```bash
NEXT_PUBLIC_API_URL=https://depression-ai-backend.onrender.com/api/v1
NEXTAUTH_SECRET=$(python -c "import secrets; print(secrets.token_hex(32))")
NEXTAUTH_URL=https://yourdomain.com
```

### Step 2: Create Vercel Account & Project

#### 2.1 Connect GitHub Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Import Project"
3. Select "Import Git Repository"
4. Search for and select your repository: `depression_detection`
5. Click "Continue"

#### 2.2 Configure Project

**Project Settings Page**:

1. **Framework Preset**: Next.js
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`
5. **Install Command**: `npm ci`

#### 2.3 Add Environment Variables

Click "Environment Variables" and add:

```
NEXT_PUBLIC_API_URL=https://depression-ai-backend.onrender.com/api/v1
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=https://<vercel-assigned-domain>.vercel.app
```

**Note**: Initial NEXTAUTH_URL will be Vercel's auto-assigned domain.

#### 2.4 Deploy

1. Click "Deploy"
2. Wait 3-5 minutes (builds in parallel)
3. View deployment status
4. Once complete, get auto-assigned URL

### Step 3: Connect Custom Domain (Optional)

#### 3.1 In Vercel Dashboard

1. Go to Project → Settings → Domains
2. Click "Add Domain"
3. Enter your domain: `yourdomain.com`
4. Verify domain ownership (DNS records)

#### 3.2 Update Environment Variables

Once domain is connected, update `NEXTAUTH_URL`:

```
NEXTAUTH_URL=https://yourdomain.com
```

Redeploy for changes to take effect.

### Step 4: Verify Frontend Deployment

```bash
# Test frontend is accessible
curl https://yourdomain.com

# Test API connection
# In browser console:
fetch('https://depression-ai-backend.onrender.com/api/v1/health')
  .then(r => r.json())
  .then(d => console.log(d))

# Check deployment logs in Vercel dashboard
```

---

## Part 3: Database Configuration

### Option A: Use Render PostgreSQL (Recommended)

```
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/db_name
```

Features:
- ✅ Managed backups
- ✅ Automatic scaling
- ✅ Point-in-time recovery
- Limitations: Free tier has 100MB storage

### Option B: Use Remote SQLite (Development)

```
DATABASE_URL=sqlite+aiosqlite:///./depression_ai.db
```

Limitations:
- ⚠️ No built-in backups
- ⚠️ Limited concurrent connections
- Suitable for MVP only

### Option C: External PostgreSQL Provider

- AWS RDS (paid)
- Google Cloud SQL (paid)
- Azure Database for PostgreSQL (paid)

---

## Part 4: Monitoring & Logs

### Render Logs

```bash
# View real-time logs
Dashboard → Services → depression-ai-backend → Logs

# Check specific date/time
Logs → Filter by timestamp

# Export logs
Logs → Download
```

### Vercel Logs

```bash
# Real-time logs
Dashboard → Deployments → [latest] → Logs

# Function logs (serverless)
Dashboard → Functions → [function] → Logs

# Build logs
Dashboard → Deployments → [deployment] → Build Logs
```

### Monitoring Uptime

Set up external monitoring:
- [Uptimerobot.com](https://uptimerobot.com) (free)
- [Pingdom](https://www.pingdom.com) (paid)

Configure for:
- Backend: `https://depression-ai-backend.onrender.com/api/v1/health`
- Frontend: `https://yourdomain.com`

---

## Part 5: CI/CD for Deployments

### Automatic Backend Deployment

Render automatically deploys on push to `main`:
- ✅ Connect repository once
- ✅ Auto-deploys on branch push
- ✅ Webhook integration

### Automatic Frontend Deployment

Vercel automatically deploys on push to `main`:
- ✅ No configuration needed
- ✅ Preview deployments for pull requests
- ✅ Automatic rollback on failed builds

---

## Part 6: Post-Deployment Tasks

### Checklist

- [ ] Backend health endpoint returns 200
- [ ] Frontend loads without console errors
- [ ] Can register new account
- [ ] Can login with credentials
- [ ] Chat endpoint works
- [ ] Analysis endpoint works
- [ ] Database is initialized (check migrations)
- [ ] Logs show no errors
- [ ] CORS headers present in responses
- [ ] JWT tokens work end-to-end

### Performance Validation

```bash
# Check backend response time
curl -w "\nTime: %{time_total}s\n" https://depression-ai-backend.onrender.com/api/v1/health

# Check frontend load time (browser DevTools)
# Performance tab → Evaluate page speed
```

### Security Validation

```bash
# Check HTTPS
curl -vI https://yourdomain.com

# Check security headers
curl -I https://yourdomain.com | grep -i "strict-transport\|x-content-type\|x-frame"

# Check CORS headers
curl -v https://depression-ai-backend.onrender.com/api/v1/health -H "Origin: https://yourdomain.com"
```

---

## Part 7: Troubleshooting

### Backend Won't Start

**Error**: `Application failed to start`

**Checks**:
1. Check build logs for Python syntax errors
2. Verify all dependencies in `requirements.txt`
3. Check environment variables are set
4. Try locally first: `python main.py`

### CORS Errors

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Fix**:
```python
# Update backend/config.py
CORS_ORIGINS: str = "https://yourdomain.com,https://vercel-app.vercel.app"
```

### Database Connection Issues

**Error**: `psycopg2.OperationalError: connection refused`

**Fix**:
```bash
# Verify DATABASE_URL format
postgresql+asyncpg://user:password@host:5432/dbname

# Check host is correct
ping pg-host.onrender.com
```

### Timeout Issues

**Error**: `504 Gateway Timeout`

**Solutions**:
- Render cold start: Wait 1-2 minutes after deployment
- Check function timeout settings (Vercel Functions)
- Optimize database queries

---

## Part 8: Rollback Plan

### If Deployment Fails

**Render Backend**:
```bash
# Revert to previous version
Dashboard → Deployments → [Previous] → Redeploy
```

**Vercel Frontend**:
```bash
# Automatic: Previous deployment still live
Dashboard → Deployments → [Previous] → Click to rollback
```

**Database**:
```bash
# Render PostgreSQL backups
Dashboard → Database → Backups → Restore
```

---

## Part 9: Cost Estimation

### Monthly Costs

| Service | Free Tier | Pro | Notes |
|---------|-----------|-----|-------|
| Render Backend | ✅ Available | $7/month | Spins down after 15min inactivity |
| Render PostgreSQL | ✅ 100MB | $7/month | 1GB/month transfer |
| Vercel Frontend | ✅ Available | $20/month | Analytics & advanced features |
| **Total** | **$0** | **$34/month** | MVP on free tier viable |

### Cost Optimization

1. Use Render free tier (acceptable latency)
2. Use Vercel free tier (includes all features)
3. Monitor usage (upgrade if needed)
4. Set up spending alerts

---

## Success Criteria

✅ All tasks complete when:
- Backend health endpoint responds with 200
- Frontend loads and connects to backend
- User can complete registration → consent → chat flow
- All tests pass in CI/CD pipeline
- No runtime errors in logs
- Page load time <3 seconds
- API response time <1 second

---

## Support & Resources

- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
- [PostgreSQL on Render](https://render.com/docs/databases)

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
