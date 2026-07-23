import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Flame, Clock, Award, Activity, RotateCcw, Calendar, ArrowRight, Zap, Shield, Crown, Workflow, Play, PlayCircle, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { 
  dashboardStats as mockStats, 
  weeklyActivity as mockWeekly, 
  accuracyProgress as mockAccuracy, 
  sessionHistory as mockHistory, 
  userMilestones as mockMilestones 
} from '../data/dashboardData';
import { api } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(mockStats);
  const [weeklyData, setWeeklyData] = useState(mockWeekly);
  const [accuracyData, setAccuracyData] = useState(mockAccuracy);
  const [history, setHistory] = useState(mockHistory);
  const [milestones, setMilestones] = useState(mockMilestones);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDbData, setIsDbData] = useState(false);

  const defaultFlows = [
    {
      id: 'default-sunrise',
      name: 'Sunrise Yoga Flow',
      description: 'A gentle morning flow to activate the core and spine.',
      steps: [
        { poseId: 'downward-dog', duration: 25 },
        { poseId: 'cobra-pose', duration: 20 },
        { poseId: 'tree-pose', duration: 30 }
      ]
    },
    {
      id: 'default-strength',
      name: 'Warrior Strength Sequence',
      description: 'An advanced balance and core stability flow.',
      steps: [
        { poseId: 'warrior-ii', duration: 30 },
        { poseId: 'crow-pose', duration: 15 },
        { poseId: 'tree-pose', duration: 30 }
      ]
    }
  ];

  const loadData = async () => {
    const isOnline = await api.checkStatus();
    const isAuth = api.isAuthenticated();

    if (isOnline && isAuth) {
      setLoading(true);
      try {
        // Fetch dashboard data
        const dash = await api.getDashboard();
        setStats(dash.stats);
        setWeeklyData(dash.weeklyActivity);
        setAccuracyData(dash.accuracyProgress);
        setHistory(dash.sessionHistory);
        setMilestones(dash.userMilestones);
        setIsDbData(true);

        // Fetch custom flows from backend
        const customDbFlows = await api.getFlows();
        const formattedDbFlows = customDbFlows.map(f => ({
          id: f.id,
          name: f.name,
          description: f.description,
          steps: f.steps.map(s => ({ poseId: s.poseId, duration: s.duration }))
        }));
        setFlows([...formattedDbFlows, ...defaultFlows]);
      } catch (e) {
        console.warn("Failed to load backend dashboard data, falling back to mock", e);
        fallbackToLocal();
      } finally {
        setLoading(false);
      }
    } else {
      fallbackToLocal();
    }
  };

  const fallbackToLocal = () => {
    setStats(mockStats);
    setWeeklyData(mockWeekly);
    setAccuracyData(mockAccuracy);
    setHistory(mockHistory);
    setMilestones(mockMilestones);
    setIsDbData(false);

    // Fallback to localStorage custom flows
    const saved = localStorage.getItem('yoga_custom_flows');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFlows([...parsed, ...defaultFlows]);
      } catch (e) {
        setFlows(defaultFlows);
      }
    } else {
      setFlows(defaultFlows);
    }
  };

  const handleClearDashboard = async () => {
    if (window.confirm("Are you sure you want to reset all your training statistics? This will permanently wipe your session logs.")) {
      const isOnline = await api.checkStatus();
      const isAuth = api.isAuthenticated();

      if (isOnline && isAuth) {
        try {
          await api.clearDashboard();
          await loadData();
        } catch (e) {
          console.warn("Failed to clear backend dashboard data", e);
        }
      } else {
        // Local mock data clearing
        setStats({
          activeStreak: 0,
          totalHours: 0,
          caloriesBurned: 0,
          averageAccuracy: 0,
          weeklyTarget: 150,
          weeklyCompleted: 0
        });
        setWeeklyData([
          { day: "Mon", minutes: 0 },
          { day: "Tue", minutes: 0 },
          { day: "Wed", minutes: 0 },
          { day: "Thu", minutes: 0 },
          { day: "Fri", minutes: 0 },
          { day: "Sat", minutes: 0 },
          { day: "Sun", minutes: 0 }
        ]);
        setAccuracyData([
          { date: "Practice", accuracy: 0 }
        ]);
        setHistory([]);
        localStorage.removeItem('yoga_custom_flows');
        setFlows(defaultFlows);
        setMilestones(prev => prev.map(m => ({ ...m, unlocked: false })));
      }
    }
  };

  useEffect(() => {
    loadData();

    // Listen to login/logout/practice success changes
    window.addEventListener('auth-login-success', loadData);
    window.addEventListener('practice-session-logged', loadData);

    return () => {
      window.removeEventListener('auth-login-success', loadData);
      window.removeEventListener('practice-session-logged', loadData);
    };
  }, []);

  // Helper to format duration: seconds to mm:ss
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs > 0 ? secs + 's' : ''}`;
  };

  // Helper to render milestone icon
  const getMilestoneIcon = (iconName, unlocked) => {
    const iconClass = `h-6 w-6 ${unlocked ? 'text-indigo-400' : 'text-slate-600'}`;
    switch (iconName) {
      case 'zap': return <Zap className={iconClass} />;
      case 'shield': return <Shield className={iconClass} />;
      case 'crown': return <Crown className={iconClass} />;
      case 'award':
      default:
        return <Award className={iconClass} />;
    }
  };

  // Helper to get peak accuracy per pose
  const getPeakAccuracy = (poseId, defaultVal) => {
    const poseSessions = history.filter(s => s.poseId === poseId);
    if (poseSessions.length === 0) return defaultVal;
    return Math.max(...poseSessions.map(s => s.accuracy));
  };

  // SVG bar chart parameters
  const chartHeight = 120;
  const chartWidth = 320;
  const maxWeeklyMinutes = Math.max(...weeklyData.map(d => d.minutes), 30);

  // SVG line chart parameters
  const lineChartHeight = 120;
  const lineChartWidth = 320;
  const points = accuracyData.map((p, idx) => {
    const x = 30 + idx * 50;
    const y = lineChartHeight - 20 - (p.accuracy / 100) * 80;
    return { x, y, accuracy: p.accuracy, date: p.date };
  });
  
  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="space-y-8 text-left">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-white">Your Practice Dashboard</h1>
            {isDbData && (
              <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md animate-pulse">
                Live Data
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm font-light">Track your consistency, pose alignment accuracy, and milestones.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleClearDashboard}
            className="flex items-center gap-2 rounded-xl bg-slate-900 border border-white/5 hover:bg-rose-950/20 hover:border-rose-500/30 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-rose-400 transition-all shadow-sm"
            title="Clear all statistics and history"
          >
            <Trash2 className="h-4 w-4" />
            Clear Data
          </button>
          <Link 
            to="/trainer" 
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition-all glow-accent"
          >
            <PlayCircle className="h-4 w-4" />
            Quick Practice
          </Link>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 py-4 px-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <Flame className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Streak</p>
            <h3 className="text-2xl font-black text-slate-200">{stats.activeStreak} Days</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 py-4 px-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Practice Time</p>
            <h3 className="text-2xl font-black text-slate-200">{stats.totalHours} hrs</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 py-4 px-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Calories</p>
            <h3 className="text-2xl font-black text-slate-200">{stats.caloriesBurned} kcal</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 py-4 px-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Avg Accuracy</p>
            <h3 className="text-2xl font-black text-slate-200">{stats.averageAccuracy}%</h3>
          </div>
        </Card>
      </div>

      {/* Main Grid: Charts & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Weekly Minutes Bar Chart */}
        <Card className="lg:col-span-6 flex flex-col justify-between" hover={false}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-200">Weekly Activity</h3>
              <p className="text-[11px] text-slate-500 font-light">Minutes practiced per day</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400">{stats.weeklyCompleted} / {stats.weeklyTarget} min</span>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full" 
                  style={{ width: `${Math.min((stats.weeklyCompleted / stats.weeklyTarget) * 100, 100)}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="w-full flex justify-center py-2">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-h-[140px] select-none">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="#ffffff" strokeOpacity="0.03" strokeDasharray="3" />
              <line x1="0" y1="60" x2={chartWidth} y2="60" stroke="#ffffff" strokeOpacity="0.03" strokeDasharray="3" />
              <line x1="0" y1="100" x2={chartWidth} y2="100" stroke="#ffffff" strokeOpacity="0.03" strokeDasharray="3" />

              {/* Bars */}
              {weeklyData.map((d, idx) => {
                const barWidth = 24;
                const gap = 16;
                const x = 15 + idx * (barWidth + gap);
                const barHeight = d.minutes > 0 ? (d.minutes / maxWeeklyMinutes) * 80 : 4;
                const y = chartHeight - 20 - barHeight;
                
                return (
                  <g key={d.day} className="group">
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="6"
                      className={`transition-all duration-300 ${
                        d.minutes > 0 
                          ? 'fill-indigo-500/80 group-hover:fill-indigo-400 shadow-lg' 
                          : 'fill-slate-800/60'
                      }`}
                    />
                    {/* Tooltip value */}
                    {d.minutes > 0 && (
                      <text
                        x={x + barWidth / 2}
                        y={y - 6}
                        textAnchor="middle"
                        className="text-[9px] fill-indigo-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {d.minutes}m
                      </text>
                    )}
                    {/* Day label */}
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight - 4}
                      textAnchor="middle"
                      className="text-[10px] fill-slate-500 font-medium"
                    >
                      {d.day}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </Card>

        {/* Alignment Accuracy Line Chart */}
        <Card className="lg:col-span-6 flex flex-col justify-between" hover={false}>
          <div>
            <h3 className="text-lg font-bold text-slate-200">Alignment Trend</h3>
            <p className="text-[11px] text-slate-500 font-light">Pose accuracy tracker over time</p>
          </div>

          <div className="w-full flex justify-center py-2">
            <svg viewBox={`0 0 ${lineChartWidth} ${lineChartHeight}`} className="w-full max-h-[140px] select-none">
              {/* Grid Lines */}
              <line x1="30" y1="20" x2={lineChartWidth - 10} y2="20" stroke="#ffffff" strokeOpacity="0.03" />
              <line x1="30" y1="60" x2={lineChartWidth - 10} y2="60" stroke="#ffffff" strokeOpacity="0.03" />
              <line x1="30" y1="100" x2={lineChartWidth - 10} y2="100" stroke="#ffffff" strokeOpacity="0.03" />

              {/* Glowing Line */}
              <path
                d={linePath}
                fill="none"
                stroke="url(#gradient-accent)"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="drop-shadow-[0_4px_8px_rgba(99,102,241,0.3)]"
              />

              {/* Gradient definition for line */}
              <defs>
                <linearGradient id="gradient-accent" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Data points */}
              {points.map((p, idx) => (
                <g key={idx} className="group">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    className="fill-indigo-950 stroke-indigo-400 group-hover:r-6 transition-all duration-150 cursor-pointer"
                    strokeWidth="2"
                  />
                  {/* Tooltip value */}
                  <text
                    x={p.x}
                    y={p.y - 8}
                    textAnchor="middle"
                    className="text-[9px] fill-emerald-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {p.accuracy}%
                  </text>
                  {/* Date label */}
                  <text
                    x={p.x}
                    y={lineChartHeight - 4}
                    textAnchor="middle"
                    className="text-[9px] fill-slate-500 font-medium"
                  >
                    {p.date.split(' ').length > 1 ? p.date.split(' ')[1] : p.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </Card>
      </div>

      {/* Asana Progression Roadmap Skill Tree */}
      <Card className="border-white/5 bg-slate-950/60 p-6 text-left" hover={false}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-200">Asana Progression Roadmap</h3>
            <p className="text-xs text-slate-500 font-light mt-0.5">Complete poses with high accuracy to unlock advanced yoga nodes.</p>
          </div>
          <Badge variant="success">Active Multipliers: +1.5x XP</Badge>
        </div>

        <div className="relative w-full flex justify-center py-4 bg-slate-950/40 rounded-2xl border border-white/5 overflow-x-auto">
          <div className="min-w-[640px] h-[280px] relative select-none">
            {/* SVG Connecting Paths */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 640 280">
              {/* Connections from Beginner nodes to Intermediate */}
              <path d="M 120 70 L 320 170" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 4" className="opacity-60" />
              <path d="M 320 70 L 320 170" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 4" className="opacity-60" />
              <path d="M 520 70 L 320 170" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 4" className="opacity-60" />
              
              {/* Connection from Intermediate to Advanced (Locked path) */}
              <path d="M 320 170 L 320 230" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" className="opacity-40" />
            </svg>

            {/* Node Placement */}
            
            {/* TIER 1: BEGINNER */}
            {/* Downward Dog */}
            <div 
              onClick={() => navigate('/library/downward-dog')}
              className="absolute cursor-pointer flex flex-col items-center group transition-all duration-300"
              style={{ left: '60px', top: '20px', width: '120px' }}
            >
              <div className="h-12 w-12 rounded-full border-2 border-emerald-500 bg-slate-900 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform">
                🐕
              </div>
              <span className="text-xs font-bold text-slate-200 mt-2">Downward Dog</span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md mt-1">
                {getPeakAccuracy('downward-dog', 91)}% Peak
              </span>
            </div>

            {/* Tree Pose */}
            <div 
              onClick={() => navigate('/library/tree-pose')}
              className="absolute cursor-pointer flex flex-col items-center group transition-all duration-300"
              style={{ left: '260px', top: '20px', width: '120px' }}
            >
              <div className="h-12 w-12 rounded-full border-2 border-emerald-500 bg-slate-900 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform">
                🌴
              </div>
              <span className="text-xs font-bold text-slate-200 mt-2">Tree Pose</span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md mt-1">
                {getPeakAccuracy('tree-pose', 86)}% Peak
              </span>
            </div>

            {/* Cobra Pose */}
            <div 
              onClick={() => navigate('/library/cobra-pose')}
              className="absolute cursor-pointer flex flex-col items-center group transition-all duration-300"
              style={{ left: '460px', top: '20px', width: '120px' }}
            >
              <div className="h-12 w-12 rounded-full border-2 border-emerald-500 bg-slate-900 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform">
                🐍
              </div>
              <span className="text-xs font-bold text-slate-200 mt-2">Cobra Pose</span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md mt-1">
                {getPeakAccuracy('cobra-pose', 94)}% Peak
              </span>
            </div>

            {/* TIER 2: INTERMEDIATE */}
            {/* Warrior II */}
            <div 
              onClick={() => navigate('/library/warrior-ii')}
              className="absolute cursor-pointer flex flex-col items-center group transition-all duration-300"
              style={{ left: '260px', top: '125px', width: '120px' }}
            >
              <div className="h-14 w-14 rounded-full border-2 border-indigo-500 bg-indigo-950/80 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(99,102,241,0.5)] group-hover:scale-110 transition-transform animate-pulse-slow">
                ⚔️
              </div>
              <span className="text-xs font-black text-slate-100 mt-2">Warrior II</span>
              <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded-md mt-1">
                {getPeakAccuracy('warrior-ii', 88)}% Peak
              </span>
            </div>

            {/* TIER 3: ADVANCED */}
            {/* Crow Pose (Locked node) */}
            <div 
              className="absolute flex flex-col items-center opacity-50"
              style={{ left: '260px', top: '210px', width: '120px' }}
              title="Unlock requirements: Reach >90% average accuracy on Warrior II"
            >
              <div className="h-12 w-12 rounded-full border-2 border-slate-700 bg-slate-900 flex items-center justify-center text-xl text-slate-500 relative">
                🐦
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
                  <span className="text-[10px] font-bold">🔒</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500 mt-2">Crow Pose</span>
              <span className="text-[9px] text-slate-500 font-medium mt-1">Locked (Level 3)</span>
            </div>

          </div>
        </div>
      </Card>

      {/* Vinyasa Flows Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Workflow className="h-5 w-5 text-indigo-400" />
            My Vinyasa Sequences
          </h3>
          <Link 
            to="/flow-builder"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            Create Custom Flow <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows.map((flow) => (
            <Card 
              key={flow.id} 
              className="p-5 bg-slate-900/40 border-white/5 hover:bg-slate-900/60 transition-all flex flex-col justify-between"
              hover={true}
            >
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="font-extrabold text-slate-200 text-sm leading-tight">{flow.name}</h4>
                  <Badge variant={flow.id.toString().startsWith('default-') ? 'secondary' : 'success'}>
                    {flow.id.toString().startsWith('default-') ? 'Preset' : 'Custom'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 font-light mt-1.5 line-clamp-2">{flow.description || 'Custom yoga sequence.'}</p>
                
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {flow.steps.map((step, idx) => (
                    <span 
                      key={idx} 
                      className="text-[9px] bg-slate-800 text-indigo-300 border border-white/5 px-2 py-0.5 rounded-full"
                    >
                      {step.poseId.split('-')[0].toUpperCase()} ({step.duration}s)
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-medium">
                  {flow.steps.length} steps • {flow.steps.reduce((acc, s) => acc + s.duration, 0)}s hold
                </span>
                <button 
                  onClick={() => navigate('/trainer', { state: { flow } })}
                  className="flex items-center gap-1 text-[11px] text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-lg font-bold transition-all shadow-md shadow-indigo-500/10"
                >
                  <Play className="h-3 w-3 fill-white text-white" /> Start Flow
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* History and Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Session Logs */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-400" />
            Recent Session History
          </h3>
          
          <div className="space-y-3">
            {history.map((session) => (
              <Card 
                key={session.id} 
                className="flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/60 border-white/5 transition-all"
                hover={true}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <span className="text-lg">🧘</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">{session.poseName}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-light mt-0.5">
                      <span>{session.date}</span>
                      <span>•</span>
                      <span>{formatDuration(session.duration)}</span>
                      <span>•</span>
                      <span>{session.calories} kcal</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block font-light">Accuracy</span>
                    <Badge variant={session.accuracy >= 90 ? 'success' : 'warning'}>
                      {session.accuracy}%
                    </Badge>
                  </div>
                  <button 
                    onClick={() => navigate(`/trainer/${session.poseId}`)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                    title="Repeat Pose Practice"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Milestone Achievements Panel */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Milestones & Badges
          </h3>

          <Card className="p-5 space-y-4" hover={false}>
            {milestones.map((milestone) => (
              <div 
                key={milestone.id} 
                className={`flex gap-4 p-3 rounded-xl border transition-all ${
                  milestone.unlocked 
                    ? 'bg-indigo-950/20 border-indigo-500/10 opacity-100' 
                    : 'bg-slate-900/10 border-white/5 opacity-50'
                }`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  milestone.unlocked 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'bg-slate-800 text-slate-600'
                }`}>
                  {getMilestoneIcon(milestone.icon, milestone.unlocked)}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-200 text-sm leading-none">{milestone.title}</h4>
                    {milestone.unlocked ? (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">Unlocked</span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-semibold bg-slate-800 px-1.5 py-0.5 rounded-md">Locked</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-light mt-1.5">{milestone.description}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// Custom internal component icon wrapper to prevent missing component compile errors
function PlayCircleIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  );
}
