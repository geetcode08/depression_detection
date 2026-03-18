# Depression AI System

> Multimodal AI System for Personalized Depression Detection and Intervention Using NLP and Behavioral Analytics

⚠️ **DISCLAIMER**: This system is NOT a medical diagnostic tool. It is an AI-assisted emotional support and non-clinical screening system.

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Fill in your API keys
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
npm run dev
```

## Architecture
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend**: FastAPI + SQLAlchemy + SQLite
- **ML**: scikit-learn (TF-IDF + Logistic Regression) + VADER Sentiment
- **LLM**: Groq API (llama3-8b-8192)

## Documentation
See `/docs` folder for complete project documentation.
See `/ai` folder for AI agent development instructions.

## API Base URL
`http://localhost:8000/api/v1`

## License
Academic project — Final Year Major Project.
