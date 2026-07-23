import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Award, Clock, Flame, RotateCcw, LayoutDashboard, Share2, Sparkles, CheckCircle2, ChevronRight, Heart, Activity } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

export default function SessionSummary() {
  const location = useLocation();
  const navigate = useNavigate();

  // Load state parameters or use default mockup if visited directly
  const sessionData = location.state || {
    poseId: "warrior-ii",
    poseName: "Warrior II",
    accuracy: 88,
    duration: 180,
    calories: 45,
    xpEarned: 135
  };

  const { poseId, poseName, accuracy, duration, calories, xpEarned, isFlow, heartRate, hrv } = sessionData;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs > 0 ? secs + 's' : 's'}`;
  };

  const handleRepeat = () => {
    if (isFlow) {
      navigate('/trainer', { 
        state: { 
          flow: {
            id: poseId,
            name: poseName,
            steps: sessionData.steps
          } 
        } 
      });
    } else {
      navigate(`/trainer/${poseId}`);
    }
  };

  // Determine feedback tier
  const getFeedbackTier = (acc) => {
    if (acc >= 92) return {
      title: "Zen Master Alignment",
      subtitle: "Incredible structural balance! Your posture was exceptionally clean and steady.",
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
      badge: "success"
    };
    if (acc >= 85) return {
      title: "Flow Practitioner",
      subtitle: "Great concentration! Just minor adjustments needed to reach peak angles.",
      color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
      badge: "info"
    };
    return {
      title: "Mindful Apprentice",
      subtitle: "Good effort. Practice makes progress—try holding stance focus.",
      color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
      badge: "warning"
    };
  };

  const tier = getFeedbackTier(accuracy);

  return (
    <div className="max-w-2xl mx-auto space-y-8 text-center pt-4">
      
      {/* Celebration Header */}
      <div className="space-y-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto glow-success animate-bounce">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {isFlow ? 'Vinyasa Flow Completed!' : 'Session Completed!'}
        </h1>
        <p className="text-slate-400 text-sm font-light">
          {isFlow 
            ? `Congratulations! You successfully finished the "${poseName}" sequence.` 
            : `Congratulations, you logged a new posture assessment session for ${poseName}.`}
        </p>
      </div>

      {/* Main XP Badge display */}
      <Card className="bg-gradient-to-tr from-indigo-950/40 via-slate-900/60 to-violet-950/40 border-indigo-500/10 p-8 relative overflow-hidden" hover={false}>
        {/* Glow halo */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
        
        <div className="relative z-10 space-y-4">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">EXPERIENCE POINTS EARNED</p>
          <h2 className="text-6xl font-black bg-gradient-to-r from-indigo-400 via-violet-300 to-emerald-400 bg-clip-text text-transparent tracking-tight leading-none animate-pulse-slow">
            +{xpEarned} <span className="text-3xl font-extrabold">XP</span>
          </h2>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Bonus Multipliers Active</span>
          </div>
        </div>
      </Card>

      {/* Stats Summary Matrix */}
      <div className={`grid gap-4 ${heartRate || hrv ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-3'}`}>
        <Card className="py-4 px-3 text-center border-white/5 bg-slate-950/40" hover={false}>
          <Award className="h-5 w-5 text-indigo-400 mx-auto mb-1.5" />
          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">ACCURACY</span>
          <span className="text-base font-black text-slate-200">{accuracy}%</span>
        </Card>
        
        <Card className="py-4 px-3 text-center border-white/5 bg-slate-950/40" hover={false}>
          <Clock className="h-5 w-5 text-emerald-400 mx-auto mb-1.5" />
          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">DURATION</span>
          <span className="text-base font-black text-slate-200">{formatDuration(duration)}</span>
        </Card>
        
        <Card className="py-4 px-3 text-center border-white/5 bg-slate-950/40" hover={false}>
          <Flame className="h-5 w-5 text-rose-500 mx-auto mb-1.5" />
          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">CALORIES</span>
          <span className="text-base font-black text-slate-200">{calories} kcal</span>
        </Card>

        {(heartRate || hrv) && (
          <>
            <Card className="py-4 px-3 text-center border-white/5 bg-slate-950/40" hover={false}>
              <Heart className="h-5 w-5 text-indigo-400 mx-auto mb-1.5 fill-indigo-400/20" />
              <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">AVG HEART RATE</span>
              <span className="text-base font-black text-slate-200">{heartRate ? `${heartRate} BPM` : '--'}</span>
            </Card>
            <Card className="py-4 px-3 text-center border-white/5 bg-slate-950/40" hover={false}>
              <Activity className="h-5 w-5 text-violet-400 mx-auto mb-1.5" />
              <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">AVG HRV</span>
              <span className="text-base font-black text-slate-200">{hrv ? `${hrv} ms` : '--'}</span>
            </Card>
          </>
        )}
      </div>

      {/* Coaching feedback tier card */}
      <div className={`p-5 rounded-2xl border text-left space-y-2 ${tier.color}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm uppercase tracking-wide">Coach Feedback</h3>
          <Badge variant={tier.badge}>{tier.title}</Badge>
        </div>
        <p className="text-xs font-light leading-relaxed text-slate-300">
          {tier.subtitle} Your consistency is helping build muscle memory. Keep up the breathing cadence.
        </p>
      </div>

      {/* Actions buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3.5 text-sm font-semibold text-white transition-all glow-accent"
        >
          <LayoutDashboard className="h-4 w-4" />
          Go to Dashboard
        </button>
        <button
          onClick={handleRepeat}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-slate-900 hover:bg-slate-800 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:text-white transition-all"
        >
          <RotateCcw className="h-4 w-4" />
          {isFlow ? 'Repeat Vinyasa Flow' : 'Repeat Pose Session'}
        </button>
      </div>

      <div className="pt-2">
        <Link
          to="/library"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1"
        >
          Explore other poses in the library
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
