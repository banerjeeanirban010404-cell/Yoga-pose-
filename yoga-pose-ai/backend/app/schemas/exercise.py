from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

# General Exercise Schema
class ExerciseBase(BaseModel):
    id: str
    name: str
    category: str
    duration: int
    difficulty: str
    description: Optional[str] = None
    steps: Optional[List[str]] = None
    sanskrit_name: Optional[str] = None
    benefits: Optional[List[str]] = None
    target_muscle: Optional[str] = None
    body_parts: Optional[List[str]] = None
    health_conditions: Optional[List[str]] = None
    equipment: Optional[str] = None
    tags: Optional[List[str]] = None
    calories_per_minute: Optional[int] = None

class ExerciseResponse(ExerciseBase):
    model_config = ConfigDict(from_attributes=True)

# Yoga Pose Schema
class YogaPoseBase(BaseModel):
    id: str
    name: str
    sanskrit_name: Optional[str] = None
    english_name: Optional[str] = None
    difficulty: str
    duration: int
    calories_per_minute: int
    description: Optional[str] = None
    steps: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    target_muscle: Optional[str] = None
    ideal_for: Optional[str] = None
    common_mistakes: Optional[List[str]] = None
    instructions: Optional[List[str]] = None
    joint_angles: Optional[Dict[str, Any]] = None
    body_parts: Optional[List[str]] = None
    health_conditions: Optional[List[str]] = None
    equipment: Optional[str] = None
    tags: Optional[List[str]] = None

class YogaPoseResponse(YogaPoseBase):
    model_config = ConfigDict(from_attributes=True)

# Unified Library Item Schema
class LibraryItemResponse(BaseModel):
    id: str
    name: str
    sanskrit_name: Optional[str] = None
    english_name: Optional[str] = None
    difficulty: str
    duration: int
    calories_per_minute: Optional[int] = None
    description: Optional[str] = None
    steps: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    target_muscle: Optional[str] = None
    category: Optional[str] = None
    type: str  # "yoga" or "exercise"
    body_parts: Optional[List[str]] = None
    health_conditions: Optional[List[str]] = None
    equipment: Optional[str] = None
    tags: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True)

class LibrarySearchResponse(BaseModel):
    results: List[LibraryItemResponse]
    suggestion: Optional[str] = None

class RelatedItemsResponse(BaseModel):
    related_poses: List[LibraryItemResponse]
    similar_exercises: List[LibraryItemResponse]
    easier_alternatives: List[LibraryItemResponse]
    advanced_progressions: List[LibraryItemResponse]
    preparatory_poses: List[LibraryItemResponse]
    counter_poses: List[LibraryItemResponse]
    complementary_stretches: List[LibraryItemResponse]
    recommended_warmups: List[LibraryItemResponse]
    recommended_cooldowns: List[LibraryItemResponse]
    frequently_together: List[LibraryItemResponse]

