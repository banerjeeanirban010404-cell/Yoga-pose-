import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, BookOpen, ShieldCheck, Activity, Volume2, Sparkles, Flame, CheckCircle, ArrowRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import YogaDigitalTwin from '../components/ui/YogaDigitalTwin';

export default function Home() {
  const [demoAccuracy, setDemoAccuracy] = useState(64);
  const [poseAligned, setPoseAligned] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [activePoseId, setActivePoseId] = useState('warrior-ii');
  
  const posesList = ['tree-pose', 'warrior-ii', 'downward-dog', 'cobra-pose', 'crow-pose'];
  const poseNames = {
    'tree-pose': 'Tree Pose',
    'warrior-ii': 'Warrior II',
    'downward-dog': 'Downward Dog',
    'cobra-pose': 'Cobra Pose',
    'crow-pose': 'Crow Pose'
  };

  const mindfulnessQuotes = [
    "Yoga is the journey of the self, through the self, to the self. — Bhagavad Gita",
    "Inhale the future, exhale the past. — Unknown",
    "The body benefits from movement, and the mind benefits from stillness. — Sakyong Mipham",
    "Yoga is not about touching your toes, it's about what you learn on the way down. — Jigar Gor",
    "Quiet the mind, and the soul will speak. — Ma Jaya Sati Bhagavati"
  ];

  // Interactive alignment demo loop
  useEffect(() => {
    const interval = setInterval(() => {
      setDemoAccuracy((prev) => {
        if (prev >= 96) {
          setPoseAligned(true);
          return 64; // Reset after peak
        }
        if (prev === 64) {
          setPoseAligned(false);
        }
        return prev + 2;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  // Cycle quote every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % mindfulnessQuotes.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Cycle 3D poses every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePoseId((prev) => {
        const nextIdx = (posesList.indexOf(prev) + 1) % posesList.length;
        return posesList[nextIdx];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Banner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered Real-Time Posture Analytics</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
            Perfect Your Alignment <br />
            With <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">Interactive AI Coaching</span>
          </h1>
          
          <p className="text-slate-400 text-lg sm:text-xl font-light max-w-xl">
            PranaAI analyses your yoga poses using your camera, offering instant biomechanical adjustments to prevent injuries and elevate your practice.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to="/trainer"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all glow-accent"
            >
              <Play className="h-4 w-4 fill-current" />
              Start Live Session
            </Link>
            <Link
              to="/library"
              className="flex items-center gap-2 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:text-white transition-all"
            >
              <BookOpen className="h-4 w-4" />
              Explore Pose Library
            </Link>
          </div>
        </div>

        {/* Live HUD Animation Demo Card */}
        <div className="lg:col-span-5 flex justify-center">
          <Card className="w-full max-w-[420px] bg-slate-950/80 border-indigo-500/10 relative overflow-hidden" hover={false}>
            {/* Header overlay */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">3D DIGITAL TWIN DEMO</span>
              </div>
              <Badge variant={demoAccuracy > 85 ? 'success' : demoAccuracy > 75 ? 'warning' : 'error'}>
                {demoAccuracy}% Match
              </Badge>
            </div>

            {/* 3D Mannequin Viewport */}
            <div className="relative aspect-video w-full rounded-xl bg-[#070b13] border border-white/5 flex items-center justify-center overflow-hidden">
              <YogaDigitalTwin 
                poseId={activePoseId} 
                jointOffsets={{
                  rightKnee: Math.max(0, 96 - demoAccuracy),
                  rightElbow: Math.max(0, 96 - demoAccuracy) * 1.2,
                  torsoAngle: Math.max(0, 96 - demoAccuracy) * 0.15
                }} 
                showUserTwin={true} 
              />
              
              {/* Feedback text indicator overlay */}
              <div className="absolute bottom-2 left-2 bg-[#090d16]/90 border border-white/5 rounded-lg px-2.5 py-1 text-[10px] z-20">
                {demoAccuracy > 85 ? (
                  <span className="text-emerald-400 font-medium">✓ {poseNames[activePoseId]} aligned</span>
                ) : (
                  <span className="text-amber-400 font-medium">⚠ Adjusting posture nodes...</span>
                )}
              </div>
            </div>

            {/* Bottom HUD readout */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-white/5 text-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Active Pose</p>
                <p className="text-sm font-semibold text-slate-200">{poseNames[activePoseId]}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Status</p>
                <p className={`text-sm font-bold ${demoAccuracy > 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {demoAccuracy > 85 ? 'Perfect Match' : 'Self-Aligning...'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quote Banner */}
      <div className="w-full text-center py-6 px-4 bg-slate-900/30 border-y border-white/5 backdrop-blur-sm">
        <p className="text-slate-400 italic text-sm font-light transition-all duration-500 select-none">
          "{mindfulnessQuotes[quoteIndex]}"
        </p>
      </div>

      {/* Feature highlight grid */}
      <div className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center">
          Designed for Mindful Practice
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex flex-col items-center text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 glow-accent">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Injury Prevention</h3>
            <p className="text-slate-400 text-sm font-light">
              Biomechanical tracking checks angles (such as knee and shoulder extensions) to protect joints from strain.
            </p>
          </Card>

          <Card className="flex flex-col items-center text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Progressive Analytics</h3>
            <p className="text-slate-400 text-sm font-light">
              Logs your alignment scores, stretch time, and practice streaks to show long-term improvements.
            </p>
          </Card>

          <Card className="flex flex-col items-center text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Volume2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Audio Coaching</h3>
            <p className="text-slate-400 text-sm font-light">
              Audio prompts help you adjust your posture without needing to turn your head and look at the screen.
            </p>
          </Card>
        </div>
      </div>

      {/* Call to action panel */}
      <Card className="bg-gradient-to-r from-indigo-950/60 to-violet-950/40 border-indigo-500/20 py-8 px-6 sm:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-left space-y-2">
          <h3 className="text-2xl font-bold text-slate-100">Ready to align your practice?</h3>
          <p className="text-slate-400 text-sm font-light max-w-lg">
            Jump into our Live Trainer session, calibrate your camera, and receive guidance through poses.
          </p>
        </div>
        <Link
          to="/trainer"
          className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100 transition-all shadow-lg shadow-white/5 whitespace-nowrap self-start md:self-center"
        >
          Get Started Now
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
    </div>
  );
}
