from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import dashboard_service
from app.models.user import User

router = APIRouter()

@router.get("", response_model=DashboardResponse)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return dashboard_service.get_dashboard_data(db, current_user)

@router.post("/clear")
def clear_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.session import Session as DbSession, CustomFlow
    
    # 1. Delete all sessions and custom flows belonging to this user
    db.query(DbSession).filter(DbSession.user_id == current_user.id).delete()
    db.query(CustomFlow).filter(CustomFlow.user_id == current_user.id).delete()

    # 2. Reset user-scoped statistics
    current_user.streak_count = 0
    current_user.total_hours = 0.0
    current_user.calories_burned = 0
    current_user.xp = 0
    current_user.last_practice_date = None

    db.commit()
    db.refresh(current_user)

    return {"status": "success", "message": "Dashboard practice history and stats cleared successfully."}
