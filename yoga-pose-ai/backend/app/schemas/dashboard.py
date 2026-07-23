from typing import List
from pydantic import BaseModel

class DashboardStats(BaseModel):
    activeStreak: int
    totalHours: float
    caloriesBurned: int
    averageAccuracy: int
    weeklyTarget: int
    weeklyCompleted: int

class WeeklyActivity(BaseModel):
    day: str
    minutes: int

class AccuracyProgress(BaseModel):
    date: str
    accuracy: int

class SessionHistoryItem(BaseModel):
    id: str
    poseId: str
    poseName: str
    date: str
    duration: int
    accuracy: int
    calories: int

class UserMilestone(BaseModel):
    id: str
    title: str
    description: str
    unlocked: bool
    icon: str

class DashboardResponse(BaseModel):
    stats: DashboardStats
    weeklyActivity: List[WeeklyActivity]
    accuracyProgress: List[AccuracyProgress]
    sessionHistory: List[SessionHistoryItem]
    userMilestones: List[UserMilestone]
