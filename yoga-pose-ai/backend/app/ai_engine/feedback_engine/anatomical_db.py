from typing import Dict

# Structured database of biomechanical and anatomical insights for joints
ANATOMICAL_INSIGHTS: Dict[str, Dict[str, str]] = {
    "knee": {
        "muscle_engagement": "Engages the quadriceps femoris to stabilize the patella, and recruits the gluteus medius/maximus to prevent the knee from collapsing inward (valgus stress).",
        "joint_mechanics": "Prevents excessive shear force on the anterior cruciate ligament (ACL) and reduces lateral stress on the meniscus by aligning the knee directly over the ankle.",
        "therapeutic_benefit": "Strengthens knee stabilizers, builds leg endurance, and corrects foot pronation over time."
    },
    "hip": {
        "muscle_engagement": "Recruits the iliopsoas, rectus femoris, and gluteal muscle groups to hinge or rotate the pelvis, releasing tension in the piriformis.",
        "joint_mechanics": "Promotes femoral head alignment within the acetabulum (hip socket), reducing impingement and evening load distribution across both hips.",
        "therapeutic_benefit": "Relieves lower back compression, stretches tight hip flexors, and improves overall pelvic alignment and gait."
    },
    "shoulder": {
        "muscle_engagement": "Recruits the serratus anterior, deltoids, and lower trapezius to rotate the scapula upward and stabilize the shoulder girdle.",
        "joint_mechanics": "Creates space in the glenohumeral joint, preventing the humerus from impinging on the acromion process.",
        "therapeutic_benefit": "Improves shoulder range of motion, decompresses the neck, and releases chronic tension in the upper back."
    },
    "elbow": {
        "muscle_engagement": "Engages the triceps brachii and pronator teres muscles to support body weight, while stabilizing wrist flexors.",
        "joint_mechanics": "Prevents elbow hyper-extension (cubitus valgus stress) and distributes load evenly through the radioulnar joint.",
        "therapeutic_benefit": "Builds upper body strength, stabilizes the elbow joint complex, and reduces repetitive strain injuries in the wrist."
    },
    "spine": {
        "muscle_engagement": "Activates the erector spinae, multifidus, and core stabilizers (transversus abdominis) to lengthen the torso.",
        "joint_mechanics": "Encourages even distribution of extension or flexion along the vertebral column, avoiding hyper-flexion in the lumbar region.",
        "therapeutic_benefit": "Decompresses intervertebral discs, strengthens back extensors, and corrects thoracic kyphosis (slouching)."
    }
}

def get_anatomical_profile(joint_name: str) -> Dict[str, str]:
    """
    Map raw joint names dynamically to the core anatomical insights profile.
    """
    name_lower = joint_name.lower()
    if "knee" in name_lower:
        return ANATOMICAL_INSIGHTS["knee"]
    elif "hip" in name_lower:
        return ANATOMICAL_INSIGHTS["hip"]
    elif "shoulder" in name_lower or "arm" in name_lower:
        return ANATOMICAL_INSIGHTS["shoulder"]
    elif "elbow" in name_lower:
        return ANATOMICAL_INSIGHTS["elbow"]
    elif "spine" in name_lower or "torso" in name_lower:
        return ANATOMICAL_INSIGHTS["spine"]
    else:
        # Fallback profile
        return {
            "muscle_engagement": "Recruits local postural stabilizers and core muscle groups to balance body weight.",
            "joint_mechanics": "Encourages structural skeletal alignment, avoiding torque spikes on supporting ligaments.",
            "therapeutic_benefit": "Promotes full-body coordination, increases body awareness, and reduces fatigue."
        }
