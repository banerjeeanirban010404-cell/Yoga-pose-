import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Zap, BookOpen, Compass, ChevronRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { generalExercises } from '../data/exerciseData';

export default function ExerciseLibrary() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 text-left">
      {/* Back button and Header */}
      <div className="space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>

        <div>
          <h1 className="text-3xl font-black text-white">Stretching & Warm-up Routines</h1>
          <p className="text-slate-400 text-sm font-light">Prepare your body for pose matching with breathing and stretching guides.</p>
        </div>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {generalExercises.map((ex) => (
          <Card
            key={ex.id}
            onClick={() => navigate(`/exercise/${ex.id}`)}
            className="flex flex-col justify-between h-full bg-slate-900/30 hover:bg-slate-900/50 border-white/5"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-slate-200">{ex.name}</h3>
                <Badge variant={ex.difficulty}>{ex.difficulty}</Badge>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-indigo-400 font-semibold">
                <span className="bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{ex.category}</span>
                <span className="flex items-center gap-1 text-slate-400 font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  {Math.floor(ex.duration / 60)} min
                </span>
              </div>

              <p className="text-xs text-slate-400 font-light leading-relaxed pt-1.5">
                {ex.description}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-indigo-400 hover:text-indigo-300 transition-colors">
              <span className="text-xs font-semibold uppercase tracking-wider">Start Routine Guide</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
