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
  const innerAtmosphereRef = useRef<THREE.Mesh>();
  const outerAtmosphereRef = useRef<THREE.Mesh>();
  const coronaRef = useRef<THREE.Mesh>();
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

    console.log(`🌍 Creating COMPACT ATMOSPHERIC GLOW with emotion: ${currentEmotion}, color: ${emotionTheme.color}`);

    // Map emotion names to numbers for shader
    const emotionMap: { [key: string]: number } = {
      'joy': 0, 'trust': 1, 'fear': 2, 'surprise': 3,
      'sadness': 4, 'anticipation': 5, 'anger': 6, 'disgust': 7
    };

    // LAYER 1: INNER ATMOSPHERE - Reduced from 0.72 to 0.68 (closer to Earth)
    const innerAtmosphereGeometry = new THREE.SphereGeometry(0.68, 64, 64);
    const innerAtmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowColor: { value: emotionColor },
        mousePos: { value: new THREE.Vector2(0, 0) },
        emotionIntensity: { value: 1.0 },
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
        
        // Atmospheric noise functions
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
        
        // Atmospheric turbulence
        float fbm(vec3 p) {
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
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vUv = uv;
          
          vec3 pos = position;
          
          // Dense atmospheric turbulence near surface
          float atmosphericNoise1 = fbm(pos * 3.0 + time * 0.2) * 0.06; // Reduced displacement
          float atmosphericNoise2 = fbm(pos * 6.0 + time * 0.15 + vec3(100.0)) * 0.04;
          float atmosphericNoise3 = fbm(pos * 9.0 + time * 0.25 + vec3(200.0)) * 0.03;
          
          // Emotion-based atmospheric patterns
          float emotionFlow1, emotionFlow2;
          
          if (emotionType == 0) { // joy - upward flowing, bright
            emotionFlow1 = sin(time * 1.5 + pos.y * 8.0) * 0.08;
            emotionFlow2 = cos(time * 1.2 + length(pos.xz) * 6.0) * 0.06;
          } else if (emotionType == 1) { // trust - gentle, stable
            emotionFlow1 = sin(time * 0.8 + atan(pos.x, pos.z) * 4.0) * 0.05;
            emotionFlow2 = cos(time * 0.6 + pos.y * 3.0) * 0.04;
          } else if (emotionType == 2) { // fear - tense, contracted
            emotionFlow1 = sin(time * 2.0 + pos.x * 10.0) * 0.03 * (1.0 + sin(time * 4.0) * 0.5);
            emotionFlow2 = cos(time * 1.8 + pos.z * 8.0) * 0.025;
          } else if (emotionType == 3) { // surprise - sudden bursts
            float burst = sin(time * 3.0) > 0.6 ? 1.8 : 0.2;
            emotionFlow1 = sin(time * 4.0 + pos.x * 12.0) * 0.1 * burst;
            emotionFlow2 = cos(time * 3.5 + pos.y * 10.0) * 0.08 * burst;
          } else if (emotionType == 4) { // sadness - drooping, slow
            emotionFlow1 = sin(time * 0.4 + pos.x * 2.0) * 0.025;
            emotionFlow2 = cos(time * 0.3 + pos.y * 1.5) * 0.03 - 0.008;
          } else if (emotionType == 5) { // anticipation - building
            float build = 0.3 + 0.7 * sin(time * 1.0);
            emotionFlow1 = sin(time * 1.0 + pos.x * 4.0) * 0.06 * build;
            emotionFlow2 = cos(time * 0.8 + pos.z * 5.0) * 0.05 * build;
          } else if (emotionType == 6) { // anger - chaotic, violent
            emotionFlow1 = sin(time * 2.5 + pos.x * 8.0 + sin(time * 5.0) * 2.0) * 0.08;
            emotionFlow2 = cos(time * 2.2 + pos.y * 6.0 + cos(time * 4.5) * 1.5) * 0.06;
          } else { // disgust - twisted, irregular
            emotionFlow1 = sin(time * 1.0 + pos.x * 3.0 + pos.y * 1.5) * 0.05;
            emotionFlow2 = cos(time * 1.2 + pos.z * 4.0 + pos.x * 2.0) * 0.04;
          }
          
          // Mouse interaction for atmospheric disturbance
          vec2 mouseInfluence = mousePos * 0.08; // Reduced mouse influence
          float mouseDistance = length(pos.xy - mouseInfluence);
          float mouseDisturbance = sin(mouseDistance * 4.0 - time * 2.0) * exp(-mouseDistance * 1.0) * 0.06;
          
          // Combine atmospheric effects
          vec3 atmosphericDisplacement = normal * (
            atmosphericNoise1 + atmosphericNoise2 + atmosphericNoise3 +
            emotionFlow1 + emotionFlow2 + 
            mouseDisturbance
          ) * emotionIntensity;
          
          pos += atmosphericDisplacement;
          
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
        
        // Atmospheric noise
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
          // Dense atmospheric fresnel
          float fresnel = 1.0 - abs(dot(vNormal, vec3(0, 0, 1.0)));
          fresnel = pow(fresnel, 1.2);
          
          // Dense atmospheric patterns
          float atmosphere1 = noise(vPosition.xy * 8.0 + time * 0.3);
          float atmosphere2 = noise(vPosition.xz * 10.0 + time * 0.2);
          float atmosphere3 = noise(vPosition.yz * 12.0 + time * 0.4);
          
          float atmosphericDensity = (atmosphere1 + atmosphere2 + atmosphere3) / 3.0;
          
          // Emotion-based atmospheric intensity
          float emotionPattern;
          
          if (emotionType == 0) { // joy - bright, energetic
            emotionPattern = sin(vPosition.x * 8.0 + time * 2.0) * 0.5 + 0.7;
          } else if (emotionType == 1) { // trust - warm, stable
            emotionPattern = sin(vPosition.x * 4.0 + time * 1.0) * 0.3 + 0.8;
          } else if (emotionType == 2) { // fear - tense, flickering
            emotionPattern = sin(vPosition.x * 12.0 + time * 3.0) * 0.6 + 0.4;
          } else if (emotionType == 3) { // surprise - bursting
            float burst = sin(time * 3.5) > 0.5 ? 1.5 : 0.3;
            emotionPattern = sin(vPosition.x * 15.0 + time * 4.0) * 0.7 * burst + 0.3;
          } else if (emotionType == 4) { // sadness - dim, sparse
            emotionPattern = sin(vPosition.x * 3.0 + time * 0.5) * 0.2 + 0.4;
          } else if (emotionType == 5) { // anticipation - building
            float build = 0.4 + 0.6 * sin(time * 1.2);
            emotionPattern = sin(vPosition.x * 6.0 + time * 1.5) * 0.4 * build + 0.5;
          } else if (emotionType == 6) { // anger - violent, chaotic
            emotionPattern = sin(vPosition.x * 10.0 + time * 2.8 + sin(time * 6.0)) * 0.8 + 0.6;
          } else { // disgust - irregular, twisted
            emotionPattern = sin(vPosition.x * 7.0 + vPosition.y * 2.0 + time * 1.3) * 0.4 + 0.5;
          }
          
          // Mouse reactive glow
          float mouseDistance = length(vPosition.xy - mousePos);
          float mouseGlow = 1.0 + exp(-mouseDistance * 2.0) * 0.6;
          
          // Atmospheric breathing effect
          float breathe = 0.7 + 0.3 * sin(time * 1.5);
          
          // Final dense atmospheric intensity
          float finalIntensity = fresnel * atmosphericDensity * emotionPattern * mouseGlow * breathe * emotionIntensity * 0.8;
          
          gl_FragColor = vec4(glowColor, finalIntensity);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });

    const innerAtmosphereMesh = new THREE.Mesh(innerAtmosphereGeometry, innerAtmosphereMaterial);
    innerAtmosphereRef.current = innerAtmosphereMesh;
    scene.add(innerAtmosphereMesh);

    // LAYER 2: OUTER ATMOSPHERE - Reduced from 0.85 to 0.75 (more compact)
    const outerAtmosphereGeometry = new THREE.SphereGeometry(0.75, 64, 64);
    const outerAtmosphereMaterial = new THREE.ShaderMaterial({
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
        
        // Wispy atmospheric noise
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
        
        // Wispy cloud-like patterns
        float fbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          
          for(int i = 0; i < 3; i++) {
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
          
          // Wispy atmospheric flows - reduced displacement
          float wispyNoise1 = fbm(pos * 1.5 + time * 0.1) * 0.1; // Reduced from 0.15
          float wispyNoise2 = fbm(pos * 2.5 + time * 0.08 + vec3(50.0)) * 0.08; // Reduced from 0.12
          float wispyNoise3 = fbm(pos * 3.5 + time * 0.12 + vec3(100.0)) * 0.06; // Reduced from 0.1
          
          // Emotion-based wispy flows
          float wispyFlow1, wispyFlow2;
          
          if (emotionType == 0) { // joy - upward spiraling wisps
            wispyFlow1 = sin(time * 0.8 + pos.y * 4.0 + atan(pos.x, pos.z) * 2.0) * 0.08;
            wispyFlow2 = cos(time * 0.6 + length(pos.xz) * 3.0) * 0.06;
          } else if (emotionType == 1) { // trust - gentle orbital wisps
            wispyFlow1 = sin(time * 0.5 + atan(pos.x, pos.z) * 3.0) * 0.06;
            wispyFlow2 = cos(time * 0.4 + pos.y * 2.0) * 0.05;
          } else if (emotionType == 2) { // fear - recoiling wisps
            wispyFlow1 = sin(time * 1.5 + pos.x * 6.0) * 0.04 * (1.0 + sin(time * 3.0) * 0.4);
            wispyFlow2 = cos(time * 1.3 + pos.z * 5.0) * 0.035;
          } else if (emotionType == 3) { // surprise - explosive wisps
            float burst = sin(time * 2.5) > 0.7 ? 2.0 : 0.1;
            wispyFlow1 = sin(time * 3.0 + pos.x * 8.0) * 0.1 * burst;
            wispyFlow2 = cos(time * 2.8 + pos.y * 7.0) * 0.08 * burst;
          } else if (emotionType == 4) { // sadness - drooping wisps
            wispyFlow1 = sin(time * 0.3 + pos.x * 1.5) * 0.03;
            wispyFlow2 = cos(time * 0.25 + pos.y * 1.0) * 0.04 - 0.015;
          } else if (emotionType == 5) { // anticipation - gathering wisps
            float gather = 0.2 + 0.8 * sin(time * 0.8);
            wispyFlow1 = sin(time * 0.7 + pos.x * 3.0) * 0.08 * gather;
            wispyFlow2 = cos(time * 0.6 + pos.z * 3.5) * 0.06 * gather;
          } else if (emotionType == 6) { // anger - chaotic wisps
            wispyFlow1 = sin(time * 2.0 + pos.x * 6.0 + sin(time * 4.0) * 1.5) * 0.08;
            wispyFlow2 = cos(time * 1.8 + pos.y * 5.0 + cos(time * 3.5) * 1.2) * 0.06;
          } else { // disgust - twisted wisps
            wispyFlow1 = sin(time * 0.8 + pos.x * 2.5 + pos.y * 1.0) * 0.06;
            wispyFlow2 = cos(time * 1.0 + pos.z * 3.0 + pos.x * 1.5) * 0.05;
          }
          
          // Mouse creates atmospheric disturbance
          vec2 mouseInfluence = mousePos * 0.12;
          float mouseDistance = length(pos.xy - mouseInfluence);
          float mouseWisp = sin(mouseDistance * 2.5 - time * 1.5) * exp(-mouseDistance * 0.6) * 0.08;
          
          // Combine wispy atmospheric effects
          vec3 wispyDisplacement = normal * (
            wispyNoise1 + wispyNoise2 + wispyNoise3 +
            wispyFlow1 + wispyFlow2 + 
            mouseWisp
          ) * emotionIntensity;
          
          pos += wispyDisplacement;
          
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
        
        // Wispy noise patterns
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
          // Wispy atmospheric fresnel
          float fresnel = 1.0 - abs(dot(vNormal, vec3(0, 0, 1.0)));
          fresnel = pow(fresnel, 2.5);
          
          // Wispy cloud patterns
          float wispy1 = noise(vPosition.xy * 4.0 + time * 0.2);
          float wispy2 = noise(vPosition.xz * 5.0 + time * 0.15);
          float wispy3 = noise(vPosition.yz * 6.0 + time * 0.25);
          
          float wispyPattern = (wispy1 + wispy2 + wispy3) / 3.0;
          
          // Emotion-based wispy intensity
          float emotionWisp;
          
          if (emotionType == 0) { // joy - bright, flowing wisps
            emotionWisp = sin(vPosition.x * 5.0 + time * 1.5) * 0.4 + 0.6;
          } else if (emotionType == 1) { // trust - gentle, stable wisps
            emotionWisp = sin(vPosition.x * 3.0 + time * 0.8) * 0.2 + 0.7;
          } else if (emotionType == 2) { // fear - fragmented wisps
            emotionWisp = sin(vPosition.x * 8.0 + time * 2.0) * 0.5 + 0.3;
          } else if (emotionType == 3) { // surprise - explosive wisps
            float burst = sin(time * 2.5) > 0.6 ? 1.2 : 0.2;
            emotionWisp = sin(vPosition.x * 10.0 + time * 3.0) * 0.6 * burst + 0.2;
          } else if (emotionType == 4) { // sadness - fading wisps
            emotionWisp = sin(vPosition.x * 2.0 + time * 0.4) * 0.15 + 0.3;
          } else if (emotionType == 5) { // anticipation - gathering wisps
            float gather = 0.3 + 0.7 * sin(time * 1.0);
            emotionWisp = sin(vPosition.x * 4.0 + time * 1.2) * 0.3 * gather + 0.4;
          } else if (emotionType == 6) { // anger - chaotic wisps
            emotionWisp = sin(vPosition.x * 7.0 + time * 2.2 + sin(time * 5.0)) * 0.6 + 0.5;
          } else { // disgust - irregular wisps
            emotionWisp = sin(vPosition.x * 4.5 + vPosition.y * 1.5 + time * 1.0) * 0.3 + 0.4;
          }
          
          // Mouse creates wispy disturbance
          float mouseDistance = length(vPosition.xy - mousePos);
          float mouseWispGlow = 1.0 + exp(-mouseDistance * 1.5) * 0.5;
          
          // Atmospheric breathing
          float breathe = 0.6 + 0.4 * sin(time * 1.2);
          
          // Final wispy atmospheric intensity
          float finalIntensity = fresnel * wispyPattern * emotionWisp * mouseWispGlow * breathe * emotionIntensity * 0.5;
          
          gl_FragColor = vec4(glowColor, finalIntensity);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });

    const outerAtmosphereMesh = new THREE.Mesh(outerAtmosphereGeometry, outerAtmosphereMaterial);
    outerAtmosphereRef.current = outerAtmosphereMesh;
    scene.add(outerAtmosphereMesh);

    // LAYER 3: CORONA - Reduced from 1.0 to 0.82 (much more compact)
    const coronaGeometry = new THREE.SphereGeometry(0.82, 32, 32);
    const coronaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowColor: { value: emotionColor },
        mousePos: { value: new THREE.Vector2(0, 0) },
        emotionIntensity: { value: 0.3 },
        emotionType: { value: emotionMap[currentEmotion] || 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float time;
        uniform int emotionType;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          
          vec3 pos = position;
          
          // Subtle corona fluctuations based on emotion - reduced displacement
          float coronaWave;
          
          if (emotionType == 0) { // joy - gentle expansion
            coronaWave = sin(time * 0.5 + length(pos) * 2.0) * 0.015; // Reduced from 0.02
          } else if (emotionType == 1) { // trust - stable corona
            coronaWave = sin(time * 0.3 + length(pos) * 1.5) * 0.01; // Reduced from 0.015
          } else if (emotionType == 2) { // fear - contracting corona
            coronaWave = sin(time * 1.0 + length(pos) * 3.0) * 0.008; // Reduced from 0.01
          } else if (emotionType == 3) { // surprise - pulsing corona
            coronaWave = sin(time * 2.0 + length(pos) * 4.0) * 0.02; // Reduced from 0.03
          } else if (emotionType == 4) { // sadness - fading corona
            coronaWave = sin(time * 0.2 + length(pos) * 1.0) * 0.006; // Reduced from 0.008
          } else if (emotionType == 5) { // anticipation - building corona
            float build = 0.5 + 0.5 * sin(time * 0.8);
            coronaWave = sin(time * 0.6 + length(pos) * 2.5) * 0.015 * build; // Reduced from 0.02
          } else if (emotionType == 6) { // anger - chaotic corona
            coronaWave = sin(time * 1.5 + length(pos) * 3.5 + sin(time * 3.0)) * 0.018; // Reduced from 0.025
          } else { // disgust - irregular corona
            coronaWave = sin(time * 0.7 + length(pos) * 2.2) * 0.009; // Reduced from 0.012
          }
          
          pos += normal * coronaWave;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float time;
        uniform vec3 glowColor;
        uniform vec2 mousePos;
        uniform float emotionIntensity;
        uniform int emotionType;
        
        void main() {
          // Subtle corona fresnel
          float fresnel = 1.0 - abs(dot(vNormal, vec3(0, 0, 1.0)));
          fresnel = pow(fresnel, 3.5);
          
          // Emotion-based corona intensity
          float coronaIntensity;
          
          if (emotionType == 0) { // joy - bright corona
            coronaIntensity = 0.8;
          } else if (emotionType == 1) { // trust - warm corona
            coronaIntensity = 0.7;
          } else if (emotionType == 2) { // fear - dim corona
            coronaIntensity = 0.4;
          } else if (emotionType == 3) { // surprise - pulsing corona
            coronaIntensity = 0.5 + 0.3 * sin(time * 3.0);
          } else if (emotionType == 4) { // sadness - faint corona
            coronaIntensity = 0.3;
          } else if (emotionType == 5) { // anticipation - building corona
            coronaIntensity = 0.4 + 0.4 * sin(time * 1.0);
          } else if (emotionType == 6) { // anger - intense corona
            coronaIntensity = 0.9;
          } else { // disgust - muted corona
            coronaIntensity = 0.5;
          }
          
          // Mouse creates subtle corona enhancement
          float mouseDistance = length(vPosition.xy - mousePos);
          float mouseCorona = 1.0 + exp(-mouseDistance * 1.0) * 0.3;
          
          // Gentle breathing effect
          float breathe = 0.8 + 0.2 * sin(time * 0.8);
          
          // Final corona intensity
          float finalIntensity = fresnel * coronaIntensity * mouseCorona * breathe * emotionIntensity * 0.2; // Reduced from 0.25
          
          gl_FragColor = vec4(glowColor, finalIntensity);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });

    const coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
    coronaRef.current = coronaMesh;
    scene.add(coronaMesh);

    // Enhanced star field
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

      // Update mouse position for atmospheric effects
      setMousePosition({ x: mouseX, y: mouseY });

      // Update all atmospheric materials with mouse position
      [innerAtmosphereRef, outerAtmosphereRef, coronaRef].forEach(ref => {
        if (ref.current && ref.current.material && 'uniforms' in ref.current.material) {
          (ref.current.material as THREE.ShaderMaterial).uniforms.mousePos.value.set(mouseX, mouseY);
        }
      });

      // Subtle mouse following effect for globe
      if (globeRef.current) {
        globeRef.current.rotation.y += (mouseX * 0.05 - globeRef.current.rotation.y) * 0.02;
        globeRef.current.rotation.x += (mouseY * 0.05 - globeRef.current.rotation.x) * 0.02;
      }
    };

    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    // Animation loop with FASTER rotation
    const animationLoop = () => {
      requestAnimationFrame(animationLoop);

      const time = Date.now() * 0.0005;

      if (globeRef.current) {
        // FASTER Globe rotation - increased from 0.00025 to 0.001 (4x faster)
        globeRef.current.rotation.y += 0.001;
      }

      // Update all atmospheric animations
      [innerAtmosphereRef, outerAtmosphereRef, coronaRef].forEach(ref => {
        if (ref.current && ref.current.material && 'uniforms' in ref.current.material) {
          (ref.current.material as THREE.ShaderMaterial).uniforms.time.value = time;
        }
      });

      // Animate stars (also faster) - increased from 0.00005 to 0.0002 (4x faster)
      if (starsRef.current) {
        starsRef.current.rotation.y += 0.0002;
        starsRef.current.rotation.x += 0.0001;
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

  // Update atmospheric colors when emotion changes
  useEffect(() => {
    const emotionTheme = getEmotionTheme(currentEmotion);
    const emotionColor = new THREE.Color(emotionTheme.color);
    
    const emotionMap: { [key: string]: number } = {
      'joy': 0, 'trust': 1, 'fear': 2, 'surprise': 3,
      'sadness': 4, 'anticipation': 5, 'anger': 6, 'disgust': 7
    };

    console.log(`🌍 Globe: Updating COMPACT ATMOSPHERIC LAYERS for emotion: ${currentEmotion} (${emotionTheme.color})`);

    // Update all atmospheric materials with new emotion
    [innerAtmosphereRef, outerAtmosphereRef, coronaRef].forEach(ref => {
      if (ref.current && ref.current.material && 'uniforms' in ref.current.material) {
        const material = ref.current.material as THREE.ShaderMaterial;
        material.uniforms.glowColor.value = emotionColor;
        material.uniforms.emotionType.value = emotionMap[currentEmotion] || 0;
      }
    });
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