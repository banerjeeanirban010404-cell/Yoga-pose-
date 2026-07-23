import os
from pathlib import Path

# Define the structure as a list of file paths relative to the root
structure = [
    # Root level files & alembic
    "backend/alembic/.gitkeep",  # .gitkeep keeps the empty folder tracked in git
    "backend/.env",
    "backend/.env.example",
    "backend/.gitignore",
    "backend/README.md",
    "backend/requirements.txt",
    
    # App root
    "backend/app/__init__.py",
    "backend/app/main.py",
    
    # API Routes
    "backend/app/api/__init__.py",
    "backend/app/api/v1/__init__.py",
    "backend/app/api/v1/router.py",
    "backend/app/api/v1/routes/__init__.py",
    "backend/app/api/v1/routes/auth.py",
    "backend/app/api/v1/routes/dashboard.py",
    "backend/app/api/v1/routes/exercise.py",
    "backend/app/api/v1/routes/session.py",
    "backend/app/api/v1/routes/trainer.py",
    "backend/app/api/v1/routes/yoga.py",
    
    # AI Engine
    "backend/app/ai_engine/__init__.py",
    "backend/app/ai_engine/angle_calculator/__init__.py",
    "backend/app/ai_engine/angle_calculator/calculator.py",
    "backend/app/ai_engine/feedback_engine/__init__.py",
    "backend/app/ai_engine/feedback_engine/engine.py",
    "backend/app/ai_engine/tracker/__init__.py",
    "backend/app/ai_engine/tracker/pose_tracker.py",
    
    # Core Configs
    "backend/app/core/__init__.py",
    "backend/app/core/config.py",
    "backend/app/core/database.py",
    "backend/app/core/dependencies.py",
    "backend/app/core/logging.py",
    "backend/app/core/security.py",
    
    # Models
    "backend/app/models/__init__.py",
    "backend/app/models/exercise.py",
    "backend/app/models/feedback.py",
    "backend/app/models/progress.py",
    "backend/app/models/session.py",
    "backend/app/models/user.py",
    "backend/app/models/yoga.py",
    
    # Repositories
    "backend/app/repositories/__init__.py",
    "backend/app/repositories/exercise_repository.py",
    "backend/app/repositories/session_repository.py",
    "backend/app/repositories/user_repository.py",
    "backend/app/repositories/yoga_repository.py",
    
    # Schemas
    "backend/app/schemas/__init__.py",
    "backend/app/schemas/dashboard.py",
    "backend/app/schemas/exercise.py",
    "backend/app/schemas/progress.py",
    "backend/app/schemas/report.py",
    "backend/app/schemas/session.py",
    "backend/app/schemas/token.py",
    "backend/app/schemas/user.py",
    
    # Services
    "backend/app/services/__init__.py",
    "backend/app/services/auth_service.py",
    "backend/app/services/dashboard_service.py",
    "backend/app/services/session_service.py",
    "backend/app/services/yoga_service.py",
    
    # Tests
    "backend/tests/__init__.py",
    "backend/tests/conftest.py",
    "backend/tests/test_auth.py",
]

def create_boilerplate():
    print("🚀 Starting project scaffolding...")
    
    for path_str in structure:
        file_path = Path(path_str)
        
        # Create parent directories safely if they don't exist
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Create the file safely (touches it if it doesn't exist, skips if it does)
        if not file_path.exists():
            file_path.touch()
            print(file_path)
            
    print("\n✅ Project structure successfully created!")

if __name__ == "__main__":
    create_boilerplate()