import pytest
from app.schemas.session import SessionCreate
from app.repositories.session_repository import session_repository
from app.models.session import Session as DbSession

def test_session_create_with_physiological_metrics(db):
    # 1. Prepare SessionCreate data with heart rate and HRV
    session_data = SessionCreate(
        pose_id="tree-pose",
        pose_name="Tree Pose",
        accuracy=94.5,
        duration=60,
        calories=8.5,
        xp_earned=120,
        is_flow=False,
        heart_rate=78.2,
        hrv=54.0
    )
    
    # 2. Persist to DB using repository
    db_session = session_repository.create_session(db, session_data, user_id=1)
    
    assert db_session.id is not None
    assert db_session.heart_rate == 78.2
    assert db_session.hrv == 54.0
    
    # 3. Retrieve session from DB and verify persistence
    fetched = db.query(DbSession).filter(DbSession.id == db_session.id).first()
    assert fetched is not None
    assert fetched.heart_rate == 78.2
    assert fetched.hrv == 54.0
    assert fetched.pose_name == "Tree Pose"
