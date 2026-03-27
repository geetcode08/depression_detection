"""Fixes: explicit /api/v1/chat router mount and localhost:3000 CORS allowance for frontend integration."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from config import settings
from database import engine, Base
from services.nlp_service import load_ml_models

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def _repair_legacy_sqlite_schema_if_needed() -> None:
    """Patch older local SQLite databases that predate newer model columns."""
    if not settings.DATABASE_URL.startswith("sqlite"):
        return

    async with engine.begin() as conn:
        users_cols_result = await conn.execute(text("PRAGMA table_info(users)"))
        users_cols = {row[1] for row in users_cols_result.fetchall()}
        if "cumulative_words" not in users_cols:
            await conn.execute(text("ALTER TABLE users ADD COLUMN cumulative_words INTEGER NOT NULL DEFAULT 0"))
            logger.info("Added missing users.cumulative_words column")

        sessions_cols_result = await conn.execute(text("PRAGMA table_info(chat_sessions)"))
        session_cols = {row[1] for row in sessions_cols_result.fetchall()}

        if "total_user_words" not in session_cols:
            await conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN total_user_words INTEGER NOT NULL DEFAULT 0"))
            logger.info("Added missing chat_sessions.total_user_words column")
        if "session_summary" not in session_cols:
            await conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN session_summary TEXT"))
            logger.info("Added missing chat_sessions.session_summary column")
        if "analysis_tier_reached" not in session_cols:
            await conn.execute(
                text(
                    "ALTER TABLE chat_sessions "
                    "ADD COLUMN analysis_tier_reached VARCHAR(30) NOT NULL DEFAULT 'gathering'"
                )
            )
            logger.info("Added missing chat_sessions.analysis_tier_reached column")
        if "opener_message_id" not in session_cols:
            await conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN opener_message_id INTEGER"))
            logger.info("Added missing chat_sessions.opener_message_id column")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Depression AI System backend...")

    # Create tables (for development — use alembic in production)
    async with engine.begin() as conn:
        # Import all models so Base.metadata knows about them
        import models  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
    await _repair_legacy_sqlite_schema_if_needed()
    logger.info("Database tables created/verified")

    # Load ML models
    load_ml_models()

    yield

    # Shutdown
    await engine.dispose()
    logger.info("Backend shutdown complete")



app = FastAPI(
    title="Depression AI System",
    description="AI-Assisted Emotional Support System with NLP and Behavioral Analytics",
    version="1.0.0",
    lifespan=lifespan,
)
logger.info("FastAPI app initialized")

# CORS middleware
configured_origins = [origin for origin in settings.cors_origins_list if origin]
frontend_origin = "http://localhost:3000"

if configured_origins == ["*"]:
    cors_origins = [frontend_origin]
else:
    cors_origins = list(dict.fromkeys([frontend_origin, *configured_origins]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info(f"CORS configured for origins: {cors_origins}")

# Register routers

from routers import auth, chat, analysis, recommend, dashboard  # noqa: E402
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
logger.info("Auth router registered at /api/v1/auth")
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
logger.info("Chat router registered at /api/v1/chat")
app.include_router(analysis.router, prefix="/api/v1")
logger.info("Analysis router registered at /api/v1")
app.include_router(recommend.router, prefix="/api/v1")
logger.info("Recommend router registered at /api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
logger.info("Dashboard router registered at /api/v1")


@app.get("/")
async def root():
    return {"message": "Depression AI System API", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
