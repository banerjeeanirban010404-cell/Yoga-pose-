from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.dependencies import get_db, get_current_user
from app.schemas.session import SessionCreate, SessionResponse, CustomFlowCreate, CustomFlowResponse
from app.services.session_service import session_service
from app.models.user import User

router = APIRouter()

# Session routes
@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def log_session(
    session_in: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return session_service.log_session(db, session_in, current_user.id)

@router.get("", response_model=List[SessionResponse])
def get_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return session_service.get_user_sessions(db, current_user.id)

# Custom Flow routes
@router.post("/flows", response_model=CustomFlowResponse)
def save_flow(
    flow_in: CustomFlowCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return session_service.save_custom_flow(db, flow_in, current_user.id)

@router.get("/flows", response_model=List[CustomFlowResponse])
def get_flows(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return session_service.get_custom_flows(db, current_user.id)

@router.delete("/flows/{flow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flow(
    flow_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = session_service.delete_custom_flow(db, current_user.id, flow_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Custom flow with ID '{flow_id}' not found."
        )
    return
