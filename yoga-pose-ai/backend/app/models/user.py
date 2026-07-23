from sqlalchemy import Column, Integer, String, Float, Date
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Dashboard overall metrics
    streak_count = Column(Integer, default=5)  # Start with 5 default streak for UX consistency
    last_practice_date = Column(Date, nullable=True)
    total_hours = Column(Float, default=12.4)
    calories_burned = Column(Integer, default=1820)
    xp = Column(Integer, default=685)  # Default starting XP

    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    custom_flows = relationship("CustomFlow", back_populates="user", cascade="all, delete-orphan")
