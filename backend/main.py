import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.core.middleware import CorrelationIDMiddleware
from backend.routers import auth, health, project, setting, admin, dashboard
from backend.websocket import routes as ws_routes
from backend.websocket.manager import redis_pubsub_listener
from backend.db.base import Base
from backend.db.session import engine
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI()

frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="assets")

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    index_file = os.path.join(frontend_path, "index.html")
    return FileResponse(index_file)
# Import all models to ensure they register on the Base class metadata
from backend.models.user import User
from backend.models.project import Project
from backend.models.pipeline import PipelineRun
from backend.models.setting import Setting
from backend.models.ai_usage import AIUsageLog

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create SQLite database tables on startup (excellent for local and test runs)
    Base.metadata.create_all(bind=engine)
    
    # Spawn the Redis pub/sub WebSocket listener task
    listener_task = asyncio.create_task(redis_pubsub_listener())
    
    try:
        yield
    finally:
        listener_task.cancel()
        try:
            await listener_task
        except asyncio.CancelledError:
            pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Correlation ID request tracing middleware
app.add_middleware(CorrelationIDMiddleware)

# Register routes
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(project.router, prefix=settings.API_V1_STR)
app.include_router(setting.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(ws_routes.router)

