from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from backend.websocket.manager import manager
from backend.core.jwt import decode_token
from backend.db.session import SessionLocal
from backend.models.user import User
from backend.models.project import Project
from backend.core.logger import logger

router = APIRouter(prefix="/ws", tags=["WebSockets"])

@router.websocket("/project/{project_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    project_id: int,
    token: str = Query(...)
):
    """
    Guarded WebSocket endpoint allowing real-time pipeline status monitoring.
    Requires a valid JWT access token passed as query parameters.
    """
    # 1. Decode JWT access token
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        logger.warning("Unauthenticated WebSocket connection attempt refused", project_id=project_id)
        await websocket.close(code=4008)  # Policy Violation / Unauthorized
        return
        
    try:
        user_id = int(payload.get("sub", 0))
    except ValueError:
        await websocket.close(code=4008)
        return

    # 2. Database validation (ownership and authorization check)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            logger.warning("Inactive/missing user WS connection refused", user_id=user_id)
            await websocket.close(code=4008)
            return

        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            logger.warning("Project not found for WS connection", project_id=project_id)
            await websocket.close(code=4004)  # Resource Not Found close code
            return

        # Ensure user owns the project OR is an admin
        if project.user_id != user.id and user.role != "admin":
            logger.warning("Unauthorized user WS access attempt rejected", project_id=project_id, user_id=user_id)
            await websocket.close(code=4008)
            return
            
    finally:
        db.close()

    # 3. Register client connection
    await manager.connect(project_id, websocket)
    
    try:
        # Keep connection open; listen for messages or client termination signals
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(project_id, websocket)
    except Exception as exc:
        logger.error("Exception in active WebSocket connection channel", project_id=project_id, error=str(exc))
        manager.disconnect(project_id, websocket)
