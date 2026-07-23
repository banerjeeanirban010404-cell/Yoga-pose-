from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class SessionBase(BaseModel):
    pose_id: str
    pose_name: str
    accuracy: float
    duration: int
    calories: float
    xp_earned: int
    is_flow: bool = False
    heart_rate: Optional[float] = None
    hrv: Optional[float] = None

class SessionCreate(SessionBase):
    pass

class SessionResponse(SessionBase):
    id: int
    user_id: int
    date: datetime

    model_config = ConfigDict(from_attributes=True)

# Custom Flow schemas
class CustomFlowStep(BaseModel):
    poseId: str
    duration: int

class CustomFlowCreate(BaseModel):
    id: str  # e.g. "custom-1720000000"
    name: str
    description: Optional[str] = None
    steps: List[CustomFlowStep]

class CustomFlowResponse(CustomFlowCreate):
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
