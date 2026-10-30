"""ParyatakRoute FastAPI Application Entrypoint.

Provides the configured FastAPI application instance, CORS middleware,
centralized exception handling, health checks, and API routing.
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_v1_router
from app.api.routes.health import router as root_health_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import get_logger, setup_logging

settings = get_settings()
setup_logging()
logger = get_logger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown lifecycle management."""
    logger.info(
        f"ParyatakRoute FastAPI backend starting up: env={settings.APP_ENV}, origins={settings.cors_origins}"
    )
    yield
    logger.info("ParyatakRoute FastAPI backend shutting down")


app = FastAPI(
    title="ParyatakRoute Backend",
    description="High-performance FastAPI backend for the ParyatakRoute intelligent travel itinerary planner.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Centralized exception handling
register_exception_handlers(app)

# Explicit CORS configuration for frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Root level health checks for Render / platform probes
app.include_router(root_health_router, prefix="/health", tags=["Health"])


@app.get("/", tags=["Root"])
async def root_index() -> JSONResponse:
    """Root metadata endpoint identifying the official ParyatakRoute backend."""
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "app": "ParyatakRoute",
            "version": "1.0.0",
            "status": "online",
            "docs": "/docs",
            "health": "/health",
            "api_v1": "/api/v1",
        },
    )


# Mount versioned API routes under /api/v1
app.include_router(api_v1_router)
