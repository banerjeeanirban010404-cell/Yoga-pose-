import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ShieldAlert, Activity, Heart, Award, X, Info } from 'lucide-react';

const targetBones = [
  ['head', 'neck'], ['neck', 'spine'], ['spine', 'hips'],
  ['neck', 'leftShoulder'], ['leftShoulder', 'leftElbow'], ['leftElbow', 'leftWrist'],
  ['neck', 'rightShoulder'], ['rightShoulder', 'rightElbow'], ['rightElbow', 'rightWrist'],
  ['hips', 'leftHip'], ['leftHip', 'leftKnee'], ['leftKnee', 'leftAnkle'],
  ['hips', 'rightHip'], ['rightHip', 'rightKnee'], ['rightKnee', 'rightAnkle']
];

const poseTemplates = {
  'tree-pose': {
    hips: { x: 0, y: 0, z: 0 }, leftHip: { x: -14, y: 0, z: 0 }, rightHip: { x: 14, y: 0, z: 0 },
    spine: { x: 0, y: 32, z: 0 }, neck: { x: 0, y: 65, z: 0 }, head: { x: 0, y: 80, z: 0 },
    leftShoulder: { x: -20, y: 60, z: 0 }, rightShoulder: { x: 20, y: 60, z: 0 },
    leftKnee: { x: -14, y: -40, z: 0 }, leftAnkle: { x: -14, y: -80, z: 0 },
    rightKnee: { x: 30, y: -20, z: 18 }, rightAnkle: { x: -4, y: -38, z: 5 },
    leftElbow: { x: -25, y: 88, z: 12 }, leftWrist: { x: -2, y: 110, z: 4 },
    rightElbow: { x: 25, y: 88, z: 12 }, rightWrist: { x: 2, y: 110, z: 4 }
  },
  'warrior-ii': {
    hips: { x: 0, y: 0, z: 0 }, leftHip: { x: -14, y: 0, z: 0 }, rightHip: { x: 14, y: 0, z: 0 },
    spine: { x: 0, y: 32, z: 0 }, neck: { x: 0, y: 64, z: 0 }, head: { x: 0, y: 78, z: 0 },
    leftShoulder: { x: -20, y: 60, z: 0 }, rightShoulder: { x: 20, y: 60, z: 0 },
    leftKnee: { x: -42, y: -18, z: 0 }, leftAnkle: { x: -42, y: -62, z: 0 },
    rightKnee: { x: 28, y: -28, z: 0 }, rightAnkle: { x: 56, y: -62, z: 0 },
    leftElbow: { x: -48, y: 60, z: 0 }, leftWrist: { x: -78, y: 60, z: 0 },
    rightElbow: { x: 48, y: 60, z: 0 }, rightWrist: { x: 78, y: 60, z: 0 }
  },
  'downward-dog': {
    hips: { x: 0, y: 40, z: 0 }, leftHip: { x: -10, y: 40, z: -10 }, rightHip: { x: 10, y: 40, z: 10 },
    spine: { x: -18, y: 22, z: 0 }, neck: { x: -36, y: 4, z: 0 }, head: { x: -44, y: -4, z: 0 },
    leftShoulder: { x: -36, y: 4, z: -12 }, rightShoulder: { x: -36, y: 4, z: 12 },
    leftKnee: { x: 8, y: 18, z: -10 }, leftAnkle: { x: 26, y: -10, z: -10 },
    rightKnee: { x: 26, y: 18, z: 10 }, rightAnkle: { x: 46, y: -10, z: 10 },
    leftElbow: { x: -50, y: -14, z: -12 }, leftWrist: { x: -64, y: -32, z: -12 },
    rightElbow: { x: -50, y: -14, z: 12 }, rightWrist: { x: -64, y: -32, z: 12 }
  },
  'cobra-pose': {
    hips: { x: -28, y: -18, z: 0 }, leftHip: { x: -28, y: -18, z: -8 }, rightHip: { x: -28, y: -18, z: 8 },
    spine: { x: 0, y: -4, z: 0 }, neck: { x: 26, y: 22, z: 0 }, head: { x: 38, y: 32, z: 0 },
    leftShoulder: { x: 26, y: 22, z: -16 }, rightShoulder: { x: 26, y: 22, z: 16 },
    leftKnee: { x: -55, y: -18, z: -8 }, leftAnkle: { x: -84, y: -18, z: -8 },
    rightKnee: { x: -55, y: -18, z: 8 }, rightAnkle: { x: -84, y: -18, z: 8 },
    leftElbow: { x: 18, y: 0, z: -20 }, leftWrist: { x: 28, y: -18, z: -16 },
    rightElbow: { x: 18, y: 0, z: 20 }, rightWrist: { x: 28, y: -18, z: 16 }
  },
  'crow-pose': {
    hips: { x: -8, y: 10, z: 0 }, leftHip: { x: -8, y: 10, z: -8 }, rightHip: { x: -8, y: 10, z: 8 },
    spine: { x: 2, y: 12, z: 0 }, neck: { x: 16, y: 10, z: 0 }, head: { x: 24, y: 4, z: 0 },
    leftShoulder: { x: 16, y: 10, z: -14 }, rightShoulder: { x: 16, y: 10, z: 14 },
    leftKnee: { x: 10, y: 14, z: -14 }, leftAnkle: { x: -16, y: 22, z: -12 },
    rightKnee: { x: 10, y: 14, z: 14 }, rightAnkle: { x: -16, y: 22, z: 12 },
    leftElbow: { x: 20, y: -6, z: -20 }, leftWrist: { x: 16, y: -24, z: -16 },
    rightElbow: { x: 20, y: -6, z: 20 }, rightWrist: { x: 16, y: -24, z: 16 }
  },
  'childs-pose': {
    hips: { x: -35, y: -45, z: 0 }, leftHip: { x: -35, y: -45, z: -8 }, rightHip: { x: -35, y: -45, z: 8 },
    spine: { x: -15, y: -40, z: 0 }, neck: { x: 12, y: -45, z: 0 }, head: { x: 24, y: -48, z: 0 },
    leftShoulder: { x: 12, y: -45, z: -14 }, rightShoulder: { x: 12, y: -45, z: 14 },
    leftKnee: { x: -15, y: -52, z: -12 }, leftAnkle: { x: -35, y: -52, z: -8 },
    rightKnee: { x: -15, y: -52, z: 12 }, rightAnkle: { x: -35, y: -52, z: 8 },
    leftElbow: { x: 38, y: -48, z: -14 }, leftWrist: { x: 62, y: -50, z: -14 },
    rightElbow: { x: 38, y: -48, z: 14 }, rightWrist: { x: 62, y: -50, z: 14 }
  },
  'bridge-pose': {
    hips: { x: -10, y: -10, z: 0 }, leftHip: { x: -10, y: -10, z: -10 }, rightHip: { x: -10, y: -10, z: 10 },
    spine: { x: -28, y: -30, z: 0 }, neck: { x: -46, y: -46, z: 0 }, head: { x: -55, y: -50, z: 0 },
    leftShoulder: { x: -46, y: -46, z: -14 }, rightShoulder: { x: -46, y: -46, z: 14 },
    leftKnee: { x: 15, y: 15, z: -12 }, leftAnkle: { x: 26, y: -48, z: -10 },
    rightKnee: { x: 15, y: 15, z: 12 }, rightAnkle: { x: 26, y: -48, z: 10 },
    leftElbow: { x: -28, y: -48, z: -16 }, leftWrist: { x: -10, y: -48, z: -14 },
    rightElbow: { x: -28, y: -48, z: 16 }, rightWrist: { x: -10, y: -48, z: 14 }
  },
  'triangle-pose': {
    hips: { x: 0, y: 0, z: 0 }, leftHip: { x: -15, y: 0, z: 0 }, rightHip: { x: 15, y: 0, z: 0 },
    spine: { x: -12, y: 24, z: 0 }, neck: { x: -28, y: 44, z: 0 }, head: { x: -36, y: 52, z: 0 },
    leftShoulder: { x: -34, y: 38, z: -6 }, rightShoulder: { x: -22, y: 50, z: 6 },
    leftKnee: { x: -30, y: -28, z: 0 }, leftAnkle: { x: -55, y: -62, z: 0 },
    rightKnee: { x: 25, y: -28, z: 0 }, rightAnkle: { x: 50, y: -62, z: 0 },
    leftElbow: { x: -52, y: 18, z: -10 }, leftWrist: { x: -70, y: -2, z: -12 },
    rightElbow: { x: -10, y: 70, z: 10 }, rightWrist: { x: 2, y: 92, z: 12 }
  },
  'warrior-i': {
    hips: { x: 0, y: 0, z: 0 }, leftHip: { x: -14, y: 0, z: 0 }, rightHip: { x: 14, y: 0, z: 0 },
    spine: { x: 0, y: 32, z: 0 }, neck: { x: 0, y: 64, z: 0 }, head: { x: 0, y: 78, z: 0 },
    leftShoulder: { x: -18, y: 60, z: 0 }, rightShoulder: { x: 18, y: 60, z: 0 },
    leftKnee: { x: -38, y: -20, z: 0 }, leftAnkle: { x: -38, y: -62, z: 0 },
    rightKnee: { x: 26, y: -30, z: 0 }, rightAnkle: { x: 52, y: -62, z: 0 },
    leftElbow: { x: -22, y: 88, z: 8 }, leftWrist: { x: -22, y: 112, z: 12 },
    rightElbow: { x: 22, y: 88, z: 8 }, rightWrist: { x: 22, y: 112, z: 12 }
  },
  'camel-pose': {
    hips: { x: 10, y: -12, z: 0 }, leftHip: { x: 10, y: -12, z: -8 }, rightHip: { x: 10, y: -12, z: 8 },
    spine: { x: 4, y: 15, z: 0 }, neck: { x: -12, y: 38, z: 0 }, head: { x: -22, y: 44, z: 0 },
    leftShoulder: { x: -15, y: 32, z: -14 }, rightShoulder: { x: -15, y: 32, z: 14 },
    leftKnee: { x: 14, y: -45, z: -10 }, leftAnkle: { x: -14, y: -45, z: -10 },
    rightKnee: { x: 14, y: -45, z: 10 }, rightAnkle: { x: -14, y: -45, z: 10 },
    leftElbow: { x: -25, y: 12, z: -16 }, leftWrist: { x: -20, y: -14, z: -14 },
    rightElbow: { x: -25, y: 12, z: 16 }, rightWrist: { x: -20, y: -14, z: 14 }
  },
  'lotus-pose': {
    hips: { x: 0, y: -42, z: 0 }, leftHip: { x: -12, y: -42, z: -6 }, rightHip: { x: 12, y: -42, z: 6 },
    spine: { x: 0, y: -12, z: 0 }, neck: { x: 0, y: 20, z: 0 }, head: { x: 0, y: 34, z: 0 },
    leftShoulder: { x: -18, y: 16, z: 0 }, rightShoulder: { x: 18, y: 16, z: 0 },
    leftKnee: { x: -32, y: -45, z: 12 }, leftAnkle: { x: 4, y: -40, z: 16 },
    rightKnee: { x: 32, y: -45, z: 14 }, rightAnkle: { x: -4, y: -38, z: 18 },
    leftElbow: { x: -26, y: -8, z: 8 }, leftWrist: { x: -22, y: -30, z: 14 },
    rightElbow: { x: 26, y: -8, z: 8 }, rightWrist: { x: 22, y: -30, z: 14 }
  },
  'plank-pose': {
    hips: { x: -12, y: 0, z: 0 }, leftHip: { x: -12, y: 0, z: -8 }, rightHip: { x: -12, y: 0, z: 8 },
    spine: { x: 8, y: 10, z: 0 }, neck: { x: 28, y: 18, z: 0 }, head: { x: 36, y: 20, z: 0 },
    leftShoulder: { x: 28, y: 18, z: -14 }, rightShoulder: { x: 28, y: 18, z: 14 },
    leftKnee: { x: -38, y: -12, z: -8 }, leftAnkle: { x: -64, y: -24, z: -8 },
    rightKnee: { x: -38, y: -12, z: 8 }, rightAnkle: { x: -64, y: -24, z: 8 },
    leftElbow: { x: 28, y: -6, z: -16 }, leftWrist: { x: 28, y: -30, z: -14 },
    rightElbow: { x: 28, y: -6, z: 16 }, rightWrist: { x: 28, y: -30, z: 14 }
  }
};

const HUD_JOINTS = [
  { key: 'rightKnee', label: 'Right Knee', joint: 'rightKnee', target: 90 },
  { key: 'leftKnee', label: 'Left Knee', joint: 'leftKnee', target: 180 },
  { key: 'rightElbow', label: 'Right Elbow', joint: 'rightElbow', target: 180 },
  { key: 'leftElbow', label: 'Left Elbow', joint: 'leftElbow', target: 180 },
  { key: 'torsoAngle', label: 'Torso Alignment', joint: 'spine', target: 90 }
];

const ANATOMICAL_PARTS = {
  head: { name: 'Cranial Skull & Face', parent: 'neck', type: 'sphere', size: [0.12, 16, 16], muscles: 'Facial expressors, frontalis, temporalis', stability: 92, flexibility: 80, injuryRisk: 'Low', activation: 0.15 },
  neck: { name: 'Cervical Neck Spine', parent: 'chest', type: 'cylinder', size: [0.045, 0.045, 0.12, 10], muscles: 'Sternocleidomastoid, splenius capitis', stability: 88, flexibility: 75, injuryRisk: 'Medium', activation: 0.35 },
  chest: { name: 'Thoracic Chest & Ribs', parent: 'spine', type: 'cylinder', size: [0.16, 0.13, 0.22, 12], muscles: 'Pectoralis major, intercostals, rhomboids', stability: 85, flexibility: 60, injuryRisk: 'Low', activation: 0.40 },
  spine: { name: 'Lumbar Spine & Core', parent: 'pelvis', type: 'cylinder', size: [0.12, 0.10, 0.24, 10], muscles: 'Erector spinae, multifidus, rectus abdominis', stability: 78, flexibility: 65, injuryRisk: 'Medium', activation: 0.70 },
  pelvis: { name: 'Pelvic Girdle & Glutes', parent: 'root', type: 'cylinder', size: [0.17, 0.15, 0.14, 12], muscles: 'Gluteus maximus, medius, pelvic floor', stability: 90, flexibility: 70, injuryRisk: 'Low', activation: 0.80 },
  leftShoulder: { name: 'Left Shoulder Joint', parent: 'chest', type: 'sphere', size: [0.05, 10, 10], muscles: 'Deltoids, rotator cuff muscles', stability: 75, flexibility: 85, injuryRisk: 'Medium', activation: 0.50 },
  leftUpperArm: { name: 'Left Upper Arm (Bicep/Tricep)', parent: 'leftShoulder', type: 'cylinder', size: [0.038, 0.032, 0.24, 8], muscles: 'Biceps brachii, triceps brachii', stability: 80, flexibility: 78, injuryRisk: 'Low', activation: 0.30 },
  leftElbow: { name: 'Left Elbow Joint', parent: 'leftUpperArm', type: 'sphere', size: [0.04, 10, 10], muscles: 'Brachioradialis, anconeus', stability: 85, flexibility: 90, injuryRisk: 'Low', activation: 0.20 },
  leftForearm: { name: 'Left Forearm & Wrist', parent: 'leftElbow', type: 'cylinder', size: [0.03, 0.024, 0.22, 8], muscles: 'Wrist flexors/extensors', stability: 82, flexibility: 80, injuryRisk: 'Low', activation: 0.20 },
  leftHand: { name: 'Left Palm & Fingers', parent: 'leftWrist', type: 'box', size: [0.06, 0.015, 0.10], muscles: 'Thenar muscles, lumbricals', stability: 92, flexibility: 90, injuryRisk: 'Low', activation: 0.10 },
  rightShoulder: { name: 'Right Shoulder Joint', parent: 'chest', type: 'sphere', size: [0.05, 10, 10], muscles: 'Deltoids, rotator cuff muscles', stability: 76, flexibility: 84, injuryRisk: 'Medium', activation: 0.50 },
  rightUpperArm: { name: 'Right Upper Arm (Bicep/Tricep)', parent: 'rightShoulder', type: 'cylinder', size: [0.038, 0.032, 0.24, 8], muscles: 'Biceps brachii, triceps brachii', stability: 81, flexibility: 77, injuryRisk: 'Low', activation: 0.30 },
  rightElbow: { name: 'Right Elbow Joint', parent: 'rightUpperArm', type: 'sphere', size: [0.04, 10, 10], muscles: 'Brachioradialis, anconeus', stability: 84, flexibility: 91, injuryRisk: 'Low', activation: 0.20 },
  rightForearm: { name: 'Right Forearm & Wrist', parent: 'rightElbow', type: 'cylinder', size: [0.03, 0.024, 0.22, 8], muscles: 'Wrist flexors/extensors', stability: 83, flexibility: 79, injuryRisk: 'Low', activation: 0.20 },
  rightHand: { name: 'Right Palm & Fingers', parent: 'rightWrist', type: 'box', size: [0.06, 0.015, 0.10], muscles: 'Thenar muscles, lumbricals', stability: 93, flexibility: 89, injuryRisk: 'Low', activation: 0.10 },
  leftHip: { name: 'Left Hip Joint', parent: 'pelvis', type: 'sphere', size: [0.065, 10, 10], muscles: 'Iliopsoas, adductors, gluteus minimus', stability: 85, flexibility: 72, injuryRisk: 'High', activation: 0.65 },
  leftThigh: { name: 'Left Thigh (Quadricep/Hamstring)', parent: 'leftHip', type: 'cylinder', size: [0.075, 0.055, 0.38, 10], muscles: 'Rectus femoris, biceps femoris', stability: 88, flexibility: 70, injuryRisk: 'Low', activation: 0.75 },
  leftKnee: { name: 'Left Knee Joint', parent: 'leftThigh', type: 'sphere', size: [0.055, 10, 10], muscles: 'Patellar ligament, popliteus', stability: 90, flexibility: 80, injuryRisk: 'Medium', activation: 0.60 },
  leftCalf: { name: 'Left Calf (Tibia/Gastrocnemius)', parent: 'leftKnee', type: 'cylinder', size: [0.055, 0.038, 0.34, 8], muscles: 'Gastrocnemius, soleus, tibialis anterior', stability: 87, flexibility: 74, injuryRisk: 'Low', activation: 0.55 },
  leftFoot: { name: 'Left Heel & Toes', parent: 'leftAnkle', type: 'box', size: [0.06, 0.04, 0.18], muscles: 'Achilles tendon, plantar fascia', stability: 91, flexibility: 68, injuryRisk: 'Low', activation: 0.30 },
  rightHip: { name: 'Right Hip Joint', parent: 'pelvis', type: 'sphere', size: [0.065, 10, 10], muscles: 'Iliopsoas, adductors, gluteus minimus', stability: 86, flexibility: 71, injuryRisk: 'High', activation: 0.65 },
  rightThigh: { name: 'Right Thigh (Quadricep/Hamstring)', parent: 'rightHip', type: 'cylinder', size: [0.075, 0.055, 0.38, 10], muscles: 'Rectus femoris, biceps femoris', stability: 89, flexibility: 69, injuryRisk: 'Low', activation: 0.75 },
  rightKnee: { name: 'Right Knee Joint', parent: 'rightThigh', type: 'sphere', size: [0.055, 10, 10], muscles: 'Patellar ligament, popliteus', stability: 91, flexibility: 79, injuryRisk: 'Medium', activation: 0.60 },
  rightCalf: { name: 'Right Calf (Tibia/Gastrocnemius)', parent: 'rightKnee', type: 'cylinder', size: [0.055, 0.038, 0.34, 8], muscles: 'Gastrocnemius, soleus, tibialis anterior', stability: 88, flexibility: 75, injuryRisk: 'Low', activation: 0.55 },
  rightFoot: { name: 'Right Heel & Toes', parent: 'rightAnkle', type: 'box', size: [0.06, 0.04, 0.18], muscles: 'Achilles tendon, plantar fascia', stability: 92, flexibility: 67, injuryRisk: 'Low', activation: 0.30 }
};

const SCALE_FACTOR = 0.0112;

const BONE_MAPPING = [
  { key: 'leftUpperArm', parent: 'leftShoulder', child: 'leftElbow', partKey: 'leftUpperArm' },
  { key: 'leftForearm', parent: 'leftElbow', child: 'leftWrist', partKey: 'leftForearm' },
  { key: 'rightUpperArm', parent: 'rightShoulder', child: 'rightElbow', partKey: 'rightUpperArm' },
  { key: 'rightForearm', parent: 'rightElbow', child: 'rightWrist', partKey: 'rightForearm' },
  { key: 'leftThigh', parent: 'leftHip', child: 'leftKnee', partKey: 'leftThigh' },
  { key: 'leftCalf', parent: 'leftKnee', child: 'leftAnkle', partKey: 'leftCalf' },
  { key: 'rightThigh', parent: 'rightHip', child: 'rightKnee', partKey: 'rightThigh' },
  { key: 'rightCalf', parent: 'rightKnee', child: 'rightAnkle', partKey: 'rightCalf' },
  { key: 'chest', parent: 'spine', child: 'neck', partKey: 'chest' },
  { key: 'spine', parent: 'hips', child: 'spine', partKey: 'spine' },
  { key: 'neck', parent: 'neck', child: 'head', partKey: 'neck' },
  { key: 'pelvis', parent: 'leftHip', child: 'rightHip', partKey: 'pelvis' }
];

// Custom Fresnel skinned vertex shader
const holoVertexShader = `
  #include <common>
  #include <skinning_pars_vertex>
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  void main() {
    #include <skinbase_vertex>
    #include <begin_vertex>
    #include <beginnormal_vertex>
    #include <skinnormal_vertex>
    #include <defaultnormal_vertex>
    #include <skinning_vertex>
    #include <project_vertex>
    
    vNormal = normalize(transformedNormal);
    vPosition = transformed;
    vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
  }
`;

// Custom Fragment Shader mapping both Fresnel Edge Glow and Muscle Heatmaps (Cyan to Red/Orange)
const holoFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uGlow;
  uniform float uTime;
  uniform float uIsWireframe;
  
  uniform vec3 uBoneStart[12];
  uniform vec3 uBoneEnd[12];
  uniform float uBoneActivation[12];
  uniform float uBoneHovered[12];
  
  float distToSegment(vec3 p, vec3 a, vec3 b) {
    vec3 ab = b - a;
    vec3 ap = p - a;
    float t = dot(ap, ab) / dot(ab, ab);
    t = clamp(t, 0.0, 1.0);
    vec3 closest = a + t * ab;
    return length(p - closest);
  }
  
  void main() {
    // Find the closest bone segment
    int closestIdx = 0;
    float minDist = 999.0;
    for (int i = 0; i < 12; i++) {
      float d = distToSegment(vWorldPosition, uBoneStart[i], uBoneEnd[i]);
      if (d < minDist) {
        minDist = d;
        closestIdx = i;
      }
    }
    
    float activation = 0.0;
    float hovered = 0.0;
    
    if (closestIdx == 0) { activation = uBoneActivation[0]; hovered = uBoneHovered[0]; }
    else if (closestIdx == 1) { activation = uBoneActivation[1]; hovered = uBoneHovered[1]; }
    else if (closestIdx == 2) { activation = uBoneActivation[2]; hovered = uBoneHovered[2]; }
    else if (closestIdx == 3) { activation = uBoneActivation[3]; hovered = uBoneHovered[3]; }
    else if (closestIdx == 4) { activation = uBoneActivation[4]; hovered = uBoneHovered[4]; }
    else if (closestIdx == 5) { activation = uBoneActivation[5]; hovered = uBoneHovered[5]; }
    else if (closestIdx == 6) { activation = uBoneActivation[6]; hovered = uBoneHovered[6]; }
    else if (closestIdx == 7) { activation = uBoneActivation[7]; hovered = uBoneHovered[7]; }
    else if (closestIdx == 8) { activation = uBoneActivation[8]; hovered = uBoneHovered[8]; }
    else if (closestIdx == 9) { activation = uBoneActivation[9]; hovered = uBoneHovered[9]; }
    else if (closestIdx == 10) { activation = uBoneActivation[10]; hovered = uBoneHovered[10]; }
    else if (closestIdx == 11) { activation = uBoneActivation[11]; hovered = uBoneHovered[11]; }
    
    // Fresnel boundary glow - always positive
    float fresnel = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
    float edgeGlow = pow(fresnel, 2.0);
    
    // Thermal heatmap blending
    vec3 baseColor = uColor;
    vec3 activeColor = vec3(1.0, 0.28, 0.0); // Neon Orange/Red
    vec3 heatColor = mix(baseColor, activeColor, activation);
    
    if (hovered > 0.5) {
      heatColor = vec3(0.0, 0.95, 0.8); // Glowing Cyan
    }
    
    float pulse = 1.0 + 0.18 * sin(uTime * 4.5) * activation;
    
    vec3 finalColor;
    float finalAlpha;
    
    if (uIsWireframe > 0.5) {
      // For wireframe: show the grid lines clearly all over the body, 
      // with enhanced brightness at the edges.
      finalColor = heatColor * (edgeGlow * 1.0 + 0.6) * pulse;
      finalAlpha = (edgeGlow * 0.4 + uOpacity) * (1.0 + 0.3 * hovered);
    } else {
      // For solid mesh: transparent in the center to show wireframe depth, 
      // with a soft glowing boundary.
      finalColor = heatColor * (edgeGlow * 1.5 + 0.25) * pulse;
      finalAlpha = (edgeGlow * 0.65 + uOpacity) * (1.0 + 0.4 * hovered);
    }
    
    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

export default function YogaDigitalTwin({ poseId = 'warrior-ii', jointOffsets = null, showUserTwin = true }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  
  const raycastTargets = useRef([]);
  const partGroups = useRef({});
  const jointWorldPositions = useRef({});
  const labelRefs = useRef({});
  const jointsPool = useRef({});
  const skeletonLines = useRef(null);
  const energyParticles = useRef([]);
  const gltfModelRef = useRef(null);
  const lineRefs = useRef({});
  const svgRef = useRef(null);

  const [hoveredPart, setHoveredPart] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [activeHUD, setActiveHUD] = useState(true);
  const [modelLoaded, setModelLoaded] = useState(false);

  // Initialize shader uniforms for the 12 bones closest distance rendering
  const shaderUniforms = useRef({
    uColor: { value: new THREE.Color(0x0ea5e9) },
    uOpacity: { value: 0.2 },
    uGlow: { value: 1.2 },
    uTime: { value: 0 },
    uBoneStart: { value: Array.from({ length: 12 }, () => new THREE.Vector3()) },
    uBoneEnd: { value: Array.from({ length: 12 }, () => new THREE.Vector3()) },
    uBoneActivation: { value: Array.from({ length: 12 }, () => 0.1) },
    uBoneHovered: { value: Array.from({ length: 12 }, () => 0.0) }
  });

  // Compute positions deformed with active offsets
  const getSkeletalCoords = useMemo(() => {
    const baseCoords = poseTemplates[poseId] || poseTemplates['warrior-ii'];
    const coords = JSON.parse(JSON.stringify(baseCoords));
    
    if (showUserTwin && jointOffsets) {
      if (jointOffsets.rightKnee > 0) {
        coords.rightAnkle.x += jointOffsets.rightKnee * 0.7;
        coords.rightAnkle.y += jointOffsets.rightKnee * 0.3;
        coords.rightKnee.x += jointOffsets.rightKnee * 0.25;
      }
      if (jointOffsets.leftKnee > 0) {
        coords.leftAnkle.x -= jointOffsets.leftKnee * 0.7;
        coords.leftAnkle.y += jointOffsets.leftKnee * 0.3;
        coords.leftKnee.x -= jointOffsets.leftKnee * 0.25;
      }
      if (jointOffsets.rightElbow > 0) {
        coords.rightWrist.y += jointOffsets.rightElbow * 0.6;
        coords.rightElbow.y += jointOffsets.rightElbow * 0.25;
      }
      if (jointOffsets.leftElbow > 0) {
        coords.leftWrist.y += jointOffsets.leftElbow * 0.6;
        coords.leftElbow.y += jointOffsets.leftElbow * 0.25;
      }
      if (jointOffsets.torsoAngle > 0) {
        const offsetVal = jointOffsets.torsoAngle * 0.5;
        coords.head.x += offsetVal;
        coords.neck.x += offsetVal;
        coords.spine.x += offsetVal * 0.4;
      }
    }
    return coords;
  }, [poseId, jointOffsets, showUserTwin]);

  // Raycaster hover + click handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!cameraRef.current || raycastTargets.current.length === 0) return;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(raycastTargets.current);

      if (intersects.length > 0) {
        const hitPart = intersects[0].object.userData.partKey;
        if (hitPart !== hoveredPart) {
          setHoveredPart(hitPart);
        }
      } else {
        if (hoveredPart !== null) {
          setHoveredPart(null);
        }
      }
    };

    const handleClick = () => {
      if (hoveredPart) {
        setSelectedPart(hoveredPart);
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
    };
  }, [hoveredPart]);

  // Three.js Canvas setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050816);
    scene.fog = new THREE.FogExp2(0x050816, 0.12);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.05, 3.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.5;
    controls.maxDistance = 5.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.target.set(0, -0.45, 0); // Focus on the center of the humanoid model
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0x0a192f, 0.8);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x00f0ff, 1.5, 10);
    pointLight.position.set(0, 1.5, 2.0);
    scene.add(pointLight);

    const gridHelper = new THREE.GridHelper(8, 60, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -1.5;
    scene.add(gridHelper);

    // Floor holographic rings
    const floorGeo = new THREE.RingGeometry(0.75, 0.76, 64);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.15 });
    const floorRing = new THREE.Mesh(floorGeo, floorMat);
    floorRing.rotation.x = Math.PI / 2;
    floorRing.position.y = -1.49;
    scene.add(floorRing);

    // Dynamic floating dust
    const dustCount = 300;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPos[i] = (Math.random() - 0.5) * 6;
      dustPos[i + 1] = (Math.random() - 0.5) * 4;
      dustPos[i + 2] = (Math.random() - 0.5) * 6;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x00ffff, size: 0.008, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // Create 3D Holographic Geometries (invisible targets for raycasting tooltip panels)
    raycastTargets.current = [];
    Object.keys(ANATOMICAL_PARTS).forEach(partKey => {
      const c = ANATOMICAL_PARTS[partKey];
      const group = new THREE.Group();
      scene.add(group);
      partGroups.current[partKey] = group;

      let geom;
      if (c.type === 'sphere') {
        geom = new THREE.SphereGeometry(c.size[0], c.size[1], c.size[2]);
      } else if (c.type === 'cylinder') {
        geom = new THREE.CylinderGeometry(c.size[0], c.size[1], c.size[2], c.size[3]);
      } else {
        geom = new THREE.BoxGeometry(c.size[0], c.size[1], c.size[2]);
      }

      // Invisible click raycast mesh
      const clickMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const clickMesh = new THREE.Mesh(geom, clickMat);
      clickMesh.userData = { partKey };
      group.add(clickMesh);
      raycastTargets.current.push(clickMesh);
    });

    // 9. MediaPipe 33-landmark skeleton Nodes (glowing spheres - hidden but kept for mapping/energy streams)
    const jointsList = ['head', 'neck', 'spine', 'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'];
    const sphGeo = new THREE.SphereGeometry(0.02, 12, 12);
    jointsList.forEach(jointKey => {
      const mat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.85 });
      const sphere = new THREE.Mesh(sphGeo, mat);
      sphere.visible = false; // Never render skeletal nodes
      scene.add(sphere);
      jointsPool.current[jointKey] = sphere;
    });

    // Glowing Skeletal connect paths (hidden)
    const skeletonGeo = new THREE.BufferGeometry();
    const skeletonMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4 });
    const skeleton = new THREE.LineSegments(skeletonGeo, skeletonMat);
    skeleton.visible = false; // Never render skeletal lines
    scene.add(skeleton);
    skeletonLines.current = skeleton;

    // 10. Glowing Energy Particle Streams
    const energyStreams = [
      ['spine', 'neck', 'head'],
      ['neck', 'leftShoulder', 'leftElbow', 'leftWrist'],
      ['neck', 'rightShoulder', 'rightElbow', 'rightWrist'],
      ['spine', 'leftHip', 'leftKnee', 'leftAnkle'],
      ['spine', 'rightHip', 'rightKnee', 'rightAnkle']
    ];

    energyParticles.current = [];
    for (let i = 0; i < 40; i++) {
      const particleGeo = new THREE.SphereGeometry(0.008, 6, 6);
      const particleMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
      const particle = new THREE.Mesh(particleGeo, particleMat);
      scene.add(particle);
      energyParticles.current.push({
        mesh: particle,
        stream: energyStreams[i % energyStreams.length],
        progress: Math.random(),
        speed: 0.08 + Math.random() * 0.12
      });
    }

    // Load humanoid GLB/GLTF model
    let isComponentActive = true;
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('/Xbot.glb', (gltf) => {
      if (!isComponentActive) return;
      
      const model = gltf.scene;
      model.position.set(0, -0.6, 0); // Align feet height with ground plane
      model.scale.set(1.0, 1.0, 1.0);
      scene.add(model);
      gltfModelRef.current = model;

      // Apply Fresnel hologram custom ShaderMaterial to all SkinnedMesh components
      model.traverse((child) => {
        if (child.isMesh && child.isSkinnedMesh) {
          // Volumetric solid-glow body
          const solidMat = new THREE.ShaderMaterial({
            vertexShader: holoVertexShader,
            fragmentShader: holoFragmentShader,
            uniforms: {
              uColor: { value: new THREE.Color(0x0ea5e9) },
              uOpacity: { value: 0.12 },
              uGlow: { value: 1.2 },
              uTime: shaderUniforms.current.uTime,
              uIsWireframe: { value: 0.0 },
              uBoneStart: shaderUniforms.current.uBoneStart,
              uBoneEnd: shaderUniforms.current.uBoneEnd,
              uBoneActivation: shaderUniforms.current.uBoneActivation,
              uBoneHovered: shaderUniforms.current.uBoneHovered
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
          });
          child.material = solidMat;

          // Wireframe grid skinned overlay
          const wireMat = new THREE.ShaderMaterial({
            vertexShader: holoVertexShader,
            fragmentShader: holoFragmentShader,
            uniforms: {
              uColor: { value: new THREE.Color(0x0ea5e9) },
              uOpacity: { value: 0.38 },
              uGlow: { value: 1.5 },
              uTime: shaderUniforms.current.uTime,
              uIsWireframe: { value: 1.0 },
              uBoneStart: shaderUniforms.current.uBoneStart,
              uBoneEnd: shaderUniforms.current.uBoneEnd,
              uBoneActivation: shaderUniforms.current.uBoneActivation,
              uBoneHovered: shaderUniforms.current.uBoneHovered
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            wireframe: true
          });
          
          const wiremesh = new THREE.SkinnedMesh(child.geometry, wireMat);
          wiremesh.bind(child.skeleton, child.bindMatrix);
          if (child.parent) {
            child.parent.add(wiremesh);
          } else {
            model.add(wiremesh);
          }
        }
      });
      setModelLoaded(true);
    }, undefined, (err) => {
      console.error('Error loading 3D humanoid GLB model:', err);
    });

    // Responsive sizing listener
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) continue;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });
    resizeObserver.observe(container);

    const clock = new THREE.Clock();

    // 11. Render Animation loop
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      
      floorRing.rotation.z = elapsed * 0.12;
      dust.position.y = Math.sin(elapsed * 0.3) * 0.05;

      // Update fragment shader elapsed times
      shaderUniforms.current.uTime.value = elapsed;

      // Flow energy particles
      energyParticles.current.forEach(p => {
        p.progress = (p.progress + p.speed * 0.4) % 1.0;
        const numJoints = p.stream.length;
        const scaledProgress = p.progress * (numJoints - 1);
        const segmentIdx = Math.floor(scaledProgress);
        const t = scaledProgress - segmentIdx;

        const posA = jointWorldPositions.current[p.stream[segmentIdx]];
        const posB = jointWorldPositions.current[p.stream[segmentIdx + 1]];

        if (posA && posB) {
          p.mesh.position.lerpVectors(posA, posB, t);
          p.mesh.visible = true;
        } else {
          p.mesh.visible = false;
        }
      });

      // Project HUD labels
      if (activeHUD) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        const model = gltfModelRef.current;
        const projectedPositions = [];

        HUD_JOINTS.forEach(hud => {
          let pos = jointWorldPositions.current[hud.joint];
          
          // Anchor HUD labels directly to the actual GLB bone's world position if loaded
          if (model) {
            const boneName = 
              hud.joint === 'rightKnee' ? 'mixamorigRightLeg' :
              hud.joint === 'leftKnee' ? 'mixamorigLeftLeg' :
              hud.joint === 'rightElbow' ? 'mixamorigRightForeArm' :
              hud.joint === 'leftElbow' ? 'mixamorigLeftForeArm' :
              hud.joint === 'spine' ? 'mixamorigSpine1' : 
              null;
            
            if (boneName) {
              const bone = model.getObjectByName(boneName);
              if (bone) {
                const worldPos = new THREE.Vector3();
                bone.getWorldPosition(worldPos);
                pos = worldPos;
              }
            }
          }

          if (pos && labelRefs.current[hud.key]) {
            const tempV = pos.clone();
            tempV.project(camera);

            const el = labelRefs.current[hud.key];
            if (tempV.z > 1.0) {
              el.style.display = 'none';
              const line = lineRefs.current[hud.key];
              if (line) line.style.display = 'none';
            } else {
              const x = (tempV.x * 0.5 + 0.5) * width;
              const y = (tempV.y * -0.5 + 0.5) * height;
              projectedPositions.push({
                key: hud.key,
                el: el,
                jx: x,
                jy: y,
                x: x,
                y: y
              });
            }
          }
        });

        // 1. Shift labels horizontally to the sides to prevent covering the model
        const margin = 80;
        projectedPositions.forEach(p => {
          const isRightSide = p.jx > width / 2;
          p.x = Math.max(margin, Math.min(width - margin, p.jx + (isRightSide ? 140 : -140)));
        });

        // 2. Sort by Y position and resolve vertical overlap
        projectedPositions.sort((a, b) => a.y - b.y);

        const minDistanceY = 32; // minimum vertical gap in pixels
        const minDistanceX = 145; // horizontal collision width in pixels

        for (let pass = 0; pass < 3; pass++) {
          for (let i = 1; i < projectedPositions.length; i++) {
            const prev = projectedPositions[i - 1];
            const curr = projectedPositions[i];
            
            const dx = Math.abs(curr.x - prev.x);
            const dy = curr.y - prev.y;
            
            if (dx < minDistanceX && dy < minDistanceY) {
              const overlap = minDistanceY - dy;
              curr.y += overlap * 0.6;
              prev.y -= overlap * 0.4;
            }
          }
          projectedPositions.sort((a, b) => a.y - b.y);
        }

        // Apply corrected positions to HTML elements and draw leader lines
        projectedPositions.forEach(p => {
          p.el.style.display = 'flex';
          p.el.style.transform = `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`;

          // Draw the dotted line from the joint position to the offset label position
          const line = lineRefs.current[p.key];
          if (line) {
            line.setAttribute('x1', p.jx);
            line.setAttribute('y1', p.jy);
            line.setAttribute('x2', p.x);
            line.setAttribute('y2', p.y);
            
            const dev = jointOffsets?.[p.key] || 0;
            const strokeColor = dev > 10 ? '#ef4444' : (dev > 5 ? '#f59e0b' : '#10b981');
            line.setAttribute('stroke', strokeColor);
            line.style.display = 'block';
          }
        });
      }

      controls.update();
      renderer.render(scene, camera);
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      isComponentActive = false;
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameIdRef.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
      }
      gltfModelRef.current = null;
    };
  }, []);

  // Rigging calculations updates
  useEffect(() => {
    const coords = getSkeletalCoords;
    const worldCoords = {};
    Object.keys(coords).forEach(key => {
      worldCoords[key] = new THREE.Vector3(
        coords[key].x * SCALE_FACTOR,
        (coords[key].y * SCALE_FACTOR) - 0.6,
        coords[key].z * SCALE_FACTOR
      );
    });
    jointWorldPositions.current = worldCoords;

    // Connect wireframe skeletal segment paths (hidden but kept)
    if (skeletonLines.current) {
      const linePositions = [];
      targetBones.forEach(([nodeA, nodeB]) => {
        const pA = worldCoords[nodeA];
        const pB = worldCoords[nodeB];
        if (pA && pB) {
          linePositions.push(pA.x, pA.y, pA.z);
          linePositions.push(pB.x, pB.y, pB.z);
        }
      });
      skeletonLines.current.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      skeletonLines.current.geometry.attributes.position.needsUpdate = true;
    }

    // Connect joint landmark nodes (hidden but kept)
    Object.keys(jointsPool.current).forEach(jointKey => {
      const mesh = jointsPool.current[jointKey];
      const pos = worldCoords[jointKey];
      if (pos && mesh) {
        mesh.position.copy(pos);
      }
    });

    // Align invisible raycast cylinders and stretch segments
    const alignSegment = (groupName, jA, jB, cSizeZ) => {
      const group = partGroups.current[groupName];
      const pA = worldCoords[jA];
      const pB = worldCoords[jB];
      if (group && pA && pB) {
        const direction = new THREE.Vector3().subVectors(pB, pA);
        const length = direction.length();
        const midpoint = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);

        group.position.copy(midpoint);
        const up = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction.clone().normalize());
        group.setRotationFromQuaternion(quaternion);
        group.scale.set(1, length / cSizeZ, 1);
      }
    };

    const alignSphereJoint = (groupName, joint) => {
      const group = partGroups.current[groupName];
      const p = worldCoords[joint];
      if (group && p) {
        group.position.copy(p);
      }
    };

    // Apply rigs to invisible raycast colliders
    alignSphereJoint('head', 'head');
    alignSegment('neck', 'neck', 'head', 0.12);
    alignSegment('chest', 'spine', 'neck', 0.22);
    alignSegment('spine', 'hips', 'spine', 0.24);
    alignSegment('pelvis', 'hips', 'spine', 0.14);

    alignSphereJoint('leftShoulder', 'leftShoulder');
    alignSegment('leftUpperArm', 'leftShoulder', 'leftElbow', 0.24);
    alignSphereJoint('leftElbow', 'leftElbow');
    alignSegment('leftForearm', 'leftElbow', 'leftWrist', 0.22);
    alignSphereJoint('leftHand', 'leftWrist');

    alignSphereJoint('rightShoulder', 'rightShoulder');
    alignSegment('rightUpperArm', 'rightShoulder', 'rightElbow', 0.24);
    alignSphereJoint('rightElbow', 'rightElbow');
    alignSegment('rightForearm', 'rightElbow', 'rightWrist', 0.22);
    alignSphereJoint('rightHand', 'rightWrist');

    alignSphereJoint('leftHip', 'leftHip');
    alignSegment('leftThigh', 'leftHip', 'leftKnee', 0.38);
    alignSphereJoint('leftKnee', 'leftKnee');
    alignSegment('leftCalf', 'leftKnee', 'leftAnkle', 0.34);
    alignSphereJoint('leftFoot', 'leftAnkle');

    alignSphereJoint('rightHip', 'rightHip');
    alignSegment('rightThigh', 'rightHip', 'rightKnee', 0.38);
    alignSphereJoint('rightKnee', 'rightKnee');
    alignSegment('rightCalf', 'rightKnee', 'rightAnkle', 0.34);
    alignSphereJoint('rightFoot', 'rightAnkle');

    // Real-time Skeletal Rigging for the 3D humanoid GLB model
    const model = gltfModelRef.current;
    if (model) {
      // 1. Position and Rotate Hips (Root bone)
      const hipsBone = model.getObjectByName('mixamorigHips');
      const pLeftHip = worldCoords.leftHip;
      const pRightHip = worldCoords.rightHip;
      const pSpine = worldCoords.spine;
      const pHips = worldCoords.hips;

      if (hipsBone && pLeftHip && pRightHip && pSpine && pHips) {
        hipsBone.position.set(pHips.x, pHips.y + 0.6, pHips.z);

        // Hips rotation basis
        const lateral = new THREE.Vector3().subVectors(pRightHip, pLeftHip).normalize();
        const vertical = new THREE.Vector3().subVectors(pSpine, pHips).normalize();
        const forward = new THREE.Vector3().crossVectors(lateral, vertical).normalize();
        const orthoVertical = new THREE.Vector3().crossVectors(forward, lateral).normalize();

        const m = new THREE.Matrix4().makeBasis(lateral, orthoVertical, forward);
        const hipsQuat = new THREE.Quaternion().setFromRotationMatrix(m);
        hipsBone.quaternion.copy(hipsQuat);
        hipsBone.updateMatrixWorld(true);
      }

      // 2. Bone rigging alignment solver
      const alignBone = (boneName, parentJoint, childJoint) => {
        const bone = model.getObjectByName(boneName);
        if (!bone) return;

        const pA = worldCoords[parentJoint];
        const pB = worldCoords[childJoint];
        if (!pA || !pB) return;

        // Target direction in world space
        const targetDir = new THREE.Vector3().subVectors(pB, pA).normalize();

        // Default direction of this bone in local space relative to its child
        let localDir = new THREE.Vector3(0, 1, 0); // fallback
        const childBone = bone.children.find(c => c.isBone);
        if (childBone) {
          localDir.copy(childBone.position).normalize();
        } else {
          // Leaf fallback directions
          if (boneName.includes('LeftArm') || boneName.includes('LeftForeArm')) {
            localDir.set(-1, 0, 0);
          } else if (boneName.includes('RightArm') || boneName.includes('RightForeArm')) {
            localDir.set(1, 0, 0);
          } else if (boneName.includes('Leg')) {
            localDir.set(0, -1, 0);
          } else {
            localDir.set(0, 1, 0);
          }
        }

        // Get parent's world rotation
        const parentWorldQuat = new THREE.Quaternion();
        if (bone.parent) {
          bone.parent.getWorldQuaternion(parentWorldQuat);
        }

        // Convert target direction to parent's local space
        const targetLocalDir = targetDir.clone().applyQuaternion(parentWorldQuat.invert());

        // Local rotation quaternion
        const localQuat = new THREE.Quaternion().setFromUnitVectors(localDir, targetLocalDir);
        bone.quaternion.copy(localQuat);
        bone.updateMatrixWorld(true);
      };

      // 3. Align bones hierarchically
      alignBone('mixamorigSpine', 'hips', 'spine');
      alignBone('mixamorigSpine1', 'spine', 'neck');
      alignBone('mixamorigSpine2', 'spine', 'neck');
      alignBone('mixamorigNeck', 'neck', 'head');

      alignBone('mixamorigLeftArm', 'leftShoulder', 'leftElbow');
      alignBone('mixamorigLeftForeArm', 'leftElbow', 'leftWrist');

      alignBone('mixamorigRightArm', 'rightShoulder', 'rightElbow');
      alignBone('mixamorigRightForeArm', 'rightElbow', 'rightWrist');

      alignBone('mixamorigLeftUpLeg', 'leftHip', 'leftKnee');
      alignBone('mixamorigLeftLeg', 'leftKnee', 'leftAnkle');

      alignBone('mixamorigRightUpLeg', 'rightHip', 'rightKnee');
      alignBone('mixamorigRightLeg', 'rightKnee', 'rightAnkle');

      // Update shader uniforms for closest bone detection
      BONE_MAPPING.forEach((mapItem, idx) => {
        const startJoint = worldCoords[mapItem.parent];
        const endJoint = worldCoords[mapItem.child];

        if (startJoint && endJoint) {
          const startBone = model.getObjectByName(
            mapItem.parent === 'hips' ? 'mixamorigHips' :
            mapItem.parent === 'spine' ? 'mixamorigSpine' :
            mapItem.parent === 'neck' ? 'mixamorigNeck' :
            mapItem.parent === 'leftShoulder' ? 'mixamorigLeftShoulder' :
            mapItem.parent === 'rightShoulder' ? 'mixamorigRightShoulder' :
            mapItem.parent === 'leftElbow' ? 'mixamorigLeftForeArm' :
            mapItem.parent === 'rightElbow' ? 'mixamorigRightForeArm' :
            mapItem.parent === 'leftHip' ? 'mixamorigLeftUpLeg' :
            mapItem.parent === 'rightHip' ? 'mixamorigRightUpLeg' :
            mapItem.parent === 'leftKnee' ? 'mixamorigLeftLeg' :
            mapItem.parent === 'rightKnee' ? 'mixamorigRightLeg' :
            mapItem.parent === 'leftAnkle' ? 'mixamorigLeftFoot' :
            'mixamorigHips'
          );

          const endBone = model.getObjectByName(
            mapItem.child === 'spine' ? 'mixamorigSpine' :
            mapItem.child === 'neck' ? 'mixamorigNeck' :
            mapItem.child === 'head' ? 'mixamorigHead' :
            mapItem.child === 'leftElbow' ? 'mixamorigLeftForeArm' :
            mapItem.child === 'rightElbow' ? 'mixamorigRightForeArm' :
            mapItem.child === 'leftWrist' ? 'mixamorigLeftHand' :
            mapItem.child === 'rightWrist' ? 'mixamorigRightHand' :
            mapItem.child === 'leftKnee' ? 'mixamorigLeftLeg' :
            mapItem.child === 'rightKnee' ? 'mixamorigRightLeg' :
            mapItem.child === 'leftAnkle' ? 'mixamorigLeftFoot' :
            mapItem.child === 'rightAnkle' ? 'mixamorigRightFoot' :
            'mixamorigHead'
          );

          if (startBone && endBone) {
            startBone.getWorldPosition(shaderUniforms.current.uBoneStart.value[idx]);
            endBone.getWorldPosition(shaderUniforms.current.uBoneEnd.value[idx]);
          } else {
            shaderUniforms.current.uBoneStart.value[idx].copy(startJoint);
            shaderUniforms.current.uBoneEnd.value[idx].copy(endJoint);
          }
        }

        // Muscle activation value for this bone
        const part = ANATOMICAL_PARTS[mapItem.partKey];
        let activationVal = part ? part.activation : 0.1;

        // Dynamic joint offsets mapping
        if (jointOffsets) {
          let dev = 0;
          if (mapItem.partKey === 'rightKnee' && jointOffsets.rightKnee) dev = jointOffsets.rightKnee;
          if (mapItem.partKey === 'leftKnee' && jointOffsets.leftKnee) dev = jointOffsets.leftKnee;
          if (mapItem.partKey === 'rightForearm' && jointOffsets.rightElbow) dev = jointOffsets.rightElbow;
          if (mapItem.partKey === 'leftForearm' && jointOffsets.leftElbow) dev = jointOffsets.leftElbow;
          if ((mapItem.partKey === 'spine' || mapItem.partKey === 'chest' || mapItem.partKey === 'neck') && jointOffsets.torsoAngle) dev = jointOffsets.torsoAngle;

          if (dev > 0) {
            activationVal = Math.min(1.0, activationVal + dev * 0.05);
          }
        }
        shaderUniforms.current.uBoneActivation.value[idx] = activationVal;

        // Hover or selected highlight uniforms update
        const isHovered = hoveredPart === mapItem.partKey;
        const isSelected = selectedPart === mapItem.partKey;
        shaderUniforms.current.uBoneHovered.value[idx] = (isHovered || isSelected) ? 1.0 : 0.0;
      });
    }

  }, [getSkeletalCoords, jointOffsets, hoveredPart, selectedPart, modelLoaded]);

  const getJointColor = (jointKey, offsets) => {
    if (!offsets) return 0x10b981;
    let val = 0;
    if (jointKey === 'rightKnee' && offsets.rightKnee) val = offsets.rightKnee;
    if (jointKey === 'leftKnee' && offsets.leftKnee) val = offsets.leftKnee;
    if (jointKey === 'rightElbow' && offsets.rightElbow) val = offsets.rightElbow;
    if (jointKey === 'leftElbow' && offsets.leftElbow) val = offsets.leftElbow;
    if ((jointKey === 'spine' || jointKey === 'neck' || jointKey === 'head') && offsets.torsoAngle) val = offsets.torsoAngle;
    
    if (val > 10) return 0xef4444; // Rose red
    if (val > 5) return 0xf59e0b;  // Gold amber
    return 0x10b981;              // Emerald green
  };

  const getAngleFromCoords = (coords, jointA, jointB, jointC) => {
    const pA = coords[jointA];
    const pB = coords[jointB];
    const pC = coords[jointC];
    if (!pA || !pB || !pC) return 180;

    const v1 = new THREE.Vector3(pA.x - pB.x, pA.y - pB.y, pA.z - pB.z).normalize();
    const v2 = new THREE.Vector3(pC.x - pB.x, pC.y - pB.y, pC.z - pB.z).normalize();
    const dot = v1.dot(v2);
    return Math.round(Math.acos(Math.max(-1.0, Math.min(1.0, dot))) * (180 / Math.PI));
  };

  const getTorsoAngleFromCoords = (coords) => {
    const pHips = coords['hips'];
    const pNeck = coords['neck'];
    if (!pHips || !pNeck) return 90;

    const v = new THREE.Vector3(pNeck.x - pHips.x, pNeck.y - pHips.y, pNeck.z - pHips.z);
    const length = v.length();
    if (length === 0) return 90;
    return Math.abs(Math.round(Math.asin(Math.max(-1.0, Math.min(1.0, v.y / length))) * (180 / Math.PI)));
  };

  const getLiveAngleValue = (hudKey) => {
    const coords = getSkeletalCoords;
    if (!coords) return 90;
    
    if (hudKey === 'rightKnee') {
      return getAngleFromCoords(coords, 'rightHip', 'rightKnee', 'rightAnkle');
    }
    if (hudKey === 'leftKnee') {
      return getAngleFromCoords(coords, 'leftHip', 'leftKnee', 'leftAnkle');
    }
    if (hudKey === 'rightElbow') {
      return getAngleFromCoords(coords, 'rightShoulder', 'rightElbow', 'rightWrist');
    }
    if (hudKey === 'leftElbow') {
      return getAngleFromCoords(coords, 'leftShoulder', 'leftElbow', 'leftWrist');
    }
    if (hudKey === 'torsoAngle') {
      return getTorsoAngleFromCoords(coords);
    }
    return 90;
  };

  return (
    <div className="relative w-full h-full min-h-[360px] overflow-hidden rounded-2xl border border-white/5 bg-[#050816]">
      
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" style={{ position: 'absolute', inset: 0 }} />

      {/* HUD Leader lines connector SVG */}
      {activeHUD && getSkeletalCoords && (
        <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none z-5" style={{ position: 'absolute', inset: 0 }}>
          {HUD_JOINTS.map(hud => (
            <line
              key={hud.key}
              ref={el => lineRefs.current[hud.key] = el}
              stroke="#0ea5e9"
              strokeWidth="1.2"
              strokeDasharray="3,3"
              opacity="0.65"
              x1="0"
              y1="0"
              x2="0"
              y2="0"
              style={{ display: 'none' }}
            />
          ))}
        </svg>
      )}

      {/* Screen space projected HTML badges */}
      {activeHUD && getSkeletalCoords && HUD_JOINTS.map(hud => {
        const dev = jointOffsets?.[hud.key] || 0;
        const colorClass = dev > 10 ? 'border-rose-500/40 text-rose-400 bg-rose-950/60 shadow-rose-950/20' :
                           dev > 5 ? 'border-amber-500/40 text-amber-400 bg-amber-950/60 shadow-amber-950/20' :
                           'border-emerald-500/40 text-emerald-400 bg-emerald-950/60 shadow-emerald-950/20';
        
        const angle = getLiveAngleValue(hud.key);
        
        return (
          <div
            key={hud.key}
            ref={el => labelRefs.current[hud.key] = el}
            style={{ position: 'absolute', left: 0, top: 0, transform: 'translate(-50%, -50%)', display: 'none', pointerEvents: 'none', zIndex: 10 }}
            className={`backdrop-blur-md border px-2.5 py-0.5 rounded-lg text-[9.5px] font-black flex items-center gap-1 shadow-md transition-colors duration-300 ${colorClass}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            <span>{hud.label}: <strong className="text-white">{angle}°</strong></span>
            <span className="text-[7.5px] font-extrabold opacity-60">
              {Math.max(88, Math.round(99.4 - dev * 0.8))}% CONF
            </span>
          </div>
        );
      })}

      {/* Header controls overlay */}
      <div className="absolute top-4 left-4 z-10 space-y-1.5 text-left pointer-events-none">
        <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[9px] font-extrabold text-cyan-400 uppercase tracking-wider">
          AI Digital Twin Rig
        </span>
        <h4 className="text-sm font-black text-slate-100 uppercase tracking-wide">
          Holographic Biomechanics
        </h4>
        <div className="flex items-center gap-2 pt-0.5">
          <button 
            onClick={() => setActiveHUD(!activeHUD)}
            className="pointer-events-auto rounded-md bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 px-2 py-1 text-[8.5px] font-bold text-slate-400 hover:text-white transition-colors"
          >
            {activeHUD ? 'Hide HUD Labels' : 'Show HUD Labels'}
          </button>
        </div>
      </div>

      {/* Glassmorphic Side Biomechanical Analysis Panel */}
      {selectedPart && ANATOMICAL_PARTS[selectedPart] && (
        <div className="absolute right-4 top-4 bottom-4 w-72 bg-slate-950/85 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col justify-between z-20 text-left shadow-2xl text-slate-100 transition-all duration-300">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-black text-sm uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                Biomechanical Scan
              </h3>
              <button onClick={() => setSelectedPart(null)} className="text-slate-500 hover:text-slate-200 transition-colors p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wider block">ANATOMICAL REGION</span>
                <h4 className="text-base font-black text-slate-100">{ANATOMICAL_PARTS[selectedPart].name}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/60 rounded-xl p-3 border border-white/5">
                  <span className="text-[7.5px] text-slate-500 font-bold block uppercase tracking-wider">STABILITY</span>
                  <span className="text-sm font-black text-emerald-400">{ANATOMICAL_PARTS[selectedPart].stability}%</span>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${ANATOMICAL_PARTS[selectedPart].stability}%` }} />
                  </div>
                </div>
                <div className="bg-slate-900/60 rounded-xl p-3 border border-white/5">
                  <span className="text-[7.5px] text-slate-500 font-bold block uppercase tracking-wider">FLEXIBILITY</span>
                  <span className="text-sm font-black text-indigo-400">{ANATOMICAL_PARTS[selectedPart].flexibility}%</span>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${ANATOMICAL_PARTS[selectedPart].flexibility}%` }} />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wider block">PRIMARY MUSCLES</span>
                  <p className="text-xs text-slate-300 font-light mt-0.5 leading-relaxed">{ANATOMICAL_PARTS[selectedPart].muscles}</p>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wider block">ALIGNMENT STATUS</span>
                  <p className="text-xs font-semibold mt-0.5 text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Optimal Tracking
                  </p>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wider block">CLINICAL INJURY RISK</span>
                  <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-md mt-1 ${
                    ANATOMICAL_PARTS[selectedPart].injuryRisk === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    ANATOMICAL_PARTS[selectedPart].injuryRisk === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {ANATOMICAL_PARTS[selectedPart].injuryRisk} Risk
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 text-[10px] text-slate-500 font-light leading-relaxed flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>Hover or click on any other body segment or joint landmark to read biomechanical properties.</span>
          </div>
        </div>
      )}

      {/* Hover visual label overlay */}
      {hoveredPart && !selectedPart && ANATOMICAL_PARTS[hoveredPart] && (
        <div className="absolute bottom-4 left-4 z-10 bg-slate-950/70 backdrop-blur-md border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-bold flex items-center gap-2 shadow-lg shadow-cyan-950/20 transition-all duration-200">
          <Activity className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
          <span>Scan target: <strong className="text-white">{ANATOMICAL_PARTS[hoveredPart].name}</strong></span>
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider ml-1">Click to analyze</span>
        </div>
      )}
    </div>
  );
}
