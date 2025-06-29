'use client';

import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';
import { getEmotionTheme } from '@/lib/emotions';
import { useAppSelector } from '@/lib/store/hooks';

interface ThreeGlobeProps {
  className?: string;
  onGlobeClick?: () => void;
}

export default function ThreeGlobe({ className = '', onGlobeClick }: ThreeGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const globeRef = useRef<THREE.Group>();
  const glowRef = useRef<THREE.Mesh>();
  const wavyGlowRef = useRef<THREE.Mesh>();
  const starsRef = useRef<THREE.Points>();
  const [isLoading, setIsLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const router = useRouter();

  // Get current emotion from Redux store (octant-driven)
  const { dominantEmotion, octantDominantEmotion } = useAppSelector(state => state.emotion);
  
  // Use octant dominant emotion for the Earth's glow
  const currentEmotion = octantDominantEmotion || dominantEmotion;

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup with TRANSPARENT background to show hero background
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 2.5;

    // Renderer setup with TRANSPARENT background
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, // Enable transparency
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Fully transparent background
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Globe group
    const globeGroup = new THREE.Group();
    globeRef.current = globeGroup;
    scene.add(globeGroup);

    // Create Earth sphere
    const earthGeometry = new THREE.SphereGeometry(0.65, 128, 128);
    
    // Load real world map texture
    const textureLoader = new THREE.TextureLoader();
    
    // Enhanced Earth material with real world map texture
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 60,
      transparent: true,
      opacity: 0.95,
      bumpScale: 0.015
    });

    // Load Earth texture
    textureLoader.load(
      'https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg',
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        earthMaterial.map = texture;
        earthMaterial.needsUpdate = true;
      },
      undefined,
      (error) => {
        console.log('Texture loading failed, using fallback color');
        earthMaterial.color = new THREE.Color(0x1a4d80);
      }
    );

    // Load bump map
    textureLoader.load(
      'https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png',
      (bumpTexture) => {
        earthMaterial.bumpMap = bumpTexture;
        earthMaterial.needsUpdate = true;
      }
    );
    
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // Create continent outlines
    const continentGeometry = new THREE.SphereGeometry(0.66, 32, 32);
    const continentMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a9eff,
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    
    const continentMesh = new THREE.Mesh(continentGeometry, continentMaterial);
    globeGroup.add(continentMesh);

    // Get emotion colors (reactive to octant changes)
    const emotionTheme = getEmotionTheme(currentEmotion);
    const emotionColor = new THREE.Color(emotionTheme.color);

    // Map emotion names to numbers for shader
    const emotionMap: { [key: string]: number } = {
      'joy': 0, 'trust': 1, 'fear': 2, 'surprise': 3,
      'sadness': 4, 'anticipation': 5, 'anger': 6, 'disgust': 7
    };

    // Create UNEVEN INNER GLOW LAYER - Dispersed atmosphere effect
    const innerGlowGeometry = new THREE.SphereGeometry(0.75, 64, 64);
    const innerGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowColor: { value: emotionColor },
        mousePos: { value: new THREE.Vector2(0, 0) },
        emotionIntensity: { value: 0.8 },
        emotionType: { value: emotionMap[currentEmotion] || 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        uniform float time;
        uniform vec2 mousePos;
        uniform float emotionIntensity;
        uniform int emotionType;
        
        // Enhanced noise functions for uneven patterns
        float random(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
        }
        
        float noise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          
          return mix(
            mix(mix(random(i + vec3(0,0,0)), random(i + vec3(1,0,0)), f.x),
                mix(random(i + vec3(0,1,0)), random(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(random(i + vec3(0,0,1)), random(i + vec3(1,0,1)), f.x),
                mix(random(i + vec3(0,1,1)), random(i + vec3(1,1,1)), f.x), f.y), f.z);
        }
        
        // Fractal noise for complex uneven patterns
        float fbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          
          for(int i = 0; i < 5; i++) {
            value += amplitude * noise(p * frequency);
            amplitude *= 0.5;
            frequency *= 2.0;
          }
          return value;
        }
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vUv = uv;
          
          vec3 pos = position;
          
          // Create highly uneven displacement using fractal noise
          float unevenNoise1 = fbm(pos * 6.0 + time * 0.4) * 0.08;
          float unevenNoise2 = fbm(pos * 10.0 + time * 0.3 + vec3(100.0)) * 0.06;
          float unevenNoise3 = fbm(pos * 4.0 + time * 0.5 + vec3(200.0)) * 0.1;
          
          // Add chaotic, non-uniform patterns
          float chaos1 = sin(pos.x * 20.0 + time * 1.5) * cos(pos.y * 15.0 + time * 1.2) * 0.05;
          float chaos2 = sin(pos.z * 25.0 + time * 1.8) * cos(pos.x * 18.0 + time * 1.0) * 0.04;
          float chaos3 = sin(pos.y * 30.0 + time * 2.0) * cos(pos.z * 22.0 + time * 1.6) * 0.03;
          
          // Emotion-based uneven patterns
          float emotionWave1, emotionWave2, emotionWave3;
          
          if (emotionType == 0) { // joy - bright, scattered bursts
            emotionWave1 = sin(time * 2.0 + pos.y * 12.0) * 0.06;
            emotionWave2 = cos(time * 1.5 + pos.x * 10.0) * 0.05;
            emotionWave3 = sin(time * 2.5 + pos.z * 15.0) * 0.04;
          } else if (emotionType == 1) { // trust - gentle, warm patches
            emotionWave1 = sin(time * 1.0 + pos.x * 8.0) * 0.04;
            emotionWave2 = cos(time * 0.8 + pos.y * 6.0) * 0.05;
            emotionWave3 = sin(time * 1.2 + pos.z * 7.0) * 0.03;
          } else if (emotionType == 2) { // fear - tense, fragmented
            emotionWave1 = sin(time * 3.0 + pos.x * 18.0) * 0.03;
            emotionWave2 = cos(time * 2.5 + pos.y * 16.0) * 0.025;
            emotionWave3 = sin(time * 3.5 + pos.z * 20.0) * 0.02;
          } else if (emotionType == 3) { // surprise - sudden, chaotic bursts
            float burst = sin(time * 4.0) > 0.7 ? 0.12 : 0.02;
            emotionWave1 = sin(time * 5.0 + pos.x * 25.0) * burst;
            emotionWave2 = cos(time * 4.5 + pos.y * 22.0) * burst * 0.8;
            emotionWave3 = sin(time * 6.0 + pos.z * 28.0) * burst * 0.6;
          } else if (emotionType == 4) { // sadness - dim, sparse patches
            emotionWave1 = sin(time * 0.5 + pos.x * 5.0) * 0.025;
            emotionWave2 = cos(time * 0.4 + pos.y * 4.0) * 0.03;
            emotionWave3 = sin(time * 0.6 + pos.z * 6.0) * 0.02;
          } else if (emotionType == 5) { // anticipation - building, pulsing patches
            float build = 0.3 + 0.7 * sin(time * 1.5);
            emotionWave1 = sin(time * 1.2 + pos.x * 9.0) * 0.05 * build;
            emotionWave2 = cos(time * 1.0 + pos.y * 7.0) * 0.04 * build;
            emotionWave3 = sin(time * 1.4 + pos.z * 11.0) * 0.03 * build;
          } else if (emotionType == 6) { // anger - violent, chaotic fragments
            emotionWave1 = sin(time * 3.5 + pos.x * 20.0 + sin(time * 7.0) * 3.0) * 0.07;
            emotionWave2 = cos(time * 3.0 + pos.y * 18.0 + cos(time * 6.0) * 2.5) * 0.06;
            emotionWave3 = sin(time * 4.0 + pos.z * 25.0 + sin(time * 8.0) * 4.0) * 0.05;
          } else { // disgust - twisted, irregular patches
            emotionWave1 = sin(time * 1.2 + pos.x * 8.0 + pos.y * 3.0) * 0.04;
            emotionWave2 = cos(time * 1.0 + pos.y * 10.0 + pos.z * 2.0) * 0.035;
            emotionWave3 = sin(time * 1.4 + pos.z * 12.0 + pos.x * 4.0) * 0.03;
          }
          
          // Mouse influence for interactive uneven effects
          vec2 mouseInfluence = mousePos * 0.1;
          float mouseDistance = length(pos.xy - mouseInfluence);
          float mouseEffect = exp(-mouseDistance * 2.0) * 0.08;
          
          // Combine all uneven effects
          vec3 totalDisplacement = normal * (
            unevenNoise1 + unevenNoise2 + unevenNoise3 +
            chaos1 + chaos2 + chaos3 +
            emotionWave1 + emotionWave2 + emotionWave3 + 
            mouseEffect
          ) * emotionIntensity;
          
          pos += totalDisplacement;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        uniform float time;
        uniform vec3 glowColor;
        uniform vec2 mousePos;
        uniform float emotionIntensity;
        uniform int emotionType;
        
        // Enhanced noise for uneven patterns
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }
        
        void main() {
          // Create uneven fresnel effect
          float fresnel = 1.0 - abs(dot(vNormal, vec3(0, 0, 1.0)));
          fresnel = pow(fresnel, 1.5);
          
          // Create highly uneven, fragmented patterns
          float fragment1 = noise(vPosition.xy * 20.0 + time * 0.8);
          float fragment2 = noise(vPosition.xz * 25.0 + time * 0.6);
          float fragment3 = noise(vPosition.yz * 30.0 + time * 1.0);
          
          // Combine fragments for uneven distribution
          float fragmentPattern = (fragment1 * fragment2 + fragment3) * 0.5;
          
          // Add chaotic intensity variations
          float chaos1 = sin(vPosition.x * 35.0 + time * 2.0) * 0.3 + 0.7;
          float chaos2 = cos(vPosition.y * 40.0 + time * 1.5) * 0.25 + 0.75;
          float chaos3 = sin(vPosition.z * 45.0 + time * 2.5) * 0.28 + 0.72;
          
          // Emotion-based uneven intensity patterns
          float pattern1, pattern2, pattern3;
          
          if (emotionType == 0) { // joy - bright, scattered patches
            pattern1 = sin(vPosition.x * 25.0 + time * 2.0) * 0.6 + 0.4;
            pattern2 = cos(vPosition.y * 20.0 + time * 1.5) * 0.5 + 0.5;
            pattern3 = sin(vPosition.z * 30.0 + time * 2.5) * 0.55 + 0.45;
          } else if (emotionType == 1) { // trust - gentle, warm patches
            pattern1 = sin(vPosition.x * 15.0 + time * 1.0) * 0.3 + 0.7;
            pattern2 = cos(vPosition.y * 12.0 + time * 0.8) * 0.25 + 0.75;
            pattern3 = sin(vPosition.z * 18.0 + time * 1.2) * 0.28 + 0.72;
          } else if (emotionType == 2) { // fear - tense, fragmented
            pattern1 = sin(vPosition.x * 40.0 + time * 3.0) * 0.7 + 0.3;
            pattern2 = cos(vPosition.y * 35.0 + time * 2.5) * 0.6 + 0.4;
            pattern3 = sin(vPosition.z * 45.0 + time * 3.5) * 0.65 + 0.35;
          } else if (emotionType == 3) { // surprise - sudden, chaotic bursts
            float burst = sin(time * 4.0) > 0.7 ? 2.0 : 0.2;
            pattern1 = sin(vPosition.x * 50.0 + time * 5.0) * 0.8 * burst + 0.2;
            pattern2 = cos(vPosition.y * 45.0 + time * 4.5) * 0.7 * burst + 0.3;
            pattern3 = sin(vPosition.z * 55.0 + time * 6.0) * 0.75 * burst + 0.25;
          } else if (emotionType == 4) { // sadness - dim, sparse patches
            pattern1 = sin(vPosition.x * 10.0 + time * 0.5) * 0.2 + 0.3;
            pattern2 = cos(vPosition.y * 8.0 + time * 0.4) * 0.18 + 0.32;
            pattern3 = sin(vPosition.z * 12.0 + time * 0.6) * 0.22 + 0.28;
          } else if (emotionType == 5) { // anticipation - building, pulsing patches
            float build = 0.2 + 0.8 * sin(time * 1.5);
            pattern1 = sin(vPosition.x * 20.0 + time * 1.5) * 0.4 * build + 0.4;
            pattern2 = cos(vPosition.y * 18.0 + time * 1.2) * 0.35 * build + 0.45;
            pattern3 = sin(vPosition.z * 25.0 + time * 1.8) * 0.38 * build + 0.42;
          } else if (emotionType == 6) { // anger - violent, chaotic fragments
            pattern1 = sin(vPosition.x * 30.0 + time * 3.5 + sin(time * 7.0)) * 0.8 + 0.5;
            pattern2 = cos(vPosition.y * 28.0 + time * 3.0 + cos(time * 6.0)) * 0.7 + 0.6;
            pattern3 = sin(vPosition.z * 35.0 + time * 4.0 + sin(time * 8.0)) * 0.75 + 0.55;
          } else { // disgust - twisted, irregular patches
            pattern1 = sin(vPosition.x * 22.0 + vPosition.y * 5.0 + time * 1.5) * 0.4 + 0.3;
            pattern2 = cos(vPosition.y * 20.0 + vPosition.z * 4.0 + time * 1.2) * 0.35 + 0.35;
            pattern3 = sin(vPosition.z * 25.0 + vPosition.x * 6.0 + time * 1.8) * 0.38 + 0.32;
          }
          
          // Combine all patterns for highly uneven effect
          float unevenIntensity = fragmentPattern * chaos1 * chaos2 * chaos3 * pattern1 * pattern2 * pattern3;
          
          // Mouse reactive glow
          float mouseDistance = length(vPosition.xy - mousePos);
          float mouseGlow = 1.0 + exp(-mouseDistance * 3.0) * 0.8;
          
          // Create threshold for uneven fragments (makes it non-circular and patchy)
          float threshold = 0.3 + 0.4 * noise(vPosition.xy * 12.0 + time * 0.5);
          float unevenMask = step(threshold, unevenIntensity);
          
          // Alive pulsing effect
          float pulse = 0.5 + 0.5 * sin(time * 2.0 + vPosition.x * 8.0) * cos(time * 1.5 + vPosition.y * 6.0);
          
          // Final highly uneven, fragmented intensity
          float finalIntensity = fresnel * unevenMask * unevenIntensity * mouseGlow * pulse * emotionIntensity * 0.6;
          
          gl_FragColor = vec4(glowColor, finalIntensity);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });

    const innerGlowMesh = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    glowRef.current = innerGlowMesh;
    scene.add(innerGlowMesh);

    // Create UNEVEN OUTER GLOW LAYER - Extended dispersed atmosphere
    const outerGlowGeometry = new THREE.SphereGeometry(0.95, 64, 64);
    const outerGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowColor: { value: emotionColor },
        mousePos: { value: new THREE.Vector2(0, 0) },
        emotionIntensity: { value: 0.6 },
        emotionType: { value: emotionMap[currentEmotion] || 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        uniform float time;
        uniform vec2 mousePos;
        uniform float emotionIntensity;
        uniform int emotionType;
        
        // Advanced noise functions for highly uneven patterns
        float random(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
        }
        
        float noise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          
          return mix(
            mix(mix(random(i + vec3(0,0,0)), random(i + vec3(1,0,0)), f.x),
                mix(random(i + vec3(0,1,0)), random(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(random(i + vec3(0,0,1)), random(i + vec3(1,0,1)), f.x),
                mix(random(i + vec3(0,1,1)), random(i + vec3(1,1,1)), f.x), f.y), f.z);
        }
        
        // Multi-octave fractal noise for complex uneven patterns
        float fbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          
          for(int i = 0; i < 6; i++) {
            value += amplitude * noise(p * frequency);
            amplitude *= 0.5;
            frequency *= 2.0;
          }
          return value;
        }
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vUv = uv;
          
          vec3 pos = position;
          
          // Create extremely uneven displacement using multiple noise layers
          float unevenNoise1 = fbm(pos * 4.0 + time * 0.3) * 0.12;
          float unevenNoise2 = fbm(pos * 8.0 + time * 0.2 + vec3(100.0)) * 0.09;
          float unevenNoise3 = fbm(pos * 12.0 + time * 0.4 + vec3(200.0)) * 0.07;
          float unevenNoise4 = fbm(pos * 6.0 + time * 0.5 + vec3(300.0)) * 0.1;
          
          // Add highly chaotic, non-uniform patterns
          float chaos1 = sin(pos.x * 18.0 + time * 1.2) * cos(pos.y * 15.0 + time * 1.0) * 0.08;
          float chaos2 = sin(pos.z * 22.0 + time * 1.5) * cos(pos.x * 20.0 + time * 1.3) * 0.06;
          float chaos3 = sin(pos.y * 25.0 + time * 1.8) * cos(pos.z * 18.0 + time * 1.1) * 0.07;
          float chaos4 = sin(pos.x * 30.0 + time * 2.0) * cos(pos.y * 28.0 + time * 1.6) * 0.05;
          
          // Emotion-based highly uneven wave patterns
          float wave1, wave2, wave3, wave4;
          
          if (emotionType == 0) { // joy - bright, scattered, upward flowing
            wave1 = sin(time * 2.0 + pos.y * 10.0 + pos.x * 3.0) * 0.1;
            wave2 = cos(time * 1.5 + pos.z * 8.0 + pos.y * 4.0) * 0.08;
            wave3 = sin(time * 2.5 + length(pos.xz) * 12.0) * 0.06;
            wave4 = cos(time * 3.0 + atan(pos.x, pos.z) * 8.0) * 0.05;
          } else if (emotionType == 1) { // trust - gentle, warm, orbiting patches
            wave1 = sin(time * 1.0 + atan(pos.x, pos.z) * 6.0) * 0.08;
            wave2 = cos(time * 0.8 + pos.y * 5.0) * 0.07;
            wave3 = sin(time * 1.2 + length(pos.xy) * 7.0) * 0.06;
            wave4 = cos(time * 0.9 + length(pos.yz) * 8.0) * 0.05;
          } else if (emotionType == 2) { // fear - tense, recoiling, fragmented
            wave1 = sin(time * 2.5 + pos.x * 12.0) * 0.06 * (1.0 + sin(time * 4.0) * 0.5);
            wave2 = cos(time * 2.2 + pos.y * 10.0) * 0.05 * (1.0 + cos(time * 3.5) * 0.4);
            wave3 = sin(time * 3.0 + pos.z * 14.0) * 0.04 * (1.0 + sin(time * 5.0) * 0.6);
            wave4 = cos(time * 2.8 + length(pos) * 15.0) * 0.03;
          } else if (emotionType == 3) { // surprise - sudden, chaotic bursts
            float burst = sin(time * 4.0) > 0.6 ? 1.5 : 0.3;
            wave1 = sin(time * 5.0 + pos.x * 18.0) * 0.12 * burst;
            wave2 = cos(time * 4.5 + pos.y * 15.0) * 0.1 * burst;
            wave3 = sin(time * 6.0 + pos.z * 20.0) * 0.08 * burst;
            wave4 = cos(time * 5.5 + length(pos.xy) * 22.0) * 0.06 * burst;
          } else if (emotionType == 4) { // sadness - dim, drooping, sparse
            wave1 = sin(time * 0.6 + pos.x * 4.0) * 0.04;
            wave2 = cos(time * 0.5 + pos.y * 3.0) * 0.05 - 0.01;
            wave3 = sin(time * 0.7 + pos.z * 5.0) * 0.03;
            wave4 = cos(time * 0.55 + length(pos) * 6.0) * 0.025;
          } else if (emotionType == 5) { // anticipation - building, pulsing
            float build = 0.2 + 0.8 * sin(time * 1.5);
            wave1 = sin(time * 1.2 + pos.x * 7.0) * 0.08 * build;
            wave2 = cos(time * 1.0 + pos.y * 6.0) * 0.07 * build;
            wave3 = sin(time * 1.4 + pos.z * 8.0) * 0.06 * build;
            wave4 = cos(time * 1.1 + length(pos.xz) * 9.0) * 0.05 * build;
          } else if (emotionType == 6) { // anger - violent, erratic, chaotic
            wave1 = sin(time * 3.0 + pos.x * 15.0 + sin(time * 6.0) * 4.0) * 0.11;
            wave2 = cos(time * 2.8 + pos.y * 12.0 + cos(time * 5.0) * 3.0) * 0.09;
            wave3 = sin(time * 3.5 + pos.z * 18.0 + sin(time * 7.0) * 5.0) * 0.08;
            wave4 = cos(time * 3.2 + length(pos) * 20.0) * 0.06;
          } else { // disgust - twisted, irregular, uneven
            wave1 = sin(time * 1.3 + pos.x * 6.0 + pos.y * 2.5) * 0.07;
            wave2 = cos(time * 1.5 + pos.y * 8.0 + pos.z * 2.0) * 0.06;
            wave3 = sin(time * 1.7 + pos.z * 9.0 + pos.x * 3.0) * 0.05;
            wave4 = cos(time * 1.4 + length(pos.xy) * 10.0 + pos.z) * 0.04;
          }
          
          // Mouse influence for interactive uneven effects
          vec2 mouseInfluence = mousePos * 0.12;
          float mouseDistance = length(pos.xy - mouseInfluence);
          float mouseWave = sin(mouseDistance * 5.0 - time * 2.5) * exp(-mouseDistance * 1.2) * 0.1;
          
          // Combine all highly uneven effects
          vec3 totalDisplacement = normal * (
            unevenNoise1 + unevenNoise2 + unevenNoise3 + unevenNoise4 +
            chaos1 + chaos2 + chaos3 + chaos4 +
            wave1 + wave2 + wave3 + wave4 + 
            mouseWave
          ) * emotionIntensity;
          
          pos += totalDisplacement;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        uniform float time;
        uniform vec3 glowColor;
        uniform vec2 mousePos;
        uniform float emotionIntensity;
        uniform int emotionType;
        
        // Enhanced noise for highly uneven patterns
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }
        
        // Multi-octave noise for complex patterns
        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          
          for(int i = 0; i < 4; i++) {
            value += amplitude * noise(p * frequency);
            amplitude *= 0.5;
            frequency *= 2.0;
          }
          return value;
        }
        
        void main() {
          // Create highly uneven fresnel effect
          float fresnel = 1.0 - abs(dot(vNormal, vec3(0, 0, 1.0)));
          fresnel = pow(fresnel, 2.0);
          
          // Create extremely uneven, fragmented patterns using multiple noise layers
          float fragment1 = fbm(vPosition.xy * 15.0 + time * 0.7);
          float fragment2 = fbm(vPosition.xz * 18.0 + time * 0.5);
          float fragment3 = fbm(vPosition.yz * 22.0 + time * 0.9);
          float fragment4 = fbm(vPosition.xy * 25.0 + time * 0.3);
          
          // Combine fragments for highly uneven distribution
          float fragmentPattern = (fragment1 * fragment2 + fragment3 * fragment4) * 0.5;
          
          // Add multiple layers of chaotic intensity variations
          float chaos1 = sin(vPosition.x * 30.0 + time * 2.5) * 0.3 + 0.7;
          float chaos2 = cos(vPosition.y * 35.0 + time * 2.0) * 0.25 + 0.75;
          float chaos3 = sin(vPosition.z * 40.0 + time * 3.0) * 0.28 + 0.72;
          float chaos4 = cos(vPosition.x * 45.0 + vPosition.y * 20.0 + time * 2.8) * 0.2 + 0.8;
          
          // Emotion-based highly uneven intensity patterns
          float pattern1, pattern2, pattern3, pattern4;
          
          if (emotionType == 0) { // joy - bright, scattered, energetic patches
            pattern1 = sin(vPosition.x * 20.0 + time * 2.5) * 0.6 + 0.4;
            pattern2 = cos(vPosition.y * 18.0 + time * 2.0) * 0.5 + 0.5;
            pattern3 = sin(vPosition.z * 25.0 + time * 3.0) * 0.55 + 0.45;
            pattern4 = cos(length(vPosition.xy) * 15.0 + time * 2.2) * 0.4 + 0.6;
          } else if (emotionType == 1) { // trust - gentle, warm, stable patches
            pattern1 = sin(vPosition.x * 12.0 + time * 1.2) * 0.3 + 0.7;
            pattern2 = cos(vPosition.y * 10.0 + time * 1.0) * 0.25 + 0.75;
            pattern3 = sin(vPosition.z * 15.0 + time * 1.5) * 0.28 + 0.72;
            pattern4 = cos(length(vPosition.xz) * 8.0 + time * 1.1) * 0.2 + 0.8;
          } else if (emotionType == 2) { // fear - tense, fragmented, scattered
            pattern1 = sin(vPosition.x * 35.0 + time * 3.5) * 0.7 + 0.3;
            pattern2 = cos(vPosition.y * 32.0 + time * 3.0) * 0.6 + 0.4;
            pattern3 = sin(vPosition.z * 40.0 + time * 4.0) * 0.65 + 0.35;
            pattern4 = cos(length(vPosition.yz) * 30.0 + time * 3.2) * 0.5 + 0.5;
          } else if (emotionType == 3) { // surprise - sudden, chaotic, explosive bursts
            float burst = sin(time * 5.0) > 0.6 ? 2.5 : 0.15;
            pattern1 = sin(vPosition.x * 45.0 + time * 6.0) * 0.8 * burst + 0.2;
            pattern2 = cos(vPosition.y * 42.0 + time * 5.5) * 0.7 * burst + 0.3;
            pattern3 = sin(vPosition.z * 50.0 + time * 7.0) * 0.75 * burst + 0.25;
            pattern4 = cos(length(vPosition.xy) * 38.0 + time * 6.2) * 0.6 * burst + 0.4;
          } else if (emotionType == 4) { // sadness - dim, sparse, minimal patches
            pattern1 = sin(vPosition.x * 8.0 + time * 0.6) * 0.2 + 0.25;
            pattern2 = cos(vPosition.y * 6.0 + time * 0.5) * 0.18 + 0.27;
            pattern3 = sin(vPosition.z * 10.0 + time * 0.7) * 0.22 + 0.23;
            pattern4 = cos(length(vPosition.xz) * 5.0 + time * 0.55) * 0.15 + 0.3;
          } else if (emotionType == 5) { // anticipation - building, pulsing, growing patches
            float build = 0.1 + 0.9 * sin(time * 1.8);
            pattern1 = sin(vPosition.x * 18.0 + time * 1.8) * 0.4 * build + 0.3;
            pattern2 = cos(vPosition.y * 16.0 + time * 1.5) * 0.35 * build + 0.35;
            pattern3 = sin(vPosition.z * 22.0 + time * 2.0) * 0.38 * build + 0.32;
            pattern4 = cos(length(vPosition.xy) * 14.0 + time * 1.6) * 0.3 * build + 0.4;
          } else if (emotionType == 6) { // anger - violent, chaotic, erratic fragments
            pattern1 = sin(vPosition.x * 28.0 + time * 4.0 + sin(time * 8.0)) * 0.8 + 0.6;
            pattern2 = cos(vPosition.y * 25.0 + time * 3.5 + cos(time * 7.0)) * 0.7 + 0.7;
            pattern3 = sin(vPosition.z * 32.0 + time * 4.5 + sin(time * 9.0)) * 0.75 + 0.65;
            pattern4 = cos(length(vPosition.yz) * 22.0 + time * 3.8) * 0.6 + 0.8;
          } else { // disgust - twisted, irregular, uneven patches
            pattern1 = sin(vPosition.x * 20.0 + vPosition.y * 6.0 + time * 1.8) * 0.4 + 0.25;
            pattern2 = cos(vPosition.y * 18.0 + vPosition.z * 5.0 + time * 1.5) * 0.35 + 0.3;
            pattern3 = sin(vPosition.z * 22.0 + vPosition.x * 7.0 + time * 2.0) * 0.38 + 0.27;
            pattern4 = cos(length(vPosition.xy) * 16.0 + vPosition.z * 4.0 + time * 1.6) * 0.3 + 0.35;
          }
          
          // Combine all patterns for extremely uneven effect
          float unevenIntensity = fragmentPattern * chaos1 * chaos2 * chaos3 * chaos4 * pattern1 * pattern2 * pattern3 * pattern4;
          
          // Mouse reactive enhancement
          float mouseDistance = length(vPosition.xy - mousePos);
          float mouseEffect = 1.0 + exp(-mouseDistance * 2.5) * 1.0;
          
          // Create multiple thresholds for highly uneven fragments
          float threshold1 = 0.2 + 0.3 * noise(vPosition.xy * 10.0 + time * 0.4);
          float threshold2 = 0.25 + 0.35 * noise(vPosition.xz * 12.0 + time * 0.6);
          float threshold3 = 0.3 + 0.4 * noise(vPosition.yz * 14.0 + time * 0.5);
          
          float combinedThreshold = (threshold1 + threshold2 + threshold3) / 3.0;
          float unevenMask = step(combinedThreshold, unevenIntensity);
          
          // Dynamic pulsing with uneven timing
          float pulse1 = 0.4 + 0.6 * sin(time * 2.2 + vPosition.x * 10.0);
          float pulse2 = 0.3 + 0.7 * cos(time * 1.8 + vPosition.y * 8.0);
          float pulse3 = 0.5 + 0.5 * sin(time * 2.5 + vPosition.z * 12.0);
          float combinedPulse = (pulse1 * pulse2 + pulse3) * 0.5;
          
          // Final extremely uneven, fragmented, organic intensity
          float finalIntensity = fresnel * unevenMask * unevenIntensity * mouseEffect * combinedPulse * emotionIntensity * 0.5;
          
          gl_FragColor = vec4(glowColor, finalIntensity);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });

    const outerGlowMesh = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    wavyGlowRef.current = outerGlowMesh;
    scene.add(outerGlowMesh);

    // Enhanced star field - SAME AS HERO PAGE
    const starCount = 1200;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 5 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const intensity = 0.5 + Math.random() * 0.5;
      starColors[i * 3] = intensity;
      starColors[i * 3 + 1] = intensity;
      starColors[i * 3 + 2] = intensity + Math.random() * 0.3;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    starsRef.current = stars;
    scene.add(stars);

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    rimLight.position.set(-5, 0, -5);
    scene.add(rimLight);

    // Mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      if (!mountRef.current) return;
      
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([earthMesh]);

      if (intersects.length > 0) {
        // Navigate directly to octants page
        router.push('/octants');
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!mountRef.current) return;
      
      const rect = mountRef.current.getBoundingClientRect();
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update mouse position for glow effects
      setMousePosition({ x: mouseX, y: mouseY });

      // Update both glow materials with mouse position
      if (glowRef.current && glowRef.current.material && 'uniforms' in glowRef.current.material) {
        (glowRef.current.material as THREE.ShaderMaterial).uniforms.mousePos.value.set(mouseX, mouseY);
      }
      
      if (wavyGlowRef.current && wavyGlowRef.current.material && 'uniforms' in wavyGlowRef.current.material) {
        (wavyGlowRef.current.material as THREE.ShaderMaterial).uniforms.mousePos.value.set(mouseX, mouseY);
      }

      // Subtle mouse following effect for globe
      if (globeRef.current) {
        globeRef.current.rotation.y += (mouseX * 0.05 - globeRef.current.rotation.y) * 0.02;
        globeRef.current.rotation.x += (mouseY * 0.05 - globeRef.current.rotation.x) * 0.02;
      }
    };

    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animationLoop = () => {
      requestAnimationFrame(animationLoop);

      const time = Date.now() * 0.0005; // HALVED SPEED

      if (globeRef.current && glowRef.current && wavyGlowRef.current) {
        // SLOWER rotation when not animating
        globeRef.current.rotation.y += 0.00025; // HALVED from 0.0005
        
        // Update both glow animations
        if (glowRef.current.material && 'uniforms' in glowRef.current.material) {
          (glowRef.current.material as THREE.ShaderMaterial).uniforms.time.value = time;
        }
        
        if (wavyGlowRef.current.material && 'uniforms' in wavyGlowRef.current.material) {
          (wavyGlowRef.current.material as THREE.ShaderMaterial).uniforms.time.value = time;
        }
      }

      // Animate stars (slower) - SAME AS HERO PAGE
      if (starsRef.current) {
        starsRef.current.rotation.y += 0.00005; // HALVED from 0.0001
        starsRef.current.rotation.x += 0.000025; // HALVED from 0.00005
      }

      renderer.render(scene, camera);
    };

    animationLoop();
    setIsLoading(false);

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [currentEmotion, router]);

  // Update glow colors when emotion changes
  useEffect(() => {
    const emotionTheme = getEmotionTheme(currentEmotion);
    const emotionColor = new THREE.Color(emotionTheme.color);
    
    const emotionMap: { [key: string]: number } = {
      'joy': 0, 'trust': 1, 'fear': 2, 'surprise': 3,
      'sadness': 4, 'anticipation': 5, 'anger': 6, 'disgust': 7
    };

    // Update glow materials with new emotion
    if (glowRef.current && glowRef.current.material && 'uniforms' in glowRef.current.material) {
      const material = glowRef.current.material as THREE.ShaderMaterial;
      material.uniforms.glowColor.value = emotionColor;
      material.uniforms.emotionType.value = emotionMap[currentEmotion] || 0;
    }
    
    if (wavyGlowRef.current && wavyGlowRef.current.material && 'uniforms' in wavyGlowRef.current.material) {
      const material = wavyGlowRef.current.material as THREE.ShaderMaterial;
      material.uniforms.glowColor.value = emotionColor;
      material.uniforms.emotionType.value = emotionMap[currentEmotion] || 0;
    }
  }, [currentEmotion]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mountRef} className="w-full h-full cursor-pointer" />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/60 text-sm">Loading Earth...</div>
        </div>
      )}
    </div>
  );
}