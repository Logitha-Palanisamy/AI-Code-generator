from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.core.dependencies import get_db, get_current_user
from backend.models.user import User
from backend.models.setting import Setting
from backend.schemas.setting import SettingResponse, SettingUpdate
from backend.core.logger import logger

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/", response_model=SettingResponse)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves user settings/preferences, initializing defaults if none exist."""
    setting = db.query(Setting).filter(Setting.user_id == current_user.id).first()
    if not setting:
        # Initialize defaults
        setting = Setting(
            user_id=current_user.id,
            theme="dark",
            preferred_model="claude-3-5-sonnet",
            timeout_seconds=60
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
        logger.info("Initialized default settings for user", user_id=current_user.id)
        
    return setting

@router.put("/", response_model=SettingResponse)
def update_settings(
    payload: SettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates user theme, preferred model, sandbox timeouts, and API keys."""
    setting = db.query(Setting).filter(Setting.user_id == current_user.id).first()
    if not setting:
        setting = Setting(user_id=current_user.id)
        db.add(setting)
        
    setting.theme = payload.theme
    setting.preferred_model = payload.preferred_model
    setting.timeout_seconds = payload.timeout_seconds
    setting.personal_api_key = payload.personal_api_key
    
    db.commit()
    db.refresh(setting)
    logger.info("User settings updated", user_id=current_user.id)
    return setting
