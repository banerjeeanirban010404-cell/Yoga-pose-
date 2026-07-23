from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repository import user_repository
from app.schemas.user import UserCreate, UserResponse
from app.core.security import verify_password, create_access_token
from app.schemas.token import Token

class AuthService:
    def register(self, db: Session, user_in: UserCreate) -> UserResponse:
        # Check if user already exists
        user_by_email = user_repository.get_by_email(db, user_in.email)
        if user_by_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists."
            )
            
        user_by_username = user_repository.get_by_username(db, user_in.username)
        if user_by_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this username already exists."
            )
            
        db_user = user_repository.create(db, user_in)
        return UserResponse.model_validate(db_user)

    def login(self, db: Session, username_or_email: str, password: str) -> Token:
        # Check by email first
        user = user_repository.get_by_email(db, username_or_email)
        if not user:
            # Check by username
            user = user_repository.get_by_username(db, username_or_email)
            
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email/username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        access_token = create_access_token(subject=user.id)
        return Token(access_token=access_token, token_type="bearer")

auth_service = AuthService()
