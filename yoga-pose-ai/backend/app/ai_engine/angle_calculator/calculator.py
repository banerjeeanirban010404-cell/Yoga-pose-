import math
from typing import Dict

def calculate_3d_angle(a: Dict[str, float], b: Dict[str, float], c: Dict[str, float]) -> float:
    """
    Calculate the angle in degrees at vertex b between endpoints a and c.
    Each point should be a dictionary with 'x', 'y', and optionally 'z'.
    """
    ax, ay, az = a.get('x', 0.0), a.get('y', 0.0), a.get('z', 0.0)
    bx, by, bz = b.get('x', 0.0), b.get('y', 0.0), b.get('z', 0.0)
    cx, cy, cz = c.get('x', 0.0), c.get('y', 0.0), c.get('z', 0.0)

    # Vectors ba and bc
    ba_x, ba_y, ba_z = ax - bx, ay - by, az - bz
    bc_x, bc_y, bc_z = cx - bx, cy - by, cz - bz

    # Dot product
    dot_product = ba_x * bc_x + ba_y * bc_y + ba_z * bc_z

    # Magnitudes
    mag_ba = math.sqrt(ba_x**2 + ba_y**2 + ba_z**2)
    mag_bc = math.sqrt(bc_x**2 + bc_y**2 + bc_z**2)

    if mag_ba == 0.0 or mag_bc == 0.0:
        return 0.0

    # Clamp to avoid precision domain issues in math.acos
    cos_theta = max(-1.0, min(1.0, dot_product / (mag_ba * mag_bc)))
    
    return round(math.degrees(math.acos(cos_theta)), 2)

def calculate_2d_angle(a: Dict[str, float], b: Dict[str, float], c: Dict[str, float]) -> float:
    """
    Calculate the angle in degrees at vertex b between endpoints a and c in the 2D plane (x, y).
    """
    ax, ay = a.get('x', 0.0), a.get('y', 0.0)
    bx, by = b.get('x', 0.0), b.get('y', 0.0)
    cx, cy = c.get('x', 0.0), c.get('y', 0.0)

    # Vectors ba and bc
    ba_x, ba_y = ax - bx, ay - by
    bc_x, bc_y = cx - bx, cy - by

    # Dot product
    dot_product = ba_x * bc_x + ba_y * bc_y

    # Magnitudes
    mag_ba = math.sqrt(ba_x**2 + ba_y**2)
    mag_bc = math.sqrt(bc_x**2 + bc_y**2)

    if mag_ba == 0.0 or mag_bc == 0.0:
        return 0.0

    cos_theta = max(-1.0, min(1.0, dot_product / (mag_ba * mag_bc)))

    return round(math.degrees(math.acos(cos_theta)), 2)
