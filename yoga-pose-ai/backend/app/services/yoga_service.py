from typing import List
from sqlalchemy.orm import Session
from app.repositories.yoga_repository import yoga_repository
from app.repositories.exercise_repository import exercise_repository
from app.schemas.exercise import YogaPoseBase, ExerciseBase
from app.models.yoga import YogaPose
from app.models.exercise import Exercise

class YogaService:
    def get_all_poses(self, db: Session) -> List[YogaPose]:
        return yoga_repository.get_all(db)

    def get_pose_by_id(self, db: Session, pose_id: str) -> YogaPose:
        return yoga_repository.get_by_id(db, pose_id)

    def get_all_exercises(self, db: Session) -> List[Exercise]:
        return exercise_repository.get_all(db)

    def get_exercise_by_id(self, db: Session, exercise_id: str) -> Exercise:
        return exercise_repository.get_by_id(db, exercise_id)

    def seed_initial_data(self, db: Session):
        # Initial yoga poses (matching yogaData.js, expanded with advanced search tags/metadata)
        poses = [
            YogaPoseBase(
                id="downward-dog",
                name="Downward Dog",
                sanskrit_name="Adho Mukha Svanasana",
                english_name="Downward Facing Dog Pose",
                difficulty="Beginner",
                duration=60,
                calories_per_minute=10,
                description="A foundational inversion that stretches the hamstrings, calves, and spine while building upper body strength.",
                steps=[
                    "Start on hands and knees, hands slightly forward of shoulders.",
                    "Exhale and lift knees off the floor, pushing pelvis up toward the ceiling.",
                    "Straighten legs without locking knees; press heels down.",
                    "Press ground away, keeping shoulders broad and head relaxed between arms."
                ],
                benefits=["Stretches hamstrings and calves", "Strengthens shoulders and arms", "Improves blood circulation"],
                target_muscle="Hamstrings & Shoulders",
                ideal_for="Warm-up, spinal elongation",
                common_mistakes=["Rounding the lower back", "Locking knees", "Shrugging shoulders into ears"],
                instructions=["Keep spine flat", "Draw ribcage in", "Press chest back toward thighs"],
                joint_angles={
                    "hipAngle": {"target": 70, "tolerance": 15},
                    "shoulderAngle": {"target": 160, "tolerance": 15}
                },
                body_parts=["Back", "Legs", "Shoulders"],
                health_conditions=["Back Pain", "Stress", "Fatigue", "Mild Depression"],
                equipment="None",
                tags=["Stretch", "Inversion", "Calming", "Warm-up", "Asana"]
            ),
            YogaPoseBase(
                id="tree-pose",
                name="Tree Pose",
                sanskrit_name="Vrikshasana",
                english_name="Tree Pose",
                difficulty="Beginner",
                duration=45,
                calories_per_minute=6,
                description="A balancing pose that strengthens thighs, calves, ankles, and spine while opening hips and improving focus.",
                steps=[
                    "Stand tall with feet together, weight evenly distributed.",
                    "Shift weight onto left foot, bend right knee, and place right foot on inner left thigh or calf (never knee).",
                    "Bring hands together at chest or extend overhead.",
                    "Hold for 5-10 breaths, then switch sides."
                ],
                benefits=["Improves balance and posture", "Strengthens legs and core", "Increases hip mobility"],
                target_muscle="Ankles, calves, thighs & core",
                ideal_for="Balance & Concentration",
                common_mistakes=["Placing foot directly on the knee joint", "Leaning hips out to the side", "Holding breath"],
                instructions=["Root standing leg", "Open bent knee sideways", "Find a fixed focal point (Drishti)"],
                joint_angles={
                    "kneeAngle": {"target": 45, "tolerance": 10},
                    "hipOpenAngle": {"target": 85, "tolerance": 10}
                },
                body_parts=["Legs", "Core", "Ankles"],
                health_conditions=["Anxiety", "Poor Posture", "Flat Feet"],
                equipment="None",
                tags=["Balance", "Focus", "Strength", "Asana"]
            ),
            YogaPoseBase(
                id="warrior-ii",
                name="Warrior II",
                sanskrit_name="Virabhadrasana II",
                english_name="Warrior II Pose",
                difficulty="Intermediate",
                duration=45,
                calories_per_minute=12,
                description="A strong standing pose that stretches the hips and chest, strengthens limbs, and develops stamina.",
                steps=[
                    "Stand with feet wide apart, about 4 feet.",
                    "Turn right foot out 90 degrees, left foot in slightly.",
                    "Inhale, raise arms parallel to the floor.",
                    "Exhale, bend right knee to 90 degrees, keeping it directly over ankle.",
                    "Gaze over right hand."
                ],
                benefits=["Strengthens quadriceps and shoulders", "Stretches groin and hips", "Improves stamina"],
                target_muscle="Legs, hips & shoulders",
                ideal_for="Strength & Stamina",
                common_mistakes=["Knee cave-in", "Torso leaning forward", "Dropping back arm"],
                instructions=["Keep front knee bent at 90°", "Extend arms fully parallel", "Align spine vertically over pelvis"],
                joint_angles={
                    "rightKnee": {"target": 90, "tolerance": 8},
                    "rightElbow": {"target": 180, "tolerance": 10},
                    "torsoAngle": {"target": 90, "tolerance": 5}
                },
                body_parts=["Legs", "Hips", "Shoulders"],
                health_conditions=["Sciatica", "Flat Feet", "Lethargy"],
                equipment="None",
                tags=["Strength", "Stamina", "Hip Opener", "Asana"]
            ),
            YogaPoseBase(
                id="cobra-pose",
                name="Cobra Pose",
                sanskrit_name="Bhujangasana",
                english_name="Cobra Pose",
                difficulty="Beginner",
                duration=30,
                calories_per_minute=8,
                description="A gentle backbend that stretches chest, shoulders, and abdomen while strengthening the spine and buttocks.",
                steps=[
                    "Lie prone on floor, forehead resting down.",
                    "Place hands under shoulders, elbows close to body.",
                    "Inhale, press tops of feet and thighs down.",
                    "Gently straighten arms to lift chest, keeping hips grounded.",
                    "Keep shoulders rolled back and down."
                ],
                benefits=["Strengthens spine", "Stretches chest and lungs", "Stimulates abdominal organs"],
                target_muscle="Spinal extensors, shoulders & chest",
                ideal_for="Back strength & Flexibility",
                common_mistakes=["Crunched neck", "Straightening arms too much and lifting pelvis", "Elbows flaring out"],
                instructions=["Keep elbows tucked in", "Lift using back muscles, not just arms", "Gaze slightly upward"],
                joint_angles={
                    "spineExtension": {"target": 35, "tolerance": 10},
                    "elbowAngle": {"target": 135, "tolerance": 15}
                },
                body_parts=["Back", "Chest", "Shoulders"],
                health_conditions=["Back Pain", "Asthma", "Stress"],
                equipment="None",
                tags=["Flexibility", "Backbend", "Strengthening", "Asana"]
            ),
            YogaPoseBase(
                id="crow-pose",
                name="Crow Pose",
                sanskrit_name="Bakasana",
                english_name="Crow Pose",
                difficulty="Advanced",
                duration=20,
                calories_per_minute=15,
                description="A challenging arm balance that strengthens arms, wrists, and core while improving mental concentration.",
                steps=[
                    "Squat down and place hands flat, shoulder-width apart.",
                    "Keep knees wide, raise heels, and place knees on back of upper arms.",
                    "Lean forward, shifting weight into hands.",
                    "Engage core and lift feet off the ground, toes touching."
                ],
                benefits=["Builds core and arm strength", "Tones abdominal muscles", "Improves focus and coordination"],
                target_muscle="Core, arms & wrists",
                ideal_for="Core stability & Arm balance",
                common_mistakes=["Looking down instead of forward", "Splaying elbows outward", "Jumping into the pose"],
                instructions=["Look 1-2 feet ahead of hands", "Squeeze knees inward against triceps", "Draw navel upward"],
                joint_angles={
                    "armFlexion": {"target": 90, "tolerance": 10},
                    "hipFlexion": {"target": 45, "tolerance": 10}
                },
                body_parts=["Arms", "Core", "Wrists"],
                health_conditions=["Stress", "Anxiety"],
                equipment="None",
                tags=["Balance", "Arm Balance", "Core Strength", "Focus", "Asana"]
            ),
            YogaPoseBase(
                id="childs-pose",
                name="Child's Pose",
                sanskrit_name="Balasana",
                english_name="Child's Pose",
                difficulty="Beginner",
                duration=60,
                calories_per_minute=4,
                description="A resting posture that gently stretches the hips, thighs, and ankles while calming the mind.",
                steps=[
                    "Kneel on the floor, touch your big toes together, and sit on your heels.",
                    "Separate your knees about hip-width apart.",
                    "Exhale and lay your torso down between your thighs.",
                    "Extend your arms forward with palms down, or rest them alongside your torso."
                ],
                benefits=["Gently stretches hips and thighs", "Relieves back and neck pain", "Calms brain and relieves stress"],
                target_muscle="Hips & Lower Back",
                ideal_for="Rest, recovery, stress relief",
                common_mistakes=["Lifting hips off heels", "Holding breath", "Tensing shoulders"],
                instructions=["Relax chest down toward floor", "Breathe deeply into the back ribs", "Keep neck relaxed"],
                joint_angles={"hipFlexion": {"target": 30, "tolerance": 10}},
                body_parts=["Back", "Hips", "Thighs"],
                health_conditions=["Back Pain", "Stress", "Anxiety", "Insomnia"],
                equipment="None",
                tags=["Rest", "Calming", "Stretch", "Cool-down", "Asana"]
            ),
            YogaPoseBase(
                id="bridge-pose",
                name="Bridge Pose",
                sanskrit_name="Setu Bandhasana",
                english_name="Bridge Pose",
                difficulty="Beginner",
                duration=45,
                calories_per_minute=7,
                description="A chest-opener and backbend that strengthens the back, glutes, and hamstrings.",
                steps=[
                    "Lie on your back, bend your knees, and place feet flat on the floor hip-width apart.",
                    "Exhale and press your feet and arms active into the floor.",
                    "Lift your hips toward the ceiling.",
                    "Clasp your hands under your back and roll your shoulders underneath you."
                ],
                benefits=["Strengthens back and glutes", "Stretches chest and neck", "Improves digestion"],
                target_muscle="Glutes, lower back & chest",
                ideal_for="Back strength & Spine mobility",
                common_mistakes=["Knees splaying outward", "Over-arching the lower back", "Squeezing glutes too hard"],
                instructions=["Keep knees parallel", "Press outer shoulders down", "Lift chest toward chin"],
                joint_angles={"hipExtension": {"target": 150, "tolerance": 15}},
                body_parts=["Back", "Glutes", "Chest"],
                health_conditions=["Back Pain", "Stress", "High Blood Pressure"],
                equipment="None",
                tags=["Strength", "Backbend", "Chest Opener", "Asana"]
            ),
            YogaPoseBase(
                id="triangle-pose",
                name="Triangle Pose",
                sanskrit_name="Utthita Trikonasana",
                english_name="Extended Triangle Pose",
                difficulty="Intermediate",
                duration=45,
                calories_per_minute=8,
                description="A standing posture that stretches the legs, spine, and chest while improving balance and core stability.",
                steps=[
                    "Stand with feet wide apart. Turn right foot out 90 degrees, left foot in slightly.",
                    "Inhale, raise arms parallel to the floor.",
                    "Exhale, hinge at the right hip and reach forward over the right leg.",
                    "Rotate your torso open and rest your right hand on your shin, ankle, or floor, extending left arm to the ceiling."
                ],
                benefits=["Stretches legs and spine", "Opens chest and shoulders", "Stimulates abdominal organs"],
                target_muscle="Hamstrings, hips & spine",
                ideal_for="Spinal rotation & Balance",
                common_mistakes=["Collapsing torso forward", "Locking front knee", "Looking up if neck hurts"],
                instructions=["Stack shoulders vertically", "Keep body in a single plane", "Engage thighs and core"],
                joint_angles={"torsoAngle": {"target": 60, "tolerance": 10}},
                body_parts=["Legs", "Hips", "Back"],
                health_conditions=["Back Pain", "Sciatica", "Stress"],
                equipment="None",
                tags=["Stretch", "Balance", "Flexibility", "Asana"]
            ),
            YogaPoseBase(
                id="warrior-i",
                name="Warrior I",
                sanskrit_name="Virabhadrasana I",
                english_name="Warrior I Pose",
                difficulty="Beginner",
                duration=45,
                calories_per_minute=10,
                description="A powerful standing pose that builds focus, strength, and stamina in the legs and core.",
                steps=[
                    "Stand with feet wide apart. Turn right foot out 90 degrees and pivot left foot 45 degrees toward the right.",
                    "Rotate your pelvis to face forward toward the front of the mat.",
                    "Bend your front knee to 90 degrees, keeping it directly over ankle.",
                    "Reach your arms overhead, palms facing each other or touching."
                ],
                benefits=["Strengthens legs and ankles", "Stretches chest and shoulders", "Improves focus and balance"],
                target_muscle="Legs, shoulders & core",
                ideal_for="Leg strength & Posture",
                common_mistakes=["Arching lower back excessively", "Back heel lifting", "Front knee collapsing inward"],
                instructions=["Press outer edge of back foot down", "Keep front knee bent to 90°", "Lift chest and gaze forward"],
                joint_angles={"frontKnee": {"target": 90, "tolerance": 10}, "hipAngle": {"target": 135, "tolerance": 15}},
                body_parts=["Legs", "Core", "Shoulders"],
                health_conditions=["Back Pain", "Sciatica", "Anxiety"],
                equipment="None",
                tags=["Strength", "Stamina", "Focus", "Asana"]
            ),
            YogaPoseBase(
                id="camel-pose",
                name="Camel Pose",
                sanskrit_name="Ustrasana",
                english_name="Camel Pose",
                difficulty="Intermediate",
                duration=30,
                calories_per_minute=9,
                description="A deep backward bend that opens the entire front body, stretches the hip flexors, and strengthens back muscles.",
                steps=[
                    "Kneel on the floor with knees hip-width apart and thighs perpendicular to floor.",
                    "Place hands on your lower back, fingers pointing down.",
                    "Inhale, lift your chest, and slowly lean back.",
                    "If comfortable, reach hands down to hold your heels. Gaze upward or let head hang back gently."
                ],
                benefits=["Stretches the throat, chest, and abdomen", "Stretches deep hip flexors", "Strengthens back muscles"],
                target_muscle="Thighs, Hip Flexors, Abs & Chest",
                ideal_for="Postural Correction & Heart Opening",
                common_mistakes=["Squeezing buttocks too tightly", "Letting knees splay apart", "Straining the neck"],
                instructions=["Press hips forward to stay aligned over knees", "Lift chest upward before bending back", "Keep shoulders broad"],
                joint_angles={"hipExtension": {"target": 160, "tolerance": 10}, "spineExtension": {"target": 45, "tolerance": 10}},
                body_parts=["Chest", "Abdomen", "Back", "Hips"],
                health_conditions=["Poor Posture", "Back Pain", "Fatigue"],
                equipment="Block",
                tags=["Flexibility", "Backbend", "Chest Opener", "Asana"]
            ),
            YogaPoseBase(
                id="lotus-pose",
                name="Lotus Pose",
                sanskrit_name="Padmasana",
                english_name="Lotus Pose",
                difficulty="Intermediate",
                duration=120,
                calories_per_minute=5,
                description="A cross-legged meditative posture that stabilizes the body, calms the mind, and facilitates deep breathing.",
                steps=[
                    "Sit on the floor with legs extended straight. Bend right knee, bring foot to left hip crease.",
                    "Bend left knee, carefully lift left foot and place it on top of right thigh at hip crease.",
                    "Place hands on knees in Jnana Mudra (palms up, index and thumb touching).",
                    "Keep spine erect, shoulders relaxed, and breathe deeply."
                ],
                benefits=["Calms the brain and central nervous system", "Stretches knees and ankles", "Increases hip flexibility"],
                target_muscle="Hips & Ankles",
                ideal_for="Meditation & Pranayama",
                common_mistakes=["Forcing feet onto thighs when hips are tight", "Rounding the spine", "Tensing shoulders"],
                instructions=["Use a cushion under hips to sit higher", "Listen to knees; do not force", "Keep chest lifted"],
                joint_angles={"kneeFlexion": {"target": 30, "tolerance": 10}, "hipFlexion": {"target": 35, "tolerance": 10}},
                body_parts=["Hips", "Legs", "Spine"],
                health_conditions=["Stress", "Anxiety", "Sciatica"],
                equipment="None",
                tags=["Meditation", "Hip Opener", "Calming", "Asana"]
            ),
            YogaPoseBase(
                id="plank-pose",
                name="Plank Pose",
                sanskrit_name="Phalakasana",
                english_name="Plank Pose",
                difficulty="Beginner",
                duration=45,
                calories_per_minute=11,
                description="A powerful core strengthening pose that prepares the body for arm balances and inversions.",
                steps=[
                    "Start in Downward Dog, then draw your torso forward until shoulders are over wrists.",
                    "Keep body in a straight line from crown of head to heels.",
                    "Press heels back, pull lower belly up and in, and look slightly forward.",
                    "Spread shoulder blades and press floor away."
                ],
                benefits=["Strengthens core, arms, wrists", "Tones abdomen", "Builds upper body stamina"],
                target_muscle="Core, Shoulders & Wrists",
                ideal_for="Core Strength & Upper Body Conditioning",
                common_mistakes=["Sagging lower back", "Poking butt up", "Collapsing between shoulders"],
                instructions=["Keep neck long and aligned with spine", "Engage thighs and glutes", "Squeeze elbows toward center line"],
                joint_angles={"elbowAngle": {"target": 180, "tolerance": 5}, "hipAngle": {"target": 180, "tolerance": 10}},
                body_parts=["Core", "Arms", "Shoulders"],
                health_conditions=["Weak Core", "Poor Posture"],
                equipment="None",
                tags=["Strength", "Core Strength", "Stability", "Asana"]
            )
        ]

        # Initial exercises (matching exerciseData.js, expanded with rehabilitation and fitness movements)
        exercises = [
            ExerciseBase(
                id="breath-pranayama",
                name="Deep Breathing",
                category="Breathing",
                duration=180,
                difficulty="Beginner",
                description="Conscious breath regulation (Pranayama) to calm the nervous system, lower stress, and increase lung capacity.",
                steps=[
                    "Find a comfortable seated position with your spine straight and shoulders relaxed.",
                    "Close your eyes and place your left hand on your knee, right hand over your navel.",
                    "Inhale slowly through your nose for 4 seconds, feeling your abdomen rise.",
                    "Hold the breath gently for 4 seconds.",
                    "Exhale smoothly through your mouth or nose for 4 seconds, drawing the navel inward.",
                    "Hold empty for 4 seconds, then repeat the cycle for 3 minutes."
                ],
                sanskrit_name="Pranayama",
                benefits=["Calms the mind", "Reduces anxiety", "Regulates nervous system", "Increases lung efficiency"],
                target_muscle="Lungs & Diaphragm",
                body_parts=["Chest", "Mind"],
                health_conditions=["Stress", "Anxiety", "High Blood Pressure", "Asthma"],
                equipment="None",
                tags=["Breathing", "Meditation", "Calming", "Pranayama"],
                calories_per_minute=4
            ),
            ExerciseBase(
                id="neck-rolls",
                name="Neck & Shoulder Warm-up",
                category="Warm-up",
                duration=120,
                difficulty="Beginner",
                description="Gentle rotations and stretches to release built-up tension in the neck, cervical spine, and shoulder girdle.",
                steps=[
                    "Sit upright with your chest lifted and shoulders relaxed.",
                    "Slowly drop your chin to your chest, feeling the stretch along the back of the neck.",
                    "Roll your right ear towards your right shoulder. Hold for 3 breaths.",
                    "Gently roll your head back, then roll your left ear to your left shoulder.",
                    "Return chin to chest, then change directions. Perform 5 rolls on each side."
                ],
                sanskrit_name=None,
                benefits=["Releases neck stiffness", "Relieves tension headaches", "Improves shoulder joint mobility"],
                target_muscle="Neck & Shoulders",
                body_parts=["Neck", "Shoulders"],
                health_conditions=["Neck Stiffness", "Stress", "Rounded Shoulders"],
                equipment="None",
                tags=["Stretch", "Warm-up", "Mobility", "Routine"],
                calories_per_minute=3
            ),
            ExerciseBase(
                id="pushups",
                name="Push-ups",
                category="Fitness",
                duration=60,
                difficulty="Intermediate",
                description="A classic bodyweight exercise that builds upper body strength, targeting the chest, shoulders, and triceps.",
                steps=[
                    "Start in a plank position with hands slightly wider than shoulders.",
                    "Keep your body in a straight line from head to heels.",
                    "Lower your body by bending your elbows until your chest nearly touches the floor.",
                    "Push yourself back up to the starting position."
                ],
                sanskrit_name=None,
                benefits=["Strengthens chest and shoulders", "Builds tricep endurance", "Engages the core"],
                target_muscle="Chest, shoulders & triceps",
                body_parts=["Arms", "Chest", "Shoulders"],
                health_conditions=["Weak Arms", "Poor Core Stability"],
                equipment="None",
                tags=["Strength", "Fitness", "Upper Body", "Routine"],
                calories_per_minute=10
            ),
            ExerciseBase(
                id="squats",
                name="Bodyweight Squats",
                category="Fitness",
                duration=45,
                difficulty="Beginner",
                description="A fundamental lower body exercise that targets the quadriceps, hamstrings, and glutes to build functional strength.",
                steps=[
                    "Stand with feet shoulder-width apart, toes pointing slightly outward.",
                    "Lower your hips back and down as if sitting in a chair.",
                    "Keep your chest upright and knees behind your toes.",
                    "Push through your heels to return to the standing position."
                ],
                sanskrit_name=None,
                benefits=["Builds leg and glute strength", "Improves hip mobility", "Strengthens bones and joints"],
                target_muscle="Quads, hamstrings & glutes",
                body_parts=["Legs", "Glutes", "Hips"],
                health_conditions=["Knee Weakness", "Hip Tightness"],
                equipment="None",
                tags=["Strength", "Fitness", "Lower Body", "Routine"],
                calories_per_minute=9
            ),
            ExerciseBase(
                id="plank",
                name="Forearm Plank",
                category="Fitness",
                duration=60,
                difficulty="Beginner",
                description="An isometric core exercise that builds endurance and stability across the entire midsection, glutes, and shoulders.",
                steps=[
                    "Place your forearms on the floor, elbows aligned under shoulders.",
                    "Extend your legs behind you, resting your weight on your toes.",
                    "Engage your core, glutes, and thighs to keep your body in a straight line.",
                    "Hold the position while breathing steadily."
                ],
                sanskrit_name=None,
                benefits=["Strengthens core and back muscles", "Improves posture", "Builds shoulder stability"],
                target_muscle="Core, glutes & shoulders",
                body_parts=["Core", "Shoulders"],
                health_conditions=["Back Pain", "Weak Core"],
                equipment="None",
                tags=["Strength", "Fitness", "Core", "Routine"],
                calories_per_minute=8
            ),
            ExerciseBase(
                id="lunges",
                name="Forward Lunges",
                category="Fitness",
                duration=45,
                difficulty="Beginner",
                description="A unilateral lower body exercise that improves balance, coordination, hip mobility, and individual leg strength.",
                steps=[
                    "Stand tall with hands on your hips.",
                    "Step forward with one leg and lower your hips until both knees are bent at a 90-degree angle.",
                    "Keep your front knee directly above your ankle.",
                    "Push back to the starting position and repeat on the other side."
                ],
                sanskrit_name=None,
                benefits=["Strengthens quads and glutes", "Improves balance and coordination", "Increases hip flexor flexibility"],
                target_muscle="Quads, hamstrings, glutes & calves",
                body_parts=["Legs", "Glutes", "Hips"],
                health_conditions=["Poor Balance", "Hip Tightness"],
                equipment="None",
                tags=["Strength", "Fitness", "Lower Body", "Balance", "Routine"],
                calories_per_minute=9
            ),
            ExerciseBase(
                id="jumping-jacks",
                name="Jumping Jacks",
                category="Warm-up",
                duration=60,
                difficulty="Beginner",
                description="A classic full-body cardiovascular warm-up that increases heart rate, improves circulation, and warms the muscles.",
                steps=[
                    "Stand with feet together and arms at your sides.",
                    "Jump up, spreading your legs wide and raising your arms above your head.",
                    "Jump again, returning your feet and arms to the starting position."
                ],
                sanskrit_name=None,
                benefits=["Increases core body temperature", "Boosts cardiovascular fitness", "Improves coordination"],
                target_muscle="Full Body",
                body_parts=["Full Body"],
                health_conditions=["Cold Muscles", "Poor Stamina"],
                equipment="None",
                tags=["Warm-up", "Fitness", "Cardio", "Routine"],
                calories_per_minute=11
            ),
            ExerciseBase(
                id="burpees",
                name="Burpees",
                category="Fitness",
                duration=45,
                difficulty="Advanced",
                description="An intense full-body movement combining a squat, plank, push-up, and jump to build explosive power and high-level conditioning.",
                steps=[
                    "Stand with feet shoulder-width apart.",
                    "Drop into a squat and place your hands on the floor.",
                    "Jump your feet back into a plank position.",
                    "Perform a push-up, then jump your feet back to the squat position.",
                    "Explosively jump up into the air, reaching your arms overhead."
                ],
                sanskrit_name=None,
                benefits=["Builds explosive power", "Excellent cardiovascular conditioner", "Strengthens entire body"],
                target_muscle="Full Body",
                body_parts=["Full Body"],
                health_conditions=["Stamina Conditioning"],
                equipment="None",
                tags=["Fitness", "Cardio", "Explosive Strength", "Routine"],
                calories_per_minute=16
            ),
            ExerciseBase(
                id="wall-slides",
                name="Wall Slides",
                category="Rehabilitation",
                duration=60,
                difficulty="Beginner",
                description="A rehabilitation movement targeting upper back and rotator cuff health, helping correct shoulder and neck alignment.",
                steps=[
                    "Stand with your back, hips, and head resting flat against a wall.",
                    "Place your elbows and wrists against the wall at 90 degrees (like a cactus).",
                    "Slowly slide your arms upward while keeping contact with the wall.",
                    "Slide back down, keeping shoulder blades pulled together."
                ],
                sanskrit_name=None,
                benefits=["Corrects rounded shoulders", "Strengthens upper back stabilizers", "Improves shoulder mobility"],
                target_muscle="Scapular stabilizers & rotator cuff",
                body_parts=["Shoulders", "Upper Back"],
                health_conditions=["Shoulder Impingement", "Rounded Shoulders", "Poor Posture"],
                equipment="Wall",
                tags=["Rehabilitation", "Mobility", "Posture", "Routine"],
                calories_per_minute=3
            ),
            ExerciseBase(
                id="butterfly-stretch",
                name="Butterfly Stretch",
                category="Stretching",
                duration=90,
                difficulty="Beginner",
                description="A deep inner thigh and hip opening stretch that helps release lower back stress and tension.",
                steps=[
                    "Sit on the floor with your knees bent and the soles of your feet touching.",
                    "Hold your feet or ankles, keeping your spine straight and tall.",
                    "Gently lower your knees toward the floor to feel the stretch in your groin.",
                    "Hinge forward from the hips for a deeper stretch if comfortable, and hold."
                ],
                sanskrit_name="Baddha Konasana",
                benefits=["Opens inner thighs and groins", "Relieves tension in lower back", "Enhances hip flexibility"],
                target_muscle="Groin & inner thighs",
                body_parts=["Hips", "Legs"],
                health_conditions=["Tight Hips", "Sciatica", "Stress"],
                equipment="None",
                tags=["Stretch", "Mobility", "Cool-down", "Routine"],
                calories_per_minute=4
            ),
            ExerciseBase(
                id="yoga-nidra",
                name="Yoga Nidra",
                category="Meditation",
                duration=300,
                difficulty="Beginner",
                description="A guided meditation technique for deep physical, mental, and emotional relaxation, calming the nervous system.",
                steps=[
                    "Lie down comfortably on your back in Savasana (Corpse Pose).",
                    "Close your eyes and keep them closed throughout the practice.",
                    "Follow the guidance to scan the body, direct awareness to breathing, and experience deep stillness.",
                    "Let go of all muscle tension, thoughts, and efforts."
                ],
                sanskrit_name="Yoga Nidra",
                benefits=["Reduces chronic stress", "Improves sleep quality", "Resets the nervous system"],
                target_muscle="Mind & Nervous System",
                body_parts=["Mind", "Full Body"],
                health_conditions=["Insomnia", "Anxiety", "Chronic Fatigue", "Stress"],
                equipment="None",
                tags=["Meditation", "Relaxation", "Calming", "Sleep", "Routine"],
                calories_per_minute=2
            )
        ]

        for p in poses:
            yoga_repository.create_or_update(db, p)
        for e in exercises:
            exercise_repository.create_or_update(db, e)

yoga_service = YogaService()
