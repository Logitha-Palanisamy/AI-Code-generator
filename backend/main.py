import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.core.config import settings
from backend.core.middleware import CorrelationIDMiddleware

from backend.db.base import Base
from backend.db.session import engine

from backend.models.user import User
from backend.models.project import Project
from backend.models.pipeline import PipelineRun
from backend.models.setting import Setting
from backend.models.ai_usage import AIUsageLog

from backend.routers import (
    auth,
    health,
    project,
    setting,
    admin,
    dashboard,
)

from backend.websocket import routes as ws_routes
from backend.websocket.manager import redis_pubsub_listener


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables
    Base.metadata.create_all(bind=engine)

    # Start Redis listener
    listener_task = asyncio.create_task(redis_pubsub_listener())

    try:
        yield
    finally:
        listener_task.cancel()
        try:
            await listener_task
        except asyncio.CancelledError:
            pass


# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware
app.add_middleware(CorrelationIDMiddleware)

# API Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(project.router, prefix=settings.API_V1_STR)
app.include_router(setting.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(ws_routes.router)

# ======================================================
# Serve React Frontend
# ======================================================

frontend_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
)

assets_path = os.path.join(frontend_path, "assets")

if os.path.exists(assets_path):
    app.mount(
        "/assets",
        StaticFiles(directory=assets_path),
        name="assets",
    )


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    index_file = os.path.join(frontend_path, "index.html")

    if os.path.exists(index_file):
        return FileResponse(index_file)

    return {
        "message": "Frontend build not found. Please run npm run build."
    }