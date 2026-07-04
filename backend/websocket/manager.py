import asyncio
import json
import redis.asyncio as aioredis
from fastapi import WebSocket
from backend.core.config import settings
from backend.core.logger import logger

class ConnectionManager:
    """Manages active WebSocket connections grouped by project ID."""
    def __init__(self):
        # Maps project_id (int) -> list of WebSocket connections
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, project_id: int, websocket: WebSocket):
        """Accepts and registers a new client connection for a project channel."""
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        self.active_connections[project_id].append(websocket)
        logger.info(
            "WebSocket client connected",
            project_id=project_id,
            active_sockets=len(self.active_connections[project_id])
        )

    def disconnect(self, project_id: int, websocket: WebSocket):
        """Removes a client connection from a project channel."""
        if project_id in self.active_connections:
            if websocket in self.active_connections[project_id]:
                self.active_connections[project_id].remove(websocket)
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]
        logger.info("WebSocket client disconnected", project_id=project_id)

    async def broadcast_to_project(self, project_id: int, message: dict):
        """Broadcasts a payload message to all clients listening to a specific project channel."""
        if project_id in self.active_connections:
            data = json.dumps(message)
            for connection in list(self.active_connections[project_id]):
                try:
                    await connection.send_text(data)
                except Exception:
                    # Handle stale sockets silently
                    self.disconnect(project_id, connection)

manager = ConnectionManager()

async def redis_pubsub_listener():
    """
    Asynchronously listens to Redis pub/sub channel 'project_updates'.
    Decodes events and delegates broadcasts to manager.
    """
    logger.info("Starting Redis WS Pub/Sub listener loop")
    
    try:
        r = aioredis.from_url(settings.REDIS_URL)
        pubsub = r.pubsub()
        await pubsub.subscribe("project_updates")
        
        while True:
            try:
                # Retrieve updates asynchronously
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message and message["type"] == "message":
                    data = json.loads(message["data"])
                    project_id = data.get("project_id")
                    if project_id:
                        await manager.broadcast_to_project(project_id, data)
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("Error encountered in Redis Pub/Sub consumer loop", error=str(exc))
                await asyncio.sleep(1.0)
                
    except asyncio.CancelledError:
        logger.info("Redis WS Pub/Sub listener loop cancelled")
    except Exception as exc:
        logger.critical("Failed to initialize Redis WS listener task", error=str(exc))
