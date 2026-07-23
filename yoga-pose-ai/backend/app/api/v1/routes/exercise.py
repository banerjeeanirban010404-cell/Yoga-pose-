from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import re
import difflib

from app.core.dependencies import get_db
from app.schemas.exercise import YogaPoseResponse, ExerciseResponse, LibraryItemResponse, LibrarySearchResponse, RelatedItemsResponse
from app.services.yoga_service import yoga_service

router = APIRouter()

# Synonym expansion dictionary for Natural Language Matching (NLM)
SYNONYMS = {
    "back": ["back", "spine", "cervical", "vertebrae", "thoracic", "lumbar", "neck", "spinal", "posture"],
    "neck": ["neck", "cervical", "shoulder", "rolls", "head", "upper back"],
    "leg": ["leg", "legs", "thigh", "thighs", "calf", "calves", "quadriceps", "quads", "hamstring", "hamstrings", "ankle", "ankles", "knee", "knees", "standing", "balance"],
    "legs": ["leg", "legs", "thigh", "thighs", "calf", "calves", "quadriceps", "quads", "hamstring", "hamstrings", "ankle", "ankles", "knee", "knees", "standing", "balance"],
    "hip": ["hip", "hips", "pelvis", "groin", "adductor", "abductor", "glutes", "buttocks", "butterfly", "baddha"],
    "hips": ["hip", "hips", "pelvis", "groin", "adductor", "abductor", "glutes", "buttocks", "butterfly", "baddha"],
    "calm": ["calm", "relax", "meditate", "meditation", "breathing", "breath", "stress", "nervous system", "mindfulness", "stillness", "quiet", "zen", "peace", "anxiety", "nidra"],
    "relax": ["calm", "relax", "meditate", "meditation", "breathing", "breath", "stress", "nervous system", "mindfulness", "stillness", "quiet", "zen", "peace", "anxiety", "nidra"],
    "breath": ["breath", "breathing", "pranayama", "lungs", "inhale", "exhale", "oxygen", "air", "calm", "regulate"],
    "breathing": ["breath", "breathing", "pranayama", "lungs", "inhale", "exhale", "oxygen", "air", "calm", "regulate"],
    "arm": ["arm", "arms", "shoulder", "shoulders", "tricep", "triceps", "bicep", "biceps", "wrist", "wrists", "hand", "hands", "elbow", "elbows", "upper body", "crow", "bakasana"],
    "arms": ["arm", "arms", "shoulder", "shoulders", "tricep", "triceps", "bicep", "biceps", "wrist", "wrists", "hand", "hands", "elbow", "elbows", "upper body", "crow", "bakasana"],
    "strength": ["strength", "strong", "power", "quadriceps", "core", "arms", "muscle", "stamina", "build", "plank", "warrior", "pushup", "squat"],
    "strong": ["strength", "strong", "power", "quadriceps", "core", "arms", "muscle", "stamina", "build", "plank", "warrior", "pushup", "squat"],
    "stretch": ["stretch", "stretches", "stretching", "flexible", "flexibility", "groin", "hamstring", "calves", "elongation", "open", "release", "warm-up", "butterfly", "dog", "triangle"],
    "stretching": ["stretch", "stretches", "stretching", "flexible", "flexibility", "groin", "hamstring", "calves", "elongation", "open", "release", "warm-up", "butterfly", "dog", "triangle"],
    "stretches": ["stretch", "stretches", "stretching", "flexible", "flexibility", "groin", "hamstring", "calves", "elongation", "open", "release", "warm-up", "butterfly", "dog", "triangle"],
    "cobra": ["cobra", "bhujangasana", "backbend", "spine"],
    "dog": ["dog", "adho", "mukha", "svanasana", "downward"],
    "warrior": ["warrior", "virabhadrasana", "standing", "stamina"],
    "tree": ["tree", "vrikshasana", "balance", "focus"],
    "meditation": ["meditation", "meditate", "calm", "mindfulness", "nidra", "breath", "lotus", "padmasana"],
    "rehab": ["rehab", "rehabilitation", "rehab", "posture", "slides", "scapular", "shoulder", "therapy"]
}

STOPWORDS = {
    "i", "want", "to", "do", "a", "for", "the", "me", "my", "some", "with", "posture",
    "exercise", "pose", "routine", "practise", "practice", "how", "find", "search",
    "give", "show", "tell"
}

def calculate_nlm_score(item: LibraryItemResponse, query_tokens: List[str]) -> float:
    score = 0.0
    
    # Compile a search document for this item
    doc_fields = {
        "name": (item.name or "").lower(),
        "sanskrit_name": (item.sanskrit_name or "").lower(),
        "english_name": (item.english_name or "").lower(),
        "difficulty": (item.difficulty or "").lower(),
        "description": (item.description or "").lower(),
        "target_muscle": (item.target_muscle or "").lower(),
        "category": (item.category or "").lower(),
        "steps": " ".join(item.steps or []).lower(),
        "benefits": " ".join(item.benefits or []).lower(),
        "body_parts": " ".join(item.body_parts or []).lower(),
        "health_conditions": " ".join(item.health_conditions or []).lower(),
        "equipment": (item.equipment or "").lower(),
        "tags": " ".join(item.tags or []).lower()
    }
    
    # Weight multipliers for matches in different fields
    weights = {
        "name": 12.0,
        "sanskrit_name": 10.0,
        "english_name": 10.0,
        "target_muscle": 8.0,
        "body_parts": 8.0,
        "health_conditions": 8.0,
        "category": 6.0,
        "tags": 6.0,
        "benefits": 4.0,
        "description": 3.0,
        "equipment": 3.0,
        "steps": 1.0
    }
    
    for token in query_tokens:
        for field, text in doc_fields.items():
            if not text:
                continue
            if token in text:
                score += weights.get(field, 1.0)
                if re.search(r'\b' + re.escape(token) + r'\b', text):
                    score += weights.get(field, 1.0) * 0.5
            else:
                # Fuzzy token matching at word boundary level within text
                words = re.findall(r'\b\w+\b', text)
                best_ratio = 0.0
                for w in words:
                    if len(w) > 2:
                        ratio = difflib.SequenceMatcher(None, token, w).ratio()
                        if ratio > best_ratio:
                            best_ratio = ratio
                if best_ratio >= 0.75:
                    score += weights.get(field, 1.0) * best_ratio * 0.8
                    
    return score

@router.get("/library", response_model=LibrarySearchResponse)
def get_unified_library(
    q: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # 1. Fetch poses and exercises from DB
    poses = yoga_service.get_all_poses(db)
    exercises = yoga_service.get_all_exercises(db)
    
    # 2. Map both into unified LibraryItemResponse format
    unified_list = []
    
    for p in poses:
        unified_list.append(
            LibraryItemResponse(
                id=p.id,
                name=p.name,
                sanskrit_name=p.sanskrit_name,
                english_name=p.english_name,
                difficulty=p.difficulty,
                duration=p.duration,
                calories_per_minute=p.calories_per_minute,
                description=p.description,
                steps=p.steps,
                benefits=p.benefits,
                target_muscle=p.target_muscle,
                category="Yoga",
                type="yoga",
                body_parts=p.body_parts,
                health_conditions=p.health_conditions,
                equipment=p.equipment,
                tags=p.tags
            )
        )
        
    for e in exercises:
        unified_list.append(
            LibraryItemResponse(
                id=e.id,
                name=e.name,
                sanskrit_name=e.sanskrit_name,
                english_name=None,
                difficulty=e.difficulty,
                duration=e.duration,
                calories_per_minute=e.calories_per_minute,
                description=e.description,
                steps=e.steps,
                benefits=e.benefits,
                target_muscle=e.target_muscle,
                category=e.category,
                type="exercise",
                body_parts=e.body_parts,
                health_conditions=e.health_conditions,
                equipment=e.equipment,
                tags=e.tags
            )
        )

    # 3. Dynamic vocabulary for spell suggestion
    vocab_set = set()
    for item in unified_list:
        for val in [item.name, item.sanskrit_name, item.english_name, item.target_muscle, item.category]:
            if val:
                for w in re.findall(r'\b\w+\b', val.lower()):
                    if len(w) > 2 and w not in STOPWORDS:
                        vocab_set.add(w)
        if item.tags:
            for t in item.tags:
                vocab_set.add(t.lower())
        if item.body_parts:
            for bp in item.body_parts:
                vocab_set.add(bp.lower())
        if item.health_conditions:
            for hc in item.health_conditions:
                for w in re.findall(r'\b\w+\b', hc.lower()):
                    if len(w) > 2 and w not in STOPWORDS:
                        vocab_set.add(w)
    vocabulary = list(vocab_set)

    spelling_suggestion = None

    # 4. Apply Natural Language Matching (NLM) if query is provided
    if q and q.strip():
        # Preprocess and tokenize query
        raw_tokens = re.findall(r'\b\w+\b', q.lower())
        query_tokens = []
        
        for token in raw_tokens:
            if token in STOPWORDS:
                continue
            query_tokens.append(token)
            if token in SYNONYMS:
                query_tokens.extend(SYNONYMS[token])
                
        # Deduplicate expanded tokens
        query_tokens = list(set(query_tokens))
        
        if not query_tokens:
            return LibrarySearchResponse(results=unified_list, suggestion=None)
            
        scored_items = []
        for item in unified_list:
            score = calculate_nlm_score(item, query_tokens)
            if score > 0:
                scored_items.append((score, item))
                
        # Sort by score in descending order
        scored_items.sort(key=lambda x: x[0], reverse=True)
        results = [item for score, item in scored_items]

        # Calculate spelling suggestion if results are empty or low
        if len(results) < 3:
            suggested_words = []
            suggestion_made = False
            for w in raw_tokens:
                if w in STOPWORDS:
                    suggested_words.append(w)
                    continue
                if w not in vocabulary:
                    matches = difflib.get_close_matches(w, vocabulary, n=1, cutoff=0.7)
                    if matches:
                        suggested_words.append(matches[0])
                        suggestion_made = True
                    else:
                        suggested_words.append(w)
                else:
                    suggested_words.append(w)
            if suggestion_made:
                spelling_suggestion = " ".join(suggested_words)

        return LibrarySearchResponse(results=results, suggestion=spelling_suggestion)

    return LibrarySearchResponse(results=unified_list, suggestion=None)

@router.get("/poses", response_model=List[YogaPoseResponse])
def get_poses(db: Session = Depends(get_db)):
    return yoga_service.get_all_poses(db)

@router.get("/poses/{pose_id}", response_model=YogaPoseResponse)
def get_pose(pose_id: str, db: Session = Depends(get_db)):
    pose = yoga_service.get_pose_by_id(db, pose_id)
    if not pose:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Yoga pose with ID '{pose_id}' not found."
        )
    return pose

@router.get("/exercises", response_model=List[ExerciseResponse])
def get_exercises(db: Session = Depends(get_db)):
    return yoga_service.get_all_exercises(db)

@router.get("/exercises/{exercise_id}", response_model=ExerciseResponse)
def get_exercise(exercise_id: str, db: Session = Depends(get_db)):
    ex = yoga_service.get_exercise_by_id(db, exercise_id)
    if not ex:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID '{exercise_id}' not found."
        )
    return ex

@router.get("/library/{item_id}/related", response_model=RelatedItemsResponse)
def get_related_items(
    item_id: str,
    db: Session = Depends(get_db)
):
    # 1. Fetch poses and exercises
    poses = yoga_service.get_all_poses(db)
    exercises = yoga_service.get_all_exercises(db)
    
    # Map to unified list
    unified_list = []
    for p in poses:
        unified_list.append(
            LibraryItemResponse(
                id=p.id,
                name=p.name,
                sanskrit_name=p.sanskrit_name,
                english_name=p.english_name,
                difficulty=p.difficulty,
                duration=p.duration,
                calories_per_minute=p.calories_per_minute,
                description=p.description,
                steps=p.steps,
                benefits=p.benefits,
                target_muscle=p.target_muscle,
                category="Yoga",
                type="yoga",
                body_parts=p.body_parts,
                health_conditions=p.health_conditions,
                equipment=p.equipment,
                tags=p.tags
            )
        )
    for e in exercises:
        unified_list.append(
            LibraryItemResponse(
                id=e.id,
                name=e.name,
                sanskrit_name=e.sanskrit_name,
                english_name=None,
                difficulty=e.difficulty,
                duration=e.duration,
                calories_per_minute=e.calories_per_minute,
                description=e.description,
                steps=e.steps,
                benefits=e.benefits,
                target_muscle=e.target_muscle,
                category=e.category,
                type="exercise",
                body_parts=e.body_parts,
                health_conditions=e.health_conditions,
                equipment=e.equipment,
                tags=e.tags
            )
        )
        
    # Find target item
    target = None
    for item in unified_list:
        if item.id == item_id:
            target = item
            break
            
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Library item with ID '{item_id}' not found."
        )
        
    # Helper to check intersections
    def shares_any(list1, list2):
        if not list1 or not list2:
            return False
        return any(x.lower() in [y.lower() for y in list2] for x in list1)
        
    # Difficulty hierarchies
    diff_order = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}
    target_diff_val = diff_order.get(target.difficulty, 1)
    
    # 1. Related poses
    related_poses = []
    # 2. Similar exercises
    similar_exercises = []
    # 3. Easier alternatives
    easier_alternatives = []
    # 4. Advanced progressions
    advanced_progressions = []
    # 7. Complementary stretches
    complementary_stretches = []
    # 8. Recommended warm-ups
    recommended_warmups = []
    # 9. Recommended cool-downs
    recommended_cooldowns = []
    
    for item in unified_list:
        if item.id == target.id:
            continue
            
        same_muscles = target.target_muscle and item.target_muscle and shares_any(
            re.findall(r'\b\w+\b', target.target_muscle), 
            re.findall(r'\b\w+\b', item.target_muscle)
        )
        same_body_parts = shares_any(target.body_parts, item.body_parts)
        item_diff_val = diff_order.get(item.difficulty, 1)
        
        # Related poses
        if item.type == "yoga" and (same_muscles or same_body_parts):
            related_poses.append(item)
            
        # Similar exercises
        if item.type == "exercise" and (same_muscles or same_body_parts or item.category == target.category):
            similar_exercises.append(item)
            
        # Easier alternatives
        if (same_muscles or same_body_parts) and item_diff_val < target_diff_val:
            easier_alternatives.append(item)
            
        # Advanced progressions
        if (same_muscles or same_body_parts) and item_diff_val > target_diff_val:
            advanced_progressions.append(item)
            
        # Complementary stretches
        is_stretch = (item.category == "Stretching" or 
                      (item.tags and any("stretch" in t.lower() for t in item.tags)))
        if is_stretch and (same_muscles or same_body_parts):
            complementary_stretches.append(item)
            
        # Recommended warm-ups
        is_warmup = (item.category == "Warm-up" or 
                     (item.tags and any("warm-up" in t.lower() for t in item.tags)))
        if is_warmup and (same_body_parts or same_muscles):
            recommended_warmups.append(item)
            
        # Recommended cool-downs
        is_cooldown = (item.category in ["Meditation", "Breathing"] or 
                       (item.tags and any(x in t.lower() for t in item.tags for x in ["cool-down", "calming", "relaxation", "sleep"])))
        if is_cooldown:
            recommended_cooldowns.append(item)

    # 5. Preparatory Poses Lookup
    prep_lookup = {
        "warrior-ii": ["warrior-i", "downward-dog", "tree-pose"],
        "cobra-pose": ["downward-dog", "childs-pose"],
        "crow-pose": ["plank-pose", "downward-dog"],
        "camel-pose": ["cobra-pose", "bridge-pose"],
        "triangle-pose": ["warrior-i", "tree-pose"],
        "pushups": ["plank-pose"],
        "burpees": ["pushups", "squats", "jumping-jacks"]
    }
    prep_ids = prep_lookup.get(target.id, [])
    preparatory_poses = [item for item in unified_list if item.id in prep_ids]
    if not preparatory_poses:
        # fallback to beginner poses of same body parts
        preparatory_poses = [item for item in unified_list if item.id != target.id and item.type == "yoga" and item.difficulty == "Beginner" and shares_any(target.body_parts, item.body_parts)]
        
    # 6. Counter Poses Lookup
    counter_lookup = {
        "cobra-pose": ["childs-pose", "downward-dog"],
        "camel-pose": ["childs-pose", "downward-dog"],
        "bridge-pose": ["childs-pose"],
        "warrior-ii": ["childs-pose", "yoga-nidra"],
        "warrior-i": ["childs-pose", "yoga-nidra"],
        "crow-pose": ["childs-pose", "neck-rolls"],
        "burpees": ["butterfly-stretch", "yoga-nidra"],
        "pushups": ["butterfly-stretch", "neck-rolls"]
    }
    counter_ids = counter_lookup.get(target.id, [])
    counter_poses = [item for item in unified_list if item.id in counter_ids]
    if not counter_poses:
        # fallback to childs-pose or butterfly-stretch
        counter_poses = [item for item in unified_list if item.id in ["childs-pose", "butterfly-stretch"]]

    # 10. Frequently Performed Together
    # Pick a few items of similar target area + a warmup + a cooldown
    frequently_together = []
    # Add a warmup
    wups = [item for item in unified_list if item.id != target.id and (item.category == "Warm-up" or (item.tags and "warm-up" in [t.lower() for t in item.tags]))]
    if wups:
        frequently_together.append(wups[0])
    # Add a similar pose/exercise
    sims = [item for item in unified_list if item.id != target.id and item.id not in [x.id for x in frequently_together] and shares_any(target.body_parts, item.body_parts)]
    if sims:
        frequently_together.extend(sims[:2])
    # Add a cooldown/meditation
    cds = [item for item in unified_list if item.id != target.id and item.id not in [x.id for x in frequently_together] and (item.category in ["Meditation", "Breathing"] or (item.tags and "cool-down" in [t.lower() for t in item.tags]))]
    if cds:
        frequently_together.append(cds[0])

    return RelatedItemsResponse(
        related_poses=related_poses[:4],
        similar_exercises=similar_exercises[:4],
        easier_alternatives=easier_alternatives[:4],
        advanced_progressions=advanced_progressions[:4],
        preparatory_poses=preparatory_poses[:4],
        counter_poses=counter_poses[:4],
        complementary_stretches=complementary_stretches[:4],
        recommended_warmups=recommended_warmups[:4],
        recommended_cooldowns=recommended_cooldowns[:4],
        frequently_together=frequently_together[:4]
    )
