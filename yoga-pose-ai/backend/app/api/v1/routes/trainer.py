from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional, Tuple
from pydantic import BaseModel
import time
import os
import httpx

from app.core.dependencies import get_db
from app.services.yoga_service import yoga_service
from app.ai_engine.feedback_engine.engine import evaluate_pose
from app.ai_engine.tracker.pose_tracker import PoseCalibrator
from app.ai_engine.feedback_engine.anatomical_db import get_anatomical_profile

router = APIRouter()

# Global in-memory cache for session calibrators: {session_id: (calibrator, last_accessed_time)}
ACTIVE_CALIBRATORS: Dict[str, Tuple[PoseCalibrator, float]] = {}

def cleanup_expired_calibrators():
    """Removes calibrators that have not been active for more than 1 hour to prevent memory leaks."""
    now = time.time()
    expired_keys = [k for k, (_, last_time) in ACTIVE_CALIBRATORS.items() if now - last_time > 3600]
    for k in expired_keys:
        try:
            del ACTIVE_CALIBRATORS[k]
        except KeyError:
            pass

class Landmark(BaseModel):
    x: float
    y: float
    z: float = 0.0
    visibility: float = 1.0

class PoseAnalysisRequest(BaseModel):
    pose_id: str
    landmarks: List[Landmark]
    session_id: Optional[str] = None

@router.post("/analyze", response_model=Dict[str, Any])
def analyze_pose(request: PoseAnalysisRequest, db: Session = Depends(get_db)):
    cleanup_expired_calibrators()

    # Convert Pydantic landmarks to dictionaries
    landmark_dicts = [lm.model_dump() for lm in request.landmarks]

    # Setup or retrieve PoseCalibrator
    is_calibrated = False
    calibration_progress = 1.0
    tilt_angle = 0.0
    
    if request.session_id:
        if request.session_id not in ACTIVE_CALIBRATORS:
            # Require 10 valid frames to lock calibration
            ACTIVE_CALIBRATORS[request.session_id] = (PoseCalibrator(required_frames=10), time.time())
        
        calibrator, _ = ACTIVE_CALIBRATORS[request.session_id]
        ACTIVE_CALIBRATORS[request.session_id] = (calibrator, time.time()) # Update access time
        
        calibration_status = "Calibrating..."
        if not calibrator.calibrated:
            _, calibration_status = calibrator.add_frame(landmark_dicts)
            
        if not calibrator.calibrated:
            # While calibrating, return a guide message
            collected = len(calibrator.collected_normals)
            required = calibrator.required_frames
            return {
                "accuracy": 60.0,
                "feedback": calibration_status,
                "joint_details": {},
                "is_calibrated": False,
                "calibration_progress": round(collected / required, 2),
                "tilt_angle": 0.0
            }
        
        is_calibrated = True
        calibration_progress = 1.0
        tilt_angle = calibrator.get_tilt_angle()
        # Rectify the landmarks to correct camera perspective tilt
        landmark_dicts = calibrator.rectify(landmark_dicts)

    # Pose evaluation: standard single pose or dynamic auto-detect
    if request.pose_id == "auto-detect":
        all_poses = yoga_service.get_all_poses(db)
        
        best_pose_id = None
        best_pose_name = None
        best_score = -1.0
        best_result = None
        
        for p in all_poses:
            target_angles = getattr(p, 'joint_angles', None) or {}
            res = evaluate_pose(p.id, landmark_dicts, target_angles)
            if res["accuracy"] > best_score:
                best_score = res["accuracy"]
                best_pose_id = p.id
                best_pose_name = p.name
                best_result = res
                
        if best_result:
            result = best_result
            # Only claim detection if accuracy is at least 65% to avoid false switching
            if best_score >= 65.0:
                result["detected_pose_id"] = best_pose_id
                result["detected_pose_name"] = best_pose_name
            else:
                result["detected_pose_id"] = None
                result["detected_pose_name"] = None
                result["feedback"] = "Scanning for matching posture..."
        else:
            result = {
                "accuracy": 60.0,
                "feedback": "Scanning posture...",
                "joint_details": {}
            }
    else:
        # Retrieve target pose or exercise
        pose = yoga_service.get_pose_by_id(db, request.pose_id)
        if not pose:
            pose = yoga_service.get_exercise_by_id(db, request.pose_id)
            if not pose:
                raise HTTPException(status_code=404, detail="Pose or exercise not found")
                
        target_angles = pose.joint_angles or {}
        # Evaluate the pose using the AI feedback engine
        result = evaluate_pose(request.pose_id, landmark_dicts, target_angles)
    
    # Inject calibration status details for frontend HUD
    result["is_calibrated"] = is_calibrated
    result["calibration_progress"] = calibration_progress
    result["tilt_angle"] = tilt_angle
    
    return result

class ExplanationRequest(BaseModel):
    pose_id: str
    joint_name: str
    deviation_degrees: float

def generate_gemini_explanation(pose_name: str, sanskrit_name: str, joint_name: str, deviation: float, profile: dict) -> Optional[str]:
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return None
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
    prompt = (
        "You are an expert biomechanical physical therapist and yoga anatomy specialist.\n"
        f"The user is practicing {pose_name} ({sanskrit_name}).\n"
        f"They have a misalignment in their {joint_name} (deviation of {deviation:.1f} degrees).\n"
        "Here is the biomechanical grounding context:\n"
        f"- Muscle Engagement: {profile['muscle_engagement']}\n"
        f"- Joint Mechanics: {profile['joint_mechanics']}\n"
        f"- Therapeutic Benefit: {profile['therapeutic_benefit']}\n\n"
        "Write a personalized, concise, and encouraging explanation (2-3 sentences max) explaining *why* they should make this adjustment. "
        "Focus on the anatomical and physiological reasons, explaining what muscles are engaged, how it protects their joints, and what therapeutic benefit it brings. "
        "Keep it accessible but scientifically grounded. Return only the final text explanation. Do not add markdown formatting or conversational filler."
    )
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }
    
    try:
        response = httpx.post(url, json=payload, timeout=8.0)
        if response.status_code == 200:
            data = response.json()
            explanation = data["candidates"][0]["content"]["parts"][0]["text"]
            return explanation.strip()
    except Exception:
        pass
        
    return None

def generate_offline_explanation(pose_name: str, sanskrit_name: str, joint_name: str, deviation: float, profile: dict) -> str:
    # Capitalize joint label
    joint_label = joint_name.replace("Angle", "").replace("Flexion", "").replace("Open", "").strip().lower()
    if not joint_label:
        joint_label = "joint"
        
    sanskrit_str = f" ({sanskrit_name})" if sanskrit_name else ""
    explanation = (
        f"Adjusting your {joint_label} in {pose_name}{sanskrit_str} is essential to "
        f"{profile['joint_mechanics'].lower()} This adjustment {profile['muscle_engagement'].lower()} "
        f"Ultimately, correcting this alignment {profile['therapeutic_benefit'].lower()}"
    )
    return explanation

@router.post("/explain", response_model=Dict[str, str])
def explain_pose_correction(request: ExplanationRequest, db: Session = Depends(get_db)):
    pose = yoga_service.get_pose_by_id(db, request.pose_id)
    if not pose:
        pose = yoga_service.get_exercise_by_id(db, request.pose_id)
        if not pose:
            raise HTTPException(status_code=404, detail="Pose or exercise not found")
            
    # Get anatomical details from local DB
    profile = get_anatomical_profile(request.joint_name)
    
    # Try Gemini generation
    explanation = generate_gemini_explanation(
        pose_name=pose.name,
        sanskrit_name=pose.sanskrit_name or "",
        joint_name=request.joint_name,
        deviation=request.deviation_degrees,
        profile=profile
    )
    
    # Fallback to offline template if Gemini is not configured or fails
    if not explanation:
        explanation = generate_offline_explanation(
            pose_name=pose.name,
            sanskrit_name=pose.sanskrit_name or "",
            joint_name=request.joint_name,
            deviation=request.deviation_degrees,
            profile=profile
        )
        
    return {"explanation": explanation}


