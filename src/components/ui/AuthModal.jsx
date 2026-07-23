import React, { useState } from 'react';
import { X, Mail, Lock, User, LogIn, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Log in (username input can accept username or email)
        await api.login(username || email, password);
      } else {
        // Sign up
        if (!username || !email || !password) {
          throw new Error('All fields are required');
        }
        await api.signup(username, email, password);
        // Automatically login after signup
        await api.login(username, password);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl glow-accent">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <span className="text-2xl">🧘</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            {isLogin ? 'Welcome Back to PranaAI' : 'Create Your PranaAI Account'}
          </h2>
          <p className="text-xs text-slate-400 font-light">
            {isLogin 
              ? 'Log in to sync your mindfulness dashboard and practice streak.' 
              : 'Join to track pose accuracy, build flows, and earn achievements.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-center text-xs text-rose-400 font-medium">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="ZenPractitioner"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none transition-colors placeholder:text-slate-600"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              {isLogin ? 'Username or Email' : 'Email Address'}
            </label>
            <div className="relative">
              {isLogin ? (
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              ) : (
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              )}
              <input
                type={isLogin ? "text" : "email"}
                placeholder={isLogin ? "username or email" : "zen@prana.ai"}
                value={isLogin ? username : email}
                onChange={(e) => isLogin ? setUsername(e.target.value) : setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none transition-colors placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none transition-colors placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 px-5 py-3 text-sm font-semibold text-white transition-all glow-accent mt-6"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>{isLogin ? 'Log In' : 'Sign Up'}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-xs text-slate-400 hover:text-indigo-400 transition-colors font-medium"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
          </button>
        </div>
      </div>
    </div>
  );
}
