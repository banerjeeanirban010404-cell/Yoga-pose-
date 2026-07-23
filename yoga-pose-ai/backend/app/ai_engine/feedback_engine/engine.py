from typing import Dict, List, Any
from app.ai_engine.angle_calculator.calculator import calculate_3d_angle

# MediaPipe landmark indices mapping (A, B, C) where B is the vertex
JOINT_MAP = {
    "leftElbow": (11, 13, 15),
    "rightElbow": (12, 14, 16),
    "leftKnee": (23, 25, 27),
    "rightKnee": (24, 26, 28),
    "leftShoulder": (23, 11, 13),
    "rightShoulder": (24, 12, 14),
    "leftHip": (11, 23, 25),
    "rightHip": (12, 24, 26),
}

def evaluate_pose(pose_id: str, landmarks: List[Dict[str, float]], target_angles: Dict[str, Dict[str, float]]) -> Dict[str, Any]:
    """
    Evaluate user's pose landmarks against target joint angles.
    landmarks: list of 33 dictionaries representing MediaPipe landmarks.
    target_angles: pose target joint parameters (e.g. {'rightKnee': {'target': 90, 'tolerance': 8}})
    """
    if not landmarks or len(landmarks) < 33:
        return {
            "accuracy": 0.0,
            "feedback": "Position your full body in the camera frame.",
            "joint_details": {}
        }

    joint_details = {}
    joint_scores = []
    evaluated_joints_count = 0

    # Calculate actual angles for standard joints
    computed_angles = {}
    for joint_name, (idx_a, idx_b, idx_c) in JOINT_MAP.items():
        try:
            pt_a = landmarks[idx_a]
            pt_b = landmarks[idx_b]
            pt_c = landmarks[idx_c]
            computed_angles[joint_name] = calculate_3d_angle(pt_a, pt_b, pt_c)
        except Exception:
            computed_angles[joint_name] = 180.0

    # Map target angles dynamically
    feedback_messages = []
    
    for key, spec in target_angles.items():
        target = spec.get("target", 180.0)
        tolerance = spec.get("tolerance", 15.0)
        
        actual_val = None
        joint_label = key

        # Smart mapping: check if the key matches a specific rule or choose best-fit side
        if key == "kneeAngle":
            # For tree-pose, find the bent knee (the knee closer to the target angle)
            left_k = computed_angles.get("leftKnee", 180.0)
            right_k = computed_angles.get("rightKnee", 180.0)
            if abs(left_k - target) < abs(right_k - target):
                actual_val = left_k
                joint_label = "left knee"
            else:
                actual_val = right_k
                joint_label = "right knee"
        elif key == "hipOpenAngle":
            # Open hip angle of the bent leg
            left_h = computed_angles.get("leftHip", 180.0)
            right_h = computed_angles.get("rightHip", 180.0)
            if abs(left_h - target) < abs(right_h - target):
                actual_val = left_h
                joint_label = "left hip"
            else:
                actual_val = right_h
                joint_label = "right hip"
        elif key == "rightKnee" or key == "leftKnee" or key == "knee":
            # Choose the knee that is closer to target
            left_k = computed_angles.get("leftKnee", 180.0)
            right_k = computed_angles.get("rightKnee", 180.0)
            if abs(left_k - target) < abs(right_k - target):
                actual_val = left_k
                joint_label = "knee"
            else:
                actual_val = right_k
                joint_label = "knee"
        elif key == "rightElbow" or key == "leftElbow" or key == "elbowAngle":
            # Check the elbow that is closer to target
            left_e = computed_angles.get("leftElbow", 180.0)
            right_e = computed_angles.get("rightElbow", 180.0)
            if abs(left_e - target) < abs(right_e - target):
                actual_val = left_e
                joint_label = "elbow"
            else:
                actual_val = right_e
                joint_label = "elbow"
        elif key == "hipAngle":
            # Take the smaller hip angle (e.g. downward dog has both hips bent)
            left_h = computed_angles.get("leftHip", 180.0)
            right_h = computed_angles.get("rightHip", 180.0)
            actual_val = min(left_h, right_h)
            joint_label = "hips"
        elif key == "shoulderAngle":
            # Check shoulder extension (maximum elevation angle)
            left_s = computed_angles.get("leftShoulder", 180.0)
            right_s = computed_angles.get("rightShoulder", 180.0)
            actual_val = max(left_s, right_s)
            joint_label = "shoulders"
        elif key == "torsoAngle" or key == "spineExtension":
            # Use hip angle to approximate torso/spine extension
            left_h = computed_angles.get("leftHip", 180.0)
            right_h = computed_angles.get("rightHip", 180.0)
            actual_val = min(left_h, right_h)
            joint_label = "spine"
        
        # Fallback to direct mapping if not matched by smart rules
        if actual_val is None:
            actual_val = computed_angles.get(key, 180.0)

        # Calculate deviation
        deviation = abs(actual_val - target)
        aligned = deviation <= tolerance
        joint_details[key] = {
            "target": target,
            "actual": actual_val,
            "tolerance": tolerance,
            "deviation": deviation,
            "aligned": aligned
        }

        # Joint score calculation
        if aligned:
            # Scale from 100.0 down to 80.0 at tolerance
            joint_score = 100.0 - (deviation / tolerance) * 20.0 if tolerance > 0 else 100.0
        else:
            # Scale from 80.0 down to 0.0 at tolerance + 45 degrees
            joint_score = max(0.0, 80.0 - ((deviation - tolerance) / 45.0) * 80.0)
            
            # Generate actionable feedback message
            if actual_val < target:
                feedback_messages.append(f"Straighten or open up your {joint_label} slightly.")
            else:
                feedback_messages.append(f"Bend or close down your {joint_label} slightly.")
        
        joint_scores.append(joint_score)
        evaluated_joints_count += 1

    # Calculate overall accuracy
    if evaluated_joints_count > 0:
        score = sum(joint_scores) / evaluated_joints_count
    else:
        score = 100.0

    # Choose feedback message
    if not feedback_messages:
        feedback = "Perfect posture! Keep holding it steadily."
    else:
        feedback = feedback_messages[0]  # Return the primary correction tip

    return {
        "accuracy": round(score, 1),
        "feedback": feedback,
        "joint_details": joint_details
    }
