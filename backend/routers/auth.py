from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.orm import Session
from backend.core.dependencies import get_db, get_current_user
from backend.core.security import get_password_hash, verify_password
from backend.core.jwt import create_access_token, create_refresh_token, decode_token
from backend.models.user import User
from backend.models.setting import Setting
from backend.schemas.user import UserRegisterRequest, UserLoginRequest, UserResponse, TokenResponse
from backend.core.logger import logger

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """Registers a new user, hashes their password, and creates default settings."""
    # Check if email is already registered
    existing_email = db.query(User).filter(User.email == payload.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    # Check if username is already taken
    existing_username = db.query(User).filter(User.username == payload.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
        
    # Create the user entity
    new_user = User(
        email=payload.email,
        username=payload.username,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role="admin" if db.query(User).count() == 0 else "registered_user" # First user becomes admin automatically
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Initialize default user preferences/settings
    user_settings = Setting(
        user_id=new_user.id,
        theme="dark",
        preferred_model="claude-3-5-sonnet",
        timeout_seconds=60
    )
    db.add(user_settings)
    db.commit()
    
    logger.info("User registered successfully", user_id=new_user.id, username=new_user.username)
    return new_user

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLoginRequest, response: Response, db: Session = Depends(get_db)):
    """Authenticates user credentials, sets HTTP-only refresh cookie, and returns access token."""
    # Authenticate via email or username
    user = db.query(User).filter(
        (User.email == payload.username_or_email) | (User.username == payload.username_or_email)
    ).first()
    
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password"
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
        
    # Issue JWT tokens
    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token, refresh_jti = create_refresh_token(subject=user.id)
    
    # Update active refresh token in database for rotation tracking
    user.active_refresh_token_jti = refresh_jti
    db.commit()
    
    # Set the HTTP-Only cookie for refresh token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Set to False for local HTTP dev, True in prod
        samesite="lax",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    logger.info("User logged in successfully", user_id=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logs out the user, clearing their active refresh token and cookies."""
    current_user.active_refresh_token_jti = None
    db.commit()
    
    response.delete_cookie("refresh_token")
    logger.info("User logged out", user_id=current_user.id)
    return {"detail": "Successfully logged out"}

@router.post("/refresh", response_model=TokenResponse)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    """Rotates refresh tokens and issues a new access token."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )
        
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
        
    user_id = int(payload.get("sub", 0))
    jti = payload.get("jti")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
        
    # Check if the token JTI matches the database active JTI
    if user.active_refresh_token_jti != jti:
        # Replay attack warning! Invalidate user's token session
        user.active_refresh_token_jti = None
        db.commit()
        response.delete_cookie("refresh_token")
        logger.warning("Potential refresh token reuse attack detected", user_id=user.id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session state, please log in again"
        )
        
    # Issue rotated tokens
    new_access_token = create_access_token(subject=user.id, role=user.role)
    new_refresh_token, new_jti = create_refresh_token(subject=user.id)
    
    # Save the new JTI to the database
    user.active_refresh_token_jti = new_jti
    db.commit()
    
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60
    )
    
    logger.info("Tokens rotated successfully", user_id=user.id)
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns the profile metadata of the currently authenticated user."""
    return current_user
