import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Plus, Trash2, ArrowUp, ArrowDown, Save, FolderOpen, 
  Sparkles, Clock, HelpCircle, Activity, ChevronRight 
} from 'lucide-react';
import YogaDigitalTwin from '../components/ui/YogaDigitalTwin';
import { api } from '../services/api';

// Pose Catalog supported by the 3D Point-Cloud Hologram Engine
const POSE_CATALOG = [
  { id: 'tree-pose', name: 'Tree Pose (Vrikshasana)', level: 'Beginner', targetMuscle: 'Balance & Core' },
  { id: 'warrior-ii', name: 'Warrior II (Virabhadrasana II)', level: 'Beginner', targetMuscle: 'Legs & Shoulders' },
  { id: 'downward-dog', name: 'Downward Dog (Adho Mukha Svanasana)', level: 'Beginner', targetMuscle: 'Hamstrings & Spine' },
  { id: 'cobra-pose', name: 'Cobra Pose (Bhujangasana)', level: 'Intermediate', targetMuscle: 'Lower Back & Chest' },
  { id: 'crow-pose', name: 'Crow Pose (Bakasana)', level: 'Advanced', targetMuscle: 'Arm Balance & Core' }
];

// Default pre-built flows
const DEFAULT_FLOWS = [
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

export default function FlowBuilder() {
  const navigate = useNavigate();
  const [customFlows, setCustomFlows] = useState([]);
  const [selectedFlow, setSelectedFlow] = useState(DEFAULT_FLOWS[0]);
  const [flowName, setFlowName] = useState(DEFAULT_FLOWS[0].name);
  const [flowDescription, setFlowDescription] = useState(DEFAULT_FLOWS[0].description || '');
  const [activeSteps, setActiveSteps] = useState(DEFAULT_FLOWS[0].steps);
  const [previewPoseId, setPreviewPoseId] = useState('downward-dog');

  // Load custom flows on mount
  const loadCustomFlows = async () => {
    const isOnline = await api.checkStatus();
    const isAuth = api.isAuthenticated();

    if (isOnline && isAuth) {
      try {
        const dbFlows = await api.getFlows();
        const formattedDbFlows = dbFlows.map(f => ({
          id: f.id,
          name: f.name,
          description: f.description,
          steps: f.steps.map(s => ({ poseId: s.poseId, duration: s.duration }))
        }));
        setCustomFlows(formattedDbFlows);
      } catch (e) {
        console.warn("Failed to load custom flows from API, using local storage", e);
        loadFromLocal();
      }
    } else {
      loadFromLocal();
    }
  };

  const loadFromLocal = () => {
    const saved = localStorage.getItem('yoga_custom_flows');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomFlows(parsed);
      } catch (e) {
        console.error('Failed to parse saved flows', e);
      }
    }
  };

  useEffect(() => {
    loadCustomFlows();
    window.addEventListener('auth-login-success', loadCustomFlows);
    return () => window.removeEventListener('auth-login-success', loadCustomFlows);
  }, []);

  // Save flows helper
  const saveFlowsToLocalStorage = (flowsList) => {
    localStorage.setItem('yoga_custom_flows', JSON.stringify(flowsList));
  };

  // Add step to current sequence
  const addStep = (poseId) => {
    const newStep = { poseId, duration: 30 };
    setActiveSteps([...activeSteps, newStep]);
    setPreviewPoseId(poseId);
  };

  // Delete step
  const removeStep = (index) => {
    const copy = [...activeSteps];
    copy.splice(index, 1);
    setActiveSteps(copy);
  };

  // Move step Up
  const moveStepUp = (index) => {
    if (index === 0) return;
    const copy = [...activeSteps];
    const temp = copy[index];
    copy[index] = copy[index - 1];
    copy[index - 1] = temp;
    setActiveSteps(copy);
  };

  // Move step Down
  const moveStepDown = (index) => {
    if (index === activeSteps.length - 1) return;
    const copy = [...activeSteps];
    const temp = copy[index];
    copy[index] = copy[index + 1];
    copy[index + 1] = temp;
    setActiveSteps(copy);
  };

  // Change duration of a step
  const updateDuration = (index, value) => {
    const dur = Math.max(5, parseInt(value) || 10);
    const copy = [...activeSteps];
    copy[index].duration = dur;
    setActiveSteps(copy);
  };

  // Create a brand new empty flow
  const createNewFlow = () => {
    const newEmptyFlow = {
      id: `custom-${Date.now()}`,
      name: 'My Custom Sequence',
      description: 'Custom yoga routine.',
      steps: []
    };
    setSelectedFlow(newEmptyFlow);
    setFlowName(newEmptyFlow.name);
    setFlowDescription(newEmptyFlow.description);
    setActiveSteps([]);
  };

  // Save flow
  const saveCurrentFlow = async () => {
    if (!flowName.trim()) {
      alert('Please enter a flow name');
      return;
    }

    const flowToSave = {
      id: selectedFlow.id.toString().startsWith('default-') ? `custom-${Date.now()}` : selectedFlow.id,
      name: flowName,
      description: flowDescription,
      steps: activeSteps.map(s => ({ poseId: s.poseId, duration: s.duration }))
    };

    const isOnline = await api.checkStatus();
    const isAuth = api.isAuthenticated();

    if (isOnline && isAuth) {
      try {
        await api.saveFlow(flowToSave);
        // Dispatch event
        window.dispatchEvent(new Event('practice-session-logged'));
      } catch (e) {
        console.warn("Failed to save flow to backend:", e);
      }
    }

    let updatedFlows;
    const exists = customFlows.some(f => f.id === flowToSave.id);
    if (exists) {
      updatedFlows = customFlows.map(f => f.id === flowToSave.id ? flowToSave : f);
    } else {
      updatedFlows = [...customFlows, flowToSave];
    }

    setCustomFlows(updatedFlows);
    saveFlowsToLocalStorage(updatedFlows);
    setSelectedFlow(flowToSave);
    alert('Vinyasa sequence saved successfully!');
  };

  // Select flow
  const selectFlow = (flow) => {
    setSelectedFlow(flow);
    setFlowName(flow.name);
    setFlowDescription(flow.description || '');
    setActiveSteps(flow.steps);
    if (flow.steps.length > 0) {
      setPreviewPoseId(flow.steps[0].poseId);
    }
  };

  // Delete custom flow
  const deleteCustomFlow = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this custom sequence?')) return;

    const isOnline = await api.checkStatus();
    const isAuth = api.isAuthenticated();

    if (isOnline && isAuth && !id.toString().startsWith('default-')) {
      try {
        await api.deleteFlow(id);
        window.dispatchEvent(new Event('practice-session-logged'));
      } catch (e) {
        console.warn("Failed to delete flow from backend:", e);
      }
    }

    const filtered = customFlows.filter(f => f.id !== id);
    setCustomFlows(filtered);
    saveFlowsToLocalStorage(filtered);
    
    // Select default if current was deleted
    if (selectedFlow.id === id) {
      selectFlow(DEFAULT_FLOWS[0]);
    }
  };

  // Start sequence in trainer
  const startFlowTraining = () => {
    if (activeSteps.length === 0) {
      alert('Add at least one pose to your sequence before starting!');
      return;
    }
    // Redirect to LiveTrainer with flow query state
    navigate(`/trainer`, { 
      state: { 
        flow: {
          id: selectedFlow.id,
          name: flowName,
          steps: activeSteps
        } 
      }
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-slate-100 min-h-[90vh]">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <span className="text-sm font-semibold tracking-wider text-indigo-400 uppercase">Interactive Lab</span>
          </div>
          <h1 className="bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
            Vinyasa Flow Builder
          </h1>
          <p className="mt-1 text-slate-400">
            Create custom yoga routines, preview pose geometries in 3D, and load them into the Live Trainer.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={createNewFlow}
            className="flex items-center gap-2 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800/80 px-4 py-2.5 text-sm font-semibold transition-all"
          >
            <Plus className="h-4 w-4" /> New Sequence
          </button>
          <button 
            onClick={startFlowTraining}
            className="flex items-center gap-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 px-5 py-2.5 text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Play className="h-4 w-4 fill-white" /> Start Practice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Flow List & Pose Selector */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Library of Sequences */}
          <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-5 backdrop-blur-xl">
            <h2 className="flex items-center gap-2 text-md font-bold text-slate-200 mb-4">
              <FolderOpen className="h-4 w-4 text-indigo-400" /> Vinyasa Library
            </h2>
            
            <div className="flex flex-col gap-3">
              {/* Default Flows */}
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Preset Routines</div>
              {DEFAULT_FLOWS.map((flow) => (
                <div 
                  key={flow.id}
                  onClick={() => selectFlow(flow)}
                  className={`flex flex-col gap-1 p-3.5 rounded-xl cursor-pointer border transition-all ${
                    selectedFlow.id === flow.id 
                      ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300' 
                      : 'bg-slate-900/60 border-transparent hover:border-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-sm">
                    <span>{flow.name}</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-medium">Preset</span>
                  </div>
                  <span className="text-xs text-slate-400 line-clamp-1">{flow.description}</span>
                  <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {flow.steps.length} steps • {flow.steps.reduce((acc, s) => acc + s.duration, 0)}s hold
                  </span>
                </div>
              ))}

              {/* Custom Flows */}
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4 mb-1">My Saved Flows</div>
              {customFlows.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 text-center text-xs text-slate-500">
                  No custom sequences saved yet.
                </div>
              ) : (
                customFlows.map((flow) => (
                  <div 
                    key={flow.id}
                    onClick={() => selectFlow(flow)}
                    className={`flex flex-col gap-1 p-3.5 rounded-xl cursor-pointer border transition-all relative group ${
                      selectedFlow.id === flow.id 
                        ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300' 
                        : 'bg-slate-900/60 border-transparent hover:border-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-sm pr-6">
                      <span>{flow.name}</span>
                      <button 
                        onClick={(e) => deleteCustomFlow(flow.id, e)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-xs text-slate-400 line-clamp-1">{flow.description}</span>
                    <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {flow.steps.length} steps • {flow.steps.reduce((acc, s) => acc + s.duration, 0)}s hold
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pose Catalog Selector */}
          <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-5 backdrop-blur-xl">
            <h2 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" /> Pose Catalog
            </h2>
            <div className="flex flex-col gap-2.5">
              {POSE_CATALOG.map((pose) => (
                <div 
                  key={pose.id}
                  onClick={() => setPreviewPoseId(pose.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/80 transition-all cursor-pointer ${
                    previewPoseId === pose.id ? 'ring-1 ring-indigo-500/40' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-200">{pose.name.split(' (')[0]}</span>
                    <span className="text-[10px] text-slate-400">{pose.targetMuscle} • <span className="text-indigo-400">{pose.level}</span></span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addStep(pose.id);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Center Column: Active Flow Builder Workspace */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-5 backdrop-blur-xl flex-1 flex flex-col">
            
            {/* Flow Properties */}
            <div className="flex flex-col gap-3 pb-5 border-b border-white/5 mb-5">
              <input 
                type="text" 
                value={flowName} 
                onChange={(e) => setFlowName(e.target.value)}
                placeholder="Enter Sequence Name..."
                className="w-full bg-transparent border-b border-transparent hover:border-white/10 focus:border-indigo-500 outline-none text-lg font-bold text-slate-100 transition-all py-1"
              />
              <input 
                type="text" 
                value={flowDescription} 
                onChange={(e) => setFlowDescription(e.target.value)}
                placeholder="Brief description (e.g. Morning spine flex)..."
                className="w-full bg-transparent text-sm text-slate-400 outline-none"
              />
            </div>

            {/* Steps Timeline */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sequence Timeline</div>
              
              {activeSteps.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-white/5 text-slate-500 bg-slate-900/20">
                  <Activity className="h-8 w-8 mb-2 text-slate-600" />
                  <span className="text-xs">Your timeline is empty.</span>
                  <span className="text-[10px] text-slate-600 mt-1">Add postures from the pose catalog.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
                  {activeSteps.map((step, idx) => {
                    const pose = POSE_CATALOG.find(p => p.id === step.poseId);
                    return (
                      <div 
                        key={idx}
                        onClick={() => setPreviewPoseId(step.poseId)}
                        className={`flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-900/60 hover:bg-slate-900 transition-all cursor-pointer ${
                          previewPoseId === step.poseId ? 'border-indigo-500/30 bg-indigo-500/5' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-indigo-400 border border-white/5">
                            {idx + 1}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-200">{pose ? pose.name.split(' (')[0] : step.poseId}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Hold Duration: 
                              <input 
                                type="number" 
                                value={step.duration}
                                onChange={(e) => updateDuration(idx, e.target.value)}
                                className="w-10 bg-slate-850 border border-white/5 rounded px-1 outline-none text-center font-semibold text-indigo-300"
                                min="5"
                                max="180"
                              />s
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => moveStepUp(idx)}
                            className="p-1 text-slate-400 hover:text-indigo-400"
                            disabled={idx === 0}
                          >
                            <ArrowUp className={`h-3.5 w-3.5 ${idx === 0 ? 'opacity-30' : ''}`} />
                          </button>
                          <button 
                            onClick={() => moveStepDown(idx)}
                            className="p-1 text-slate-400 hover:text-indigo-400"
                            disabled={idx === activeSteps.length - 1}
                          >
                            <ArrowDown className={`h-3.5 w-3.5 ${idx === activeSteps.length - 1 ? 'opacity-30' : ''}`} />
                          </button>
                          <button 
                            onClick={() => removeStep(idx)}
                            className="p-1 text-slate-400 hover:text-red-400 ml-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Save Controls */}
            <div className="mt-5 pt-4 border-t border-white/5 flex justify-end">
              <button 
                onClick={saveCurrentFlow}
                className="flex items-center gap-2 rounded-xl bg-slate-900 border border-white/10 hover:border-indigo-500/40 text-slate-200 px-5 py-2.5 text-sm font-semibold transition-all"
              >
                <Save className="h-4 w-4 text-indigo-400" /> Save Sequence
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: 3D Hologram Preview */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-5 backdrop-blur-xl sticky top-24">
            <h2 className="text-md font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-400 font-bold" /> 3D Target Preview
            </h2>
            <p className="text-[11px] text-slate-400 mb-4">
              Click and drag the hologram to rotate coordinates and preview ideal pose geometries.
            </p>
            
            <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-white/5 bg-[#05070f]">
              <YogaDigitalTwin 
                poseId={previewPoseId} 
                jointOffsets={null} 
                showUserTwin={true} 
              />
            </div>
            
            <div className="mt-4 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[11px] text-slate-300">
              <div className="font-bold text-indigo-300 mb-1 flex items-center gap-1">
                <HelpCircle className="h-3 w-3" /> Sequence Info
              </div>
              Select postures in the catalog to add them to your flow. Press and drag inside the viewport to inspect alignment joints before loading your routine.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
