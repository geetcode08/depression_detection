import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import engine, Base
from services.nlp_service import load_ml_models

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Depression AI System backend...")

    # Create tables (for development — use alembic in production)
    async with engine.begin() as conn:
        # Import all models so Base.metadata knows about them
        import models  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
from routers import auth, chat, analysis, recommend, dashboard  # noqa: E402

app.include_router(auth.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(analysis.router, prefix="/api/v1")
app.include_router(recommend.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Depression AI System API", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
