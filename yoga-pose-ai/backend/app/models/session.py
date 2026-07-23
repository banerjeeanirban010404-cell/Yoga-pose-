from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    pose_id = Column(String, nullable=False)  # references yoga_pose.id or exercise.id or flow.id
    pose_name = Column(String, nullable=False)
    accuracy = Column(Float, nullable=False)
    duration = Column(Integer, nullable=False)  # in seconds
    calories = Column(Float, nullable=False)
    xp_earned = Column(Integer, default=0)
    is_flow = Column(Boolean, default=False)
    heart_rate = Column(Float, nullable=True)
    hrv = Column(Float, nullable=True)
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship
    user = relationship("User", back_populates="sessions")

class CustomFlow(Base):
    __tablename__ = "custom_flows"

    id = Column(String, primary_key=True, index=True)  # e.g., "custom-172000000"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    steps = Column(JSON, nullable=False)  # e.g., [{"poseId": "tree-pose", "duration": 30}]
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship
    user = relationship("User", back_populates="custom_flows")
