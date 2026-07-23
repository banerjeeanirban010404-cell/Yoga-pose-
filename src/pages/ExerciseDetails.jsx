import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Play, Pause, RotateCcw, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { generalExercises } from '../data/exerciseData';
import { api } from '../services/api';

export default function ExerciseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exercise, setExercise] = useState(null);
  const [related, setRelated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const exerciseData = await api.getExercise(id);
        const relatedData = await api.getRelatedItems(id);
        if (active) {
          setExercise(exerciseData);
          setRelated(relatedData);
        }
      } catch (err) {
        console.warn("Failed to fetch exercise details, trying fallback static data:", err);
        // Fallback to static data if API fails or for offline development
        const staticExercise = generalExercises.find(e => e.id === id);
        if (staticExercise) {
          if (active) {
            setExercise(staticExercise);
          }
        } else {
          if (active) setError(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (exercise) {
      setTimeLeft(exercise.duration);
    }
  }, [exercise]);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      // Play synthesis announcement on completion
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance("Routine completed. Excellent work.");
        window.speechSynthesis.speak(utterance);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  if (loading) {
    return (
      <div className="space-y-6 text-left py-12 max-w-4xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-slate-800 rounded mb-4" />
        <div className="h-10 bg-slate-800 rounded w-1/2 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 h-[250px] bg-slate-800 rounded-xl" />
          <div className="md:col-span-2 h-[250px] bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="space-y-6 text-center py-16 max-w-md mx-auto">
        <Card className="p-12 border-white/5 bg-slate-950/20" hover={false}>
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Routine Not Found</h2>
          <p className="text-slate-400 text-sm font-light mt-1.5">The stretching routine you are trying to view does not exist.</p>
          <Link
            to="/exercise-library"
            className="inline-flex items-center gap-2 mt-6 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Routines
          </Link>
        </Card>
      </div>
    );
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsTimerRunning(prev => !prev);
  };

  const handleReset = () => {
    setIsTimerRunning(false);
    setTimeLeft(exercise.duration);
  };

  const handleComplete = () => {
    setIsTimerRunning(false);
    // Navigate back to home and award 40 XP
    navigate('/dashboard');
  };

  const progressPercent = ((exercise.duration - timeLeft) / exercise.duration) * 100;

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto">
      {/* Back button & Header */}
      <div className="space-y-4">
        <button
          onClick={() => navigate('/exercise-library')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Routines
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-3xl font-black text-white">{exercise.name}</h1>
              <Badge variant="info">{exercise.category}</Badge>
              {exercise.difficulty && (
                <Badge variant={exercise.difficulty}>{exercise.difficulty}</Badge>
              )}
            </div>
            <p className="text-sm text-slate-400 font-light mt-1.5">{exercise.description}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Countdown timer block */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-white/5 bg-slate-950/60 p-6 flex flex-col items-center text-center space-y-6" hover={false}>
            <div>
              <h3 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Routine Hold Timer</h3>
              <div className="text-5xl font-black text-slate-200 font-mono tracking-tight mt-2">
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Circular Timer progress bar */}
            <div className="w-full h-2 bg-slate-900 border border-white/5 rounded-full overflow-hidden relative">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Action buttons */}
            <div className="w-full space-y-2">
              <button
                onClick={handleStartPause}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                  isTimerRunning 
                    ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white glow-accent'
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause Timer
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    Start Timer
                  </>
                )}
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
                <button
                  onClick={handleComplete}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-semibold text-white transition-all shadow-md"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Done
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column: Steps list */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border-white/5 bg-slate-950/40 p-6" hover={false}>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-5 pb-2 border-b border-white/5">Step-by-Step Directions</h3>
            {exercise.steps && (
              <ol className="space-y-5">
                {exercise.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-4 items-start">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-400 border border-indigo-500/20">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-slate-300 font-light leading-relaxed pt-0.5">{step}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

      </div>

      {/* Related Results Section */}
      {related && (
        <div className="space-y-6 border-t border-white/5 pt-8">
          <div>
            <h2 className="text-2xl font-black text-white">Recommended Alternatives & Progressions</h2>
            <p className="text-slate-400 text-sm font-light mt-1">
              Explore similar routines, easier alternatives, or advanced progressions based on this exercise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Similar Exercises */}
            {related.similar_exercises && related.similar_exercises.length > 0 && (
              <Card className="p-4 border-white/5 bg-slate-950/40" hover={false}>
                <h3 className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider mb-3">Similar Exercises</h3>
                <div className="space-y-3">
                  {related.similar_exercises.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => navigate(item.type === 'yoga' ? `/library/${item.id}` : `/exercise/${item.id}`)}
                      className="p-2.5 rounded-xl border border-white/5 bg-slate-900/30 hover:bg-indigo-600/10 hover:border-indigo-500/20 cursor-pointer flex justify-between items-center group transition-colors"
                    >
                      <div className="text-left">
                        <h4 className="font-bold text-xs text-slate-200 group-hover:text-indigo-400 transition-colors">{item.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.category}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Easier Alternatives */}
            {related.easier_alternatives && related.easier_alternatives.length > 0 && (
              <Card className="p-4 border-white/5 bg-slate-950/40" hover={false}>
                <h3 className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider mb-3">Easier Alternatives</h3>
                <div className="space-y-3">
                  {related.easier_alternatives.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => navigate(item.type === 'yoga' ? `/library/${item.id}` : `/exercise/${item.id}`)}
                      className="p-2.5 rounded-xl border border-white/5 bg-slate-900/30 hover:bg-emerald-600/10 hover:border-emerald-500/20 cursor-pointer flex justify-between items-center group transition-colors"
                    >
                      <div className="text-left">
                        <h4 className="font-bold text-xs text-slate-200 group-hover:text-emerald-400 transition-colors">{item.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.difficulty}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Advanced Progressions */}
            {related.advanced_progressions && related.advanced_progressions.length > 0 && (
              <Card className="p-4 border-white/5 bg-slate-950/40" hover={false}>
                <h3 className="text-xs uppercase font-extrabold text-amber-400 tracking-wider mb-3">Advanced Progressions</h3>
                <div className="space-y-3">
                  {related.advanced_progressions.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => navigate(item.type === 'yoga' ? `/library/${item.id}` : `/exercise/${item.id}`)}
                      className="p-2.5 rounded-xl border border-white/5 bg-slate-900/30 hover:bg-amber-600/10 hover:border-amber-500/20 cursor-pointer flex justify-between items-center group transition-colors"
                    >
                      <div className="text-left">
                        <h4 className="font-bold text-xs text-slate-200 group-hover:text-amber-400 transition-colors">{item.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.difficulty}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Frequently Performed Together */}
            {related.frequently_together && related.frequently_together.length > 0 && (
              <Card className="p-4 border-white/5 bg-slate-950/40" hover={false}>
                <h3 className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider mb-3">Frequently Together</h3>
                <div className="space-y-3">
                  {related.frequently_together.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => navigate(item.type === 'yoga' ? `/library/${item.id}` : `/exercise/${item.id}`)}
                      className="p-2.5 rounded-xl border border-white/5 bg-slate-900/30 hover:bg-indigo-600/10 hover:border-indigo-500/20 cursor-pointer flex justify-between items-center group transition-colors"
                    >
                      <div className="text-left">
                        <h4 className="font-bold text-xs text-slate-200 group-hover:text-indigo-400 transition-colors">{item.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.category}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
