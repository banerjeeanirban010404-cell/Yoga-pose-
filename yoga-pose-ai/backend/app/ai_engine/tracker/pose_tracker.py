import math
from typing import List, Dict, Any, Tuple, Optional

class PoseCalibrator:
    """
    Estimates the floor plane normal vector from user's contact points (ankles/heels/toes)
    and computes a rotation matrix to rectify 2.5D coordinate perspective distortion.
    """
    def __init__(self, required_frames: int = 10):
        self.required_frames = required_frames
        self.collected_normals: List[Tuple[float, float, float]] = []
        self.rotation_matrix: Optional[List[List[float]]] = None
        self.calibrated = False

    def add_frame(self, landmarks: List[Dict[str, float]]) -> Tuple[bool, str]:
        """
        Extract feet landmarks, calculate ground normal, and accumulate.
        Returns (is_completed, status_message).
        """
        if self.calibrated:
            return True, "Calibration complete."

        if not landmarks or len(landmarks) < 33:
            return False, "No person detected. Position your full body in the camera frame."

        # Check visibility of key skeletal landmarks to ensure full body is in frame
        key_landmarks = [11, 12, 23, 24, 25, 26, 27, 28] # shoulders, hips, knees, ankles
        low_visibility_count = sum(1 for idx in key_landmarks if landmarks[idx].get('visibility', 1.0) < 0.55)
        if low_visibility_count > 2:
            return False, "Calibration paused: Position your full body in the camera frame."

        # Verify visibility of the feet landmarks specifically
        feet_indices = [27, 28, 29, 30, 31, 32]
        if any(landmarks[idx].get('visibility', 1.0) < 0.50 for idx in feet_indices):
            return False, "Calibration paused: Adjust camera so your feet are fully visible."

        try:
            l_ank = landmarks[27]
            r_ank = landmarks[28]
            l_heel = landmarks[29]
            r_heel = landmarks[30]
            l_toe = landmarks[31]
            r_toe = landmarks[32]

            # Levelness check: Verify left and right heels are flat/level on the floor
            # A vertical difference greater than 0.06 indicates a single-leg or transition pose
            if abs(l_heel['y'] - r_heel['y']) > 0.06:
                return False, "Calibration paused: Place both feet flat on the floor."

            # Posture check: Verify the user is standing upright (hips above knees, knees above ankles)
            l_hip = landmarks[23]
            r_hip = landmarks[24]
            l_knee = landmarks[25]
            r_knee = landmarks[26]

            # In MediaPipe's coordinates, +y is downwards, so smaller y = higher position
            if not (l_hip['y'] < l_knee['y'] < l_ank['y']) or not (r_hip['y'] < r_knee['y'] < r_ank['y']):
                return False, "Calibration paused: Stand upright with both feet flat."

            # 1. Lateral vector (left to right across the heels)
            v_lat = (
                r_heel['x'] - l_heel['x'],
                r_heel['y'] - l_heel['y'],
                r_heel['z'] - l_heel['z']
            )

            # 2. Longitudinal vector (back to front, heel to toe)
            mid_heel = (
                (l_heel['x'] + r_heel['x']) / 2.0,
                (l_heel['y'] + r_heel['y']) / 2.0,
                (l_heel['z'] + r_heel['z']) / 2.0
            )
            mid_toe = (
                (l_toe['x'] + r_toe['x']) / 2.0,
                (l_toe['y'] + r_toe['y']) / 2.0,
                (l_toe['z'] + r_toe['z']) / 2.0
            )
            v_long = (
                mid_toe[0] - mid_heel[0],
                mid_toe[1] - mid_heel[1],
                mid_toe[2] - mid_heel[2]
            )

            # 3. Calculate normal vector (v_lat x v_long)
            normal = (
                v_lat[1] * v_long[2] - v_lat[2] * v_long[1],
                v_lat[2] * v_long[0] - v_lat[0] * v_long[2],
                v_lat[0] * v_long[1] - v_lat[1] * v_long[0]
            )

            mag = math.sqrt(normal[0]**2 + normal[1]**2 + normal[2]**2)
            if mag > 1e-6:
                u_normal = (normal[0] / mag, normal[1] / mag, normal[2] / mag)
                if u_normal[1] > 0:
                    u_normal = (-u_normal[0], -u_normal[1], -u_normal[2])
                    
                self.collected_normals.append(u_normal)
            else:
                return False, "Calibration paused: Noisy ground signals. Stand still."

        except (KeyError, IndexError, ZeroDivisionError):
            return False, "Calibration paused: Sensor noise detected. Stand still."

        collected = len(self.collected_normals)
        required = self.required_frames
        if collected >= required:
            self._compute_calibration_matrix()
            self.calibrated = True
            return True, "Calibration complete!"

        return False, f"Calibrating camera... Stand still in full frame ({collected}/{required})."

    def _compute_calibration_matrix(self):
        """
        Averages collected normal vectors and computes the Rodrigues rotation matrix
        to align the floor normal with the target gravity vertical (0, -1, 0).
        """
        if not self.collected_normals:
            self.rotation_matrix = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]]
            return

        # Average normals
        sum_x = sum(n[0] for n in self.collected_normals)
        sum_y = sum(n[1] for n in self.collected_normals)
        sum_z = sum(n[2] for n in self.collected_normals)
        
        n_avg = (
            sum_x / len(self.collected_normals),
            sum_y / len(self.collected_normals),
            sum_z / len(self.collected_normals)
        )
        
        mag = math.sqrt(n_avg[0]**2 + n_avg[1]**2 + n_avg[2]**2)
        if mag < 1e-6:
            self.rotation_matrix = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]]
            return
            
        u_n = (n_avg[0] / mag, n_avg[1] / mag, n_avg[2] / mag)
        nx, ny, nz = u_n

        # Target vector: straight up (0, -1, 0)
        # Dot product with target
        c = -ny 

        if 1.0 - abs(c) < 1e-5:
            # Already aligned or upside down
            if c > 0:
                self.rotation_matrix = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]]
            else:
                self.rotation_matrix = [[1.0, 0.0, 0.0], [0.0, -1.0, 0.0], [0.0, 0.0, -1.0]]
            return

        # Rodrigues matrix calculation helper
        # k = 1 / (1 + c)
        k = 1.0 / (1.0 + c)
        
        # Matrix R
        self.rotation_matrix = [
            [1.0 - k * nx**2,     nx,               -k * nx * nz],
            [-nx,                 1.0 - k * (nx**2 + nz**2), -nz],
            [-k * nx * nz,        nz,               1.0 - k * nz**2]
        ]

    def get_tilt_angle(self) -> float:
        """
        Returns estimated pitch tilt angle in degrees.
        tilt angle is the angle between the ground normal and vertical (0, -1, 0).
        """
        if not self.calibrated or not self.collected_normals:
            return 0.0
            
        # Average normal
        sum_x = sum(n[0] for n in self.collected_normals)
        sum_y = sum(n[1] for n in self.collected_normals)
        sum_z = sum(n[2] for n in self.collected_normals)
        
        mag = math.sqrt(sum_x**2 + sum_y**2 + sum_z**2)
        if mag < 1e-6:
            return 0.0
            
        ny = sum_y / mag
        cos_theta = min(1.0, max(-1.0, -ny))  # dot product with (0, -1, 0)
        
        return round(math.degrees(math.acos(cos_theta)), 1)

    def rectify(self, landmarks: List[Dict[str, float]]) -> List[Dict[str, float]]:
        """
        Rotate the landmarks around the center of the feet to correct camera tilt.
        """
        if not self.calibrated or not self.rotation_matrix or not landmarks:
            return landmarks

        # 1. Compute pivot point (midpoint of left and right ankle)
        try:
            l_ank = landmarks[27]
            r_ank = landmarks[28]
            pivot = (
                (l_ank.get('x', 0.0) + r_ank.get('x', 0.0)) / 2.0,
                (l_ank.get('y', 0.0) + r_ank.get('y', 0.0)) / 2.0,
                (l_ank.get('z', 0.0) + r_ank.get('z', 0.0)) / 2.0
            )
        except (IndexError, KeyError):
            # Fallback pivot: mean of all landmarks
            pivot = (0.5, 0.5, 0.0)

        # 2. Rectify each landmark relative to pivot
        rectified_landmarks = []
        R = self.rotation_matrix

        for lm in landmarks:
            # Subtract pivot
            px = lm.get('x', 0.0) - pivot[0]
            py = lm.get('y', 0.0) - pivot[1]
            pz = lm.get('z', 0.0) - pivot[2]

            # Rotate: R * p
            rx = R[0][0] * px + R[0][1] * py + R[0][2] * pz
            ry = R[1][0] * px + R[1][1] * py + R[1][2] * pz
            rz = R[2][0] * px + R[2][1] * py + R[2][2] * pz

            # Add pivot back
            rectified_lm = lm.copy()
            rectified_lm['x'] = rx + pivot[0]
            rectified_lm['y'] = ry + pivot[1]
            rectified_lm['z'] = rz + pivot[2]
            
            rectified_landmarks.append(rectified_lm)

        return rectified_landmarks
