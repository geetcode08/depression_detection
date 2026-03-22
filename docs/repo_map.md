# Repository Map

```
depression-ai-system/
├── README.md
├── .env.example
├── docs/
│   ├── SRS.md                          # Software Requirements Specification
│   ├── project_overview.md             # Project summary and status
│   ├── architecture.md                 # System architecture and data flow
│   ├── design.md                       # Design decisions and user flows
│   ├── tech_stack.md                   # All technologies with versions
│   ├── database_schema.md             # Table definitions and relationships
│   ├── api_contracts.md               # REST API endpoint specifications
│   ├── coding_standards.md            # Code style and conventions
│   ├── feature_registry.md            # Feature tracking with status
│   ├── task_board.md                  # Sprint planning and progress
│   ├── deployment.md                  # Setup and deployment guide
│   ├── glossary.md                    # Term definitions
│   ├── repo_map.md                    # This file — directory structure
│   ├── ai_rules.md                    # Rules for AI agent development
│   └── session_context.md            # Session continuation context
├── ai/
│   ├── system_prompt.md               # AI agent system prompt
│   ├── development_workflow.md        # AI development workflow rules
│   └── memory_strategy.md            # AI memory and context strategy
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   ├── main.py                        # FastAPI app entry point
│   ├── config.py                      # Settings via pydantic-settings
│   ├── database.py                    # SQLAlchemy engine + session
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                    # User model
│   │   ├── session.py                 # ChatSession model
│   │   ├── message.py                 # Message model
│   │   └── mood_log.py               # MoodLog model
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py                    # User request/response schemas
│   │   ├── chat.py                    # Chat schemas
│   │   ├── analysis.py               # Analysis schemas
│   │   └── dashboard.py              # Dashboard schemas
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py                    # POST /auth/register, /auth/login
│   │   ├── chat.py                    # POST /chat/send
│   │   ├── analysis.py               # POST /analyze, GET /analyze/history
│   │   ├── recommend.py              # GET /recommend
│   │   └── dashboard.py              # GET /dashboard/*
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py           # JWT + password hashing
│   │   ├── llm_service.py            # Groq API + system prompt
│   │   ├── nlp_service.py            # VADER + ML inference
│   │   ├── recommendation_service.py # Rule-based recommendations
│   │   └── behavioral_service.py     # Pattern analysis + mood aggregation
│   ├── ml/
│   │   ├── model.pkl                  # Trained LogReg (from ml_training)
│   │   └── vectorizer.pkl            # Fitted TF-IDF (from ml_training)
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   └── alembic.ini
├── ml_training/
│   ├── requirements.txt
│   ├── 01_preprocess.py
│   ├── 02_train_model.py
│   ├── 03_evaluate.py
│   ├── 04_explain.py
│   ├── data/
│   │   ├── raw/                       # Place dataset CSVs here
│   │   └── processed/
│   └── outputs/
│       ├── model.pkl
│       └── vectorizer.pkl
└── frontend/
	├── .env.local.example
	├── package.json
	├── tsconfig.json
	├── next.config.ts
	├── eslint.config.mjs
	├── postcss.config.mjs
	├── public/
	└── src/
		├── app/
		│   ├── layout.tsx
		│   ├── page.tsx
		│   ├── client-layout.tsx
		│   ├── (auth)/
		│   │   ├── login/page.tsx
		│   │   └── register/page.tsx
		│   ├── chat/page.tsx
		│   └── dashboard/page.tsx
		├── components/
		│   ├── chat/
		│   ├── dashboard/
		│   ├── shared/
		│   └── ui/
		├── hooks/useChat.ts
		├── lib/
		│   ├── api.ts
		│   ├── auth.ts
		│   └── utils.ts
		├── store/
		│   ├── chatStore.ts
		│   └── userStore.ts
		└── types/index.ts
```
