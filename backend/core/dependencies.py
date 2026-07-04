from typing import Generator
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.db.session import SessionLocal
from backend.models.user import User
from backend.core.jwt import decode_token

# Define standard oauth2 scheme
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False
)

def get_db() -> Generator[Session, None, None]:
    """Yields a database session to handlers, ensuring it closes afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Extracts the user ID from the Bearer token,
    authenticates it, and returns the User record.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
        
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id_str: str = payload.get("sub", "")
    token_type: str = payload.get("type", "")
    
    if not user_id_str or token_type != "access":
        raise credentials_exception
        
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
        
    return user

def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Verifies that the authenticated user possesses admin privileges."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges"
        )
    return current_user
