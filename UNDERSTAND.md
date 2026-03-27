# understand.md

## 1. Project Introduction

### What is this project?
This is a full-stack **AI emotional support system** called **Aura**.  
It helps users:
- chat about feelings,
- get sentiment + depression-risk analysis,
- track mood trends,
- receive personalized recommendations,
- and see crisis support when risk is high.

It is explicitly **non-clinical** (not diagnosis, not therapy replacement).

### Project goal
Build an accessible web app for self-reflection and early pattern detection in emotional well-being.

### Why this approach works
- Fast, explainable ML model for risk scoring (`TF-IDF + Logistic Regression`).
- Instant sentiment from VADER.
- Empathetic conversational responses from LLM (Groq/OpenAI fallback).
- Behavioral analytics from stored message history.
- Clear UI with risk labels, trend charts, and recommendations.
- Safety rules: consent gate, disclaimer, crisis escalation.

### Core architecture
- Frontend: Next.js + React + TypeScript (`frontend/`)
- Backend API: FastAPI + SQLAlchemy + JWT (`backend/`)
- Offline ML training pipeline: Python scripts (`ml_training/`)
- Project governance/spec docs (`docs/`, `ai/`)

---

## 2. Top-Level Folder Structure (What each folder does)

- `README.md`
  - Quick start and architecture summary.
- `ai/`
  - AI-agent operation instructions (how AI contributors should work in this repo).
- `backend/`
  - FastAPI server, database models, routes, business services, tests.
- `docs/`
  - Full project documentation (SRS, architecture, API contracts, schema, standards, task tracking).
- `frontend/`
  - Next.js web app UI (auth, chat, dashboard, analysis pages).
- `ml_training/`
  - Offline preprocessing/training/evaluation/explainability scripts to generate model files used by backend.

---

## 3. How the whole system works (big pipeline)

1. User opens frontend page (`frontend/src/app/page.tsx`).
2. User registers/logs in (`frontend/src/app/(auth)/...`) and gets JWT via backend `POST /auth/login`.
3. Frontend stores token, attaches it to all API requests (`frontend/src/lib/api.ts`).
4. User sends message in chat (`frontend/src/components/chat/ChatInput.tsx`).
5. Backend chat route (`backend/routers/chat.py`) does:
   - consent check,
   - session create/reuse,
   - NLP analysis (`backend/services/nlp_service.py`),
   - LLM response (`backend/services/llm_service.py`),
   - DB save (`messages`, `chat_sessions`),
   - daily mood aggregation (`backend/services/behavioral_service.py`).
6. Backend returns `reply + analysis + crisis_alert`.
7. Frontend renders message bubble, risk badge, optional crisis modal.
8. Dashboard page calls `GET /dashboard/*` routes and renders charts.
9. Recommendations fetched based on risk level (`GET /recommend`).

---

## 4. Backend in detail (`backend/`)

### `backend/main.py`
Purpose: App entry point and startup lifecycle.
Key functions:
- `lifespan(app)`:
  - creates DB tables (dev convenience),
  - loads ML models once at startup (`load_ml_models()`),
  - disposes DB engine on shutdown.
- `root()`:
  - returns simple API status message.
- `health_check()`:
  - health probe endpoint.
Also:
- Registers CORS middleware.
- Includes routers: auth, chat, analysis, recommend, dashboard.

### `backend/config.py`
Purpose: central environment-based settings.
Key class:
- `Settings(BaseSettings)`:
  - stores DB URL, JWT secret/algorithm, token expiry, API keys, CORS origins.
- `cors_origins_list` property:
  - converts comma-separated origins string into a list.
- `settings = Settings()`:
  - singleton config object used across backend.

### `backend/database.py`
Purpose: async SQLAlchemy setup.
Key items:
- `engine`: async DB engine.
- `async_session`: session factory.
- `Base`: declarative base for models.
- `get_db()`:
  - dependency that yields a DB session,
  - auto-commits on success, rollbacks on exceptions.

---

## 5. Backend Models (`backend/models/`)

### `user.py` → `User`
Contains user account data:
- username/email/password hash,
- anonymous flag,
- consent flag,
- created timestamp.
Relationships:
- one-to-many sessions, messages, mood logs.

### `session.py` → `ChatSession`
Contains conversation container:
- user link,
- start/end times,
- total message count.

### `message.py` → `Message`
Contains each chat message:
- role (`user` or `assistant`),
- text content,
- sentiment score,
- risk score and label,
- emotion label (optional),
- message length and timestamp.

### `mood_log.py` → `MoodLog`
Contains one-day aggregation per user:
- avg sentiment,
- avg risk,
- dominant emotion,
- message count,
- late-night activity flag.

### `__init__.py`
Imports all model classes so metadata is fully known.

---

## 6. Backend Schemas (`backend/schemas/`)

These are Pydantic contracts for request/response validation.

### `user.py`
- `UserCreate`: register input validation.
- `UserLogin`: login payload shape.
- `UserResponse`: response after registration.
- `UserProfile`: authenticated profile response.
- `TokenResponse`: JWT token response.

### `chat.py`
- `ChatRequest`: incoming message + optional session id.
- `ChatResponse`: assistant reply + session id + NLP analysis + crisis flag.

### `analysis.py`
- `AnalysisResult`: sentiment/risk/keywords/confidence payload.
- `AnalysisRequest`: text for manual analysis endpoint.
- `AnalysisHistoryItem`: stored user message analysis entry.
- `SessionAnalysisResponse`: aggregate stats for one chat session.

### `dashboard.py`
- `StatsResponse`: high-level dashboard KPIs.
- `MoodTrendResponse`: chart arrays for dates/sentiment/risk.
- `SentimentDistResponse`: positive/neutral/negative counts.
- `BehaviorResponse`: late-night/activity/length/frequency metrics.
- `RecommendationItem`, `RecommendationResponse`: recommendation payloads.

---

## 7. Backend Services (`backend/services/`)

### `auth_service.py`
Purpose: authentication and authorization.
Functions:
- `hash_password(password)`: hashes with `pbkdf2_sha256`.
- `verify_password(plain, hash)`: verifies password.
- `create_access_token(data)`: creates JWT with expiry.
- `decode_access_token(token)`: decodes/validates JWT.
- `get_current_user(...)`: FastAPI dependency to fetch authenticated user from token.
- `require_consent(user)`: blocks protected analysis/chat paths until user consents.

### `llm_service.py`
Purpose: generate empathetic assistant response.
Functions:
- `get_llm_reply(user_message, conversation_history)`:
  - builds system + context + user message prompt,
  - tries Groq first,
  - falls back to OpenAI,
  - returns safe fallback message if both fail.
- `_call_groq(messages)`: POST to Groq chat completions.
- `_call_openai(messages)`: POST to OpenAI chat completions.
Also includes strict `SYSTEM_PROMPT` safety rules.

### `nlp_service.py`
Purpose: sentiment + risk analysis.
Functions:
- `load_ml_models()`: loads `backend/ml/model.pkl` and `vectorizer.pkl`.
- `get_sentiment_score(text)`: VADER compound score.
- `get_risk_score(text)`: model-based probability; heuristic fallback if model missing.
- `get_risk_label(risk_score)`: thresholds low/medium/high.
- `get_top_keywords(text, n=5)`: explainability via TF-IDF feature contributions.
- `analyze_text(text)`: complete pipeline returning `AnalysisResult`.

### `recommendation_service.py`
Purpose: curated interventions by risk level.
Function:
- `get_recommendations(risk_label)`: returns predefined recommendation list for low/medium/high categories.

### `behavioral_service.py`
Purpose: aggregate historical behavior for dashboard.
Functions:
- `aggregate_daily_mood(db, user_id)`: upserts daily mood log from today’s messages.
- `get_dashboard_stats(db, user_id)`: total messages, 7-day averages, streak.
- `_calculate_streak(db, user_id)`: consecutive active days.
- `get_mood_trend(db, user_id, days)`: daily arrays for line charts.
- `get_sentiment_distribution(db, user_id)`: positive/neutral/negative counts.
- `get_behavioral_patterns(db, user_id)`: late-night days, avg length, peak hour, weekday frequency.

---

## 8. Backend Routers (`backend/routers/`)

### `auth.py`
Endpoints:
- `register(...)`: create user with duplicate checks.
- `login(...)`: OAuth2 form login and JWT return.
- `get_me(...)`: returns current profile.
- `give_consent(...)`: sets `consent_given = True`.
- `delete_account(...)`: deletes user (cascade relationships).
- `create_anonymous_user(...)`: guest account creation and token return.

### `chat.py`
Endpoint:
- `send_message(...)`:
  - consent enforcement,
  - create/reuse chat session,
  - NLP analysis of user message,
  - save user message,
  - build context history,
  - call LLM,
  - save assistant message,
  - increment session count,
  - aggregate daily mood,
  - return structured chat response.

### `analysis.py`
Endpoints:
- `analyze(...)`: one-off analysis of arbitrary text.
- `get_analysis_history(...)`: recent analyzed user messages.
- `get_session_analysis(...)`: aggregated stats for one session.

### `dashboard.py`
Endpoints:
- `stats(...)`: overview card numbers.
- `mood_trend(...)`: mood/risk trend arrays.
- `sentiment_distribution(...)`: pie chart inputs.
- `behavior(...)`: behavioral pattern metrics.

### `recommend.py`
Endpoint:
- `recommend(...)`: returns recommendations for queried risk label.

### `__init__.py`
Empty marker file for package import structure.

---

## 9. Backend Tests (`backend/tests/`)

### `conftest.py`
- Creates isolated in-memory async SQLite test DB.
- Overrides `get_db` dependency.
- Provides test client fixture.
- Provides `auth_headers` fixture (register + login + consent pre-done).

### `test_auth.py`
- Tests register, duplicate email, login, wrong password, `/auth/me`, consent, account deletion, anonymous auth.

### `test_chat.py`
- Mocks LLM call and tests `/chat/send`.
- Checks session creation/reuse.
- Verifies consent is required.

### `test_analysis.py`
- Tests `/analyze`, history, and session summary endpoints.

### `test_dashboard.py`
- Tests all dashboard endpoints and response shape.

### `test_nlp.py`
- Unit-tests NLP behavior:
  - sentiment polarity,
  - risk label thresholds,
  - analysis output completeness and ranges.

### `test_recommend.py`
- Tests recommendation endpoint for low/high/invalid risk label behavior.

### `__init__.py`
Empty.

---

## 10. Database & Migration files

### `backend/alembic.ini`
Alembic config (logging + script location + DB URL placeholder).

### `backend/alembic/env.py`
Loads app settings and metadata, supports online/offline migrations with async engine.

### `backend/alembic/script.py.mako`
Template used when generating migration scripts.

### `backend/alembic/versions/.gitkeep`
Keeps versions directory in git when empty.

---

## 11. Frontend in detail (`frontend/`)

### Core app files (`frontend/src/app/`)

### `layout.tsx`
- Global HTML/body wrapper.
- Imports global CSS.
- Sets metadata title/description.
- Applies font variables.
- Wraps all pages with `ClientLayout`.

### `client-layout.tsx`
- Client-only wrapper.
- Loads current user on mount (`fetchUser`).
- Renders top navbar + page content area.

### `page.tsx` (landing)
Main marketing/entry page:
- feature cards,
- CTA buttons,
- guest mode,
- consent modal trigger logic.
Key handlers:
- `handleGetStarted()`
- `handleConsentAccept()`
- `handleContinueAsGuest()`

### `(auth)/login/page.tsx`
Login form page.
Key function:
- `handleSubmit(e)` validates inputs, calls `userStore.login`, navigates to `/chat`.

### `(auth)/register/page.tsx`
Register form page.
Key function:
- `handleSubmit(e)` validates fields/password match, calls `register`, then navigates to `/chat`.

### `chat/page.tsx`
Chat shell page that binds hook + components:
- chat window,
- input,
- disclaimer,
- crisis alert,
- consent enforcement modal.
Key helper:
- `handleConsentAccept()`.

### `dashboard/page.tsx`
Dashboard data loader and renderer.
Key logic:
- `fetchAll()` in `useEffect` fetches stats/mood/sentiment/behavior in parallel,
- derives risk label from avg 7-day risk,
- fetches recommendations accordingly.

### `analysis/page.tsx`
Manual analysis + history + session summary page.
Key functions:
- `loadHistory()`
- `handleAnalyze()`
- `handleSessionSummary()`

### `globals.css`
- global theme vars,
- body style,
- smooth scroll,
- custom scrollbar,
- small fade-in animation utility.

---

## 12. Frontend Components

### Chat components (`frontend/src/components/chat/`)

### `ChatInput.tsx`
- message textbox + send button.
Functions:
- `handleSubmit()`: trims and sends text.
- `handleKeyDown()`: Enter sends, Shift+Enter newline.
- `useEffect` auto-resizes textarea.

### `ChatWindow.tsx`
- message list + empty state + typing indicator.
- auto-scrolls on updates.
- emits `chat:suggestion` custom event for starter prompts.

### `MessageBubble.tsx`
- visual bubble for each message.
- shows timestamp and risk/analysis metadata on assistant messages.
- shows extracted keywords tags.

### `RiskBadge.tsx`
- maps risk labels (`low`, `medium`, `high`) to variant + icon + text.

---

### Shared components (`frontend/src/components/shared/`)

### `Navbar.tsx`
- persistent header and disclaimer.
- auth-aware navigation (chat/dashboard/analysis).
- desktop + mobile menus.
Handlers:
- `handleDeleteAccount()`
- `handleAnonymous()`

### `ConsentModal.tsx`
- consent agreement dialog before analysis/chat operations.

### `CrisisAlert.tsx`
- emergency-support modal shown on high risk.
- contains helpline links and dismiss action.

### `Disclaimer.tsx`
- compact caution notice used in chat page.

---

### Dashboard components (`frontend/src/components/dashboard/`)

### `StatCard.tsx`
- reusable metric card with icon/trend subtitle style.

### `MoodLineChart.tsx`
- line chart for sentiment and risk over time.

### `RiskTrendChart.tsx`
- weekly activity bar chart + behavioral summary counters.

### `SentimentPieChart.tsx`
- pie chart for positive/neutral/negative message distribution.

---

### UI primitives (`frontend/src/components/ui/`)
Reusable design-system-like components:
- `avatar.tsx`: `Avatar`, `AvatarFallback`
- `badge.tsx`: variant badge utility
- `button.tsx`: variant/size button utility
- `card.tsx`: `Card`, header/content/footer building blocks
- `input.tsx`: styled text input
- `textarea.tsx`: styled textarea

---

## 13. Frontend State, APIs, Utilities, Types

### `frontend/src/lib/api.ts`
Central Axios client + typed API wrappers.
Important behavior:
- request interceptor injects JWT from `localStorage`.
- helper `getErrorMessage` standardizes backend error extraction.
Exposed groups:
- `authApi`
- `chatApi`
- `dashboardApi`
- `analysisApi`
- `recommendApi`

### `frontend/src/lib/auth.ts`
- NextAuth integration stub (currently not active).
- shows intended future credentials-provider setup.

### `frontend/src/lib/utils.ts`
Utility functions:
- `cn(...)`: class merge helper.
- `formatDate(...)`
- `formatTime(...)`
- `getRiskColor(...)`
- `getSentimentLabel(...)`
- `getSentimentColor(...)`

### `frontend/src/hooks/useChat.ts`
- Hook around Zustand chat store.
- exposes chat state/actions.
- listens to `chat:suggestion` event and forwards to `send()`.

### `frontend/src/store/chatStore.ts`
Chat Zustand store.
State:
- messages, sessionId, loading/error, latestRiskLabel, showCrisisAlert.
Actions:
- `sendMessage(text)`:
  - optimistic user message insert,
  - backend send,
  - assistant message append from response,
  - risk/crisis state update.
- `dismissCrisisAlert()`
- `clearChat()`

### `frontend/src/store/userStore.ts`
User/auth Zustand store.
State:
- user object, isAuthenticated, consentGiven, loading.
Actions:
- `login(...)`
- `register(...)`
- `startAnonymous()`
- `logout()`
- `deleteAccount()`
- `fetchUser()`
- `giveConsent()`
- `setUser(user)`

### `frontend/src/types/index.ts`
Single source of frontend API/domain TypeScript interfaces:
- user/auth,
- chat/analysis,
- dashboard/behavior,
- recommendations,
- mood log.

---

## 14. Frontend config files

- `frontend/package.json`: dependencies and scripts (`dev/build/start/lint`).
- `frontend/tsconfig.json`: strict TS config + path alias `@/*`.
- `frontend/next.config.ts`: Next config placeholder.
- `frontend/eslint.config.mjs`: Next core-web-vitals + TypeScript lint setup.
- `frontend/postcss.config.mjs`: Tailwind postcss plugin config.
- `frontend/next-env.d.ts`: Next generated type references.
- `frontend/README.md`: default Next.js scaffold readme.

---

## 15. ML Training Pipeline (`ml_training/`)

### `requirements.txt`
Training-only package versions (pandas, numpy, sklearn, nltk, joblib, matplotlib).

### `01_preprocess.py`
Purpose: prepare clean training data.
Functions:
- `find_dataset()`:
  - finds first CSV in `data/raw/` and validates existence.
- `clean_text(text, stemmer, stop_words)`:
  - lowercase,
  - remove URLs/emails/non-letters,
  - tokenize,
  - remove stopwords,
  - stem tokens.
- `main()`:
  - load CSV,
  - normalize expected columns,
  - filter invalid rows,
  - clean text,
  - output `data/processed/clean_data.csv`.

### `02_train_model.py`
Purpose: train classifier and vectorizer.
Function:
- `main()`:
  - load processed data,
  - split train/test,
  - fit TF-IDF vectorizer,
  - train Logistic Regression,
  - print metrics,
  - save `outputs/model.pkl` and `outputs/vectorizer.pkl`.

### `03_evaluate.py`
Purpose: deeper evaluation.
Function:
- `main()`:
  - loads data + saved model/vectorizer,
  - reproduces test split,
  - computes accuracy/F1/ROC-AUC/confusion matrix,
  - optionally saves confusion matrix plot,
  - checks F1 threshold warning.

### `04_explain.py`
Purpose: explainability insights.
Functions:
- `get_top_global_keywords(model, vectorizer, n)`:
  - top class-indicative terms by coefficient weights.
- `explain_prediction(text, model, vectorizer, n)`:
  - per-text keyword contribution explanation.
- `main()`:
  - prints global indicators and sample prediction explanations.

### `data/raw/`
- place source CSV dataset here.

### `data/processed/`
- generated cleaned dataset output.

### `outputs/`
- generated artifacts (`model.pkl`, `vectorizer.pkl`, plots).

---

## 16. Docs folder (`docs/`) and what each file contributes

- `SRS.md`: master requirements/specification and execution checklist.
- `project_overview.md`: project statement, objectives, capabilities, status.
- `architecture.md`: system layers and message lifecycle flow.
- `design.md`: UX flows, risk thresholds, ethical principles.
- `api_contracts.md`: endpoint-level request/response contracts.
- `database_schema.md`: table definitions and relationships.
- `tech_stack.md`: technology choices and versions.
- `deployment.md`: local setup and deployment guidance.
- `coding_standards.md`: backend/frontend coding conventions.
- `feature_registry.md`: feature-by-feature completion status.
- `task_board.md`: sprint progress and backlog.
- `glossary.md`: domain term definitions.
- `repo_map.md`: canonical repo tree map.
- `ai_rules.md`: AI-specific safety/workflow rules.
- `session_context.md`: continuity notes from last development session.

---

## 17. AI instruction folder (`ai/`)

- `system_prompt.md`
  - Defines how AI coding agents should behave and what docs to read first.
- `development_workflow.md`
  - Feature implementation flow and testing/document-update protocol.
- `memory_strategy.md`
  - Long-term vs session memory usage strategy for AI contributors.

---

## 18. Flow guide (so you don’t get overwhelmed)

### Flow A: New user to first chat
`frontend/src/app/page.tsx`  
-> `frontend/src/components/shared/ConsentModal.tsx`  
-> `frontend/src/app/(auth)/register/page.tsx` or `login/page.tsx`  
-> `frontend/src/lib/api.ts` (`authApi.register/login/getMe`)  
-> `backend/routers/auth.py` + `backend/services/auth_service.py`  
-> JWT returned and stored  
-> `frontend/src/app/chat/page.tsx` unlocks chat when consent is true.

### Flow B: Sending one chat message
`frontend/src/components/chat/ChatInput.tsx`  
-> `frontend/src/hooks/useChat.ts`  
-> `frontend/src/store/chatStore.ts` (`sendMessage`)  
-> `frontend/src/lib/api.ts` (`chatApi.send`)  
-> `backend/routers/chat.py::send_message`  
-> `backend/services/nlp_service.py::analyze_text`  
-> `backend/services/llm_service.py::get_llm_reply`  
-> DB writes via `models/message.py` and `models/session.py`  
-> `backend/services/behavioral_service.py::aggregate_daily_mood`  
-> response back to frontend  
-> `frontend/src/components/chat/MessageBubble.tsx` + `RiskBadge.tsx` render analysis.

### Flow C: Crisis escalation
`backend/services/nlp_service.py::get_risk_label` gives `high`  
-> `analyze_text` sets `crisis_alert = True`  
-> `backend/routers/chat.py` returns that flag  
-> `frontend/src/store/chatStore.ts` sets `showCrisisAlert`  
-> `frontend/src/components/shared/CrisisAlert.tsx` modal appears with helplines.

### Flow D: Dashboard analytics
`frontend/src/app/dashboard/page.tsx` `fetchAll()`  
-> `frontend/src/lib/api.ts` (`dashboardApi.*`)  
-> `backend/routers/dashboard.py`  
-> `backend/services/behavioral_service.py` aggregations  
-> frontend chart components:
- `MoodLineChart.tsx`
- `SentimentPieChart.tsx`
- `RiskTrendChart.tsx`
- `StatCard.tsx`

### Flow E: Recommendations
Dashboard computes risk bucket from `avg_risk_7d`  
-> `frontend/src/lib/api.ts` (`recommendApi.get`)  
-> `backend/routers/recommend.py`  
-> `backend/services/recommendation_service.py::get_recommendations`  
-> cards shown in dashboard recommendation panel.

### Flow F: Manual analysis page
`frontend/src/app/analysis/page.tsx`  
-> `analysisApi.analyze/getHistory/getSessionAnalysis`  
-> `backend/routers/analysis.py`  
-> `backend/services/nlp_service.py` + DB queries on `messages`.

### Flow G: ML model lifecycle
`ml_training/01_preprocess.py`  
-> `ml_training/02_train_model.py`  
-> `ml_training/03_evaluate.py`  
-> `ml_training/04_explain.py`  
-> copy `outputs/model.pkl` + `vectorizer.pkl` to `backend/ml/`  
-> `backend/main.py` startup calls `load_ml_models()`  
-> live inference in `nlp_service.py` during chat/analysis.

---

## 19. What makes the project “finished” as an integrated system

- Frontend is connected to real backend endpoints (not mock-only).
- Backend endpoints are implemented with schema validation and tests.
- JWT auth and consent gates are enforced.
- Chat path includes NLP + LLM + DB persistence + mood aggregation.
- Dashboard and recommendations are driven by backend analytics.
- ML pipeline exists offline and backend can load generated artifacts.
- Ethical and safety requirements are implemented in UI and backend behavior.