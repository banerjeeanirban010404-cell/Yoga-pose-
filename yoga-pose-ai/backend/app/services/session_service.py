from typing import List, Optional
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.repositories.session_repository import session_repository
from app.repositories.user_repository import user_repository
from app.schemas.session import SessionCreate, SessionResponse, CustomFlowCreate, CustomFlowResponse
from app.models.session import Session as DbSession, CustomFlow
from app.models.user import User

class SessionService:
    def log_session(self, db: Session, obj_in: SessionCreate, user_id: int) -> SessionResponse:
        # Create session log
        session_log = session_repository.create_session(db, obj_in, user_id)

        # Retrieve user and update stats
        user = user_repository.get_by_id(db, user_id)
        if user:
            # Add calories and xp
            user.calories_burned += int(obj_in.calories)
            user.xp += obj_in.xp_earned
            user.total_hours = round(user.total_hours + (obj_in.duration / 3600), 2)

            # Streak updates
            today = date.today()
            if user.last_practice_date == today:
                # Already practiced today, streak stays the same
                pass
            elif user.last_practice_date == today - timedelta(days=1):
                # Practiced yesterday, increment streak
                user.streak_count += 1
            else:
                # Streak broken or first practice, set to 1
                user.streak_count = 1
                
            user.last_practice_date = today
            db.add(user)
            db.commit()
            db.refresh(user)

        return SessionResponse.model_validate(session_log)

    def get_user_sessions(self, db: Session, user_id: int) -> List[DbSession]:
        return session_repository.get_sessions_by_user(db, user_id)

    # Custom Flow services
    def get_custom_flows(self, db: Session, user_id: int) -> List[CustomFlow]:
        return session_repository.get_custom_flows_by_user(db, user_id)

    def get_custom_flow_by_id(self, db: Session, user_id: int, flow_id: str) -> Optional[CustomFlow]:
        return session_repository.get_custom_flow(db, user_id, flow_id)

    def save_custom_flow(self, db: Session, obj_in: CustomFlowCreate, user_id: int) -> CustomFlowResponse:
        flow = session_repository.create_or_update_custom_flow(db, obj_in, user_id)
        return CustomFlowResponse.model_validate(flow)

    def delete_custom_flow(self, db: Session, user_id: int, flow_id: str) -> bool:
        return session_repository.delete_custom_flow(db, user_id, flow_id)

session_service = SessionService()
