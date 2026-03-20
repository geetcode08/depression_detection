# Aura — AI Emotional Support Assistant (Frontend)

> ⚠️ **Disclaimer**: This is NOT a medical tool. Aura is an AI-assisted emotional support system for non-clinical self-monitoring only. For clinical concerns, please consult a qualified mental health professional.

---

## Project Overview

Aura is the frontend for an AI-powered emotional wellness tracking system built as a Final Year Major Project. It connects to a FastAPI backend with an NLP/ML pipeline for sentiment analysis and depression risk scoring.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Recharts · Zustand · Axios

---

## Quick Start

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Set up environment variables
```bash
cp .env.local.example .env.local
# Edit .env.local with your values
```

### 3. Run in development
```bash
npm run dev
# Opens http://localhost:3000
```

> **Mock mode**: The app works fully without a backend. `USE_MOCK=true` in `src/lib/api.ts` uses realistic mock data. Flip to `false` once your FastAPI backend is running.

---

## Environment Variables (`.env.local`)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | FastAPI backend base URL | `http://localhost:8000/api/v1` |
| `NEXTAUTH_SECRET` | NextAuth secret (min 32 chars) | `your-secret-here` |
| `NEXTAUTH_URL` | App URL | `http://localhost:3000` |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout + ToastProvider
│   ├── client-layout.tsx         # Navbar wrapper
│   ├── globals.css               # Tailwind + CSS variables
│   ├── not-found.tsx             # 404 page
│   ├── error.tsx                 # Root error boundary
│   ├── global-error.tsx          # Global error boundary
│   ├── (auth)/
│   │   ├── login/page.tsx        # Login form
│   │   └── register/page.tsx     # Registration form
│   ├── chat/
│   │   ├── page.tsx              # Chat interface
│   │   ├── loading.tsx           # Chat loading state
│   │   └── error.tsx             # Chat error boundary
│   ├── dashboard/
│   │   ├── page.tsx              # Analytics dashboard
│   │   ├── loading.tsx           # Dashboard loading state
│   │   └── error.tsx             # Dashboard error boundary
│   ├── analysis/
│   │   └── page.tsx              # Analysis history
│   └── account/
│       └── page.tsx              # Account settings + data deletion
│
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   └── toast.tsx             # Toast + ToastProvider
│   ├── chat/
│   │   ├── ChatWindow.tsx        # Scrollable message list
│   │   ├── ChatInput.tsx         # Textarea + send button
│   │   ├── MessageBubble.tsx     # User/assistant message styling
│   │   └── RiskBadge.tsx         # Low/medium/high badge
│   ├── dashboard/
│   │   ├── MoodLineChart.tsx     # Recharts 30-day trend
│   │   ├── SentimentPieChart.tsx # Positive/neutral/negative donut
│   │   ├── RiskTrendChart.tsx    # Weekly activity bar chart
│   │   └── StatCard.tsx          # Summary stat card
│   └── shared/
│       ├── Navbar.tsx            # Sticky nav + disclaimer banner
│       ├── ConsentModal.tsx      # GDPR-style consent gate
│       ├── CrisisAlert.tsx       # Helpline modal (high risk)
│       └── Disclaimer.tsx        # Inline disclaimer bar
│
├── hooks/
│   └── useChat.ts                # Chat send + suggestion events
│
├── lib/
│   ├── api.ts                    # Axios + all API functions + mock data
│   ├── auth.ts                   # next-auth config stub
│   └── utils.ts                  # cn(), formatDate, getRiskColor, etc.
│
├── store/
│   ├── userStore.ts              # Zustand: auth, consent, anonymous mode
│   └── chatStore.ts              # Zustand: messages, session, crisis alert
│
└── types/
    └── index.ts                  # All TypeScript interfaces
```

---

## Key Features Implemented

### Ethical Safeguards (SRS §13)
| Safeguard | Location |
|-----------|----------|
| Consent gate | `ConsentModal.tsx` + `userStore.giveConsent()` |
| Persistent disclaimer banner | `Navbar.tsx` (top bar, every page) |
| No diagnosis language | All AI responses use non-clinical wording |
| Crisis escalation | `CrisisAlert.tsx` shows when `risk_label === "high"` |
| Anonymous/guest mode | `userStore.continueAsGuest()` → UUID-based session |
| Data deletion | `account/page.tsx` → DELETE /auth/me cascade |

### Risk Classification Display
| Score | Label | UI |
|-------|-------|-----|
| 0.0–0.35 | Low | `ShieldCheck` green badge |
| 0.35–0.65 | Medium | `Shield` amber badge |
| 0.65–1.0 | High | `ShieldAlert` red badge + crisis modal |

### Error Handling (SRS NFR-04)
- Every page has a dedicated `error.tsx` boundary with retry button
- Global `global-error.tsx` for uncaught root errors
- 404 page with navigation links
- API errors surface as toast notifications via `ToastProvider`
- Dashboard and chat show loading spinners, retry states, empty states

---

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run test         # Run Vitest tests
npm run test:ui      # Vitest with browser UI
```

---

## Tests

All tests use **Vitest** + **Testing Library**:

```bash
npm run test
```

Test files in `src/__tests__/`:
- `ConsentModal.test.tsx` — renders, accept, guest mode
- `CrisisAlert.test.tsx` — renders helplines, dismiss
- `ChatInput.test.tsx` — send on Enter, no send on Shift+Enter, clears after send, disabled while loading
- `utils.test.ts` — getSentimentLabel, getSentimentColor, getRiskColor, formatDate, formatTime

---

## Connecting to Backend

1. Start your FastAPI backend on port 8000
2. Set `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` in `.env.local`
3. In `src/lib/api.ts`, set `const USE_MOCK = false`
4. Ensure CORS is configured on the backend to allow `http://localhost:3000`

---

## Deployment (Vercel)

1. Push `frontend/` to GitHub
2. Connect to Vercel → set Root Directory to `frontend/`
3. Add env vars: `NEXT_PUBLIC_API_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
4. Deploy — auto-builds on every push to `main`

---

## Crisis Helplines (Appendix A)

| Organisation | Number | Hours |
|-------------|--------|-------|
| iCall (TISS) | 9152987821 | Mon–Sat, 8am–10pm |
| Vandrevala Foundation | 1860-2662-345 | 24/7 |
| NIMHANS Helpline | 080-46110007 | Mon–Sat, 8am–8pm |
| iCall Online Chat | icallhelpline.org | Available online |

---

*Final Year Major Project — Computer Science / AI Engineering*
