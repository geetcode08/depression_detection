# Technology Stack

## Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | 0.111+ | REST API framework |
| Uvicorn | 0.29+ | ASGI server |
| SQLAlchemy | 2.x | ORM for database access |
| SQLite | built-in | MVP database (file-based) |
| Alembic | 1.x | Database migrations |
| Pydantic | v2 | Request/response validation |
| python-jose | 3.x | JWT token generation/validation |
| passlib[bcrypt] | 1.x | Password hashing |
| python-dotenv | 1.x | Environment variable loading |
| httpx | 0.27+ | Async HTTP for LLM API calls |
| CORS Middleware | via FastAPI | Allow Next.js frontend access |

## Machine Learning Layer
| Technology | Version | Purpose |
|-----------|---------|---------|
| scikit-learn | 1.4+ | TF-IDF vectorizer, Logistic Regression |
| NLTK | 3.8+ | Tokenization, stopword removal, VADER |
| vaderSentiment | 3.3+ | Rule-based sentiment scoring |
| pandas | 2.x | Tabular data manipulation |
| numpy | 1.26+ | Numerical operations |
| joblib | 1.x | Model serialization (.pkl files) |

## Frontend (planned)
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 14.x (App Router) | React framework, routing, SSR |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui | latest | Pre-built accessible UI components |
| Recharts | 2.x | Charts on dashboard |
| Zustand | 4.x | Client-side state management |
| Axios | 1.x | HTTP client for API calls |
| next-auth | 4.x | Authentication (JWT + credentials) |

## External APIs
| API / Service | Usage | Auth Method |
|--------------|-------|-------------|
| Groq API (primary) | Chatbot response generation via llama3-8b-8192 | GROQ_API_KEY in .env |
| OpenAI API (fallback) | GPT-3.5-turbo fallback | OPENAI_API_KEY in .env |
| HuggingFace Inference API | Optional emotion detection | HF_API_TOKEN in .env |
