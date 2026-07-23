import math
from app.ai_engine.tracker.pose_tracker import PoseCalibrator

def test_pose_calibrator_rotation():
    # 1. Base aligned points on ground plane (y = 0.9)
    base_points = {
        27: {'x': 0.4, 'y': 0.88, 'z': 0.2}, # left ankle
        28: {'x': 0.6, 'y': 0.88, 'z': 0.2}, # right ankle
        29: {'x': 0.4, 'y': 0.9,  'z': 0.2}, # left heel
        30: {'x': 0.6, 'y': 0.9,  'z': 0.2}, # right heel
        31: {'x': 0.4, 'y': 0.9,  'z': 0.1}, # left toe
        32: {'x': 0.6, 'y': 0.9,  'z': 0.1}, # right toe
        23: {'x': 0.4, 'y': 0.5,  'z': 0.2}, # left hip
        24: {'x': 0.6, 'y': 0.5,  'z': 0.2}, # right hip
        25: {'x': 0.4, 'y': 0.7,  'z': 0.2}, # left knee
        26: {'x': 0.6, 'y': 0.7,  'z': 0.2}, # right knee
        11: {'x': 0.4, 'y': 0.3,  'z': 0.2}, # left shoulder
        12: {'x': 0.6, 'y': 0.3,  'z': 0.2}, # right shoulder
    }
    
    # Fill remaining landmarks to complete 33 landmarks
    landmarks = [{'x': 0.0, 'y': 0.0, 'z': 0.0} for _ in range(33)]
    for idx, pt in base_points.items():
        landmarks[idx] = pt

    # 2. Simulate camera tilt of 15 degrees around x-axis
    theta = math.radians(15.0)
    cos_t = math.cos(theta)
    sin_t = math.sin(theta)
    
    tilted_landmarks = []
    for lm in landmarks:
        x, y, z = lm['x'], lm['y'], lm['z']
        # Rotate around X axis
        yt = y * cos_t - z * sin_t
        zt = y * sin_t + z * cos_t
        tilted_landmarks.append({'x': x, 'y': yt, 'z': zt, 'visibility': 1.0})

    # 3. Instantiate calibrator and feed 10 identical frames
    calibrator = PoseCalibrator(required_frames=10)
    for _ in range(10):
        calibrator.add_frame(tilted_landmarks)
        
    assert calibrator.calibrated is True
    
    # 4. Check estimated tilt angle (should be approx 15 degrees)
    tilt = calibrator.get_tilt_angle()
    assert abs(tilt - 15.0) < 1.0
    
    # 5. Rectify tilted landmarks
    rectified = calibrator.rectify(tilted_landmarks)
    
    # Check that ankle and heel heights are aligned (should have identical rectified y-levels)
    y_l_heel = rectified[29]['y']
    y_r_heel = rectified[30]['y']
    y_l_toe = rectified[31]['y']
    y_r_toe = rectified[32]['y']
    
    # The floor points (heels & toes) should all lie in a flat plane perpendicular to gravity,
    # meaning they should all have roughly the same rectified y value!
    assert abs(y_l_heel - y_r_heel) < 1e-4
    assert abs(y_l_heel - y_l_toe) < 1e-4
    assert abs(y_r_heel - y_r_toe) < 1e-4
