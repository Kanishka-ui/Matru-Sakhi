"""
MatruSakhi - Maternal Health Companion API
Main FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.database import connect_to_database, close_database_connection
from app.api.routes.auth import router as auth_router
from app.api.routes.chat import router as chat_router
from app.api.routes.health import router as health_router
from app.api.routes.appointments import router as appointments_router
from app.api.routes.alerts import router as alerts_router
from app.api.routes.content import router as content_router
from app.api.routes.reports import router as reports_router
from app.api.routes.sos import router as sos_router
from app.api.routes.partner import router as partner_router
from app.services.content_service import seed_content


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown events."""
    # Startup
    await connect_to_database()
    print(f"[STARTUP] {settings.APP_NAME} v{settings.APP_VERSION} starting up...")
    # Seed educational content
    try:
        count = await seed_content()
        print(f"[CONTENT] {count} educational content items available")
    except Exception as e:
        print(f"[WARNING] Content seeding skipped: {e}")
    yield
    # Shutdown
    await close_database_connection()
    print(f"[SHUTDOWN] {settings.APP_NAME} shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="MatruSakhi - AI-powered maternal health companion for expectant and new mothers",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Include Routers ────────────────────────────────────────
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(health_router)
app.include_router(partner_router)
app.include_router(appointments_router)
app.include_router(alerts_router)
app.include_router(content_router)
app.include_router(reports_router)
app.include_router(sos_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "status": "healthy",
    }


@app.get("/api/status")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }
