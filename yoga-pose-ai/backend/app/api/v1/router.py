from fastapi import APIRouter
from app.api.v1.routes import auth, dashboard, exercise, session, trainer

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard Analytics"])
api_router.include_router(exercise.router, tags=["Yoga Poses & Exercises"])
api_router.include_router(session.router, prefix="/sessions", tags=["Sessions & Custom Flows"])
api_router.include_router(trainer.router, prefix="/trainer", tags=["Live AI Trainer"])
