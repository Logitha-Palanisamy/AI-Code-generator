import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import jwt
from backend.core.config import settings
from backend.core.logger import logger

ALGORITHM = "HS256"

def create_access_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Generates a short-lived JWT access token containing subject (user ID) and role."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "type": "access",
        "jti": str(uuid.uuid4())
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> tuple[str, str]:
    """
    Generates a longer-lived refresh token.
    Returns a tuple: (token_str, jti)
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    jti = str(uuid.uuid4())
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "jti": jti
    }
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return token, jti

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT token. Returns claims if valid, otherwise None."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired signature")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning("Invalid token error", error=str(e))
        return None
