from sqlalchemy import Column, String, Integer, JSON
from app.core.database import Base

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # e.g., "Meditation", "Warm-up"
    duration = Column(Integer, default=60)
    difficulty = Column(String, default="Beginner")
    description = Column(String, nullable=True)
    steps = Column(JSON, nullable=True)
    sanskrit_name = Column(String, nullable=True)
    benefits = Column(JSON, nullable=True)
    target_muscle = Column(String, nullable=True)
    body_parts = Column(JSON, nullable=True)
    health_conditions = Column(JSON, nullable=True)
    equipment = Column(String, default="None")
    tags = Column(JSON, nullable=True)
    calories_per_minute = Column(Integer, default=4)
