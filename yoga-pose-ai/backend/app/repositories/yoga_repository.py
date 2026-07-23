from typing import List
from sqlalchemy.orm import Session
from app.models.yoga import YogaPose
from app.schemas.exercise import YogaPoseBase

class YogaRepository:
    def get_by_id(self, db: Session, pose_id: str) -> YogaPose:
        return db.query(YogaPose).filter(YogaPose.id == pose_id).first()

    def get_all(self, db: Session) -> List[YogaPose]:
        return db.query(YogaPose).all()

    def create_or_update(self, db: Session, obj_in: YogaPoseBase) -> YogaPose:
        db_obj = db.query(YogaPose).filter(YogaPose.id == obj_in.id).first()
        data = obj_in.model_dump()
        
        # Map camelCase style parameters if needed, but here we match snake_case fields
        if db_obj:
            for field, value in data.items():
                setattr(db_obj, field, value)
        else:
            db_obj = YogaPose(**data)
            db.add(db_obj)
            
        db.commit()
        db.refresh(db_obj)
        return db_obj

yoga_repository = YogaRepository()
