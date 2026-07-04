import uuid
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from backend.core.logger import correlation_id_ctx, logger

class CorrelationIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware that assigns a unique Correlation-ID to every request.
    It logs request initiation, duration, and completion in a structured format.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        # Retrieve correlation ID from headers or generate a new one
        correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        
        # Bind the correlation ID to the context variable
        token = correlation_id_ctx.set(correlation_id)
        
        start_time = time.perf_counter()
        
        # Log request details
        logger.info(
            "Request started",
            method=request.method,
            path=request.url.path,
            client_ip=request.client.host if request.client else "unknown"
        )
        
        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.exception(
                "Request crashed",
                method=request.method,
                path=request.url.path,
                duration_ms=round(duration_ms, 2),
                error=str(exc)
            )
            # Reset context variable before propagating exception
            correlation_id_ctx.reset(token)
            raise exc
            
        duration_ms = (time.perf_counter() - start_time) * 1000
        logger.info(
            "Request completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2)
        )
        
        # Return correlation ID in response headers
        response.headers["X-Correlation-ID"] = correlation_id
        
        # Reset context variable
        correlation_id_ctx.reset(token)
        return response
