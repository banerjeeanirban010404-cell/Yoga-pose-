from typing import List
from sqlalchemy.orm import Session
from app.models.exercise import Exercise
from app.schemas.exercise import ExerciseBase

class ExerciseRepository:
    def get_by_id(self, db: Session, exercise_id: str) -> Exercise:
        return db.query(Exercise).filter(Exercise.id == exercise_id).first()

    def get_all(self, db: Session) -> List[Exercise]:
        return db.query(Exercise).all()

    def create_or_update(self, db: Session, obj_in: ExerciseBase) -> Exercise:
        db_obj = db.query(Exercise).filter(Exercise.id == obj_in.id).first()
        data = obj_in.model_dump()
        
        if db_obj:
            for field, value in data.items():
                setattr(db_obj, field, value)
        else:
            db_obj = Exercise(**data)
            db.add(db_obj)
            
        db.commit()
        db.refresh(db_obj)
        return db_obj

exercise_repository = ExerciseRepository()
