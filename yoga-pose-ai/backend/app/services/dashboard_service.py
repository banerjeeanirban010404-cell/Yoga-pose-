from typing import List
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.repositories.session_repository import session_repository
from app.repositories.user_repository import user_repository
from app.schemas.dashboard import DashboardResponse, DashboardStats, WeeklyActivity, AccuracyProgress, SessionHistoryItem, UserMilestone
from app.models.user import User

class DashboardService:
    def get_dashboard_data(self, db: Session, user: User) -> DashboardResponse:
        sessions = session_repository.get_sessions_by_user(db, user.id)
        
        # Calculate Average Accuracy
        avg_acc = 0  # default baseline
        if sessions:
            avg_acc = int(sum(s.accuracy for s in sessions) / len(sessions))

        # Calculate Weekly Minutes
        now_local = datetime.now()
        # Find start of current week (Monday)
        start_of_week = now_local - timedelta(days=now_local.weekday())
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Weekdays maps
        days_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        weekly_mins = {day: 0 for day in days_names}
        
        for s in sessions:
            # Check if session was logged this week
            # s.date might be offset-aware or native. Let's make it native for comparison
            s_date = s.date.replace(tzinfo=None)
            if s_date >= start_of_week:
                day_name = days_names[s_date.weekday()]
                weekly_mins[day_name] += round(s.duration / 60)

        weekly_activity_list = [
            WeeklyActivity(day=d, minutes=m) for d, m in weekly_mins.items()
        ]

        # Calculate weekly completed
        weekly_completed = sum(weekly_mins.values())

        # Build Stats
        stats = DashboardStats(
            activeStreak=user.streak_count,
            totalHours=user.total_hours,
            caloriesBurned=user.calories_burned,
            averageAccuracy=avg_acc,
            weeklyTarget=150,
            weeklyCompleted=weekly_completed
        )

        # Build Accuracy Progress (last 6 sessions)
        progress_sessions = list(reversed(sessions[:6]))
        accuracy_progress = []
        if progress_sessions:
            for s in progress_sessions:
                # Format date like "June 25"
                date_str = s.date.strftime("%b %d")
                accuracy_progress.append(
                    AccuracyProgress(date=date_str, accuracy=int(s.accuracy))
                )
        else:
            # Fallback placeholder if no sessions logged yet
            accuracy_progress = [
                AccuracyProgress(date="Practice", accuracy=0)
            ]

        # Session History list (last 10 sessions)
        session_history = []
        for s in sessions[:10]:
            # Format date like "Yesterday", "2 days ago", or "June 22"
            delta = datetime.now(timezone.utc) - s.date.replace(tzinfo=timezone.utc)
            if delta.days == 0:
                date_label = "Today"
            elif delta.days == 1:
                date_label = "Yesterday"
            elif delta.days < 7:
                date_label = f"{delta.days} days ago"
            else:
                date_label = s.date.strftime("%b %d")

            session_history.append(
                SessionHistoryItem(
                    id=f"session-{s.id}",
                    poseId=s.pose_id,
                    poseName=s.pose_name,
                    date=date_label,
                    duration=s.duration,
                    accuracy=int(s.accuracy),
                    calories=int(s.calories)
                )
            )

        # Calculate milestones dynamically
        milestones = [
            UserMilestone(
                id="m-1",
                title="Prana Pioneer",
                description="Completed your first pose alignment check",
                unlocked=len(sessions) > 0,
                icon="award"
            ),
            UserMilestone(
                id="m-2",
                title="Streak Starter",
                description="Maintained a 5-day practice streak",
                unlocked=user.streak_count >= 5,
                icon="zap"
            ),
            UserMilestone(
                id="m-3",
                title="Warrior Ascendant",
                description="Achieved >90% alignment on Warrior II for 30s",
                unlocked=any(s.pose_id == "warrior-ii" and s.accuracy >= 90 for s in sessions),
                icon="shield"
            ),
            UserMilestone(
                id="m-4",
                title="Master of Zen",
                description="Hold any pose with 95% accuracy for over 60 seconds",
                unlocked=any(s.accuracy >= 95 and s.duration >= 60 for s in sessions),
                icon="crown"
            )
        ]

        return DashboardResponse(
            stats=stats,
            weeklyActivity=weekly_activity_list,
            accuracyProgress=accuracy_progress,
            sessionHistory=session_history,
            userMilestones=milestones
        )

dashboard_service = DashboardService()
