import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Mic, X, Star, Clock, Flame, 
  CornerDownLeft, Sparkles, History, ChevronRight, 
  AlertCircle, Sparkle 
} from 'lucide-react';
import { api } from '../../services/api';
import Card from './Card';
import Badge from './Badge';

export default function SearchOverlay({ onClose }) {
  const navigate = useNavigate();
  const overlayRef = useRef(null);
  const inputRef = useRef(null);

  // Search states
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Suggestions states
  const [recentSearches, setRecentSearches] = useState([]);
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState([]);
  const [popularPoses, setPopularPoses] = useState([]);
  const [popularExercises, setPopularExercises] = useState([]);

  // Keyboard navigation states
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Voice Search Recognition reference
  const recognitionRef = useRef(null);

  // Static recommendations & trending data
  const trendingQueries = [
    'Lower Back Pain', 
    'Core Strength', 
    'Hip Openers', 
    'Spine Mobility', 
    'Morning Warm-up'
  ];

  // Load initial suggestions and recent searches
  useEffect(() => {
    // 1. Load recent searches from localStorage
    const cached = localStorage.getItem('yoga_recent_searches');
    if (cached) {
      setRecentSearches(JSON.parse(cached));
    }

    // 2. Fetch library items for popular poses and exercises
    const fetchPopular = async () => {
      try {
        const response = await api.getLibrary();
        const allItems = response.results || [];
        
        // Categorize for quick suggestions
        const poses = allItems.filter(item => item.type === 'yoga').slice(0, 3);
        const exercises = allItems.filter(item => item.type === 'exercise' && item.category !== 'Warm-up').slice(0, 3);
        setPopularPoses(poses);
        setPopularExercises(exercises);

        // Calculate personalized suggestions based on logged user sessions or dashboard goals
        if (api.isAuthenticated()) {
          const dashboard = await api.getDashboard();
          const workedMuscles = new Set();
          
          if (dashboard.sessionHistory && dashboard.sessionHistory.length > 0) {
            dashboard.sessionHistory.slice(0, 5).forEach(session => {
              // Match pose details
              const poseItem = allItems.find(item => item.id === session.poseId);
              if (poseItem && poseItem.target_muscle) {
                workedMuscles.add(poseItem.target_muscle);
              }
            });
          }

          // Suggest items matching worked muscles or low-accuracy targets
          let suggestions = [];
          if (workedMuscles.size > 0) {
            const muscleList = Array.from(workedMuscles);
            suggestions = allItems.filter(item => 
              item.target_muscle && 
              muscleList.some(m => item.target_muscle.toLowerCase().includes(m.toLowerCase()))
            );
          } else {
            // Suggest beginner flexible items
            suggestions = allItems.filter(item => item.difficulty === 'Beginner');
          }
          setPersonalizedSuggestions(suggestions.slice(0, 3));
        } else {
          // Default personalization fallback
          setPersonalizedSuggestions(allItems.filter(item => item.difficulty === 'Beginner').slice(3, 6));
        }
      } catch (e) {
        console.warn('Failed to load search suggestions:', e);
      }
    };

    fetchPopular();

    // Auto-focus input
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Handle Escape or global clicks
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Debounced real-time search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSuggestion(null);
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    setSelectedIndex(-1);

    const timer = setTimeout(async () => {
      try {
        const response = await api.getLibrary(query);
        setResults(response.results || []);
        setSuggestion(response.suggestion || null);
      } catch (e) {
        console.warn('Search query failed:', e);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation logic
  const handleInputKeyDown = (e) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleItemClick(results[selectedIndex]);
      } else if (results.length > 0) {
        handleItemClick(results[0]);
      }
    }
  };

  // Click outside to close overlay
  const handleBackdropClick = (e) => {
    if (overlayRef.current && !overlayRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Add search term to history
  const addRecentSearch = (searchTerm) => {
    if (!searchTerm.trim()) return;
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('yoga_recent_searches', JSON.stringify(updated));
  };

  // Clear search history
  const clearRecentSearches = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('yoga_recent_searches');
  };

  // Navigate to item details and record search query
  const handleItemClick = (item) => {
    addRecentSearch(query || item.name);
    onClose();
    if (item.type === 'yoga') {
      navigate(`/library/${item.id}`);
    } else {
      navigate(`/exercise/${item.id}`);
    }
  };

  // Voice Search Web Speech API
  const handleVoiceSearch = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      addRecentSearch(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Highlight matched query text
  const highlightMatch = (text, matchQuery) => {
    if (!matchQuery || !text) return text;
    const cleanQuery = matchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${cleanQuery})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === matchQuery.toLowerCase() 
            ? <mark key={i} className="bg-indigo-500/30 text-indigo-300 rounded-sm px-0.5 font-semibold">{part}</mark> 
            : part
        )}
      </span>
    );
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-start justify-center p-4 md:p-10 text-left overflow-y-auto"
    >
      <div 
        ref={overlayRef}
        className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 mt-6 md:mt-12"
      >
        {/* Search Input Box */}
        <div className="relative border-b border-white/5 p-4 flex items-center gap-3">
          <Search className="h-5 w-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search poses, muscles, categories, health conditions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="w-full bg-transparent border-0 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-0 text-base py-1 font-medium"
          />

          {/* Voice Search Button */}
          <button
            onClick={handleVoiceSearch}
            className={`p-2 rounded-xl border border-white/5 hover:bg-slate-800 transition-all relative shrink-0 ${
              isListening ? 'bg-indigo-500/20 text-indigo-300 ring-2 ring-indigo-500 border-indigo-500' : 'text-slate-400'
            }`}
            title="Search with Voice"
          >
            {isListening ? (
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 bg-rose-500 rounded-full animate-ping mr-1" />
                <Mic className="h-4 w-4 text-rose-400 animate-pulse" />
              </span>
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-white/5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results / Suggestions Container */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-[300px]">
          {/* SKELETON LOADING STATE */}
          {loading && (
            <div className="space-y-4">
              <div className="h-4 w-28 bg-slate-800 rounded animate-pulse mb-4" />
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 p-3 border border-white/5 rounded-xl animate-pulse">
                  <div className="h-10 w-10 bg-slate-800 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2 py-0.5">
                    <div className="h-4 bg-slate-800 rounded w-1/3" />
                    <div className="h-3 bg-slate-800 rounded w-2/3" />
                  </div>
                  <div className="h-5 w-12 bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* DYNAMIC RESULTS LIST */}
          {!loading && query && results.length > 0 && (
            <div className="space-y-6">
              {/* Spelling Suggestion */}
              {suggestion && (
                <div className="flex items-center gap-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300">
                  <Sparkle className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>
                    Did you mean:{' '}
                    <button 
                      onClick={() => setQuery(suggestion)}
                      className="font-bold underline hover:text-indigo-200"
                    >
                      {suggestion}
                    </button>
                    ?
                  </span>
                </div>
              )}

              {/* Categorized List */}
              <div className="space-y-2">
                <h3 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider mb-3">Matching Results</h3>
                <div className="space-y-1">
                  {results.map((item, idx) => {
                    const isSelected = selectedIndex === idx;
                    const itemMuscles = item.target_muscle 
                      ? item.target_muscle.split(/[&,]+/).map(m => m.trim())
                      : [];

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md translation-x-1' 
                            : 'bg-slate-900/30 hover:bg-slate-800/40 border-white/5 text-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-4 text-left">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                            item.type === 'yoga' 
                              ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400' 
                              : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                          }`}>
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm">
                                {highlightMatch(item.name, query)}
                              </h4>
                              {item.sanskrit_name && (
                                <span className="text-xs italic text-slate-500 font-light">
                                  ({highlightMatch(item.sanskrit_name, query)})
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-light mt-0.5 line-clamp-1">
                              {highlightMatch(item.description, query)}
                            </p>
                            {/* Matching tags / muscles */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-white/5">
                                {item.category}
                              </span>
                              {itemMuscles.slice(0, 2).map(m => (
                                <span key={m} className="text-[9px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 px-1.5 py-0.5 rounded">
                                  {highlightMatch(m, query)}
                                </span>
                              ))}
                              {item.tags && item.tags.slice(0, 2).map(t => (
                                <span key={t} className="text-[9px] text-slate-400 bg-slate-800/60 border border-white/5 px-1.5 py-0.5 rounded">
                                  #{highlightMatch(t, query)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant={item.difficulty}>{item.difficulty}</Badge>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {item.duration}s
                            </span>
                          </div>
                          {isSelected && <CornerDownLeft className="h-4 w-4 text-indigo-400 animate-pulse" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ZERO RESULTS FALLBACK */}
          {!loading && query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-rose-500 shadow-inner">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-200">No matching routines or poses found</h3>
                <p className="text-slate-500 text-sm font-light mt-1 max-w-md">
                  We couldn't find anything matching "{query}". Try checking your spelling or search for muscle groups like "core", "legs" or "back".
                </p>
              </div>

              {/* Try Spelling Suggestion if available */}
              {suggestion && (
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-sm text-indigo-300 flex items-center gap-1.5 mt-2">
                  <span>Did you mean:</span>
                  <button 
                    onClick={() => setQuery(suggestion)}
                    className="font-bold underline text-indigo-400 hover:text-indigo-200"
                  >
                    {suggestion}
                  </button>
                </div>
              )}

              {/* Fallback Popular Items */}
              <div className="w-full pt-6 border-t border-white/5 space-y-3">
                <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Suggested for you</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {popularPoses.slice(0, 2).concat(popularExercises.slice(0, 2)).map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="p-3 border border-white/5 bg-slate-900/40 rounded-xl hover:bg-slate-900/80 cursor-pointer flex justify-between items-center text-slate-300 transition-colors hover:border-indigo-500/30 group"
                    >
                      <div className="text-left">
                        <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider">{item.category}</span>
                        <h5 className="font-bold text-sm text-slate-200 group-hover:text-indigo-400 transition-colors mt-0.5">{item.name}</h5>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PRE-SEARCH INTERACTIVE DASHBOARD */}
          {!loading && !query && (
            <div className="space-y-6">
              {/* Recent searches & Trending row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Recent Searches */}
                <div className="md:col-span-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Recent Searches</h3>
                    {recentSearches.length > 0 && (
                      <button 
                        onClick={clearRecentSearches}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {recentSearches.length > 0 ? (
                    <div className="space-y-1">
                      {recentSearches.map((term, i) => (
                        <div 
                          key={i}
                          onClick={() => setQuery(term)}
                          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-900/60 cursor-pointer text-slate-400 hover:text-slate-200 text-sm transition-colors group"
                        >
                          <History className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
                          <span className="line-clamp-1">{term}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 font-light italic py-2">No recent searches.</p>
                  )}
                </div>

                {/* Trending Queries */}
                <div className="md:col-span-6 space-y-3">
                  <h3 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Trending Right Now</h3>
                  <div className="flex flex-wrap gap-2">
                    {trendingQueries.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(t)}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-300 bg-slate-900 border border-white/5 rounded-xl hover:bg-indigo-600 hover:border-indigo-500 hover:text-white transition-all shadow-sm"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Personalized Suggestions Card */}
              {personalizedSuggestions.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Recommended for your targets</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {personalizedSuggestions.map((item) => (
                      <Card
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="p-4 bg-slate-900/30 hover:bg-slate-900/60 border-white/5 cursor-pointer flex flex-col justify-between text-left group h-full"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-400">{item.category}</span>
                            <Badge variant={item.difficulty}>{item.difficulty}</Badge>
                          </div>
                          <h4 className="font-bold text-sm text-slate-200 mt-1.5 group-hover:text-indigo-400 transition-colors line-clamp-1">{item.name}</h4>
                          <p className="text-[10px] text-slate-400 font-light mt-1 line-clamp-2">{item.description}</p>
                        </div>
                        <div className="mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between group-hover:text-indigo-300 transition-colors">
                          <span>Practice now</span>
                          <ChevronRight className="h-3 w-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-white/5">
                {/* Popular Poses */}
                <div className="space-y-3">
                  <h3 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Popular Yoga Poses</h3>
                  <div className="space-y-2">
                    {popularPoses.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-slate-900/20 hover:bg-slate-900/60 cursor-pointer text-sm text-slate-300 transition-colors"
                      >
                        <div>
                          <h4 className="font-bold">{item.name}</h4>
                          {item.sanskrit_name && <p className="text-[10px] italic text-slate-500 mt-0.5">{item.sanskrit_name}</p>}
                        </div>
                        <Badge variant={item.difficulty}>{item.difficulty}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Routines */}
                <div className="space-y-3">
                  <h3 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Popular Routines</h3>
                  <div className="space-y-2">
                    {popularExercises.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-slate-900/20 hover:bg-slate-900/60 cursor-pointer text-sm text-slate-300 transition-colors"
                      >
                        <div>
                          <h4 className="font-bold">{item.name}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">{item.category}</p>
                        </div>
                        <Badge variant={item.difficulty}>{item.difficulty}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Keyboard Navigation Footer */}
        <div className="bg-slate-950/80 border-t border-white/5 px-4 py-2.5 flex items-center justify-between text-[10px] text-slate-500 font-medium">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-[9px] font-bold">↑↓</span> to navigate
            </span>
            <span className="flex items-center gap-1">
              <span className="bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-[9px] font-bold">Enter</span> to open
            </span>
            <span className="flex items-center gap-1">
              <span className="bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-[9px] font-bold">Esc</span> to close
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <Sparkle className="h-3 w-3 text-indigo-400 animate-spin-slow" />
            <span>AI Search Assistant Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
