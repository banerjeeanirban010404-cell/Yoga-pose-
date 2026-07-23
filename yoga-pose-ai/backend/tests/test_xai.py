import pytest
from app.services.yoga_service import yoga_service
from app.ai_engine.feedback_engine.anatomical_db import get_anatomical_profile, ANATOMICAL_INSIGHTS

def test_api_trainer_explain_endpoint(client, db):
    # Seed database data to ensure standard poses are loaded
    yoga_service.seed_initial_data(db)
    
    # 1. Test explaining a knee deviation in Tree Pose
    payload = {
        "pose_id": "tree-pose",
        "joint_name": "rightKnee",
        "deviation_degrees": 15.0
    }
    
    response = client.post("/api/v1/trainer/explain", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "explanation" in data
    explanation = data["explanation"]
    
    # Verify that the explanation is compiled using the fallback template and contains pose and joint context
    assert "knee" in explanation.lower()
    assert "tree pose" in explanation.lower()
    assert "patella" in explanation.lower() or "meniscus" in explanation.lower()

def test_anatomical_db_mappings():
    # 1. Test knee mapping
    knee_profile = get_anatomical_profile("rightKnee")
    assert knee_profile == ANATOMICAL_INSIGHTS["knee"]
    assert "patella" in knee_profile["muscle_engagement"].lower()
    
    # 2. Test spine mapping
    spine_profile = get_anatomical_profile("torsoAngle")
    assert spine_profile == ANATOMICAL_INSIGHTS["spine"]
    assert "erector spinae" in spine_profile["muscle_engagement"].lower()
    
    # 3. Test fallback mapping for unknown joint
    fallback_profile = get_anatomical_profile("unknownJointName")
    assert "postural stabilizers" in fallback_profile["muscle_engagement"].lower()
