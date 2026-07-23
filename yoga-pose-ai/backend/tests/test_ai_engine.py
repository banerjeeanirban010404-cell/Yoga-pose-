import pytest
from app.ai_engine.angle_calculator.calculator import calculate_2d_angle, calculate_3d_angle
from app.ai_engine.feedback_engine.engine import evaluate_pose

def test_calculate_3d_angle_orthogonal():
    # Right angle (90 degrees)
    a = {"x": 1.0, "y": 0.0, "z": 0.0}
    b = {"x": 0.0, "y": 0.0, "z": 0.0}
    c = {"x": 0.0, "y": 1.0, "z": 0.0}
    
    angle = calculate_3d_angle(a, b, c)
    assert pytest.approx(angle, 0.01) == 90.0

def test_calculate_3d_angle_collinear():
    # Straight angle (180 degrees)
    a = {"x": -1.0, "y": 0.0, "z": 0.0}
    b = {"x": 0.0, "y": 0.0, "z": 0.0}
    c = {"x": 1.0, "y": 0.0, "z": 0.0}
    
    angle = calculate_3d_angle(a, b, c)
    assert pytest.approx(angle, 0.01) == 180.0

def test_calculate_3d_angle_coincident():
    # Coincident vertex (magnitude 0) - should handle gracefully and return 0.0
    a = {"x": 0.0, "y": 0.0, "z": 0.0}
    b = {"x": 0.0, "y": 0.0, "z": 0.0}
    c = {"x": 1.0, "y": 0.0, "z": 0.0}
    
    angle = calculate_3d_angle(a, b, c)
    assert angle == 0.0

def test_calculate_2d_angle_orthogonal():
    # 2D Right angle
    a = {"x": 2.0, "y": 2.0}
    b = {"x": 2.0, "y": 0.0}
    c = {"x": 0.0, "y": 0.0}
    
    angle = calculate_2d_angle(a, b, c)
    assert pytest.approx(angle, 0.01) == 90.0

def test_evaluate_pose_perfect_match():
    # Create 33 dummy landmarks. Index 11/13/15 is leftElbow, 12/14/16 is rightElbow.
    # Set rightKnee to 90 degrees: A(rightHip)=24 is (0,1,0), B(rightKnee)=26 is (0,0,0), C(rightAnkle)=28 is (1,0,0)
    # Set rightElbow to 180 degrees: A(rightShoulder)=12 is (0,1,0), B(rightElbow)=14 is (0,0,0), C(rightWrist)=16 is (0,-1,0)
    # We will pass target joint parameters: rightKnee target=90, tolerance=8
    landmarks = [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(33)]
    
    # rightKnee points: 24 (hip), 26 (knee), 28 (ankle)
    landmarks[24] = {"x": 0.0, "y": 1.0, "z": 0.0}
    landmarks[26] = {"x": 0.0, "y": 0.0, "z": 0.0}
    landmarks[28] = {"x": 1.0, "y": 0.0, "z": 0.0}
    
    target_angles = {
        "rightKnee": {"target": 90.0, "tolerance": 8.0}
    }
    
    result = evaluate_pose("warrior-ii", landmarks, target_angles)
    assert result["accuracy"] == 100.0
    assert result["joint_details"]["rightKnee"]["aligned"] is True
    assert "Perfect" in result["feedback"]

def test_evaluate_pose_misaligned():
    landmarks = [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(33)]
    
    # rightKnee points: 24 (hip), 26 (knee), 28 (ankle)
    # This forms a straight line (180 degrees) instead of 90 degrees target
    landmarks[24] = {"x": 0.0, "y": 1.0, "z": 0.0}
    landmarks[26] = {"x": 0.0, "y": 0.0, "z": 0.0}
    landmarks[28] = {"x": 0.0, "y": -1.0, "z": 0.0}
    
    target_angles = {
        "rightKnee": {"target": 90.0, "tolerance": 8.0}
    }
    
    result = evaluate_pose("warrior-ii", landmarks, target_angles)
    assert result["accuracy"] < 100.0
    assert result["joint_details"]["rightKnee"]["aligned"] is False
    assert "Bend or close down" in result["feedback"]

def test_api_trainer_analyze_endpoint(client, db):
    from app.services.yoga_service import yoga_service
    yoga_service.seed_initial_data(db)
    
    # Register & Login a test user to make authenticated calls
    client.post(
        "/api/v1/auth/signup",
        json={"username": "trainerfan", "email": "trainer@fan.com", "password": "securepassword"}
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "trainer@fan.com", "password": "securepassword"}
    )
    token = login_response.json()["access_token"]
    
    # Define a set of 33 dummy landmarks
    landmarks = [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(33)]
    landmarks[24] = {"x": 0.0, "y": 1.0, "z": 0.0}
    landmarks[26] = {"x": 0.0, "y": 0.0, "z": 0.0}
    landmarks[28] = {"x": 1.0, "y": 0.0, "z": 0.0}
    
    payload = {
        "pose_id": "warrior-ii",
        "landmarks": landmarks
    }
    
    response = client.post(
        "/api/v1/trainer/analyze",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "accuracy" in data
    assert "feedback" in data
    assert "joint_details" in data
