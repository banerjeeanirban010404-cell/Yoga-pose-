import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Clock, Flame, Filter, ChevronRight, Sparkles } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { api } from '../services/api';
import SearchOverlay from '../components/ui/SearchOverlay';

export default function YogaLibrary() {
  const navigate = useNavigate();
  const [libraryItems, setLibraryItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFocusDomain, setSelectedFocusDomain] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Available filters
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  const categories = ['All', 'Yoga', 'Warm-up', 'Meditation'];
  const focusDomains = ['All', 'Core Strength', 'Hip Openers', 'Spine Mobility'];

  useEffect(() => {
    // Listen for Ctrl+K or Cmd+K to trigger search overlay
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchLibrary = async () => {
      setLoading(true);
      try {
        const data = await api.getLibrary(searchQuery);
        if (active) {
          setLibraryItems(data.results || []);
        }
      } catch (e) {
        console.warn("Failed to fetch library items:", e);
      } finally {
        if (active) setLoading(false);
      }
    };

    // Debounce API calls by 250ms
    const timer = setTimeout(() => {
      fetchLibrary();
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Filter logic applied locally on the NLM search results
  const filteredItems = libraryItems.filter((item) => {
    const matchesDifficulty = selectedDifficulty === 'All' || item.difficulty === selectedDifficulty;
    
    const matchesCategory = selectedCategory === 'All' || 
      (selectedCategory === 'Yoga' && item.type === 'yoga') ||
      (selectedCategory === 'Warm-up' && item.category === 'Warm-up') ||
      (selectedCategory === 'Meditation' && item.category === 'Meditation');

    const matchesFocusDomain = selectedFocusDomain === 'All' ||
      (selectedFocusDomain === 'Core Strength' && (
        item.target_muscle?.toLowerCase().includes('core') || 
        item.target_muscle?.toLowerCase().includes('abs') || 
        item.target_muscle?.toLowerCase().includes('abdominals') ||
        item.tags?.some(t => t.toLowerCase() === 'core')
      )) ||
      (selectedFocusDomain === 'Hip Openers' && (
        item.target_muscle?.toLowerCase().includes('hip') || 
        item.target_muscle?.toLowerCase().includes('glute') ||
        item.tags?.some(t => t.toLowerCase() === 'hip' || t.toLowerCase() === 'hips') ||
        item.body_parts?.some(b => b.toLowerCase() === 'hips')
      )) ||
      (selectedFocusDomain === 'Spine Mobility' && (
        item.target_muscle?.toLowerCase().includes('spine') || 
        item.target_muscle?.toLowerCase().includes('back') || 
        item.tags?.some(t => t.toLowerCase() === 'spine' || t.toLowerCase() === 'back') ||
        item.body_parts?.some(b => b.toLowerCase() === 'back')
      ));

    return matchesDifficulty && matchesCategory && matchesFocusDomain;
  });

  const handleCardClick = (item) => {
    if (item.type === 'yoga') {
      navigate(`/library/${item.id}`);
    } else {
      navigate(`/exercise/${item.id}`);
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-black text-white">Mindfulness & Yoga Directory</h1>
        <p className="text-slate-400 text-sm font-light">
          Search dynamically for poses and exercises. Type natural queries like "back pain", "relaxation", or "leg strength" to activate AI matching.
        </p>
      </div>

      {/* Filter and Search Bar Card */}
      <Card className="p-5 border-white/5 bg-slate-950/60" hover={false}>
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
            <input
              type="text"
              placeholder="Search poses, routines, muscles (Press ⌘K)..."
              value={searchQuery}
              onClick={() => setIsSearchOpen(true)}
              onFocus={() => setIsSearchOpen(true)}
              readOnly
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 cursor-pointer focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
            />
            {searchQuery && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20 font-bold animate-pulse">
                <Sparkles className="h-2.5 w-2.5" /> NLM Active
              </span>
            )}
          </div>

          {/* Reset button */}
          {(searchQuery || selectedCategory !== 'All' || selectedDifficulty !== 'All' || selectedFocusDomain !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedDifficulty('All');
                setSelectedFocusDomain('All');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold self-end md:self-center"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="mt-5 pt-4 border-t border-white/5 space-y-4">
          {/* Difficulty row */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-slate-500 mr-2 uppercase tracking-wider">Difficulty:</span>
            {difficulties.map(diff => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  selectedDifficulty === diff
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Category row */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-slate-500 mr-4 uppercase tracking-wider">Category:</span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  selectedCategory === cat
                    ? 'bg-violet-600 border-violet-500 text-white shadow-md'
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Focus Domain row */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-slate-500 mr-2 uppercase tracking-wider">Focus Area:</span>
            {focusDomains.map(domain => (
              <button
                key={domain}
                onClick={() => setSelectedFocusDomain(domain)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  selectedFocusDomain === domain
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {domain}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Pose Listing Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">Running NLM Engine...</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            // Parse muscles targeted from comma-separated target_muscle string
            const muscles = item.target_muscle 
              ? item.target_muscle.split(/[&,]+/).map(m => m.trim())
              : [item.category || 'Mindfulness'];

            // Calculate calorie estimate
            const calories = item.calories_per_minute 
              ? Math.round(item.calories_per_minute * (item.duration / 60))
              : Math.round(4 * (item.duration / 60));

            return (
              <Card
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="flex flex-col justify-between h-full bg-slate-900/30 hover:bg-slate-900/50 border-white/5 cursor-pointer relative overflow-hidden group"
              >
                <div className="space-y-4">
                  {/* Header info */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-xl font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                        {item.name}
                      </h3>
                      {item.sanskrit_name ? (
                        <p className="text-xs italic text-slate-500 font-light mt-0.5">{item.sanskrit_name}</p>
                      ) : (
                        <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mt-0.5">{item.category}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge variant={item.difficulty}>{item.difficulty}</Badge>
                      <Badge variant={item.type === 'yoga' ? 'info' : 'secondary'}>
                        {item.type === 'yoga' ? 'Asana' : 'Routine'}
                      </Badge>
                    </div>
                  </div>

                  {/* Rating & stats row */}
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>{item.type === 'yoga' ? '4.9' : '4.6'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{item.duration}s</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5 text-rose-500" />
                      <span>{calories} kcal</span>
                    </div>
                  </div>

                  {/* Muscles targeted tags */}
                  <div className="flex flex-wrap gap-1">
                    {muscles.map(m => (
                      <span 
                        key={m} 
                        className="text-[10px] font-semibold text-slate-400 bg-slate-900/60 border border-white/5 rounded px-2 py-0.5"
                      >
                        {m}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-slate-400 font-light leading-relaxed line-clamp-2">
                    {item.steps && item.steps.length > 0 ? item.steps[0] : (item.description || 'Active mindfulness training session.')}
                  </p>
                </div>

                {/* Bottom Card Action bar */}
                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {item.type === 'yoga' ? 'Practice Pose' : 'Start Exercises'}
                  </span>
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-white/5 bg-slate-950/20" hover={false}>
          <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500 mb-4">
            <Filter className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-300">No poses match your search</h3>
          <p className="text-slate-500 text-sm font-light mt-1">Try modifying your query terms (e.g. "back pain" or "strong legs").</p>
        </Card>
      )}

      {isSearchOpen && (
        <SearchOverlay onClose={() => setIsSearchOpen(false)} />
      )}
    </div>
  );
}
