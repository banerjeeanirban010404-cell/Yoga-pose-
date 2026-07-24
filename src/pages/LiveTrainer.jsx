import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Camera, CameraOff, Volume2, VolumeX, Play, Pause, RotateCcw, AlertTriangle, ArrowRight, ShieldCheck, HelpCircle, Workflow, CheckCircle, ChevronDown, ChevronUp, Sparkles, Clock, Flame, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { yogaPoses } from '../data/yogaData';
import YogaDigitalTwin from '../components/ui/YogaDigitalTwin';
import { api } from '../services/api';

const skeletonTemplates2D = {
  'warrior-ii': {
    head: { x: 150, y: 90 },
    shoulder: { x: 150, y: 125 },
    hip: { x: 150, y: 205 },
    leftElbow: { x: 90, y: 125 },
    leftWrist: { x: 40, y: 125 },
    leftKnee: { x: 100, y: 245 },
    leftAnkle: { x: 100, y: 295 },
    rightElbow: { x: 210, y: 125 },
    rightWrist: { x: 260, y: 125 },
    rightKnee: { x: 200, y: 245 },
    rightAnkle: { x: 200, y: 295 }
  },
  'tree-pose': {
    head: { x: 150, y: 70 },
    shoulder: { x: 150, y: 105 },
    hip: { x: 150, y: 195 },
    leftElbow: { x: 110, y: 75 },
    leftWrist: { x: 140, y: 40 },
    leftKnee: { x: 125, y: 235 },
    leftAnkle: { x: 125, y: 285 },
    rightElbow: { x: 190, y: 75 },
    rightWrist: { x: 160, y: 40 },
    rightKnee: { x: 195, y: 220 },
    rightAnkle: { x: 150, y: 235 }
  },
  'downward-dog': {
    head: { x: 90, y: 210 },
    shoulder: { x: 110, y: 180 },
    hip: { x: 190, y: 110 },
    leftElbow: { x: 75, y: 220 },
    leftWrist: { x: 50, y: 260 },
    leftKnee: { x: 210, y: 180 },
    leftAnkle: { x: 230, y: 260 },
    rightElbow: { x: 75, y: 220 },
    rightWrist: { x: 50, y: 260 },
    rightKnee: { x: 210, y: 180 },
    rightAnkle: { x: 230, y: 260 }
  },
  'cobra-pose': {
    head: { x: 210, y: 130 },
    shoulder: { x: 170, y: 160 },
    hip: { x: 110, y: 230 },
    leftElbow: { x: 160, y: 200 },
    leftWrist: { x: 170, y: 240 },
    leftKnee: { x: 70, y: 240 },
    leftAnkle: { x: 30, y: 245 },
    rightElbow: { x: 160, y: 200 },
    rightWrist: { x: 170, y: 240 },
    rightKnee: { x: 70, y: 240 },
    rightAnkle: { x: 30, y: 245 }
  },
  'crow-pose': {
    head: { x: 190, y: 190 },
    shoulder: { x: 160, y: 160 },
    hip: { x: 110, y: 130 },
    leftElbow: { x: 140, y: 210 },
    leftWrist: { x: 150, y: 250 },
    leftKnee: { x: 120, y: 140 },
    leftAnkle: { x: 90, y: 150 },
    rightElbow: { x: 140, y: 210 },
    rightWrist: { x: 150, y: 250 },
    rightKnee: { x: 120, y: 140 },
    rightAnkle: { x: 90, y: 150 }
  }
};

const getJointLabel = (key) => {
  const labels = {
    rightKnee: 'Front Knee Flexion',
    rightElbow: 'Right Elbow Flexion',
    torsoAngle: 'Torso Spine Rotation',
    hipAngle: 'Hip Flexion Angle',
    shoulderAngle: 'Shoulder Flexion Angle',
    kneeAngle: 'Knee Flexion Angle',
    hipOpenAngle: 'Hip Opening Angle',
    spineExtension: 'Spinal Extension Angle',
    elbowAngle: 'Elbow Flexion Angle',
    armFlexion: 'Arm Flexion Angle',
    hipFlexion: 'Hip Flexion Angle',
    frontKnee: 'Front Knee Flexion',
    rightAnkle: 'Right Ankle Flexion',
    kneeFlexion: 'Knee Flexion Angle',
    spineExtension: 'Spinal Extension Angle'
  };
  return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

export default function LiveTrainer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);
  
  // Vinyasa Flow States
  const [activeFlow, setActiveFlow] = useState(location.state?.flow || null);
  const [flowStepIdx, setFlowStepIdx] = useState(0);
  const [flowHoldTimer, setFlowHoldTimer] = useState(0);
  
  const [poses, setPoses] = useState(yogaPoses);
  const [detectedPose, setDetectedPose] = useState(null);
  // Find current pose or default
  const defaultPose = activeFlow && activeFlow.steps.length > 0 
    ? (poses.find(p => p.id === activeFlow.steps[0].poseId) || poses[0])
    : (id === 'auto-detect'
        ? { id: 'auto-detect', name: '✨ Auto-Detect Pose', sanskritName: 'Automatic Scanner', jointAngles: {} }
        : (poses.find(p => p.id === id) || poses[0]));
  const [currentPose, setCurrentPose] = useState(defaultPose);

  useEffect(() => {
    const loadPoses = async () => {
      try {
        const dbPoses = await api.getPoses();
        if (dbPoses && dbPoses.length > 0) {
          const formattedPoses = dbPoses.map(p => ({
            id: p.id,
            name: p.name,
            sanskritName: p.sanskrit_name,
            difficulty: p.difficulty,
            duration: p.duration,
            calories: p.calories_per_minute * (p.duration / 60),
            description: p.description,
            steps: p.steps,
            benefits: p.benefits,
            targetMuscle: p.target_muscle,
            idealFor: p.ideal_for,
            commonMistakes: p.common_mistakes,
            instructions: p.instructions,
            jointAngles: p.joint_angles
          }));
          setPoses(formattedPoses);
        }
      } catch (e) {
        console.warn("Failed to load poses from API:", e);
      }
    };
    loadPoses();
  }, []);

  // Sync currentPose when poses are loaded or active pose/flow selection changes
  useEffect(() => {
    if (poses.length > 0) {
      if (activeFlow && activeFlow.steps.length > 0) {
        const step = activeFlow.steps[flowStepIdx];
        const pose = poses.find(p => p.id === step.poseId) || poses[0];
        setCurrentPose(pose);
      } else {
        const pose = id === 'auto-detect'
          ? { id: 'auto-detect', name: '✨ Auto-Detect Pose', sanskritName: 'Automatic Scanner', jointAngles: {} }
          : (poses.find(p => p.id === id) || poses[0]);
        setCurrentPose(pose);
      }
    }
  }, [poses, id, activeFlow, flowStepIdx]);

  // Calibration States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [voiceCoaching, setVoiceCoaching] = useState(true);
  const [isSessionRunning, setIsSessionRunning] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  
  // HUD Stats
  const [accuracy, setAccuracy] = useState(62);
  const [holdTime, setHoldTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [caloriesAccumulated, setCaloriesAccumulated] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState('Position yourself in full frame to calibrate.');

  // Animation and simulation control
  const [jointOffsets, setJointOffsets] = useState({});

  // Dynamically initialize joint offsets based on the target pose joint angles
  useEffect(() => {
    if (currentPose) {
      const targets = currentPose.jointAngles || currentPose.joint_angles || {
        rightKnee: { target: 90, tolerance: 8 },
        rightElbow: { target: 180, tolerance: 10 },
        torsoAngle: { target: 90, tolerance: 5 }
      };
      const initialOffsets = {};
      Object.keys(targets).forEach(joint => {
        initialOffsets[joint] = Math.floor(Math.random() * 10) + 12; // 12 to 22 degrees offset
      });
      setJointOffsets(initialOffsets);
    }
  }, [currentPose]);

  // Track speech prompts to prevent overlapping speech
  const lastSpokenTime = useRef(0);

  // MediaPipe tracking refs & state
  const poseModelRef = useRef(null);
  const mpCameraRef = useRef(null);
  const [currentLandmarks, setCurrentLandmarks] = useState(null);
  const lastAnalysisTimeRef = useRef(0);

  // Camera Calibration States
  const [sessionId, setSessionId] = useState(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [tiltAngle, setTiltAngle] = useState(0);

  // Explainable AI (XAI) States
  const [xaiOpen, setXaiOpen] = useState(false);
  const [xaiLoading, setXaiLoading] = useState(false);
  const [xaiExplanation, setXaiExplanation] = useState('');
  const [xaiJoint, setXaiJoint] = useState('');

  // Coaching Hub / Corrections States
  const [jointDetails, setJointDetails] = useState({});
  const [rightPanelMode, setRightPanelMode] = useState('twin'); // 'twin' | 'corrections'
  const [expandedInsights, setExpandedInsights] = useState({}); // { [joint]: explanation }
  const [loadingInsights, setLoadingInsights] = useState({}); // { [joint]: boolean }

  // Auto-Capture States
  const [captureCountdown, setCaptureCountdown] = useState(null);
  const [capturedAnalysis, setCapturedAnalysis] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleToggleInsight = async (jointName) => {
    if (expandedInsights[jointName]) {
      setExpandedInsights(prev => ({ ...prev, [jointName]: null }));
      return;
    }

    setLoadingInsights(prev => ({ ...prev, [jointName]: true }));
    try {
      const deviation = jointOffsets[jointName] || 0;
      const res = await api.getBiomechanicalExplanation(currentPose.id, jointName, deviation);
      if (res && res.explanation) {
        setExpandedInsights(prev => ({ ...prev, [jointName]: res.explanation }));
      } else {
        setExpandedInsights(prev => ({ ...prev, [jointName]: "No anatomical explanation available." }));
      }
    } catch (e) {
      console.warn("Failed to get explanation:", e);
      setExpandedInsights(prev => ({ ...prev, [jointName]: "Error communicating with AI coach." }));
    } finally {
      setLoadingInsights(prev => ({ ...prev, [jointName]: false }));
    }
  };

  const startAutoCapture = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setCaptureCountdown(5);
    speakFeedback("Starting auto-capture countdown. 5 seconds.");

    let count = 5;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCaptureCountdown(count);
        speakFeedback(count.toString());
      } else {
        clearInterval(interval);
        setCaptureCountdown(0);
        speakFeedback("Capturing!");
        setTimeout(() => {
          triggerCaptureAnalysis();
          setIsCapturing(false);
          setCaptureCountdown(null);
        }, 300);
      }
    }, 1000);
  };

  const triggerCaptureAnalysis = async () => {
    const lms = currentLandmarks;
    if (!lms) {
      alert("No pose landmarks detected from the camera. Please make sure the camera is active and tracking your body.");
      return;
    }

    let capturedPhotoUrl = null;
    const video = videoRef.current;
    if (video && cameraActive) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        capturedPhotoUrl = canvas.toDataURL('image/jpeg');
      } catch (err) {
        console.warn("Failed to capture video snapshot", err);
      }
    }

    try {
      setFeedbackMsg("Analyzing captured posture...");
      const response = await api.analyzePose(currentPose.id, lms, sessionId);
      if (response) {
        setCapturedAnalysis({
          poseName: currentPose.id === 'auto-detect' ? (detectedPose?.name || 'Detected Pose') : currentPose.name,
          accuracy: response.accuracy,
          feedback: response.feedback,
          jointDetails: response.joint_details,
          tiltAngle: response.tilt_angle,
          capturedLandmarks: lms,
          photoUrl: capturedPhotoUrl
        });
        speakFeedback(`Capture complete. Pose accuracy: ${response.accuracy} percent.`);
      }
    } catch (e) {
      console.error("Failed to analyze captured pose:", e);
      setFeedbackMsg("Failed to analyze captured pose.");
      alert("Error calling the analysis API: " + e.message);
    }
  };

  const getJointMetrics = (joint, data) => {
    const targetVal = typeof data === 'object' && data !== null ? (data.target || 90) : (data || 90);
    const tolerance = typeof data === 'object' && data !== null ? (data.tolerance || 10) : 10;
    const deviation = jointOffsets[joint] || 0;
    
    if (jointDetails && jointDetails[joint]) {
      return {
        target: jointDetails[joint].target,
        actual: jointDetails[joint].actual,
        tolerance: jointDetails[joint].tolerance,
        deviation: jointDetails[joint].deviation,
        aligned: jointDetails[joint].aligned
      };
    }
    
    const direction = joint.toLowerCase().includes('flex') || joint.toLowerCase().includes('bend') ? -1 : 1;
    const actualVal = targetVal + (deviation * direction);
    const aligned = deviation <= tolerance;
    
    return {
      target: targetVal,
      actual: actualVal,
      tolerance: tolerance,
      deviation: deviation,
      aligned: aligned
    };
  };

  const getCorrectionAdvice = (joint, detail) => {
    const label = getJointLabel(joint).toLowerCase();
    const diff = Math.round(detail.actual - detail.target);
    if (diff < 0) {
      return `Straighten or open your ${label} by about ${Math.abs(diff)}°.`;
    } else {
      return `Bend or close down your ${label} by about ${diff}°.`;
    }
  };

  const handleShowExplanation = async (jointName) => {
    setXaiJoint(jointName);
    setXaiLoading(true);
    setXaiOpen(true);
    setXaiExplanation('');

    try {
      const deviation = jointOffsets[jointName] || 0;
      const res = await api.getBiomechanicalExplanation(currentPose.id, jointName, deviation);
      if (res && res.explanation) {
        setXaiExplanation(res.explanation);
      } else {
        setXaiExplanation("Failed to retrieve anatomical explanation. Please try again.");
      }
    } catch (e) {
      console.warn("Failed to get explanation:", e);
      setXaiExplanation("Error communicating with AI coach.");
    } finally {
      setXaiLoading(false);
    }
  };

  // Wearable Bluetooth States & Refs
  const bleDeviceRef = useRef(null);
  const bleSimIntervalRef = useRef(null);
  const [isBleConnected, setIsBleConnected] = useState(false);
  const [isBleConnecting, setIsBleConnecting] = useState(false);
  const [heartRate, setHeartRate] = useState(null);
  const [rollingRR, setRollingRR] = useState([]);
  const [hrv, setHrv] = useState(0);
  const [sessionHRs, setSessionHRs] = useState([]);
  const [sessionHRVs, setSessionHRVs] = useState([]);
  const [bleError, setBleError] = useState(null);

  const handleSimulateBluetooth = () => {
    setIsBleConnecting(true);
    setBleError(null);
    if (bleSimIntervalRef.current) {
      clearInterval(bleSimIntervalRef.current);
    }
    
    setTimeout(() => {
      setIsBleConnecting(false);
      setIsBleConnected(true);
      setFeedbackMsg("Simulated heart rate monitor connected.");
      speakFeedback("Simulated heart rate monitor connected.");
      
      let baseHr = 75;
      bleSimIntervalRef.current = setInterval(() => {
        const hrVal = baseHr + Math.floor(Math.random() * 9) - 4; // 71 - 80 BPM
        const hrvVal = 55 + Math.floor(Math.random() * 11) - 5; // 50 - 60 MS
        
        setHeartRate(hrVal);
        setHrv(hrvVal);
        setSessionHRs(prev => [...prev, hrVal]);
        setSessionHRVs(prev => [...prev, hrvVal]);
      }, 2000);
    }, 1000);
  };

  const handleDisconnectBluetooth = () => {
    if (bleSimIntervalRef.current) {
      clearInterval(bleSimIntervalRef.current);
      bleSimIntervalRef.current = null;
    }
    if (bleDeviceRef.current && bleDeviceRef.current.gatt.connected) {
      bleDeviceRef.current.gatt.disconnect();
    }
    bleDeviceRef.current = null;
    setIsBleConnected(false);
    setHeartRate(null);
    setHrv(0);
    setFeedbackMsg("Wearable disconnected.");
    speakFeedback("Heart rate monitor disconnected.");
  };

  const handleConnectBluetooth = async () => {
    setIsBleConnecting(true);
    setBleError(null);
    if (bleSimIntervalRef.current) {
      clearInterval(bleSimIntervalRef.current);
      bleSimIntervalRef.current = null;
    }

    if (!navigator.bluetooth) {
      setBleError("Web Bluetooth is not supported on this browser. Use Google Chrome or Microsoft Edge on Android or macOS.");
      setIsBleConnecting(false);
      return;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }]
      });
      bleDeviceRef.current = device;

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');

      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value;
        const flags = value.getUint8(0);
        const rate16 = flags & 0x01;
        let offset = 1;
        const hrVal = rate16 ? value.getUint16(offset, true) : value.getUint8(offset);
        offset += rate16 ? 2 : 1;

        setHeartRate(hrVal);
        setSessionHRs(prev => [...prev, hrVal]);

        // Parse RR intervals
        const rrPresent = flags & 0x10;
        if (rrPresent) {
          const rrVals = [];
          while (offset < value.byteLength) {
            const rrValue = value.getUint16(offset, true);
            const rrMs = (rrValue / 1024) * 1000;
            rrVals.push(rrMs);
            offset += 2;
          }
          if (rrVals.length > 0) {
            setRollingRR(prev => {
              const updated = [...prev, ...rrVals].slice(-20);
              if (updated.length >= 2) {
                let sumSqDiff = 0;
                let count = 0;
                for (let i = 0; i < updated.length - 1; i++) {
                  const diff = updated[i+1] - updated[i];
                  sumSqDiff += diff * diff;
                  count++;
                }
                const calculatedHrv = Math.round(Math.sqrt(sumSqDiff / count));
                setHrv(calculatedHrv);
                setSessionHRVs(prevHrvs => [...prevHrvs, calculatedHrv]);
              }
              return updated;
            });
          }
        }
      });

      await characteristic.startNotifications();
      setIsBleConnected(true);
      setFeedbackMsg("Heart rate monitor connected via Bluetooth.");
      speakFeedback("Heart rate monitor connected.");

      device.addEventListener('gattserverdisconnected', () => {
        setIsBleConnected(false);
        setHeartRate(null);
        setHrv(0);
        setFeedbackMsg("Wearable disconnected.");
        speakFeedback("Heart rate monitor disconnected.");
      });

    } catch (err) {
      console.warn("Bluetooth connection failed:", err);
      if (err.name === 'NotFoundError') {
        setBleError("Connection cancelled by user.");
      } else if (err.name === 'SecurityError') {
        setBleError("Bluetooth permission blocked by browser security policy. Please allow Bluetooth access.");
      } else {
        setBleError(err.message || "Failed to connect to wearable device.");
      }
    } finally {
      setIsBleConnecting(false);
    }
  };

  // --- NEW FEATURES STATES & REFS ---
  const [soundVolumes, setSoundVolumes] = useState({
    singingBowls: 0.15,
    oceanBreeze: 0.10,
    binauralBeats: 0.04
  });
  const [soundscapeActive, setSoundscapeActive] = useState(false);
  const audioCtxRef = useRef(null);
  const singingBowlNodeRef = useRef(null);
  const oceanBreezeNodeRef = useRef(null);
  const binauralNodeRef = useRef(null);
  const gainsRef = useRef({});

  // Breath Pacer Mandala
  const [breathState, setBreathState] = useState('Inhale'); // Inhale | Hold | Exhale | Ready
  const [breathPercent, setBreathPercent] = useState(0);

  const stopAmbientSynth = () => {
    if (singingBowlNodeRef.current) {
      singingBowlNodeRef.current.forEach(osc => {
        try { osc.stop(); } catch(e){}
      });
      singingBowlNodeRef.current = null;
    }
    if (oceanBreezeNodeRef.current) {
      const { source, lfo } = oceanBreezeNodeRef.current;
      try { source.stop(); } catch(e){}
      try { lfo.stop(); } catch(e){}
      oceanBreezeNodeRef.current = null;
    }
    if (binauralNodeRef.current) {
      const { leftOsc, rightOsc } = binauralNodeRef.current;
      try { leftOsc.stop(); } catch(e){}
      try { rightOsc.stop(); } catch(e){}
      binauralNodeRef.current = null;
    }
    setSoundscapeActive(false);
  };

  const startAmbientSynth = () => {
    if (soundscapeActive) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // 1. Tibetan Singing Bowls Drone (A2, E3, A3 sine waves)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc3.type = 'sine';
      
      osc1.frequency.setValueAtTime(110, ctx.currentTime);
      osc2.frequency.setValueAtTime(165, ctx.currentTime);
      osc3.frequency.setValueAtTime(220, ctx.currentTime);

      const g1 = ctx.createGain();
      const g2 = ctx.createGain();
      const g3 = ctx.createGain();
      g1.gain.setValueAtTime(0.08, ctx.currentTime);
      g2.gain.setValueAtTime(0.04, ctx.currentTime);
      g3.gain.setValueAtTime(0.02, ctx.currentTime);

      osc1.connect(g1);
      osc2.connect(g2);
      osc3.connect(g3);

      const bowlsMasterGain = ctx.createGain();
      bowlsMasterGain.gain.setValueAtTime(soundVolumes.singingBowls, ctx.currentTime);

      g1.connect(bowlsMasterGain);
      g2.connect(bowlsMasterGain);
      g3.connect(bowlsMasterGain);
      bowlsMasterGain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc3.start();

      singingBowlNodeRef.current = [osc1, osc2, osc3];
      gainsRef.current.singingBowls = bowlsMasterGain;

      // 2. Ocean Breeze White Noise
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, ctx.currentTime);
      filter.Q.setValueAtTime(1, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(180, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      const windMasterGain = ctx.createGain();
      windMasterGain.gain.setValueAtTime(soundVolumes.oceanBreeze, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(windMasterGain);
      windMasterGain.connect(ctx.destination);

      whiteNoise.start();
      lfo.start();

      oceanBreezeNodeRef.current = { source: whiteNoise, lfo };
      gainsRef.current.oceanBreeze = windMasterGain;

      // 3. Binaural Focus (Alpha Wave: 200Hz Left / 208Hz Right)
      const leftOsc = ctx.createOscillator();
      const rightOsc = ctx.createOscillator();
      leftOsc.type = 'sine';
      rightOsc.type = 'sine';
      
      leftOsc.frequency.setValueAtTime(200, ctx.currentTime);
      rightOsc.frequency.setValueAtTime(208, ctx.currentTime);

      const leftGain = ctx.createGain();
      const rightGain = ctx.createGain();
      leftGain.gain.setValueAtTime(0.05, ctx.currentTime);
      rightGain.gain.setValueAtTime(0.05, ctx.currentTime);

      leftOsc.connect(leftGain);
      rightOsc.connect(rightGain);

      const binMasterGain = ctx.createGain();
      binMasterGain.gain.setValueAtTime(soundVolumes.binauralBeats, ctx.currentTime);

      if (ctx.createStereoPanner) {
        const leftPanner = ctx.createStereoPanner();
        const rightPanner = ctx.createStereoPanner();
        leftPanner.pan.setValueAtTime(-1, ctx.currentTime);
        rightPanner.pan.setValueAtTime(1, ctx.currentTime);
        
        leftGain.connect(leftPanner);
        rightGain.connect(rightPanner);
        leftPanner.connect(binMasterGain);
        rightPanner.connect(binMasterGain);
      } else {
        leftGain.connect(binMasterGain);
        rightGain.connect(binMasterGain);
      }
      
      binMasterGain.connect(ctx.destination);
      gainsRef.current.binauralBeats = binMasterGain;

      leftOsc.start();
      rightOsc.start();

      binauralNodeRef.current = { leftOsc, rightOsc };
      setSoundscapeActive(true);
    } catch (e) {
      console.error("Web Audio initialization failed:", e);
    }
  };

  const handleVolumeChange = (type, val) => {
    const numericVal = parseFloat(val);
    setSoundVolumes(prev => ({
      ...prev,
      [type]: numericVal
    }));
    if (gainsRef.current[type] && audioCtxRef.current) {
      gainsRef.current[type].gain.setValueAtTime(numericVal, audioCtxRef.current.currentTime);
    }
  };

  // Auto toggle ambient soundscapes with session
  useEffect(() => {
    if (isSessionRunning) {
      startAmbientSynth();
    } else {
      stopAmbientSynth();
    }
  }, [isSessionRunning]);

  // Clean up Web Audio nodes and Bluetooth simulator on unmount
  useEffect(() => {
    return () => {
      if (bleSimIntervalRef.current) {
        clearInterval(bleSimIntervalRef.current);
      }
      if (singingBowlNodeRef.current) {
        singingBowlNodeRef.current.forEach(osc => { try { osc.stop(); } catch(e){} });
      }
      if (oceanBreezeNodeRef.current) {
        try { oceanBreezeNodeRef.current.source.stop(); } catch(e){}
        try { oceanBreezeNodeRef.current.lfo.stop(); } catch(e){}
      }
      if (binauralNodeRef.current) {
        try { binauralNodeRef.current.leftOsc.stop(); } catch(e){}
        try { binauralNodeRef.current.rightOsc.stop(); } catch(e){}
      }
    };
  }, []);

  // Breath Pacer Mandala Loop
  useEffect(() => {
    let timer = null;
    if (isSessionRunning) {
      const cycleDuration = 16000;
      const startTime = Date.now();
      timer = setInterval(() => {
        const elapsed = (Date.now() - startTime) % cycleDuration;
        const stage = Math.floor(elapsed / 4000);
        const progress = (elapsed % 4000) / 4000;
        
        if (stage === 0) {
          setBreathState('Inhale');
          setBreathPercent(Math.round(progress * 100));
        } else if (stage === 1) {
          setBreathState('Hold');
          setBreathPercent(100);
        } else if (stage === 2) {
          setBreathState('Exhale');
          setBreathPercent(Math.round((1 - progress) * 100));
        } else {
          setBreathState('Hold');
          setBreathPercent(0);
        }
      }, 100);
    } else {
      setBreathState('Ready');
      setBreathPercent(0);
    }
    return () => clearInterval(timer);
  }, [isSessionRunning]);

  // Chime synthesiser using Web Audio
  const playFlowChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = audioCtxRef.current || new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.12); // G5
      
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("Chime failed", e);
    }
  };

  const handleFinishFlowSession = async () => {
    const xp = Math.round(elapsedTime * 2.5 + caloriesAccumulated * 3 + 150);
    const avgHR = sessionHRs.length > 0 ? Math.round(sessionHRs.reduce((a, b) => a + b, 0) / sessionHRs.length) : null;
    const avgHRV = sessionHRVs.length > 0 ? Math.round(sessionHRVs.reduce((a, b) => a + b, 0) / sessionHRVs.length) : null;

    const payload = {
      pose_id: activeFlow.id,
      pose_name: activeFlow.name,
      accuracy: accuracy,
      duration: elapsedTime,
      calories: Math.round(caloriesAccumulated),
      xp_earned: xp,
      is_flow: true,
      heart_rate: avgHR,
      hrv: avgHRV
    };

    if (api.isAuthenticated()) {
      try {
        await api.logSession(payload);
        window.dispatchEvent(new Event('practice-session-logged'));
      } catch (e) {
        console.warn("Failed to log flow session to backend:", e);
      }
    }

    // Navigate to summary carrying performance details for the whole flow
    navigate('/summary', {
      state: {
        poseId: activeFlow.id,
        poseName: activeFlow.name,
        accuracy: accuracy,
        duration: elapsedTime,
        calories: Math.round(caloriesAccumulated),
        xpEarned: xp,
        isFlow: true,
        steps: activeFlow.steps,
        heartRate: avgHR,
        hrv: avgHRV
      }
    });
  };

  // Sync flow step when flowStepIdx changes
  useEffect(() => {
    if (activeFlow && activeFlow.steps.length > 0) {
      const step = activeFlow.steps[flowStepIdx];
      const pose = poses.find(p => p.id === step.poseId) || poses[0];
      setCurrentPose(pose);
      setHoldTime(0);
      setFlowHoldTimer(step.duration);
      setFeedbackMsg(`Flow Pose ${flowStepIdx + 1}: Hold ${pose.name}. Get ready.`);
    }
  }, [activeFlow, flowStepIdx, poses]);

  // Sync selected pose if URL parameter changes (only when not in flow mode)
  useEffect(() => {
    if (activeFlow) return;
    if (id === 'auto-detect') {
      setCurrentPose({ id: 'auto-detect', name: '✨ Auto-Detect Pose', sanskritName: 'Automatic Scanner', jointAngles: {} });
      setDetectedPose(null);
      setHoldTime(0);
      setAccuracy(62);
      setFeedbackMsg("Automatic posture detection active. Stand in frame.");
    } else {
      const pose = poses.find(p => p.id === id);
      if (pose) {
        setCurrentPose(pose);
        setDetectedPose(null);
        setHoldTime(0);
        setAccuracy(62);
        setFeedbackMsg(`Pose changed to ${pose.name}. Get ready.`);
      }
    }
  }, [id, activeFlow, poses]);

  // Webcam activation & MediaPipe setup logic
  useEffect(() => {
    if (cameraActive) {
      if (typeof window.Pose === 'undefined' || typeof window.Camera === 'undefined') {
        setCameraError(true);
        setFeedbackMsg("MediaPipe scripts not loaded. Running in simulated HUD mode.");
        return;
      }

      try {
        const pose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        pose.onResults((results) => {
          if (results.poseLandmarks) {
            setCurrentLandmarks(results.poseLandmarks);
          }
        });

        poseModelRef.current = pose;

        if (videoRef.current) {
          const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && cameraActive) {
                try {
                  await pose.send({ image: videoRef.current });
                } catch (err) {
                  console.error("Error sending frame to MediaPipe Pose:", err);
                }
              }
            },
            width: 640,
            height: 480
          });
          
          camera.start()
            .then(() => {
              setCameraError(false);
              setFeedbackMsg("Webcam connected. Real-time pose tracking active.");
            })
            .catch((err) => {
              console.error("MediaPipe camera start error:", err);
              setCameraError(true);
              setCameraActive(false);
              setFeedbackMsg("Camera access denied or failed to start.");
            });

          mpCameraRef.current = camera;
        }
      } catch (err) {
        console.error("MediaPipe Pose initialization error:", err);
        setCameraError(true);
        setCameraActive(false);
        setFeedbackMsg("Failed to initialize MediaPipe Pose.");
      }
    } else {
      // Clean up camera and model
      if (mpCameraRef.current) {
        try { mpCameraRef.current.stop(); } catch(e){}
        mpCameraRef.current = null;
      }
      if (poseModelRef.current) {
        try { poseModelRef.current.close(); } catch(e){}
        poseModelRef.current = null;
      }
      setCurrentLandmarks(null);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (mpCameraRef.current) {
        try { mpCameraRef.current.stop(); } catch(e){}
      }
      if (poseModelRef.current) {
        try { poseModelRef.current.close(); } catch(e){}
      }
    };
  }, [cameraActive]);

  // Demo Mode landmarks generator
  useEffect(() => {
    let interval = null;
    if (demoMode && isSessionRunning) {
      setCameraActive(true);
      interval = setInterval(() => {
        const poseKey = currentPose.id === 'auto-detect' ? (detectedPose?.id || 'warrior-ii') : currentPose.id;
        const mockLms = generateMockLandmarks(poseKey);
        setCurrentLandmarks(mockLms);
      }, 400);
    }
    return () => clearInterval(interval);
  }, [demoMode, isSessionRunning, currentPose, detectedPose]);

  // Real-time Pose Analysis API integration
  useEffect(() => {
    if (!isSessionRunning || !currentLandmarks || !cameraActive) return;

    const now = Date.now();
    if (now - lastAnalysisTimeRef.current > 300) {
      lastAnalysisTimeRef.current = now;

      const runAnalysis = async () => {
        try {
          const response = await api.analyzePose(currentPose.id, currentLandmarks, sessionId);
          if (response) {
            // Update calibration status
            setIsCalibrated(response.is_calibrated ?? false);
            setCalibrationProgress(response.calibration_progress ?? 0);
            setTiltAngle(response.tilt_angle ?? 0);

            setAccuracy(response.accuracy);
            setFeedbackMsg(response.feedback);
            
            // If pose was auto-detected, update detectedPose in frontend!
            if (currentPose.id === 'auto-detect' && response.detected_pose_id) {
              const matched = poses.find(p => p.id === response.detected_pose_id);
              if (matched && (!detectedPose || detectedPose.id !== matched.id)) {
                setDetectedPose(matched);
                speakFeedback(`Detected pose: ${matched.name}.`);
              }
            } else if (currentPose.id === 'auto-detect' && !response.detected_pose_id) {
              setDetectedPose(null);
            }

            const newOffsets = {};
            if (response.joint_details) {
              Object.entries(response.joint_details).forEach(([joint, detail]) => {
                newOffsets[joint] = detail.deviation;
              });
              setJointOffsets(newOffsets);
              setJointDetails(response.joint_details);
            }
          }
        } catch (err) {
          console.warn("Pose analysis API error:", err);
        }
      };

      runAnalysis();
    }
  }, [currentLandmarks, isSessionRunning, currentPose, cameraActive, sessionId, detectedPose, poses]);

  // Speech synthesis coach helper
  const speakFeedback = (text) => {
    if (!voiceCoaching || !('speechSynthesis' in window)) return;
    const now = Date.now();
    // Throttle speech synthesis to once every 5 seconds
    if (now - lastSpokenTime.current > 5000) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
      lastSpokenTime.current = now;
    }
  };

  // Main session ticks & metrics simulator (and hold progress checker)
  useEffect(() => {
    let timer = null;
    if (isSessionRunning) {
      timer = setInterval(() => {
        // Increment total session elapsed time
        setElapsedTime(prev => prev + 1);

        // Accumulate calories based on accuracy and pose difficulty
        setCaloriesAccumulated(prev => {
          const factor = currentPose.difficulty === 'Advanced' ? 0.35 : currentPose.difficulty === 'Intermediate' ? 0.25 : 0.15;
          return parseFloat((prev + factor * (accuracy / 90)).toFixed(1));
        });

        // Handle simulated or real metric convergence
        if (!cameraActive) {
          // Simulate joint posture correction tracking dynamically
          setJointOffsets(prev => {
            const nextOffsets = {};
            Object.keys(prev).forEach(joint => {
              const currentOffset = prev[joint];
              const decrement = Math.random() > 0.4 ? (joint.toLowerCase().includes('angle') ? 0.5 : 1) : 0;
              nextOffsets[joint] = Math.max(currentOffset - decrement, 0);
            });
            
            const totalOffset = Object.values(nextOffsets).reduce((sum, val) => sum + Math.round(val), 0);
            
            if (activeFlow) {
              // Flow Mode hold timer check
              if (totalOffset <= 8) {
                setFlowHoldTimer(t => {
                  if (t <= 1) {
                    playFlowChime();
                    setTimeout(() => {
                      setFlowStepIdx(idx => {
                        if (idx < activeFlow.steps.length - 1) {
                          return idx + 1;
                        } else {
                          handleFinishFlowSession();
                          return idx;
                        }
                      });
                    }, 100);
                    return 0;
                  }
                  return t - 1;
                });
              }
            } else {
              // Single Pose Mode hold timer check
              if (totalOffset === 0) {
                setHoldTime(h => {
                  if (h >= currentPose.duration - 1) {
                    handleFinishSession();
                    return currentPose.duration;
                  }
                  return h + 1;
                });
              } else {
                setHoldTime(0);
              }
            }
            
            return nextOffsets;
          });
        } else {
          // For real MediaPipe camera mode, check hold progress directly from accuracy/offsets
          const totalOffset = Object.values(jointOffsets).reduce((sum, val) => sum + Math.round(val), 0);
          
          if (activeFlow) {
            if (totalOffset <= 15) { // Real threshold tolerance for the flow transition
              setFlowHoldTimer(t => {
                if (t <= 1) {
                  playFlowChime();
                  setTimeout(() => {
                    setFlowStepIdx(idx => {
                      if (idx < activeFlow.steps.length - 1) {
                        return idx + 1;
                      } else {
                        handleFinishFlowSession();
                        return idx;
                      }
                    });
                  }, 100);
                  return 0;
                }
                return t - 1;
              });
            }
          } else {
            if (accuracy >= 80) { // Keep holding if accuracy is high
              setHoldTime(h => {
                if (h >= currentPose.duration - 1) {
                  handleFinishSession();
                  return currentPose.duration;
                }
                return h + 1;
              });
            } else {
              setHoldTime(0);
            }
          }
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSessionRunning, accuracy, currentPose, activeFlow, flowStepIdx, cameraActive, jointOffsets]);

  // Recalculate accuracy based on simulated joint offsets, and update feedback message
  useEffect(() => {
    if (cameraActive) return; // Skip if camera is active (handled by backend analysis)
    
    const totalOffset = Object.values(jointOffsets).reduce((sum, val) => sum + Math.round(val), 0);
    const currentAccuracy = Math.max(100 - totalOffset, 60);
    setAccuracy(currentAccuracy);

    // Dynamic HUD feed message and Voice Coach
    if (isSessionRunning) {
      if (activeFlow) {
        if (totalOffset <= 8) {
          setFeedbackMsg("Perfect alignment! Hold pose steadily.");
          speakFeedback("Perfect posture. Hold it.");
        } else {
          const misalignedJoint = Object.keys(jointOffsets).find(joint => jointOffsets[joint] > 5);
          if (misalignedJoint) {
            const label = getJointLabel(misalignedJoint);
            const val = Math.round(jointOffsets[misalignedJoint]);
            setFeedbackMsg(`Flow: Adjust your ${label} (offset ${val}°).`);
            speakFeedback(`Adjust your ${label}.`);
          } else {
            setFeedbackMsg("Flow: Fine-tune posture to match calibration grid.");
          }
        }
      } else {
        if (totalOffset === 0) {
          setFeedbackMsg("Perfect alignment! Hold the pose steadily.");
          speakFeedback("Perfect posture. Hold it.");
        } else {
          const misalignedJoint = Object.keys(jointOffsets).find(joint => jointOffsets[joint] > 5);
          if (misalignedJoint) {
            const label = getJointLabel(misalignedJoint);
            const val = Math.round(jointOffsets[misalignedJoint]);
            setFeedbackMsg(`Adjusting: Align your ${label} (offset ${val}°).`);
            speakFeedback(`Align your ${label}.`);
          } else {
            setFeedbackMsg("Slight shift: Adjust pose slightly to reach 100% accuracy.");
          }
        }
      }
    }
  }, [jointOffsets, isSessionRunning, currentPose, activeFlow]);

  const handleStartStop = () => {
    if (!isSessionRunning) {
      setIsSessionRunning(true);
      if (!sessionId) {
        const sid = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
        setSessionId(sid);
        setIsCalibrated(false);
        setCalibrationProgress(0);
        setTiltAngle(0);
        setSessionHRs([]);
        setSessionHRVs([]);
        setFeedbackMsg("Session started. Calibrating camera perspective...");
        speakFeedback("Assessment starting. Please stand in full view to calibrate.");
      } else {
        setFeedbackMsg("Session resumed.");
        speakFeedback("Session resumed.");
      }
    } else {
      setIsSessionRunning(false);
      setFeedbackMsg("Session paused.");
    }
  };

  const handleReset = () => {
    setIsSessionRunning(false);
    setSessionId(null);
    setIsCalibrated(false);
    setCalibrationProgress(0);
    setTiltAngle(0);
    setHeartRate(null);
    setHrv(0);
    setSessionHRs([]);
    setSessionHRVs([]);
    setElapsedTime(0);
    setHoldTime(0);
    setCaloriesAccumulated(0);
    setAccuracy(62);
    const targets = currentPose.jointAngles || currentPose.joint_angles || {
      rightKnee: { target: 90, tolerance: 8 },
      rightElbow: { target: 180, tolerance: 10 },
      torsoAngle: { target: 90, tolerance: 5 }
    };
    const initialOffsets = {};
    Object.keys(targets).forEach(joint => {
      initialOffsets[joint] = Math.floor(Math.random() * 10) + 12;
    });
    setJointOffsets(initialOffsets);
    setFeedbackMsg("Session reset. Calibrating...");
  };

  const handleFinishSession = async () => {
    const xp = Math.round(elapsedTime * 2 + caloriesAccumulated * 3 + (accuracy > 85 ? 100 : 0));
    const avgHR = sessionHRs.length > 0 ? Math.round(sessionHRs.reduce((a, b) => a + b, 0) / sessionHRs.length) : null;
    const avgHRV = sessionHRVs.length > 0 ? Math.round(sessionHRVs.reduce((a, b) => a + b, 0) / sessionHRVs.length) : null;

    const finalPoseId = currentPose.id === 'auto-detect' ? (detectedPose?.id || 'auto-detect') : currentPose.id;
    const finalPoseName = currentPose.id === 'auto-detect' ? (detectedPose?.name || 'Auto-Detected Session') : currentPose.name;

    const payload = {
      pose_id: finalPoseId,
      pose_name: finalPoseName,
      accuracy: accuracy,
      duration: elapsedTime,
      calories: Math.round(caloriesAccumulated),
      xp_earned: xp,
      is_flow: false,
      heart_rate: avgHR,
      hrv: avgHRV
    };

    if (api.isAuthenticated()) {
      try {
        await api.logSession(payload);
        window.dispatchEvent(new Event('practice-session-logged'));
      } catch (e) {
        console.warn("Failed to log session to backend:", e);
      }
    }

    // Navigate to summary carrying performance details
    navigate('/summary', {
      state: {
        poseId: finalPoseId,
        poseName: finalPoseName,
        accuracy: accuracy,
        duration: elapsedTime,
        calories: Math.round(caloriesAccumulated),
        xpEarned: xp,
        isFlow: false,
        heartRate: avgHR,
        hrv: avgHRV
      }
    });
  };

  // Helper to get landmark coordinates mapped to SVG coordinate space
  const getLMCoords = (idx) => {
    if (!currentLandmarks || !currentLandmarks[idx]) {
      return { x: 0, y: 0 };
    }
    const lm = currentLandmarks[idx];
    return {
      x: (1 - lm.x) * 300,
      y: lm.y * 300
    };
  };

  const template = skeletonTemplates2D[currentPose.id] || skeletonTemplates2D['warrior-ii'];

  let headX, headY, shoulderX, shoulderY, hipX, hipY;
  let leftElbowX, leftElbowY, leftWristX, leftWristY, leftKneeX, leftKneeY, leftAnkleX, leftAnkleY;
  let rightElbowX, rightElbowY, rightWristX, rightWristY, rightKneeX, rightKneeY, rightAnkleX, rightAnkleY;

  if (cameraActive && currentLandmarks && currentLandmarks.length >= 33) {
    const nose = getLMCoords(0);
    const leftShoulder = getLMCoords(11);
    const rightShoulder = getLMCoords(12);
    const leftHip = getLMCoords(23);
    const rightHip = getLMCoords(24);

    headX = nose.x;
    headY = nose.y;

    shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
    shoulderY = (leftShoulder.y + rightShoulder.y) / 2;

    hipX = (leftHip.x + rightHip.x) / 2;
    hipY = (leftHip.y + rightHip.y) / 2;

    const leftElbow = getLMCoords(13);
    leftElbowX = leftElbow.x;
    leftElbowY = leftElbow.y;

    const leftWrist = getLMCoords(15);
    leftWristX = leftWrist.x;
    leftWristY = leftWrist.y;

    const leftKnee = getLMCoords(25);
    leftKneeX = leftKnee.x;
    leftKneeY = leftKnee.y;

    const leftAnkle = getLMCoords(27);
    leftAnkleX = leftAnkle.x;
    leftAnkleY = leftAnkle.y;

    const rightElbow = getLMCoords(14);
    rightElbowX = rightElbow.x;
    rightElbowY = rightElbow.y;

    const rightWrist = getLMCoords(16);
    rightWristX = rightWrist.x;
    rightWristY = rightWrist.y;

    const rightKnee = getLMCoords(26);
    rightKneeX = rightKnee.x;
    rightKneeY = rightKnee.y;

    const rightAnkle = getLMCoords(28);
    rightAnkleX = rightAnkle.x;
    rightAnkleY = rightAnkle.y;
  } else {
    headX = template.head.x;
    headY = template.head.y;
    shoulderX = template.shoulder.x;
    shoulderY = template.shoulder.y;
    hipX = template.hip.x;
    hipY = template.hip.y;
    
    leftElbowX = template.leftElbow.x;
    leftElbowY = template.leftElbow.y;
    leftWristX = template.leftWrist.x;
    leftWristY = template.leftWrist.y;
    leftKneeX = template.leftKnee.x;
    leftKneeY = template.leftKnee.y;
    leftAnkleX = template.leftAnkle.x;
    leftAnkleY = template.leftAnkle.y;
   
    const kneeOffset = jointOffsets.kneeAngle || jointOffsets.rightKnee || 0;
    const elbowOffset = jointOffsets.elbowAngle || jointOffsets.rightElbow || 0;
    
    rightElbowX = template.rightElbow.x;
    rightElbowY = template.rightElbow.y - elbowOffset * 1.2;
    rightWristX = template.rightWrist.x;
    rightWristY = template.rightWrist.y - elbowOffset * 1.5;
    
    rightKneeX = template.rightKnee.x + kneeOffset * 0.8;
    rightKneeY = template.rightKnee.y - kneeOffset * 0.3;
    rightAnkleX = template.rightAnkle.x;
    rightAnkleY = template.rightAnkle.y;
  }

  const currentMisalignedJoint = Object.keys(jointOffsets).find(joint => jointOffsets[joint] > 5);

  return (
    <div className="space-y-6 text-left">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">AI Training Room</h1>
          <p className="text-slate-400 text-sm font-light">Interact with the real-time AI joint tracker simulation.</p>
        </div>
        
        {/* Dynamic Pose Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Select Pose:</span>
          <select
            value={currentPose.id}
            onChange={(e) => {
               const val = e.target.value;
               if (val === 'auto-detect') {
                 navigate('/trainer/auto-detect');
               } else {
                 const selected = poses.find(p => p.id === val);
                 if (selected) navigate(`/trainer/${selected.id}`);
               }
            }}
            disabled={activeFlow !== null}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="auto-detect">✨ Auto-Detect Pose</option>
            {poses.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sequence Progress HUD */}
      {activeFlow && (
        <Card className="p-5 border-indigo-500/10 bg-indigo-500/5 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">Guided Routine</span>
              </div>
              <h2 className="text-lg font-black text-white mt-1">{activeFlow.name}</h2>
            </div>
            
            <div className="text-right">
              <span className="text-xs text-slate-400">
                Step <span className="font-bold text-indigo-300">{flowStepIdx + 1}</span> of {activeFlow.steps.length}
              </span>
              <div className="text-xl font-black text-indigo-300 mt-0.5 animate-pulse">
                Hold Remaining: {flowHoldTimer}s
              </div>
            </div>
          </div>

          {/* Progress Timeline Nodes */}
          <div className="w-full flex items-center justify-between gap-2 relative mt-2 pt-2">
            {/* Background progress track */}
            <div className="absolute top-[21px] left-0 right-0 h-1 bg-slate-800 rounded-full z-0 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(flowStepIdx / (activeFlow.steps.length - 1 || 1)) * 100}%` }}
              />
            </div>

            {activeFlow.steps.map((step, idx) => {
              const pose = yogaPoses.find(p => p.id === step.poseId) || { name: step.poseId };
              const isCompleted = idx < flowStepIdx;
              const isActive = idx === flowStepIdx;
              
              return (
                <div 
                  key={idx} 
                  className="flex flex-col items-center flex-1 z-10 cursor-pointer"
                  onClick={() => {
                    if (idx < flowStepIdx) {
                      setFlowStepIdx(idx); // Allow stepping back
                    }
                  }}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/25' 
                      : isActive 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/40 ring-offset-2 ring-offset-[#05070f]' 
                        : 'bg-slate-900 border-white/5 text-slate-500'
                  }`}>
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <span className={`text-[10px] font-bold mt-2 truncate max-w-[80px] text-center ${
                    isActive ? 'text-indigo-300 font-black' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                  }`}>
                    {pose.name.split(' (')[0]}
                  </span>
                  <span className="text-[9px] text-slate-500 font-light mt-0.5">{step.duration}s</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Full Screen Viewport Row (Camera & 3D Twin side-by-side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel A: Webcam Video HUD */}
        <Card className="relative overflow-hidden p-0 border-white/5 bg-slate-950/80 w-full" hover={false}>
          {/* HUD Status overlay headers */}
          <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-[#05070f]/80 border border-white/10 px-3 py-1 text-[10px] font-bold text-slate-200">
              <span className={`h-2 w-2 rounded-full ${cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {cameraActive ? 'CAMERA ON' : 'SIMULATION MODE'}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-[#05070f]/80 border border-white/10 px-3 py-1 text-[10px] font-bold text-indigo-400">
              AI Alignment: {accuracy}%
            </span>
            {isSessionRunning && (
              <>
                <span className="flex items-center gap-1.5 rounded-full bg-[#05070f]/80 border border-white/10 px-3 py-1 text-[10px] font-bold text-slate-200">
                  <Clock className="h-3 w-3 text-indigo-400" />
                  {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-[#05070f]/80 border border-white/10 px-3 py-1 text-[10px] font-bold text-slate-200">
                  <Flame className="h-3 w-3 text-rose-400 animate-pulse" />
                  {Math.round(caloriesAccumulated)} kcal
                </span>
              </>
            )}
          </div>

          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <button
              onClick={() => setVoiceCoaching(prev => !prev)}
              className={`p-2 rounded-xl border transition-all ${
                voiceCoaching 
                  ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' 
                  : 'bg-[#05070f]/80 border-white/10 text-slate-400'
              }`}
              title={voiceCoaching ? "Mute Voice Coach" : "Unmute Voice Coach"}
            >
              {voiceCoaching ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>

          {/* Video Viewport Container */}
          <div className="relative h-[400px] md:h-[500px] lg:h-[580px] w-full bg-[#070b13] flex items-center justify-center overflow-hidden">
            {/* Actual Video Tag for stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                cameraActive && !cameraError ? 'opacity-35' : 'opacity-0'
              }`}
            />

            {/* Simulated Ambient Particle Grid (Always visible when webcam is off or as a HUD design layer) */}
            <div className="absolute inset-0 mesh-bg opacity-20" />
            
            {/* Sci-Fi HUD Scan Laser Overlay */}
            {isSessionRunning && (
              <div className="absolute left-0 right-0 h-[2.5px] bg-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.8)] pointer-events-none z-15 hud-scanner-bar" style={{ width: '100%' }} />
            )}

            {/* Countdown Overlay */}
            {isCapturing && captureCountdown !== null && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm">
                <div className="text-8xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent animate-bounce">
                  {captureCountdown}
                </div>
                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest mt-4">
                  Hold your pose! Capturing in {captureCountdown}...
                </p>
              </div>
            )}
            
            {/* Skeletal tracking overlay grid */}
            <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">
              
              {/* HUD Cyber Corners */}
              <g stroke="#6366f1" strokeWidth="1.5" opacity="0.35" fill="none">
                <path d="M 15 35 L 15 15 L 35 15" />
                <path d="M 285 35 L 285 15 L 265 15" />
                <path d="M 15 265 L 15 285 L 35 285" />
                <path d="M 285 265 L 285 285 L 265 285" />
              </g>

              {/* Ghost Target Silhouette (Perfect position coords) */}
              {isSessionRunning && (
                <g opacity="0.18" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="3,3" fill="none">
                  {/* Head & Spine */}
                  <line x1={headX} y1={headY} x2={shoulderX} y2={shoulderY} />
                  <line x1={shoulderX} y1={shoulderY} x2={hipX} y2={hipY} />
                  {/* Left limbs (perfect) */}
                  <line x1={shoulderX} y1={shoulderY} x2={leftElbowX} y2={leftElbowY} />
                  <line x1={leftElbowX} y1={leftElbowY} x2={leftWristX} y2={leftWristY} />
                  <line x1={hipX} y1={hipY} x2={leftKneeX} y2={leftKneeY} />
                  <line x1={leftKneeX} y1={leftKneeY} x2={leftAnkleX} y2={leftAnkleY} />
                  {/* Right limbs (perfect - offset 0) */}
                  <line x1={shoulderX} y1={shoulderY} x2={template.rightElbow.x} y2={template.rightElbow.y} />
                  <line x1={template.rightElbow.x} y1={template.rightElbow.y} x2={template.rightWrist.x} y2={template.rightWrist.y} />
                  <line x1={hipX} y1={hipY} x2={template.rightKnee.x} y2={template.rightKnee.y} />
                  <line x1={template.rightKnee.x} y1={template.rightKnee.y} x2={template.rightAnkle.x} y2={template.rightAnkle.y} />
                  {/* Perfect joints rings */}
                  <circle cx={template.rightElbow.x} cy={template.rightElbow.y} r="3" fill="#818cf8" />
                  <circle cx={template.rightWrist.x} cy={template.rightWrist.y} r="3" fill="#818cf8" />
                  <circle cx={template.rightKnee.x} cy={template.rightKnee.y} r="3" fill="#818cf8" />
                  <circle cx={template.rightAnkle.x} cy={template.rightAnkle.y} r="3" fill="#818cf8" />
                </g>
              )}

              {/* Concentric targets for misaligned joints */}
              {isSessionRunning && Object.entries(jointOffsets).map(([joint, offset]) => {
                if (offset <= 5) return null;
                let jx, jy;
                if (joint === 'rightKnee' || joint === 'kneeAngle') { jx = rightKneeX; jy = rightKneeY; }
                else if (joint === 'rightElbow' || joint === 'elbowAngle') { jx = rightElbowX; jy = rightElbowY; }
                else if (joint === 'torsoAngle' || joint === 'hipOpenAngle') { jx = shoulderX; jy = shoulderY; }
                else return null;
                
                return (
                  <g key={joint}>
                    <circle cx={jx} cy={jy} r="12" className="stroke-amber-500/40 fill-none concentric-ping" strokeWidth="1" />
                    <circle cx={jx} cy={jy} r="6" className="stroke-amber-500/60 fill-none" strokeWidth="1" />
                  </g>
                );
              })}

              {/* Connecting Bones */}
              <line x1={headX} y1={headY} x2={shoulderX} y2={shoulderY} className="skeleton-line text-indigo-400" stroke="currentColor" strokeWidth="3" />
              <line x1={shoulderX} y1={shoulderY} x2={hipX} y2={hipY} className="skeleton-line text-indigo-400" stroke="currentColor" strokeWidth="4" />
              
              {/* Left side limbs */}
              <line x1={shoulderX} y1={shoulderY} x2={leftElbowX} y2={leftElbowY} className="skeleton-line text-emerald-400" stroke="currentColor" strokeWidth="2.5" />
              <line x1={leftElbowX} y1={leftElbowY} x2={leftWristX} y2={leftWristY} className="skeleton-line text-emerald-400" stroke="currentColor" strokeWidth="2.5" />
              
              <line x1={hipX} y1={hipY} x2={leftKneeX} y2={leftKneeY} className="skeleton-line text-emerald-400" stroke="currentColor" strokeWidth="3.5" />
              <line x1={leftKneeX} y1={leftKneeY} x2={leftAnkleX} y2={leftAnkleY} className="skeleton-line text-emerald-400" stroke="currentColor" strokeWidth="3.5" />

              {/* Right side limbs (dynamic coordinates based on offsets) */}
              <line 
                x1={shoulderX} 
                y1={shoulderY} 
                x2={rightElbowX} 
                y2={rightElbowY} 
                className={`skeleton-line ${(jointOffsets.rightElbow > 5 || jointOffsets.elbowAngle > 5) ? 'text-amber-400' : 'text-emerald-400'}`} 
                stroke="currentColor" 
                strokeWidth="2.5" 
              />
              <line 
                x1={rightElbowX} 
                y1={rightElbowY} 
                x2={rightWristX} 
                y2={rightWristY} 
                className={`skeleton-line ${(jointOffsets.rightElbow > 5 || jointOffsets.elbowAngle > 5) ? 'text-amber-400' : 'text-emerald-400'}`} 
                stroke="currentColor" 
                strokeWidth="2.5" 
              />

              <line 
                x1={hipX} 
                y1={hipY} 
                x2={rightKneeX} 
                y2={rightKneeY} 
                className={`skeleton-line ${(jointOffsets.rightKnee > 5 || jointOffsets.kneeAngle > 5) ? 'text-amber-400' : 'text-emerald-400'}`} 
                stroke="currentColor" 
                strokeWidth="3.5" 
              />
              <line 
                x1={rightKneeX} 
                y1={rightKneeY} 
                x2={rightAnkleX} 
                y2={rightAnkleY} 
                className={`skeleton-line ${(jointOffsets.rightKnee > 5 || jointOffsets.kneeAngle > 5) ? 'text-amber-400' : 'text-emerald-400'}`} 
                stroke="currentColor" 
                strokeWidth="3.5" 
              />

              {/* Joints (Nodes) */}
              <circle cx={headX} cy={headY} r="8" className="fill-indigo-500 stroke-white/20" strokeWidth="1.5" />
              <circle cx={shoulderX} cy={shoulderY} r="5" className="fill-indigo-400" />
              <circle cx={leftElbowX} cy={leftElbowY} r="4" className="fill-emerald-400" />
              <circle cx={leftWristX} cy={leftWristY} r="4" className="fill-emerald-400" />
              
              <circle cx={rightElbowX} cy={rightElbowY} r="4" className={(jointOffsets.rightElbow > 5 || jointOffsets.elbowAngle > 5) ? "fill-amber-400 animate-pulse" : "fill-emerald-400"} />
              <circle cx={rightWristX} cy={rightWristY} r="4" className={(jointOffsets.rightElbow > 5 || jointOffsets.elbowAngle > 5) ? "fill-amber-400" : "fill-emerald-400"} />
              
              <circle cx={hipX} cy={hipY} r="5" className="fill-indigo-400" />
              <circle cx={leftKneeX} cy={leftKneeY} r="4" className="fill-emerald-400" />
              <circle cx={leftAnkleX} cy={leftAnkleY} r="4" className="fill-emerald-400" />
              
              <circle cx={rightKneeX} cy={rightKneeY} r="4" className={(jointOffsets.rightKnee > 5 || jointOffsets.kneeAngle > 5) ? "fill-amber-400 animate-pulse" : "fill-emerald-400"} />
              <circle cx={rightAnkleX} cy={rightAnkleY} r="4" className={(jointOffsets.rightKnee > 5 || jointOffsets.kneeAngle > 5) ? "fill-amber-400" : "fill-emerald-400"} />
            </svg>

            {/* Inactive state prompt */}
            {!isSessionRunning && !cameraActive && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#05070f]/90 backdrop-blur-sm p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20">
                  <Camera className="h-6 w-6 animate-pulse" />
                </div>
                <h3 className="text-lg font-extrabold text-white">Camera Feed Offline</h3>
                <p className="text-xs text-slate-400 font-light mt-1 max-w-xs mb-5">
                  To start the real-time AI pose assessment, please turn on your camera first.
                </p>
                <button 
                  onClick={() => setCameraActive(true)}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-105"
                >
                  <Camera className="h-4 w-4" />
                  Turn Camera On
                </button>
              </div>
            )}

            {!isSessionRunning && cameraActive && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/45 p-6 text-center">
                <div className="bg-[#05070f]/90 border border-white/10 rounded-2xl p-6 shadow-2xl max-w-xs w-full backdrop-blur-md animate-fade-in">
                  <Play className="h-8 w-8 text-indigo-400 mx-auto mb-3 animate-bounce" />
                  <h3 className="text-sm font-bold text-white">Camera Ready</h3>
                  <p className="text-[11px] text-slate-400 font-light mt-1 mb-4 leading-normal">
                    Align your body in the frame so the skeleton matches, then click start to begin tracking.
                  </p>
                  <button
                    onClick={handleStartStop}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02]"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Start Session
                  </button>
                </div>
              </div>
            )}

            {/* Calibration overlay */}
            {isSessionRunning && !isCalibrated && cameraActive && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 text-center">
                <div className="relative mb-4 h-16 w-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90 animate-pulse">
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="28" 
                      stroke="rgba(255,255,255,0.05)" 
                      strokeWidth="4" 
                      fill="transparent" 
                    />
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="28" 
                      stroke="#6366f1" 
                      strokeWidth="4" 
                      fill="transparent" 
                      strokeDasharray="175.9"
                      strokeDashoffset={175.9 - (175.9 * calibrationProgress)}
                      className="transition-all duration-300 ease-out"
                    />
                  </svg>
                  <div className="absolute text-xs font-black text-white">
                    {Math.round(calibrationProgress * 100)}%
                  </div>
                </div>
                <h3 className="text-base font-black text-white">Calibrating Camera Perspective</h3>
                <p className="text-sm font-semibold mt-2 max-w-xs leading-relaxed text-indigo-400">
                  {feedbackMsg}
                </p>
                <p className="text-[10px] text-slate-500 font-light mt-2 max-w-xs leading-normal">
                  Stand still in full view. Keep both feet flat and visible on the floor to align.
                </p>
              </div>
            )}
          </div>

          {/* Bottom HUD Feedback Message Bar */}
          <div className="bg-[#090d16] border-t border-white/5 px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-5 w-5 shrink-0 ${accuracy > 85 ? 'text-emerald-400' : 'text-amber-500'}`} />
              <div className="flex items-center flex-wrap gap-2">
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {feedbackMsg}
                </p>
                {isSessionRunning && currentMisalignedJoint && (
                  <button
                    onClick={() => handleShowExplanation(currentMisalignedJoint)}
                    className="rounded-lg bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-black text-indigo-400 transition-all flex items-center gap-1 shrink-0"
                  >
                    <HelpCircle className="h-3 w-3" />
                    Why?
                  </button>
                )}
              </div>
            </div>

            {/* Mini Target hold meter */}
            {isSessionRunning && (
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">HOLD PROGRESS</span>
                <span className="text-xs font-black text-indigo-400">
                  {activeFlow 
                    ? `${flowHoldTimer}s / ${activeFlow.steps[flowStepIdx].duration}s` 
                    : (currentPose.id === 'auto-detect' 
                        ? (detectedPose ? `${holdTime}s / ${detectedPose.duration}s` : 'Scanning...') 
                        : `${holdTime}s / ${currentPose.duration}s`)}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Panel B: 3D Digital Twin Viewer / Coaching Hub */}
        <Card className="relative overflow-hidden p-0 border-white/5 bg-slate-950/80 w-full flex flex-col justify-between" hover={false}>
          {/* Tab Selector overlay headers */}
          <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap justify-between items-center gap-2">
            <div className="flex gap-1 bg-[#05070f]/90 border border-white/10 rounded-full p-1">
              <button
                onClick={() => setRightPanelMode('twin')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider transition-all uppercase ${
                  rightPanelMode === 'twin'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                3D Digital Twin
              </button>
              <button
                onClick={() => setRightPanelMode('corrections')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider transition-all uppercase flex items-center gap-1.5 ${
                  rightPanelMode === 'corrections'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Coaching Hub
                {isSessionRunning && Object.values(jointOffsets).some(offset => offset > 5) && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                )}
              </button>
            </div>

            <div className="flex gap-2">
              {isSessionRunning && cameraActive && (
                <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold transition-all border bg-[#05070f]/80 ${
                  isCalibrated 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 animate-pulse'
                }`}>
                  {isCalibrated ? `Calibrated (Tilt: ${tiltAngle}°)` : 'Calibrating...'}
                </span>
              )}
            </div>
          </div>

          {rightPanelMode === 'twin' ? (
            <>
              {/* Canvas viewport container */}
              <div className="relative h-[400px] md:h-[500px] lg:h-[580px] w-full bg-[#070b13] flex items-center justify-center overflow-hidden">
                <YogaDigitalTwin 
                  poseId={currentPose.id === 'auto-detect' ? (detectedPose?.id || 'warrior-ii') : currentPose.id} 
                  jointOffsets={jointOffsets} 
                  showUserTwin={isSessionRunning} 
                />
              </div>

              {/* Bottom message bar */}
              <div className="bg-[#090d16] border-t border-white/5 px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-wider">
                    Drag mouse to rotate model in 3D space
                  </p>
                </div>
                {isSessionRunning && (
                  <div className="flex items-center gap-4 text-right shrink-0">
                    {isBleConnected && heartRate && (
                      <div>
                        <span className="text-[8px] text-slate-500 font-bold block uppercase tracking-wider">PHYSIOLOGY</span>
                        <span className="text-[10px] font-black text-indigo-400 animate-pulse">{heartRate} BPM / {hrv}ms HRV</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">STATUS</span>
                      <span className="text-[10px] font-black text-emerald-400">ONLINE</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Coaching Hub / Corrections Viewport */}
              <div className="overflow-y-auto pt-20 p-6 space-y-6 h-[400px] md:h-[500px] lg:h-[580px] w-full bg-[#070b13] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-indigo-500/20 text-left">
                {/* Coaching Hub Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-900/30 border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center gap-4">
                    {/* SVG Progress Gauge */}
                    <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle 
                          cx="40" 
                          cy="40" 
                          r="34" 
                          stroke="rgba(255,255,255,0.03)" 
                          strokeWidth="5" 
                          fill="transparent" 
                        />
                        <circle 
                          cx="40" 
                          cy="40" 
                          r="34" 
                          stroke={accuracy >= 85 ? '#34d399' : accuracy >= 70 ? '#fbbf24' : '#f87171'} 
                          strokeWidth="5" 
                          fill="transparent" 
                          strokeDasharray="213.6"
                          strokeDashoffset={213.6 - (213.6 * accuracy) / 100}
                          className="transition-all duration-500 ease-out"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-base font-black text-white">{accuracy}%</span>
                        <span className="text-[7px] text-slate-500 font-extrabold uppercase tracking-wider">Accuracy</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Posture Assessment</span>
                      <h4 className="text-sm font-extrabold text-white mt-0.5">
                        {accuracy >= 85 ? 'Perfect Alignment' : accuracy >= 70 ? 'Minor Adjustments Needed' : 'Correction Required'}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-light mt-0.5 leading-snug">
                        {accuracy >= 85 ? 'Pose matches target parameters. Hold steadily.' : 'Review marked joints below to achieve optimal alignment.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 md:border-l md:border-white/5 md:pl-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Target Pose:</span>
                      <span className="text-slate-200 font-bold">{currentPose.id === 'auto-detect' ? (detectedPose?.name || 'Scanning...') : currentPose.name}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Total Faults:</span>
                      {(() => {
                        const targetAnglesObj = (currentPose.id === 'auto-detect' ? (detectedPose?.jointAngles || detectedPose?.joint_angles) : (currentPose.jointAngles || currentPose.joint_angles)) || {};
                        const activeFaultsCount = Object.entries(targetAnglesObj).filter(([joint]) => (jointOffsets[joint] || 0) > 5).length;
                        return (
                          <span className={`font-black ${activeFaultsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {activeFaultsCount} joint{activeFaultsCount !== 1 ? 's' : ''}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Duration:</span>
                      <span className="text-slate-200 font-bold">
                        {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Calories:</span>
                      <span className="text-rose-400 font-bold">{Math.round(caloriesAccumulated)} kcal</span>
                    </div>
                  </div>
                </div>

                {/* Coaching Hub Quick Actions */}
                <div className="grid grid-cols-3 gap-3 bg-slate-900/30 border border-white/5 rounded-2xl p-3">
                  <button
                    onClick={handleStartStop}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all shadow-md ${
                      isSessionRunning 
                        ? 'bg-amber-600/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {isSessionRunning ? (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Start
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleReset}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>

                  <button
                    onClick={activeFlow ? handleFinishFlowSession : handleFinishSession}
                    className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all border bg-emerald-600/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                  >
                    Finish
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  onClick={startAutoCapture}
                  disabled={!cameraActive || isCapturing}
                  className={`w-full mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all bg-violet-600 hover:bg-violet-500 text-white ${
                    (!cameraActive || isCapturing) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Camera className="h-3.5 w-3.5" />
                  Auto-Capture (5s Timer)
                </button>

                {/* Faults List */}
                {(() => {
                  const targetAnglesObj = (currentPose.id === 'auto-detect' ? (detectedPose?.jointAngles || detectedPose?.joint_angles) : (currentPose.jointAngles || currentPose.joint_angles)) || {};
                  const activeFaultsList = Object.entries(targetAnglesObj).filter(([joint]) => (jointOffsets[joint] || 0) > 5);
                  
                  return (
                    <div className="space-y-3">
                      <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">
                        Joint Alignment & Corrections
                      </h4>

                      {activeFaultsList.length > 0 ? (
                        activeFaultsList.map(([joint, data]) => {
                          const metrics = getJointMetrics(joint, data);
                          const label = getJointLabel(joint);
                          const devValue = Math.round(metrics.deviation);
                          const isSevere = metrics.deviation > 15;
                          
                          const isExpanded = !!expandedInsights[joint];
                          const isLoading = !!loadingInsights[joint];

                          return (
                            <div 
                              key={joint}
                              className={`rounded-2xl border transition-all duration-300 p-4 space-y-3 ${
                                isSevere 
                                  ? 'border-rose-500/20 bg-rose-500/5' 
                                  : 'border-amber-500/20 bg-amber-500/5'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex items-start gap-3">
                                  <div className={`mt-0.5 rounded-xl p-1.5 ${isSevere ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                    <AlertTriangle className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <h5 className="text-xs font-black text-slate-100 flex items-center gap-2">
                                      {label}
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                        isSevere ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                                      }`}>
                                        Off by {devValue}°
                                      </span>
                                    </h5>
                                    
                                    {/* Actionable Correction */}
                                    <p className="text-sm font-extrabold text-slate-200 mt-1 leading-snug">
                                      {getCorrectionAdvice(joint, metrics)}
                                    </p>
                                    
                                    <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-2">
                                      <span>Target: <strong className="text-slate-400 font-semibold">{Math.round(metrics.target)}°</strong></span>
                                      <span>Current: <strong className={isSevere ? "text-rose-400 font-bold" : "text-amber-400 font-bold"}>{Math.round(metrics.actual)}°</strong></span>
                                      <span>Tolerance: <strong className="text-slate-400 font-semibold">±{metrics.tolerance}°</strong></span>
                                    </div>
                                  </div>
                                </div>

                                {/* Anatomical Insight Trigger */}
                                <button
                                  onClick={() => handleToggleInsight(joint)}
                                  className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-all shrink-0 self-center border border-indigo-500/10 hover:border-indigo-500/30 rounded-xl px-2.5 py-1 bg-indigo-500/5"
                                >
                                  <Sparkles className="h-3 w-3" />
                                  {isExpanded ? 'Hide Anatomy' : 'Anatomy Coach'}
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                              </div>

                              {/* Expanded Biomechanical Insight */}
                              {isExpanded && (
                                <div className="border-t border-white/5 pt-3 mt-1 animate-fade-in text-xs font-light text-slate-400 leading-relaxed bg-[#05070f]/30 rounded-xl p-3">
                                  <p className="font-bold text-slate-300 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <span className="h-1 w-1 rounded-full bg-indigo-400 animate-pulse" />
                                    Clinical Biomechanical Context
                                  </p>
                                  {expandedInsights[joint]}
                                </div>
                              )}

                              {isLoading && (
                                <div className="border-t border-white/5 pt-3 mt-1 flex items-center gap-2 justify-center py-2 text-xs font-light text-slate-500 bg-[#05070f]/30 rounded-xl">
                                  <div className="h-3.5 w-3.5 animate-spin rounded-full border border-indigo-500 border-t-transparent" />
                                  <span>AI Coach is analyzing joint kinematics...</span>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        /* Perfect Posture celebration card */
                        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6 text-center space-y-4 animate-fade-in">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="h-6 w-6" />
                          </div>
                          <div>
                            <h5 className="text-sm font-black text-white">Posture Perfectly Aligned</h5>
                            <p className="text-xs text-slate-400 font-light mt-1 max-w-sm mx-auto leading-relaxed">
                              All joint angles match the target posture within tolerance. Keep holding this posture to lock in muscle memory!
                            </p>
                          </div>

                          {/* Checklist of aligned joints */}
                          <div className="border-t border-white/5 pt-4 max-w-xs mx-auto grid grid-cols-2 gap-2 text-left">
                            {Object.keys(targetAnglesObj).map(j => (
                              <div key={j} className="flex items-center gap-1.5 text-[10px] text-slate-400 font-light">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                <span className="truncate">{getJointLabel(j)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Bottom message bar */}
              <div className="bg-[#090d16] border-t border-white/5 px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-wider">
                    Coaching Hub updates in real-time based on joint angles
                  </p>
                </div>
                {isSessionRunning && (
                  <div className="flex items-center gap-4 text-right shrink-0">
                    {isBleConnected && heartRate && (
                      <div>
                        <span className="text-[8px] text-slate-500 font-bold block uppercase tracking-wider">PHYSIOLOGY</span>
                        <span className="text-[10px] font-black text-indigo-400 animate-pulse">{heartRate} BPM / {hrv}ms HRV</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">STATUS</span>
                      <span className="text-[10px] font-black text-emerald-400">ONLINE</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Quick instructions trigger bar */}
      <div className="flex flex-wrap gap-4 items-center justify-between rounded-2xl border border-white/5 bg-slate-900/30 p-4">
        <div className="flex items-center gap-2.5 text-xs text-slate-400 font-light">
          <ShieldCheck className="h-4 w-4 text-indigo-400" />
          <span>Biomechanical tracking is calibrated for {currentPose.difficulty} level.</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setDemoMode(prev => {
                const next = !prev;
                if (next) {
                  setCameraActive(true);
                }
                return next;
              });
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all border ${
              demoMode 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Workflow className="h-3.5 w-3.5" />
            {demoMode ? 'Disable Demo Stream' : 'Enable Demo Stream'}
          </button>
          
          <button 
            onClick={() => setCameraActive(prev => !prev)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all border ${
              cameraActive 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {cameraActive ? (
              <>
                <CameraOff className="h-3.5 w-3.5" />
                Turn Camera Off
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5" />
                Turn Camera On
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Dashboard Controls & Gauges Row (5-column layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 pt-2">
        {/* Column 1: Main Controls Panel */}
        <Card className="border-white/5 bg-slate-950/60 p-5 space-y-6" hover={false}>
          <div className="text-center pb-4 border-b border-white/5">
            <h3 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">
              {currentPose.id === 'auto-detect' ? 'Auto-Detected Pose' : 'Current Target Pose'}
            </h3>
            <h2 className="text-2xl font-black text-slate-200 mt-1">
              {currentPose.id === 'auto-detect' ? (detectedPose?.name || 'Scanning...') : currentPose.name}
            </h2>
            <p className="text-[10px] italic text-slate-500 font-light mt-0.5">
              {currentPose.id === 'auto-detect' ? (detectedPose?.sanskritName || 'Looking for posture match...') : currentPose.sanskritName}
            </p>
          </div>

          {/* Session Stats readout */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Elapsed Time</span>
              <span className="text-lg font-black text-slate-300">
                {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Calories</span>
              <span className="text-lg font-black text-rose-400">{Math.round(caloriesAccumulated)} kcal</span>
            </div>
          </div>

          {/* Session Control Buttons */}
          <div className="space-y-3">
            <button
              onClick={startAutoCapture}
              disabled={!cameraActive || isCapturing}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all shadow-md bg-violet-600 hover:bg-violet-500 text-white ${
                (!cameraActive || isCapturing) ? 'opacity-50 cursor-not-allowed' : 'glow-accent'
              }`}
            >
              <Camera className="h-4 w-4" />
              Auto-Capture (5s Timer)
            </button>

            <button
              onClick={handleStartStop}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all shadow-md ${
                isSessionRunning 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white glow-accent'
              }`}
            >
              {isSessionRunning ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause Session
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  Start Session
                </>
              )}
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button
                onClick={activeFlow ? handleFinishFlowSession : handleFinishSession}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all border bg-emerald-600/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
              >
                Finish
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>

        {/* Column 2: Skeletal Adjustments HUD */}
        <Card className="border-white/5 bg-slate-950/60 p-5 space-y-4" hover={false}>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-white/5 pb-2">AI Biomechanical Readout</h3>
          
          <div className="space-y-4">
            {Object.entries(
              (currentPose.id === 'auto-detect' ? (detectedPose?.jointAngles || detectedPose?.joint_angles) : (currentPose.jointAngles || currentPose.joint_angles)) || {
                rightKnee: { target: 90, tolerance: 8 },
                rightElbow: { target: 180, tolerance: 10 },
                torsoAngle: { target: 90, tolerance: 5 }
              }
            ).map(([joint, data]) => {
              const targetVal = typeof data === 'object' && data !== null ? (data.target || 90) : (data || 90);
              const offset = jointOffsets[joint] || 0;
              const isOK = offset <= 2;
              const currentVal = targetVal + (offset * (joint.toLowerCase().includes('flex') || joint.toLowerCase().includes('bend') ? -1 : 1));
              
              return (
                <div key={joint} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">{getJointLabel(joint)}</span>
                    <span className={!isOK ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                      {Math.round(currentVal)}°
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-900 border border-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${!isOK ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.max(100 - offset * 4, 30)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold w-10 shrink-0 text-right">
                      {!isOK ? `${offset > 0 ? '+' : ''}${Math.round(offset)}°` : 'OK'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Column 3: Breath Pacer Mandala Card */}
        <Card className="border-white/5 bg-slate-950/60 p-5 flex flex-col items-center text-center space-y-4" hover={false}>
          <h3 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Zen Breathing Pacer</h3>
          
          <div className="relative h-28 w-28 flex items-center justify-center">
            {/* Concentric rings */}
            <div 
              className={`absolute inset-0 rounded-full border border-indigo-500/20 transition-all duration-500 ${
                breathState === 'Inhale' ? 'mandala-inhale' : breathState === 'Exhale' ? 'mandala-exhale' : 'mandala-hold'
              }`}
              style={{
                transform: `scale(${0.75 + (breathPercent / 100) * 0.35})`,
                backgroundColor: breathState === 'Inhale' 
                  ? 'rgba(99, 102, 241, 0.04)' 
                  : breathState === 'Exhale' 
                    ? 'rgba(16, 185, 129, 0.04)' 
                    : 'rgba(245, 158, 11, 0.04)',
                borderColor: breathState === 'Inhale' 
                  ? 'rgba(99, 102, 241, 0.3)' 
                  : breathState === 'Exhale' 
                    ? 'rgba(16, 185, 129, 0.3)' 
                    : 'rgba(245, 158, 11, 0.3)'
              }}
            />
            
            <div 
              className="absolute h-16 w-16 rounded-full flex items-center justify-center bg-slate-900/90 border border-white/10 shadow-lg text-xs font-black"
              style={{
                color: breathState === 'Inhale' 
                  ? '#818cf8' 
                  : breathState === 'Exhale' 
                    ? '#34d399' 
                    : breathState === 'Hold'
                      ? '#fbbf24'
                      : '#94a3b8'
              }}
            >
              {breathState}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-light max-w-[200px] min-h-[32px] flex items-center justify-center text-center">
            {breathState === 'Inhale' && 'Slowly fill your lungs with air...'}
            {breathState === 'Exhale' && 'Exhale deeply, releasing tension...'}
            {breathState === 'Hold' && 'Hold stance, feel the stillness...'}
            {breathState === 'Ready' && 'Start session to begin breath guidance.'}
          </div>
        </Card>

        {/* Column 4: Ambient Soundscape Mixer Panel */}
        <Card className="border-white/5 bg-slate-950/60 p-5 space-y-4" hover={false}>
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Zen Soundscapes</h3>
            <Badge variant={soundscapeActive ? 'success' : 'info'}>
              {soundscapeActive ? 'Playing' : 'Muted'}
            </Badge>
          </div>
          
          <div className="space-y-4 pt-1">
            {/* Singing Bowls slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Tibetan Singing Bowls</span>
                <span className="text-slate-500 font-semibold">{Math.round(soundVolumes.singingBowls * 200)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={soundVolumes.singingBowls}
                onChange={(e) => handleVolumeChange('singingBowls', e.target.value)}
                className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Ocean Breeze slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Ocean Breeze Waves</span>
                <span className="text-slate-500 font-semibold">{Math.round(soundVolumes.oceanBreeze * 250)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.4"
                step="0.05"
                value={soundVolumes.oceanBreeze}
                onChange={(e) => handleVolumeChange('oceanBreeze', e.target.value)}
                className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Binaural Focus waves slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Binaural Focus (Alpha)</span>
                <span className="text-slate-500 font-semibold">{Math.round(soundVolumes.binauralBeats * 250)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.3"
                step="0.02"
                value={soundVolumes.binauralBeats}
                onChange={(e) => handleVolumeChange('binauralBeats', e.target.value)}
                className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
          
          <div className="text-[10px] text-slate-500 leading-normal font-light">
            Web Audio API synthesizes meditation frequencies dynamically in real-time. Put on headphones for best binaural effect.
          </div>
        </Card>

        {/* Column 5: Wearable Sensor Fusion */}
        <Card className="border-white/5 bg-slate-950/60 p-5 space-y-4 flex flex-col justify-between" hover={false}>
          <div className="flex items-center justify-between border-b border-white/5 pb-2 shrink-0">
            <h3 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Wearable Sensor
            </h3>
            <Badge variant={isBleConnected ? 'success' : isBleConnecting ? 'warning' : 'danger'}>
              {isBleConnected ? 'Connected' : isBleConnecting ? 'Pairing' : 'Disconnected'}
            </Badge>
          </div>
          
          <div className="space-y-4 pt-1 flex flex-col justify-between h-full min-h-[140px] grow">
            {isBleConnected ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-light">Heart Rate:</span>
                  <span className="text-2xl font-black text-slate-100 flex items-baseline gap-1 animate-pulse">
                    {heartRate} <span className="text-[10px] text-slate-500 font-bold">BPM</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-light">Autonomic HRV:</span>
                  <span className="text-2xl font-black text-indigo-400 flex items-baseline gap-1">
                    {hrv} <span className="text-[10px] text-slate-500 font-bold">MS</span>
                  </span>
                </div>
                <button
                  onClick={handleDisconnectBluetooth}
                  className="w-full rounded-xl bg-slate-900 border border-white/5 hover:bg-rose-950/20 hover:border-rose-500/30 py-1.5 text-[10px] font-semibold text-slate-400 hover:text-rose-400 transition-all mt-1"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="text-center py-2 space-y-2">
                <p className="text-[11px] text-slate-500 leading-normal font-light">
                  Pair a Bluetooth Low Energy (BLE) heart rate strap to stream heart rate variability (RMSSD).
                </p>
                {bleError && (
                  <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-[10px] text-rose-400 font-light text-left space-y-2">
                    <p className="font-bold leading-normal">{bleError}</p>
                    <div className="border-t border-rose-500/10 pt-1.5 space-y-1">
                      <p className="font-semibold text-slate-300">Troubleshooting Guide:</p>
                      <p>• <span className="font-bold text-slate-300">macOS:</span> Ensure Bluetooth is toggled ON and Chrome has permission under <span className="italic">System Settings &gt; Privacy &amp; Security &gt; Bluetooth</span>.</p>
                      <p>• <span className="font-bold text-slate-300">Android:</span> Ensure Location/Nearby Devices permission is enabled for Chrome under <span className="italic">App Info &gt; Permissions</span>.</p>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleConnectBluetooth}
                    disabled={isBleConnecting}
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed py-2 text-xs font-black text-white transition-all shadow-md shadow-indigo-600/10"
                  >
                    {isBleConnecting ? 'Pairing Monitor...' : 'Connect HR Monitor'}
                  </button>
                  <button
                    onClick={handleSimulateBluetooth}
                    disabled={isBleConnecting}
                    className="w-full rounded-xl bg-slate-900 border border-white/10 hover:border-indigo-500/30 py-2 text-xs font-semibold text-slate-300 hover:text-indigo-400 transition-all"
                  >
                    Simulate HR Monitor
                  </button>
                </div>
              </div>
            )}
            
            <div className="text-[9.5px] text-slate-500 leading-normal font-light border-t border-white/5 pt-2 shrink-0">
              Web Bluetooth API accesses heart_rate service characteristic 0x2A37.
            </div>
          </div>
        </Card>
      {/* Explainable AI (XAI) Biomechanical Coach Overlay Card */}
      {xaiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
          <Card className="max-w-md w-full border border-indigo-500/20 bg-slate-900/95 shadow-2xl shadow-indigo-500/10 p-6 relative overflow-hidden" hover={false}>
            {/* Holographic glowing grid effect */}
            <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[9.5px] font-extrabold text-indigo-400 uppercase tracking-wider">
                  Explainable AI Biomechanical Coach
                </span>
                <h3 className="text-lg font-black text-slate-100 mt-2">
                  Anatomical Insight: {getJointLabel(xaiJoint)}
                </h3>
              </div>
              <button 
                onClick={() => setXaiOpen(false)}
                className="text-slate-500 hover:text-white rounded-lg p-1.5 transition-all hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {xaiLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  <p className="text-xs text-slate-400 mt-3 font-light">Retrieving clinical biomechanical context...</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    {xaiExplanation}
                  </p>
                  
                  {/* Visual Muscle Indicators */}
                  <div className="rounded-xl bg-slate-950/60 border border-white/5 p-3.5 space-y-2.5">
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Target Joint Mechanics</span>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-light">Current Deviation:</span>
                      <span className="font-semibold text-amber-400">
                        {Math.round(jointOffsets[xaiJoint] || 0)}°
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-light">Target Tolerance:</span>
                      <span className="font-semibold text-emerald-400">
                        ±{currentPose.jointAngles?.[xaiJoint]?.tolerance ?? 10}°
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setXaiOpen(false)}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-black text-white transition-all shadow-md shadow-indigo-600/10"
              >
                Got It
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Captured Pose Analysis Modal */}
      {capturedAnalysis && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <Card className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-indigo-500/25 bg-slate-900/95 p-6 md:p-8 shadow-2xl glow-accent text-left" hover={false}>
            {/* Close Button */}
            <button 
              onClick={() => setCapturedAnalysis(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-30"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Pose Capture Report</h2>
                <p className="text-xs text-slate-400 font-light">Comparison analysis with the digital twin model for {capturedAnalysis.poseName}.</p>
              </div>
            </div>

            {/* Side-by-Side Visual Comparison Displays */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left Side: Captured Photo with Skeleton Overlay */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Your Captured Pose</span>
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center h-[220px] md:h-[260px]">
                  {capturedAnalysis.photoUrl ? (
                    <>
                      <img src={capturedAnalysis.photoUrl} className="w-full h-full object-cover" alt="Captured pose" />
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                        {/* Draw skeleton lines */}
                        {(() => {
                          const lms = capturedAnalysis.capturedLandmarks;
                          if (!lms || lms.length < 33) return null;
                          
                          // Helper to get x,y as percentage [0, 100]
                          const getPt = (idx) => {
                            const pt = lms[idx];
                            return pt ? { x: pt.x * 100, y: pt.y * 100 } : { x: 50, y: 50 };
                          };
                          
                          const pts = {
                            nose: getPt(0),
                            l_sh: getPt(11),
                            r_sh: getPt(12),
                            l_el: getPt(13),
                            r_el: getPt(14),
                            l_wr: getPt(15),
                            r_wr: getPt(16),
                            l_hip: getPt(23),
                            r_hip: getPt(24),
                            l_kn: getPt(25),
                            r_kn: getPt(26),
                            l_ank: getPt(27),
                            r_ank: getPt(28),
                          };
                          
                          return (
                            <g stroke="#34d399" strokeWidth="1.2" fill="none" strokeLinecap="round">
                              {/* Shoulders */}
                              <line x1={pts.l_sh.x} y1={pts.l_sh.y} x2={pts.r_sh.x} y2={pts.r_sh.y} />
                              {/* Hips */}
                              <line x1={pts.l_hip.x} y1={pts.l_hip.y} x2={pts.r_hip.x} y2={pts.r_hip.y} />
                              {/* Left Arm */}
                              <line x1={pts.l_sh.x} y1={pts.l_sh.y} x2={pts.l_el.x} y2={pts.l_el.y} />
                              <line x1={pts.l_el.x} y1={pts.l_el.y} x2={pts.l_wr.x} y2={pts.l_wr.y} />
                              {/* Right Arm */}
                              <line x1={pts.r_sh.x} y1={pts.r_sh.y} x2={pts.r_el.x} y2={pts.r_el.y} />
                              <line x1={pts.r_el.x} y1={pts.r_el.y} x2={pts.r_wr.x} y2={pts.r_wr.y} />
                              {/* Left Leg */}
                              <line x1={pts.l_hip.x} y1={pts.l_hip.y} x2={pts.l_kn.x} y2={pts.l_kn.y} />
                              <line x1={pts.l_kn.x} y1={pts.l_kn.y} x2={pts.l_ank.x} y2={pts.l_ank.y} />
                              {/* Right Leg */}
                              <line x1={pts.r_hip.x} y1={pts.r_hip.y} x2={pts.r_kn.x} y2={pts.r_kn.y} />
                              <line x1={pts.r_kn.x} y1={pts.r_kn.y} x2={pts.r_ank.x} y2={pts.r_ank.y} />
                              
                              {/* Connect shoulders and hips midpoint for spine */}
                              <line 
                                x1={(pts.l_sh.x + pts.r_sh.x) / 2} 
                                y1={(pts.l_sh.y + pts.r_sh.y) / 2} 
                                x2={(pts.l_hip.x + pts.r_hip.x) / 2} 
                                y2={(pts.l_hip.y + pts.r_hip.y) / 2} 
                                stroke="#818cf8"
                              />
                              
                              {/* Joints */}
                              {Object.keys(pts).map((key) => (
                                <circle key={key} cx={pts[key].x} cy={pts[key].y} r="1.2" fill="#ffffff" stroke="#4f46e5" strokeWidth="0.4" />
                              ))}
                            </g>
                          );
                        })()}
                      </svg>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <CameraOff className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                      <span className="text-xs text-slate-500 font-light">No camera image captured</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: 3D Digital Twin Model */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">AI 3D Digital Twin Target</span>
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-[#070b13] flex items-center justify-center h-[220px] md:h-[260px]">
                  <YogaDigitalTwin 
                    poseId={currentPose.id === 'auto-detect' ? (detectedPose?.id || 'warrior-ii') : currentPose.id} 
                    jointOffsets={capturedAnalysis.jointDetails ? 
                      Object.keys(capturedAnalysis.jointDetails).reduce((acc, key) => {
                        acc[key] = capturedAnalysis.jointDetails[key].deviation;
                        return acc;
                      }, {}) : null
                    }
                    showUserTwin={true} 
                  />
                  <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-full bg-[#05070f]/80 border border-white/10 px-2.5 py-0.5 text-[8px] font-bold text-slate-300">
                    <span>3D Rig View</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content HUD Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Core Stats */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 text-center">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Accuracy Score</span>
                    <div className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent mt-1 leading-none">
                      {capturedAnalysis.accuracy}%
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold mt-2 border ${
                      capturedAnalysis.accuracy >= 90 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : capturedAnalysis.accuracy >= 75 
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {capturedAnalysis.accuracy >= 90 ? 'Master' : capturedAnalysis.accuracy >= 75 ? 'Practitioner' : 'Apprentice'}
                    </span>
                  </div>

                  <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Camera Tilt</span>
                    <div className="text-3xl font-black text-indigo-400 mt-1 leading-none">
                      {capturedAnalysis.tiltAngle !== undefined ? `${capturedAnalysis.tiltAngle}°` : '0°'}
                    </div>
                    <span className="text-[9px] text-slate-500 font-light mt-2">Perspective Pitch</span>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1">AI Coaching Feedback</span>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    {capturedAnalysis.feedback}
                  </p>
                </div>
              </div>

              {/* Right Column: Joint Comparison Table */}
              <div className="space-y-4">
                <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 h-[180px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-indigo-500/20">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-3">Biomechanical Joints Compare</span>
                  {capturedAnalysis.jointDetails && Object.keys(capturedAnalysis.jointDetails).length > 0 ? (
                    <div className="space-y-2.5">
                      {Object.entries(capturedAnalysis.jointDetails).map(([joint, detail]) => (
                        <div key={joint} className="flex items-center justify-between border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                          <div>
                            <span className="text-xs font-bold text-slate-200 block">{getJointLabel(joint)}</span>
                            <span className="text-[9px] text-slate-500">Target: {Math.round(detail.target)}° | Actual: {Math.round(detail.actual)}°</span>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            detail.deviation <= 5 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : detail.deviation <= 15 
                                ? 'bg-amber-500/10 text-amber-400' 
                                : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            Diff: {Math.round(detail.deviation)}°
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500">
                      No joint detail offsets available.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4 mt-6">
              <button
                onClick={() => setCapturedAnalysis(null)}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 transition-all"
              >
                Close Report
              </button>
            </div>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}

const generateMockLandmarks = (poseId) => {
  const list = [];
  for (let i = 0; i < 33; i++) {
    list.push({ x: 0.5, y: 0.5, z: 0.0, visibility: 0.99 });
  }

  list[27] = { x: 0.35, y: 0.85, z: 0.1, visibility: 0.99 };
  list[28] = { x: 0.65, y: 0.85, z: -0.1, visibility: 0.99 };
  list[29] = { x: 0.33, y: 0.87, z: 0.12, visibility: 0.99 };
  list[30] = { x: 0.67, y: 0.87, z: -0.12, visibility: 0.99 };
  list[31] = { x: 0.32, y: 0.89, z: 0.18, visibility: 0.99 };
  list[32] = { x: 0.68, y: 0.89, z: -0.05, visibility: 0.99 };

  list[0] = { x: 0.5, y: 0.2, z: 0.0, visibility: 0.99 };
  list[11] = { x: 0.4, y: 0.35, z: 0.0, visibility: 0.99 };
  list[12] = { x: 0.6, y: 0.35, z: 0.0, visibility: 0.99 };
  list[23] = { x: 0.42, y: 0.6, z: 0.0, visibility: 0.99 };
  list[24] = { x: 0.58, y: 0.6, z: 0.0, visibility: 0.99 };

  if (poseId === 'tree-pose') {
    list[25] = { x: 0.38, y: 0.72, z: 0.05, visibility: 0.99 };
    list[26] = { x: 0.58, y: 0.72, z: -0.05, visibility: 0.99 };
    list[13] = { x: 0.45, y: 0.15, z: 0.0, visibility: 0.99 };
    list[14] = { x: 0.55, y: 0.15, z: 0.0, visibility: 0.99 };
    list[15] = { x: 0.5, y: 0.05, z: 0.0, visibility: 0.99 };
    list[16] = { x: 0.5, y: 0.05, z: 0.0, visibility: 0.99 };
  } else if (poseId === 'downward-dog') {
    list[25] = { x: 0.38, y: 0.72, z: 0.0, visibility: 0.99 };
    list[26] = { x: 0.62, y: 0.72, z: 0.0, visibility: 0.99 };
    list[13] = { x: 0.45, y: 0.45, z: 0.0, visibility: 0.99 };
    list[14] = { x: 0.55, y: 0.45, z: 0.0, visibility: 0.99 };
  } else {
    list[25] = { x: 0.35, y: 0.75, z: 0.0, visibility: 0.99 };
    list[26] = { x: 0.65, y: 0.72, z: 0.0, visibility: 0.99 };
    list[13] = { x: 0.3, y: 0.35, z: 0.0, visibility: 0.99 };
    list[14] = { x: 0.7, y: 0.35, z: 0.0, visibility: 0.99 };
    list[15] = { x: 0.2, y: 0.35, z: 0.0, visibility: 0.99 };
    list[16] = { x: 0.8, y: 0.35, z: 0.0, visibility: 0.99 };
  }

  for (let i = 0; i < 33; i++) {
    list[i].x += (Math.random() - 0.5) * 0.015;
    list[i].y += (Math.random() - 0.5) * 0.015;
    list[i].z += (Math.random() - 0.5) * 0.015;
  }

  return list;
};






