from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.session import Session as DbSession, CustomFlow
from app.schemas.session import SessionCreate, CustomFlowCreate

class SessionRepository:
    # Session methods
    def create_session(self, db: Session, obj_in: SessionCreate, user_id: int) -> DbSession:
        db_obj = DbSession(
            user_id=user_id,
            pose_id=obj_in.pose_id,
            pose_name=obj_in.pose_name,
            accuracy=obj_in.accuracy,
            duration=obj_in.duration,
            calories=obj_in.calories,
            xp_earned=obj_in.xp_earned,
            is_flow=obj_in.is_flow,
            heart_rate=obj_in.heart_rate,
            hrv=obj_in.hrv,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_sessions_by_user(self, db: Session, user_id: int) -> List[DbSession]:
        return db.query(DbSession).filter(DbSession.user_id == user_id).order_by(DbSession.date.desc()).all()

    # CustomFlow methods
    def get_custom_flows_by_user(self, db: Session, user_id: int) -> List[CustomFlow]:
        return db.query(CustomFlow).filter(CustomFlow.user_id == user_id).order_by(CustomFlow.created_at.desc()).all()

    def get_custom_flow(self, db: Session, user_id: int, flow_id: str) -> Optional[CustomFlow]:
        return db.query(CustomFlow).filter(CustomFlow.user_id == user_id, CustomFlow.id == flow_id).first()

    def create_or_update_custom_flow(self, db: Session, obj_in: CustomFlowCreate, user_id: int) -> CustomFlow:
        db_obj = db.query(CustomFlow).filter(CustomFlow.user_id == user_id, CustomFlow.id == obj_in.id).first()
        steps_data = [step.model_dump() for step in obj_in.steps]
        
        if db_obj:
            db_obj.name = obj_in.name
            db_obj.description = obj_in.description
            db_obj.steps = steps_data
        else:
            db_obj = CustomFlow(
                id=obj_in.id,
                user_id=user_id,
                name=obj_in.name,
                description=obj_in.description,
                steps=steps_data
            )
            db.add(db_obj)
            
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete_custom_flow(self, db: Session, user_id: int, flow_id: str) -> bool:
        db_obj = db.query(CustomFlow).filter(CustomFlow.user_id == user_id, CustomFlow.id == flow_id).first()
        if db_obj:
            db.delete(db_obj)
            db.commit()
            return True
        return False

session_repository = SessionRepository()
