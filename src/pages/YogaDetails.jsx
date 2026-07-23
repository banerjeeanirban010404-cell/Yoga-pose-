import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Flame, Play, Star, BookOpen, AlertCircle, CheckCircle, Info, ChevronRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { yogaPoses } from '../data/yogaData';
import YogaDigitalTwin from '../components/ui/YogaDigitalTwin';
import { api } from '../services/api';

export default function YogaDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('steps'); // steps | benefits | cautions
  
  const [pose, setPose] = useState(null);
  const [related, setRelated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Map backend raw database items to frontend structure
  const mapPoseData = (rawPose) => {
    const targetMuscles = rawPose.target_muscle 
      ? rawPose.target_muscle.split(/[&,]+/).map(m => m.trim())
      : ['Full Body'];
      
    const targetAngles = {};
    const jointAngles = rawPose.joint_angles || {};
    Object.entries(jointAngles).forEach(([joint, data]) => {
      targetAngles[joint] = typeof data === 'object' && data !== null ? (data.target || 90) : (data || 90);
    });

    return {
      id: rawPose.id,
      name: rawPose.name,
      sanskritName: rawPose.sanskrit_name,
      difficulty: rawPose.difficulty,
      category: rawPose.category || 'Yoga',
      duration: rawPose.duration,
      calories: rawPose.calories_per_minute 
        ? Math.round(rawPose.calories_per_minute * (rawPose.duration / 60))
        : Math.round(5 * (rawPose.duration / 60)),
      rating: 4.9, // Default rating
      targetMuscles,
      targetAngles,
      benefits: rawPose.benefits || [],
      cautions: rawPose.common_mistakes || ['Avoid if experiencing joint injury.'],
      steps: rawPose.steps || [],
      tips: rawPose.instructions ? rawPose.instructions[0] : (rawPose.description || '')
    };
  };

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const poseData = await api.getPose(id);
        const relatedData = await api.getRelatedItems(id);
        if (active) {
          setPose(mapPoseData(poseData));
          setRelated(relatedData);
        }
      } catch (err) {
        console.warn("Failed to fetch pose details, trying fallback static data:", err);
        // Fallback to static data if API fails or for offline development
        const staticPose = yogaPoses.find(p => p.id === id);
        if (staticPose) {
          const mapped = {
            id: staticPose.id,
            name: staticPose.name,
            sanskritName: staticPose.sanskritName,
            difficulty: staticPose.difficulty,
            category: staticPose.category,
            duration: staticPose.duration,
            calories: staticPose.calories,
            rating: staticPose.rating,
            benefits: staticPose.benefits,
            steps: staticPose.steps,
            targetMuscles: staticPose.targetMuscles,
            targetAngles: staticPose.targetAngles,
            cautions: staticPose.cautions || [],
            tips: staticPose.tips || ''
          };
          if (active) {
            setPose(mapped);
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

  if (loading) {
    return (
      <div className="space-y-6 text-left py-12 max-w-4xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-slate-800 rounded mb-4" />
        <div className="h-10 bg-slate-800 rounded w-1/2 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 h-[400px] bg-slate-800 rounded-xl" />
          <div className="md:col-span-2 h-[400px] bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !pose) {
    return (
      <div className="space-y-6 text-center py-16 max-w-md mx-auto">
        <Card className="p-12 border-white/5 bg-slate-950/20" hover={false}>
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Pose Not Found</h2>
          <p className="text-slate-400 text-sm font-light mt-1.5">The yoga pose you are trying to view does not exist or has been moved.</p>
          <Link
            to="/library"
            className="inline-flex items-center gap-2 mt-6 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Library
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto">
      {/* Back button and Header */}
      <div className="space-y-4">
        <button
          onClick={() => navigate('/library')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Directory
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-3xl font-black text-white">{pose.name}</h1>
              <Badge variant={pose.difficulty}>{pose.difficulty}</Badge>
              <Badge variant="info">{pose.category}</Badge>
            </div>
            {pose.sanskritName && (
              <p className="text-sm italic text-slate-500 font-light mt-1">{pose.sanskritName}</p>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm font-semibold text-slate-400 bg-slate-900/60 border border-white/5 rounded-xl px-4 py-2">
            <div className="flex items-center gap-1.5 text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              <span>{pose.rating}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{pose.duration}s</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-rose-500" />
              <span>{pose.calories} kcal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Stats and Target Calibration */}
        <div className="lg:col-span-4 space-y-6">
          {/* 3D Target Pose Avatar Card */}
          <Card className="border-white/5 bg-slate-950/80 p-0 overflow-hidden relative" hover={false}>
            <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-[#05070f]/80 border border-white/10 px-3 py-1 text-[10px] font-bold text-indigo-400">
                3D VIEW
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-[#05070f]/80 border border-white/10 px-3 py-1 text-[10px] font-bold text-slate-400">
                Interact & Rotate
              </span>
            </div>
            
            <div className="relative w-full h-[220px] bg-[#070b13] flex items-center justify-center overflow-hidden">
              <YogaDigitalTwin poseId={pose.id} showUserTwin={false} />
            </div>
            
            <div className="bg-[#090d16] border-t border-white/5 px-4 py-2 text-center">
              <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                Click & drag to rotate perfect alignment mannequin
              </p>
            </div>
          </Card>

          {/* Target muscles Card */}
          <Card className="border-white/5 bg-slate-950/60" hover={false}>
            <h3 className="text-sm font-bold text-slate-200 mb-3 uppercase tracking-wider">Target Muscles</h3>
            <div className="grid grid-cols-2 gap-2">
              {pose.targetMuscles.map(m => (
                <div key={m} className="flex items-center gap-2 text-xs text-slate-300 font-light">
                  <CheckCircle className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Joint Target Angles Card */}
          {pose.targetAngles && Object.keys(pose.targetAngles).length > 0 && (
            <Card className="border-white/5 bg-slate-950/60" hover={false}>
              <div className="flex items-center gap-1.5 mb-3">
                <Info className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">AI Calibration Targets</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(pose.targetAngles).map(([joint, angle]) => (
                  <div key={joint} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                      <span className="capitalize">{joint.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-indigo-300">{angle}° Target</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 border border-white/5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full rounded-full" 
                        style={{ width: `${Math.min((angle / 180) * 100, 100)}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Tips card */}
          {pose.tips && (
            <Card className="border-amber-500/10 bg-amber-500/5" hover={false}>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5">Coach's Pro Tip</h4>
              <p className="text-xs text-amber-300/80 font-light leading-relaxed">{pose.tips}</p>
            </Card>
          )}
        </div>

        {/* Right Side: Tab container and CTA */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tabs header card */}
          <Card className="border-white/5 p-4 bg-slate-950/40" hover={false}>
            <div className="flex border-b border-white/5 pb-2">
              <button
                onClick={() => setActiveTab('steps')}
                className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'steps' 
                    ? 'border-indigo-500 text-indigo-300' 
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Instructions
              </button>
              <button
                onClick={() => setActiveTab('benefits')}
                className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'benefits' 
                    ? 'border-indigo-500 text-indigo-300' 
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Health Benefits
              </button>
              <button
                onClick={() => setActiveTab('cautions')}
                className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'cautions' 
                    ? 'border-indigo-500 text-indigo-300' 
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Cautions
              </button>
            </div>

            {/* Tab content area */}
            <div className="mt-6 min-h-[220px]">
              
              {/* Instructions Steps */}
              {activeTab === 'steps' && pose.steps && (
                <ol className="space-y-4">
                  {pose.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-4 items-start">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-400 border border-indigo-500/20">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-slate-300 font-light leading-relaxed pt-0.5">{step}</p>
                    </li>
                  ))}
                </ol>
              )}

              {/* Benefits */}
              {activeTab === 'benefits' && pose.benefits && (
                <ul className="space-y-3.5">
                  {pose.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex gap-3 items-start">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                      <p className="text-sm text-slate-300 font-light leading-relaxed">{benefit}</p>
                    </li>
                  ))}
                </ul>
              )}

              {/* Cautions */}
              {activeTab === 'cautions' && pose.cautions && (
                <ul className="space-y-3.5">
                  {pose.cautions.map((caution, idx) => (
                    <li key={idx} className="flex gap-3 items-start">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                      <p className="text-sm text-slate-300 font-light leading-relaxed">{caution}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          {/* Active Training Trigger CTA */}
          <Card className="bg-gradient-to-r from-indigo-950/40 to-violet-950/20 border-indigo-500/10 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-left">
              <h3 className="text-lg font-bold text-slate-200">Start Posture Assessment</h3>
              <p className="text-xs text-slate-400 font-light mt-1">
                Open the live camera HUD and receive guidance to snap your bones into perfect {pose.name} angles.
              </p>
            </div>
            <button
              onClick={() => navigate(`/trainer/${pose.id}`)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition-all glow-accent shrink-0"
            >
              <Play className="h-4 w-4 fill-current" />
              Practice Pose
            </button>
          </Card>
        </div>
      </div>

      {/* Related Results Section */}
      {related && (
        <div className="space-y-6 border-t border-white/5 pt-8">
          <div>
            <h2 className="text-2xl font-black text-white">Recommended Sequences & Alternatives</h2>
            <p className="text-slate-400 text-sm font-light mt-1">
              Follow these recommended preparatory poses, counter stretches, and variations to deepen your practice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Preparatory Poses */}
            {related.preparatory_poses && related.preparatory_poses.length > 0 && (
              <Card className="p-4 border-white/5 bg-slate-950/40" hover={false}>
                <h3 className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider mb-3">Preparatory Poses</h3>
                <div className="space-y-3">
                  {related.preparatory_poses.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => navigate(`/library/${item.id}`)}
                      className="p-2.5 rounded-xl border border-white/5 bg-slate-900/30 hover:bg-indigo-600/10 hover:border-indigo-500/20 cursor-pointer flex justify-between items-center group transition-colors"
                    >
                      <div className="text-left">
                        <h4 className="font-bold text-xs text-slate-200 group-hover:text-indigo-400 transition-colors">{item.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.sanskrit_name || 'Asana'}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Counter Poses */}
            {related.counter_poses && related.counter_poses.length > 0 && (
              <Card className="p-4 border-white/5 bg-slate-950/40" hover={false}>
                <h3 className="text-xs uppercase font-extrabold text-rose-400 tracking-wider mb-3">Counter Poses</h3>
                <div className="space-y-3">
                  {related.counter_poses.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => navigate(item.type === 'yoga' ? `/library/${item.id}` : `/exercise/${item.id}`)}
                      className="p-2.5 rounded-xl border border-white/5 bg-slate-900/30 hover:bg-rose-600/10 hover:border-rose-500/20 cursor-pointer flex justify-between items-center group transition-colors"
                    >
                      <div className="text-left">
                        <h4 className="font-bold text-xs text-slate-200 group-hover:text-rose-400 transition-colors">{item.name}</h4>
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
          </div>

          {/* Warmups & Cooldowns section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Recommended Warm-ups */}
            {related.recommended_warmups && related.recommended_warmups.length > 0 && (
              <Card className="p-4 border-white/5 bg-slate-950/40" hover={false}>
                <h3 className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider mb-3 flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-orange-500" /> Recommended Warm-ups
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {related.recommended_warmups.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => navigate(item.type === 'yoga' ? `/library/${item.id}` : `/exercise/${item.id}`)}
                      className="p-2.5 rounded-xl border border-white/5 bg-slate-900/30 hover:bg-indigo-600/10 hover:border-indigo-500/20 cursor-pointer flex justify-between items-center group transition-all"
                    >
                      <div className="text-left">
                        <h4 className="font-bold text-xs text-slate-200 group-hover:text-indigo-400 transition-colors">{item.name}</h4>
                        <span className="text-[9px] text-slate-400 bg-slate-800 px-1 rounded">{item.duration}s</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recommended Cool-downs */}
            {related.recommended_cooldowns && related.recommended_cooldowns.length > 0 && (
              <Card className="p-4 border-white/5 bg-slate-950/40" hover={false}>
                <h3 className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider mb-3 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-emerald-500" /> Recommended Cool-downs & Meditations
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {related.recommended_cooldowns.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => navigate(item.type === 'yoga' ? `/library/${item.id}` : `/exercise/${item.id}`)}
                      className="p-2.5 rounded-xl border border-white/5 bg-slate-900/30 hover:bg-emerald-600/10 hover:border-emerald-500/20 cursor-pointer flex justify-between items-center group transition-all"
                    >
                      <div className="text-left">
                        <h4 className="font-bold text-xs text-slate-200 group-hover:text-emerald-400 transition-colors">{item.name}</h4>
                        <span className="text-[9px] text-slate-400 bg-slate-800 px-1 rounded">{item.duration}s</span>
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
