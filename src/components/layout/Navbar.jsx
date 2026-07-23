import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, LayoutDashboard, Library, PlayCircle, User, Flame, Workflow, LogOut } from 'lucide-react';
import { api } from '../../services/api';
import AuthModal from '../ui/AuthModal';

export default function Navbar() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: Compass },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/library', label: 'Yoga Library', icon: Library },
    { path: '/flow-builder', label: 'Flow Builder', icon: Workflow },
    { path: '/trainer', label: 'Live Trainer', icon: PlayCircle },
  ];

  const fetchUser = async () => {
    if (api.isAuthenticated()) {
      try {
        const user = await api.getMe();
        setCurrentUser(user);
      } catch (e) {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    // Check if backend is running
    api.checkStatus().then(online => {
      setIsOnline(online);
    });

    fetchUser();

    // Listen to storage changes to keep auth synced
    const handleAuthChange = () => {
      fetchUser();
    };
    window.addEventListener('storage', handleAuthChange);
    // Add custom event listener for manual auth changes
    window.addEventListener('auth-login-success', handleAuthChange);
    window.addEventListener('practice-session-logged', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('auth-login-success', handleAuthChange);
      window.removeEventListener('practice-session-logged', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setShowDropdown(false);
    window.dispatchEvent(new Event('auth-login-success'));
  };

  const handleProfileClick = () => {
    if (currentUser) {
      setShowDropdown(!showDropdown);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    fetchUser();
    // Dispatch event so other components (like Dashboard) know they should refetch
    window.dispatchEvent(new Event('auth-login-success'));
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#05070f]/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/10">
                <span className="font-extrabold text-lg">🧘</span>
              </div>
              <span className="bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text font-black text-xl tracking-tight text-transparent">
                Prana<span className="text-indigo-400 font-bold">AI</span>
              </span>
              
              {/* Online status indicator */}
              <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-white/5'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                {isOnline ? 'API Connected' : 'Offline Mode'}
              </span>
            </div>

            <div className="hidden md:block">
              <div className="flex space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                            : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* XP Indicator */}
              <div className="flex items-center gap-1.5 rounded-full bg-slate-900 border border-white/5 px-3 py-1 text-xs font-semibold text-indigo-300">
                <Flame className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                <span>{currentUser ? `${currentUser.xp} XP` : '320 XP'}</span>
              </div>

              {/* Profile / Login */}
              <div className="relative">
                <div 
                  onClick={handleProfileClick}
                  className={`flex h-9 items-center gap-2 rounded-full px-3 bg-slate-800 border hover:border-indigo-500/45 transition-all cursor-pointer ${
                    currentUser ? 'border-indigo-500/20' : 'border-white/10'
                  }`}
                >
                  <User className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-300">
                    {currentUser ? currentUser.username : 'Sign In'}
                  </span>
                </div>

                {/* Profile Dropdown */}
                {showDropdown && currentUser && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-xl animate-fade-in z-50">
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Logged in as</p>
                      <p className="text-xs font-black text-white truncate">{currentUser.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Mobile Navigation Bar */}
          <div className="flex md:hidden items-center justify-around py-2 border-t border-white/5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-medium transition-all duration-200 ${
                      isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Auth Modal Trigger */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
