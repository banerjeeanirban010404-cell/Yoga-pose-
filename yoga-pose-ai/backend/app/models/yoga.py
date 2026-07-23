from sqlalchemy import Column, String, Integer, JSON
from app.core.database import Base

class YogaPose(Base):
    __tablename__ = "yoga_poses"

    id = Column(String, primary_key=True, index=True)  # e.g., "tree-pose"
    name = Column(String, nullable=False)
    sanskrit_name = Column(String, nullable=True)
    english_name = Column(String, nullable=True)
    difficulty = Column(String, nullable=False)
    duration = Column(Integer, default=30)
    calories_per_minute = Column(Integer, default=5)
    description = Column(String, nullable=True)
    steps = Column(JSON, nullable=True)
    benefits = Column(JSON, nullable=True)
    target_muscle = Column(String, nullable=True)
    ideal_for = Column(String, nullable=True)
    common_mistakes = Column(JSON, nullable=True)
    instructions = Column(JSON, nullable=True)
    joint_angles = Column(JSON, nullable=True)
    body_parts = Column(JSON, nullable=True)
    health_conditions = Column(JSON, nullable=True)
    equipment = Column(String, default="None")
    tags = Column(JSON, nullable=True)
