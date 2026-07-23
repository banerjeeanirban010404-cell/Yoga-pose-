export const dashboardStats = {
  activeStreak: 5,
  totalHours: 12.4,
  caloriesBurned: 1820,
  averageAccuracy: 88,
  weeklyTarget: 150,
  weeklyCompleted: 110,
};

export const weeklyActivity = [
  { day: "Mon", minutes: 15 },
  { day: "Tue", minutes: 20 },
  { day: "Wed", minutes: 10 },
  { day: "Thu", minutes: 30 },
  { day: "Fri", minutes: 25 },
  { day: "Sat", minutes: 10 },
  { day: "Sun", minutes: 0 },
];

export const accuracyProgress = [
  { date: "June 22", accuracy: 78 },
  { date: "June 23", accuracy: 82 },
  { date: "June 24", accuracy: 80 },
  { date: "June 25", accuracy: 85 },
  { date: "June 26", accuracy: 88 },
  { date: "June 27", accuracy: 91 },
];

export const sessionHistory = [
  {
    id: "session-1",
    poseId: "downward-dog",
    poseName: "Downward Dog",
    date: "Yesterday",
    duration: 300,
    accuracy: 91,
    calories: 50,
  },
  {
    id: "session-2",
    poseId: "tree-pose",
    poseName: "Tree Pose",
    date: "2 days ago",
    duration: 180,
    accuracy: 86,
    calories: 32,
  },
  {
    id: "session-3",
    poseId: "warrior-ii",
    poseName: "Warrior II",
    date: "3 days ago",
    duration: 240,
    accuracy: 88,
    calories: 96,
  },
  {
    id: "session-4",
    poseId: "cobra-pose",
    poseName: "Cobra Pose",
    date: "5 days ago",
    duration: 120,
    accuracy: 94,
    calories: 28,
  }
];

export const userMilestones = [
  {
    id: "m-1",
    title: "Prana Pioneer",
    description: "Completed your first pose alignment check",
    unlocked: true,
    icon: "award"
  },
  {
    id: "m-2",
    title: "Streak Starter",
    description: "Maintained a 5-day practice streak",
    unlocked: true,
    icon: "zap"
  },
  {
    id: "m-3",
    title: "Warrior Ascendant",
    description: "Achieved >90% alignment on Warrior II for 30s",
    unlocked: true,
    icon: "shield"
  },
  {
    id: "m-4",
    title: "Master of Zen",
    description: "Hold any pose with 95% accuracy for over 60 seconds",
    unlocked: false,
    icon: "crown"
  }
];
