SOFTWARE REQUIREMENTS SPECIFICATION
Multimodal AI System for Personalized Depression Detection and Intervention
Using NLP and Behavioral Analytics
Version: 1.0 | Document Type: Master SRS + Agent Execution Guide
Target: AI Agent (Opus 4.6) + Human Developer
Final Year Major Project — Computer Science / AI Engineering

⚠️ DISCLAIMER: This system is NOT a medical diagnostic tool. It is an AI-assisted emotional support and non-clinical screening system.


1. PROJECT OVERVIEW
This SRS serves a dual purpose: it is both a formal specification for human developers and a structured prompt document for AI coding agents. Every section is written to be unambiguous, technology-specific, and directly actionable.
1.1 Problem Statement
Mental health awareness lacks accessible, low-barrier self-monitoring tools. This project builds a web-based AI assistant that helps users track emotional states, detect early signs of depressive patterns through conversational NLP and behavioral analytics, and receive personalized non-clinical recommendations — all with full ethical safeguards.
1.2 Project Classification
FieldValueProject TypeFinal Year Major Project (MVP)DomainMental Health Tech / Applied AI / Full-Stack WebSystem ClassAI-Assisted Emotional Support System (Non-Clinical)Primary InterfaceWeb Application with Chatbot UIArchitectureMonorepo: Next.js Frontend + FastAPI Backend + ML LayerMVP Timeline6 Weeks (Phased)
1.3 Core Capabilities

Conversational chatbot powered by LLM API (Groq / OpenAI)
NLP-based depression risk scoring via TF-IDF + Logistic Regression
Sentiment analysis per message using VADER + HuggingFace model
Behavioral analytics: message frequency, length, time-of-day patterns
Mood trend visualization dashboard (time-series charts)
Personalized activity recommendations based on risk level
Explainability: keyword highlighting + confidence score display
Ethical safeguards: consent gate, disclaimer, crisis escalation


2. TECHNOLOGY STACK (FULLY SPECIFIED)
All technologies below are pinned to ensure reproducibility. No ambiguity in library choice.
2.1 Frontend
TechnologyVersionPurposeNext.js14.x (App Router)React framework, routing, SSRTypeScript5.xType safety across all componentsTailwind CSS3.xUtility-first stylingshadcn/uilatestPre-built accessible UI componentsRecharts2.xMood/sentiment charts on dashboardZustand4.xClient-side state managementAxios1.xHTTP client for API callsReact Hook Form7.xForm handling (consent, auth)Zod3.xSchema validation (form + API response)next-auth4.xAuthentication (JWT + credentials)date-fns3.xDate formatting for dashboard
2.2 Backend
TechnologyVersionPurposePython3.11+RuntimeFastAPI0.111+REST API frameworkUvicorn0.29+ASGI serverSQLAlchemy2.xORM for database accessSQLitebuilt-inMVP database (file-based)Alembic1.xDatabase migrationsPydanticv2Request/response validationpython-jose3.xJWT token generation/validationpasslib[bcrypt]1.xPassword hashingpython-dotenv1.xEnvironment variable loadinghttpx0.27+Async HTTP for LLM API callsCORS Middlewarevia FastAPIAllow Next.js frontend access
2.3 Machine Learning Layer
TechnologyVersionPurposescikit-learn1.4+TF-IDF vectorizer, Logistic Regression, evaluationNLTK3.8+Tokenization, stopword removal, VADER sentimentvaderSentiment3.3+Rule-based sentiment scoring (fast, offline)pandas2.xTabular data manipulation for featuresnumpy1.26+Numerical operationsjoblib1.xModel serialization (.pkl files)transformers4.40+ (optional)BERT model for advanced emotion detectiontorch2.x (optional)PyTorch backend for transformersdatasets (HuggingFace)optionalLoading public mental health datasets
2.4 External APIs
API / ServiceUsageAuth MethodGroq API (primary LLM)Chatbot response generation via llama3-8b-8192 model. Free tier available.GROQ_API_KEY in .envOpenAI API (fallback LLM)GPT-3.5-turbo for chatbot responses if Groq unavailable.OPENAI_API_KEY in .envHuggingFace Inference APIOptional: j-hartmann/emotion-english-distilroberta-base for emotion label (joy/sadness/fear etc.)HF_API_TOKEN in .envDAIC-WOZ Dataset (offline)Training data for depression classification model. Download requires form fill at USC.No API — static filesSentiment140 / IMDB (fallback)Alternative training data if DAIC-WOZ is unavailable. Public domain.No API — Kaggle CSV

NOTE FOR AGENT: Use Groq API as the primary LLM provider. It is free, fast (<1s), and requires only an API key from console.groq.com. Model: llama3-8b-8192. System prompt must include mental health assistant persona + safety guardrails.


3. COMPLETE FOLDER STRUCTURE (MVP)
This is the exact directory tree the AI agent must generate. Do not deviate. All paths are relative to the project root.
depression-ai-system/
├── README.md
├── .env.example
├── docker-compose.yml  (optional, for local dev)
│
├── frontend/  (Next.js 14 App)
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── .env.local.example
│   ├── public/
│   │   └── logo.svg
│   └── src/
│       ├── app/
│       │   ├── layout.tsx              (root layout + font)
│       │   ├── page.tsx                (landing / consent screen)
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   └── register/page.tsx
│       │   ├── chat/page.tsx           (main chat interface)
│       │   ├── dashboard/page.tsx      (mood charts + analytics)
│       │   └── api/                    (Next.js route handlers if needed)
│       ├── components/
│       │   ├── ui/                     (shadcn components — auto-generated)
│       │   ├── chat/
│       │   │   ├── ChatWindow.tsx      (scrollable message list)
│       │   │   ├── ChatInput.tsx       (text input + send button)
│       │   │   ├── MessageBubble.tsx   (user vs assistant styling)
│       │   │   └── RiskBadge.tsx       (low/medium/high indicator)
│       │   ├── dashboard/
│       │   │   ├── MoodLineChart.tsx   (Recharts line chart)
│       │   │   ├── SentimentPieChart.tsx
│       │   │   ├── RiskTrendChart.tsx
│       │   │   └── StatCard.tsx        (summary stat card)
│       │   └── shared/
│       │       ├── Navbar.tsx
│       │       ├── ConsentModal.tsx
│       │       ├── CrisisAlert.tsx     (shows when high risk detected)
│       │       └── Disclaimer.tsx
│       ├── lib/
│       │   ├── api.ts                  (axios instance + typed API calls)
│       │   ├── auth.ts                 (next-auth config)
│       │   └── utils.ts
│       ├── store/
│       │   ├── chatStore.ts            (Zustand: messages, session)
│       │   └── userStore.ts            (Zustand: user profile, settings)
│       ├── types/
│       │   └── index.ts                (shared TypeScript interfaces)
│       └── hooks/
│           └── useChat.ts              (custom hook: send msg, update store)
│
├── backend/  (FastAPI)
│   ├── requirements.txt
│   ├── .env.example
│   ├── main.py                         (app entry point, middleware, routers)
│   ├── config.py                       (settings via pydantic-settings)
│   ├── database.py                     (SQLAlchemy engine + session)
│   ├── models/                         (SQLAlchemy ORM models)
│   │   ├── user.py
│   │   ├── session.py
│   │   ├── message.py
│   │   └── mood_log.py
│   ├── schemas/                        (Pydantic v2 request/response schemas)
│   │   ├── user.py
│   │   ├── chat.py
│   │   ├── analysis.py
│   │   └── dashboard.py
│   ├── routers/                        (FastAPI APIRouter per domain)
│   │   ├── auth.py                     (POST /auth/register, /auth/login)
│   │   ├── chat.py                     (POST /chat/send)
│   │   ├── analysis.py                 (POST /analyze, GET /analyze/history)
│   │   ├── recommend.py                (GET /recommend)
│   │   └── dashboard.py                (GET /dashboard/stats)
│   ├── services/
│   │   ├── llm_service.py              (Groq API call + system prompt)
│   │   ├── nlp_service.py              (VADER + ML model inference)
│   │   ├── recommendation_service.py   (rule-based + prompt-based recs)
│   │   ├── behavioral_service.py       (pattern analysis from DB)
│   │   └── auth_service.py             (JWT create/verify)
│   ├── ml/                             (loaded at startup — NOT trained at runtime)
│   │   ├── model.pkl                   (trained LogReg model)
│   │   └── vectorizer.pkl              (fitted TF-IDF vectorizer)
│   └── alembic/                        (DB migrations)
│       ├── env.py
│       └── versions/
│
└── ml_training/  (offline training scripts — run once)
    ├── requirements.txt
    ├── 01_preprocess.py                (clean + tokenize dataset)
    ├── 02_train_model.py               (fit TF-IDF + LogReg, save .pkl)
    ├── 03_evaluate.py                  (accuracy, F1, confusion matrix)
    ├── 04_explain.py                   (LIME / keyword extraction)
    ├── data/
    │   └── raw/                        (place downloaded dataset CSVs here)
    └── outputs/
        ├── model.pkl                   (copy to backend/ml/)
        └── vectorizer.pkl              (copy to backend/ml/)

4. DATABASE SCHEMA (SQLite via SQLAlchemy)
Four tables. All use Integer primary keys (autoincrement). SQLite file stored at backend/depression_ai.db.
4.1 Table: users
ColumnTypeConstraints / NotesidINTEGERPRIMARY KEY, AUTOINCREMENTusernameVARCHAR(50)UNIQUE, NOT NULLemailVARCHAR(120)UNIQUE, NOT NULLhashed_passwordVARCHAR(255)NOT NULL — bcrypt hashis_anonymousBOOLEANDEFAULT FALSE — for guest modeconsent_givenBOOLEANDEFAULT FALSE — must be TRUE before any data storedcreated_atDATETIMEDEFAULT CURRENT_TIMESTAMP
4.2 Table: chat_sessions
ColumnTypeConstraints / NotesidINTEGERPRIMARY KEY, AUTOINCREMENTuser_idINTEGERFOREIGN KEY → users.id, NOT NULLstarted_atDATETIMEDEFAULT CURRENT_TIMESTAMPended_atDATETIMENULLABLEtotal_messagesINTEGERDEFAULT 0
4.3 Table: messages
ColumnTypeConstraints / NotesidINTEGERPRIMARY KEY, AUTOINCREMENTsession_idINTEGERFOREIGN KEY → chat_sessions.iduser_idINTEGERFOREIGN KEY → users.idroleVARCHAR(10)ENUM: 'user' | 'assistant'contentTEXTNOT NULL — raw message textsentiment_scoreFLOATNULLABLE — VADER compound score (-1.0 to 1.0)depression_risk_scoreFLOATNULLABLE — ML model probability (0.0 to 1.0)risk_labelVARCHAR(10)NULLABLE — 'low' | 'medium' | 'high'emotion_labelVARCHAR(20)NULLABLE — HuggingFace output if enabledmessage_lengthINTEGERCharacter count of contentcreated_atDATETIMEDEFAULT CURRENT_TIMESTAMP
4.4 Table: mood_logs
ColumnTypeConstraints / NotesidINTEGERPRIMARY KEY, AUTOINCREMENTuser_idINTEGERFOREIGN KEY → users.iddateDATEOne entry per day per useravg_sentimentFLOATAverage VADER score for the dayavg_risk_scoreFLOATAverage depression risk score for the daydominant_emotionVARCHAR(20)NULLABLE — most frequent emotion labelmessage_countINTEGERNumber of user messages that daylate_night_activityBOOLEANTRUE if any messages sent between 00:00–05:00

5. REST API SPECIFICATION
Base URL (dev): http://localhost:8000/api/v1
All endpoints return JSON. All protected endpoints require: Authorization: Bearer <JWT_TOKEN> header.
5.1 Authentication Endpoints
EndpointMethod + PathDescriptionRegisterPOST /auth/registerBody: {username, email, password}. Returns: {id, username, email}. Hashes password with bcrypt.LoginPOST /auth/loginBody: {email, password} (OAuth2 form). Returns: {access_token, token_type: 'bearer'}. Token expiry: 24h.Get MeGET /auth/meProtected. Returns current user profile from JWT payload.Give ConsentPATCH /auth/consentProtected. Sets consent_given=TRUE. Required before any analysis data is stored.
5.2 Chat Endpoint
FieldDetailNotesPathPOST /chat/sendProtectedRequest Body{session_id?: int, message: string}If no session_id, creates new session automaticallyResponse Body{reply: string, session_id: int, analysis: AnalysisResult}AnalysisResult defined belowAnalysisResult fieldssentiment_score: float, risk_score: float, risk_label: string, top_keywords: string[], confidence: float, emotion_label?: stringAll returned inline with chat replyLLM UsedGroq API — llama3-8b-8192System prompt enforces safety guardrailsTrigger Escalation ifrisk_label == 'high' (risk_score >= 0.65)Response includes crisis_alert: true flag
5.3 Analysis Endpoints
EndpointMethod + PathDescriptionAnalyze TextPOST /analyzeBody: {text: string}. Runs NLP pipeline on arbitrary text. Returns AnalysisResult. Protected.Analysis HistoryGET /analyze/history?limit=50Returns last N analysis results for current user ordered by created_at DESC.Session AnalysisGET /analyze/session/{session_id}Returns aggregated analysis for a specific chat session.
5.4 Recommendation Endpoint
FieldDetailNotesPathGET /recommendProtectedQuery Paramsrisk_label: string (low|medium|high)Response{recommendations: Recommendation[]}Recommendation fieldscategory: string, title: string, description: string, priority: intcategories: activity | journaling | social | professional_help | breathingLogicRule-based mapping from risk_label to curated recommendation poolLow: 5 activities. Medium: 7 activities + journaling. High: 5 activities + strong professional_help prompt.
5.5 Dashboard Endpoints
EndpointMethod + PathResponse ShapeStats OverviewGET /dashboard/stats{total_messages, avg_sentiment_7d, avg_risk_7d, current_streak_days}Mood TrendGET /dashboard/mood?days=30{dates: string[], sentiment_scores: float[], risk_scores: float[]} — for Recharts line chartSentiment DistributionGET /dashboard/sentiment-dist{positive: int, neutral: int, negative: int} — for pie chartBehavioral PatternsGET /dashboard/behavior{late_night_days: int, avg_message_length: float, most_active_hour: int, weekly_frequency: int[]}

6. MACHINE LEARNING PIPELINE SPECIFICATION
The ML model is trained OFFLINE in ml_training/ and the resulting .pkl files are copied into backend/ml/. The backend loads them once at startup. No training happens at runtime.
6.1 Dataset
OptionDatasetDetailsPrimaryDAIC-WOZ Extended (PHQ-8)USC ICT. Text transcripts labeled with depression severity. Requires form registration. Binary label: depressed (PHQ >= 10) vs not.Fallback AReddit Depression/Happy DatasetPublic. ~30k posts from r/depression (positive class) and r/happy (negative class). Available on Kaggle.Fallback BSentiment1401.6M tweets. Use negative sentiment as proxy for depression signal. Not ideal but usable for demo.

AGENT NOTE: Use the Reddit Depression dataset (Kaggle) for MVP training. It is immediately accessible, binary labeled, and sufficient for demonstrating the concept. CSV columns used: text (input), label (0=no depression, 1=depression).

6.2 Preprocessing Steps (01_preprocess.py)

Load CSV with pandas. Drop rows where text is NaN or len(text) < 10.
Lowercase all text.
Remove URLs, email addresses, special characters (regex).
Tokenize using NLTK word_tokenize.
Remove stopwords using NLTK stopwords corpus (english).
Apply stemming using NLTK PorterStemmer (optional but improves generalization).
Rejoin tokens into cleaned string.
Save as data/processed/clean_data.csv with columns: cleaned_text, label.

6.3 Feature Extraction
ParameterValueVectorizerTfidfVectorizer from scikit-learnmax_features10000 (top 10k unigrams + bigrams)ngram_range(1, 2) — unigrams and bigramsmin_df3 — ignore terms appearing in < 3 docsmax_df0.90 — ignore very common termssublinear_tfTrue — apply log normalization to TFFit onTraining split ONLY (80%). Transform both train and test.Save asml_training/outputs/vectorizer.pkl via joblib.dump
6.4 Model Training (02_train_model.py)
ParameterValueAlgorithmLogisticRegression (scikit-learn)solverliblinearC (regularization)1.0max_iter1000class_weightbalanced (handles class imbalance)random_state42Train/Test Split80/20 using train_test_split(stratify=label)Save asml_training/outputs/model.pkl via joblib.dump
6.5 Model Output Interpretation
risk_score Rangerisk_labelAction Taken0.0 – 0.35lowNormal response + general wellness tips0.35 – 0.65mediumEmpathetic response + suggest journaling/activities0.65 – 1.0highCompassionate response + crisis_alert: true + helpline info
6.6 Explainability (04_explain.py)
Extract top N keywords contributing to the prediction using the TF-IDF feature names and the LogReg coefficient weights. For a given input text, compute TF-IDF vector, then find the top 5 feature indices with highest weighted values. Return those feature names as top_keywords in the API response. This mimics lightweight LIME without requiring the LIME library.
6.7 Evaluation Metrics (03_evaluate.py)

Accuracy (overall correctness)
Precision, Recall, F1-score (per class) — via classification_report
ROC-AUC score
Confusion matrix (print + save as PNG via matplotlib)

Target minimum acceptable performance: F1-score >= 0.75 on test set. If below, try adjusting C, switching to SGDClassifier, or using more training data.

7. FUNCTIONAL REQUIREMENTS (DETAILED)
IDRequirementAcceptance CriterionFR-01User Registration: POST /auth/register with email, username, password. Password hashed with bcrypt. JWT returned on login.User can register, login, and access protected routes. JWT expires in 24h.FR-02Consent Gate: Before first analysis, user must accept consent modal. consent_given flag set to TRUE in DB.No analysis data stored until consent given. API returns 403 if consent not given.FR-03Chat Send: User sends message → LLM (Groq) generates reply → NLP pipeline analyzes user message → all stored in DB.Round-trip < 3s (LLM call ~1s, NLP ~50ms, DB ~10ms).FR-04Sentiment Analysis: Each user message is scored using VADER compound score. Score stored in messages table.Score in range [-1.0, 1.0]. Positive > 0.05, Negative < -0.05, Neutral in between.FR-05Depression Risk Scoring: User message preprocessed and passed to loaded LogReg + TF-IDF. Returns probability score and label.Model loaded at startup. Inference < 100ms. Score stored in messages.depression_risk_score.FR-06Crisis Escalation: If risk_label == 'high', API sets crisis_alert: true. Frontend shows CrisisAlert component with iCall / Vandrevala helpline numbers.Alert shown immediately. Message still delivered. No data withheld.FR-07Mood Dashboard: GET /dashboard/mood returns 30-day time-series. Frontend renders with Recharts LineChart.Chart shows dual Y-axis or dual line for sentiment and risk. Dates on X-axis.FR-08Recommendations: GET /recommend?risk_label=medium returns 5-7 curated activity recommendations.Recommendations are categorized, not generic. High risk always includes professional help suggestion.FR-09Behavioral Analytics: GET /dashboard/behavior returns late_night_activity, avg_message_length, most_active_hour.Computed from messages table for last 30 days for current user.FR-10Explainability: Chat response includes top_keywords (array of 5 strings) and confidence (float).Keywords are actual TF-IDF feature names, not hallucinated. Confidence is max class probability.FR-11Anonymous Mode: User can use app without registration. Session tracked by device-generated UUID in localStorage.anonymous=true sessions do not store email or password. Analysis stored linked to anonymous user ID.FR-12Mood Log Aggregation: A background function (called after each message) aggregates daily mood into mood_logs table.One row per user per day. Upsert pattern: insert if not exists, update if exists.

8. NON-FUNCTIONAL REQUIREMENTS
IDRequirementTarget MetricNFR-01API Response TimePOST /chat/send < 3s end-to-end. GET endpoints < 200ms.NFR-02ML Model Loadmodel.pkl and vectorizer.pkl loaded once at FastAPI startup using lifespan event. Not reloaded per request.NFR-03Type SafetyTypeScript strict mode on frontend. Pydantic v2 on backend. Zero any types in production code.NFR-04Error HandlingAll FastAPI routes use HTTPException with appropriate status codes. Frontend shows toast notifications on API errors.NFR-05SecurityJWT secret via env variable. CORS restricted to frontend origin. Passwords never stored in plain text. No PII logged.NFR-06ScalabilityFastAPI is async throughout. SQLAlchemy uses async sessions. Can be upgraded to PostgreSQL by changing DATABASE_URL.NFR-07PortabilityBackend works on Linux/Mac/Windows. Docker Compose file included for one-command local setup.NFR-08Ethical ComplianceDisclaimer shown on every page. Consent required. No clinical diagnosis language used. All high-risk responses include professional help.

9. LLM SYSTEM PROMPT SPECIFICATION (Groq / llama3-8b-8192)
The system prompt below MUST be used verbatim in backend/services/llm_service.py. It enforces the persona, safety limits, and conversational style.
You are Aura, a compassionate AI emotional support assistant. You help users reflect on their feelings and well-being.

IMPORTANT RULES (follow strictly, never violate):
1. You are NOT a doctor, therapist, or medical professional. Never provide clinical diagnosis.
2. Never tell a user they have depression. You may gently reflect observations like:
   'It sounds like you've been feeling quite low lately.'
3. If the user expresses suicidal thoughts, self-harm, or a crisis, ALWAYS respond with:
   'I hear you, and I'm concerned about your safety. Please reach out to iCall at
   9152987821 (India) or Vandrevala Foundation at 1860-2662-345. You don't have to
   face this alone.'
4. Always respond with empathy. Use warm, non-judgmental language.
5. Keep responses concise (3-5 sentences max) unless the user asks for more detail.
6. Do not prescribe medication, suggest diagnoses, or recommend specific doctors.
7. You may suggest journaling, breathing exercises, physical activity, and social connection.
8. If the user asks if you are human, always clarify you are an AI.

Your tone: warm, calm, validating, hopeful. Like a thoughtful friend who listens without judgment.

10. PHASED IMPLEMENTATION PLAN (6 Weeks)
Phase 1 — Week 1: Project Scaffold + Auth
TaskFiles to CreateDone WhenInit Next.js 14 frontendfrontend/ with TypeScript + Tailwind + shadcn/uinpm run dev worksInit FastAPI backendbackend/main.py, config.py, database.py, requirements.txtuvicorn main:app runsCreate DB modelsbackend/models/*.py + alembic initalembic upgrade head creates tablesImplement Authbackend/routers/auth.py + services/auth_service.pyRegister + Login return JWTFrontend Auth Pagesfrontend/src/app/(auth)/login + registerUser can login, JWT stored in cookieConsent Modalfrontend/src/components/shared/ConsentModal.tsxConsent stored, user unblocked
Phase 2 — Week 2: ML Training (Offline)
TaskFiles to CreateDone WhenDownload Reddit depression datasetml_training/data/raw/CSV with text + label columns presentPreprocessing scriptml_training/01_preprocess.pyclean_data.csv generatedTraining scriptml_training/02_train_model.pymodel.pkl + vectorizer.pkl in outputs/Evaluation scriptml_training/03_evaluate.pyF1 >= 0.75 printed in terminalCopy artifactsbackend/ml/model.pkl + vectorizer.pklFiles present in backend
Phase 3 — Week 3: Chat + NLP Pipeline
TaskFiles to CreateDone WhenNLP servicebackend/services/nlp_service.pyLoads pkl at startup, analyze(text) returns AnalysisResultLLM servicebackend/services/llm_service.pyCalls Groq API with system prompt, returns reply stringChat routerbackend/routers/chat.pyPOST /chat/send creates session, stores messages, returns reply + analysisChat UIfrontend/src/app/chat/page.tsx + chat componentsUser can type, see reply, see risk badgeCrisis Alertfrontend/src/components/shared/CrisisAlert.tsxShows modal with helplines when crisis_alert: true
Phase 4 — Week 4: Dashboard
TaskFiles to CreateDone WhenMood log aggregationbackend/services/behavioral_service.py — aggregate_daily_mood()mood_logs table updated after each messageDashboard routerbackend/routers/dashboard.pyAll 4 GET dashboard endpoints return correct shapeRecharts componentsfrontend/src/components/dashboard/*.tsxLine chart, pie chart, stat cards render with real dataDashboard pagefrontend/src/app/dashboard/page.tsxFull dashboard visible with charts
Phase 5 — Week 5: Recommendations + Explainability
TaskFiles to CreateDone WhenRecommendation servicebackend/services/recommendation_service.pyReturns curated list based on risk_labelRecommendation routerbackend/routers/recommend.pyGET /recommend worksKeyword extractionAdd to nlp_service.py — get_top_keywords(text, n=5)Returns list of strings from TF-IDF weightsDisplay in UIMessageBubble.tsx — show keywords + confidence chipEach assistant message shows explainability info
Phase 6 — Week 6: Polish, Testing, Deployment
TaskNotesDone WhenUnit testspytest for backend services. Vitest for frontend utils.All critical paths testedIntegration testsTestClient (FastAPI) for all routers. Mock LLM call.All routes return expected shapesError handling auditAll edge cases covered: empty message, model failure, LLM timeout.No unhandled 500 errorsFrontend deployVercel: connect GitHub repo, set NEXT_PUBLIC_API_URL env var.Production URL accessibleBackend deployRender.com or Railway: FastAPI Docker container. Set all .env vars.Health check endpoint returns 200Final documentationREADME.md with setup steps, env vars, architecture diagramAnother developer can run it in < 10 mins

11. ENVIRONMENT VARIABLES
11.1 Backend (.env)
VariableExample ValueRequiredDATABASE_URLsqlite:///./depression_ai.dbYESSECRET_KEYyour-256-bit-secret-string-hereYES — use secrets.token_hex(32)ACCESS_TOKEN_EXPIRE_MINUTES1440YESGROQ_API_KEYgsk_xxxxxxxxxxxxxxxxxxxxYES — from console.groq.comOPENAI_API_KEYsk-xxxxxxxxxxxxxxxxxxxxOptional fallbackHF_API_TOKENhf_xxxxxxxxxxxxxxxxxxxxOptional for emotion detectionCORS_ORIGINShttp://localhost:3000YES — comma-separated listENVIRONMENTdevelopmentYES — 'development' or 'production'
11.2 Frontend (.env.local)
VariableExample ValueRequiredNEXT_PUBLIC_API_URLhttp://localhost:8000/api/v1YESNEXTAUTH_SECRETyour-nextauth-secretYESNEXTAUTH_URLhttp://localhost:3000YES

12. TESTING STRATEGY
12.1 Backend Tests (pytest)
Test FileWhat to TestMethodtest_auth.pyRegister → Login → Get JWT → Access protected routeTestClient, no mocking neededtest_chat.pyPOST /chat/send with mock LLM call. Assert response shape. Assert messages stored in DB.Patch llm_service.get_reply with fixed stringtest_nlp.pyanalyze('I feel hopeless and sad') returns risk_score > 0.5 and sentiment_score < 0. analyze('I am happy today') returns risk_score < 0.4.Direct function call, assert rangestest_dashboard.pySeed DB with 5 messages. GET /dashboard/stats returns correct totals.TestClient + seed fixturetest_recommend.pyGET /recommend?risk_label=high always includes at least one professional_help category.Direct assertion on response data
12.2 Frontend Tests (Vitest + Testing Library)
ComponentTest CaseAssertionConsentModalRenders. Clicking accept calls onAccept callback.toBeInTheDocument, fireEvent.clickCrisisAlertDoes not render when crisis_alert=false. Renders helpline numbers when crisis_alert=true.queryByText, getByTextChatInputTyping and pressing Enter calls onSend with correct text. Clears input after send.fireEvent.change, fireEvent.keyDownMoodLineChartRenders with mock data array. Chart container present in DOM.Mock Recharts, assert wrapper renders

13. ETHICAL SAFEGUARDS (MANDATORY IMPLEMENTATION)
These are non-negotiable. The AI agent must implement ALL of these before the project is considered complete.
SafeguardImplementation LocationWhat Must HappenConsent GateConsentModal.tsx + PATCH /auth/consentUsers see consent text before any data is collected. No analysis until consent_given=TRUE.Disclaimer BannerNavbar.tsx — persistent bannerText: "This is not a medical tool. Consult a professional for clinical concerns." Always visible.No Diagnosis LanguageLLM system prompt + nlp_service.py commentsNever output "You have depression". Use "you may be experiencing" or "it sounds like".Crisis EscalationPOST /chat/send when risk_label=highcrisis_alert: true in response. Frontend shows CrisisAlert with iCall (9152987821) and Vandrevala (1860-2662-345).Data Minimizationmessages table + mood_logs tableStore only what is needed. No location, no device info, no third-party tracking.Anonymous Modeusers table is_anonymous flagUser can use app without providing email. UUID-based session tracking only.Data DeletionDELETE /auth/me routeUser can delete their account and all associated data. Cascade delete in DB.

14. DEPLOYMENT GUIDE
14.1 Frontend — Vercel

Push frontend/ directory to GitHub repo.
Connect repo to Vercel (vercel.com/import).
Set Root Directory to frontend/.
Add environment variables: NEXT_PUBLIC_API_URL, NEXTAUTH_SECRET, NEXTAUTH_URL.
Deploy. Vercel auto-builds on push to main.

14.2 Backend — Render.com

Create Dockerfile in backend/: FROM python:3.11-slim. COPY requirements.txt. RUN pip install. CMD uvicorn main:app --host 0.0.0.0 --port 8000.
Push backend/ to GitHub.
Create new Web Service on Render. Connect to repo. Set root to backend/.
Add all .env variables in Render dashboard.
Set start command: uvicorn main:app --host 0.0.0.0 --port $PORT.
Deploy. Update CORS_ORIGINS to Vercel URL. Update NEXT_PUBLIC_API_URL to Render URL.

14.3 SQLite Note for Production
SQLite on Render uses an ephemeral filesystem (data resets on redeploy). For production persistence, upgrade DATABASE_URL to PostgreSQL (Render free tier available). SQLAlchemy ORM makes this a one-line change.

15. AI AGENT EXECUTION CHECKLIST
This checklist is the ordered task list for an AI coding agent (Opus 4.6) to follow when building this project from scratch. Execute in order. Do not skip steps.
#TaskVerify With01Create root directory depression-ai-system/ with README.md and .env.examplels confirms structure02Scaffold frontend/ with: npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir. Then rename src/ back in.cd frontend && npm run dev loads http://localhost:300003Install frontend deps: shadcn/ui (npx shadcn@latest init), recharts, zustand, axios, react-hook-form, zod, next-auth, date-fnspackage.json has all deps04Create frontend folder structure: src/app/, src/components/, src/lib/, src/store/, src/types/, src/hooks/All directories exist05Create backend/ with requirements.txt listing all backend deps. Run pip install -r requirements.txt in venv.pip freeze matches requirements.txt06Create backend/config.py using pydantic-settings BaseSettings. Load all .env vars.from config import settings works07Create backend/database.py with SQLAlchemy async engine, SessionLocal, Base.No import errors08Create all 4 SQLAlchemy models in backend/models/. Run alembic init + first migration.alembic upgrade head creates all tables09Create all Pydantic schemas in backend/schemas/No import errors10Implement auth: routers/auth.py + services/auth_service.py. Test with curl.POST /auth/register + /auth/login return expected JSON11Run ml_training pipeline: download dataset → 01_preprocess → 02_train → 03_evaluate. Copy .pkl to backend/ml/F1 score >= 0.75 shown. .pkl files present in backend/ml/12Implement backend/services/nlp_service.py. Load .pkl at module level. Implement analyze(text) function.Direct Python call returns AnalysisResult dict13Implement backend/services/llm_service.py. Call Groq API with system prompt. Handle timeouts.Returns string reply in < 3s14Implement backend/routers/chat.py: POST /chat/send. Chain LLM + NLP + DB write + aggregation.Full round trip works with curl15Implement all dashboard service functions in behavioral_service.py + router.All 4 GET /dashboard/* return correct shape16Implement recommendation_service.py with curated pool for each risk_label.GET /recommend?risk_label=high includes professional_help17Build frontend ConsentModal, Disclaimer, Navbar shared components.Consent modal visible, dismissable, calls API18Build frontend chat/ page with ChatWindow, ChatInput, MessageBubble, RiskBadge.Full chat flow works in browser19Build frontend dashboard/ page with all 4 Recharts components + StatCards.Charts render with live data20Add CrisisAlert component. Test with high-risk message input.Alert shows with helpline numbers21Write and run all backend pytest tests. Fix failures.All tests pass22Write and run frontend Vitest tests. Fix failures.All tests pass23Write Dockerfile for backend. Test locally with docker build.Docker container starts successfully24Deploy frontend to Vercel. Deploy backend to Render. Update all URLs.Production URLs accessible25Final review: all ethical safeguards present, no clinical diagnosis language, helplines visible.Ethical checklist complete

APPENDIX A: CRISIS RESOURCES TO DISPLAY IN CrisisAlert.tsx
OrganizationContactAvailabilityiCall (India — TISS)9152987821Mon–Sat, 8am–10pmVandrevala Foundation1860-2662-34524/7iCall Online Chaticallhelpline.orgOnline chat availableNIMHANS Helpline080-46110007Mon–Sat, 8am–8pm

APPENDIX B: KEY DESIGN DECISIONS & RATIONALE
DecisionChosen OptionRationaleLLM ProviderGroq (llama3-8b-8192)Free tier, ~0.5s latency, no credit card for student use. OpenAI as fallback.Database for MVPSQLiteZero-config, file-based, perfect for college project demo. Easy PostgreSQL upgrade.ML ModelLogistic Regression + TF-IDFFast inference (~5ms), explainable (coefficients = feature importance), no GPU needed, suitable for college project scope.Sentiment ToolVADER (offline, no API key)Rule-based, instant, specifically tuned for social media text. No API cost.Frontend FrameworkNext.js 14 App RouterIndustry standard, built-in API routes, easy Vercel deployment, strong TypeScript support.Auth StrategyJWT (stateless)No session DB needed for MVP. Stored in httpOnly cookies for security.