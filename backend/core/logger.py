import logging
import sys
from contextvars import ContextVar
import structlog

# Context variable to hold request correlation IDs across async context boundaries
correlation_id_ctx: ContextVar[str] = ContextVar("correlation_id", default="")

def add_correlation_id(logger, method_name, event_dict):
    """Processor to insert request correlation id into structlog events."""
    event_dict["correlation_id"] = correlation_id_ctx.get()
    return event_dict

def setup_logging():
    """Sets up standard library logging to print JSON via structlog."""
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )
    
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            add_correlation_id,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

setup_logging()
logger = structlog.get_logger("backend")
