'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { EmotionType } from '@/lib/emotions';

interface ParticleLoaderProps {
  emotion?: EmotionType;
  message?: string;
  onComplete?: () => void;
  minLoadTime?: number;
}

const ParticleLoader: React.FC<ParticleLoaderProps> = ({ 
  emotion = 'joy', 
  message = 'Loading',
  onComplete,
  minLoadTime = 3000
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const particlesRef = useRef<THREE.Mesh[]>([]);
  const [loadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Particle system - ALL WHITE PARTICLES
    const particleCount = 350;
    const particles: THREE.Mesh[] = [];
    const baseRadius = 1.2;
    
    // Create particle geometry and material - WHITE ONLY
    const geometry = new THREE.SphereGeometry(0.025, 8, 8); // Increased size
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,        // Pure white
      emissive: 0xcccccc,     // White emissive
      emissiveIntensity: 0.3,
      shininess: 100
    });

    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(geometry, material);
      
      // Start particles in dispersed state
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(2 * Math.random() - 1);
      const disperseRadius = 1.0 + Math.random() * 1.5; // Decreased disperse volume
      
      particle.position.x = disperseRadius * Math.sin(theta) * Math.cos(phi);
      particle.position.y = disperseRadius * Math.sin(theta) * Math.sin(phi);
      particle.position.z = disperseRadius * Math.cos(theta);
      
      // Calculate target position (assembled state)
      const targetPhi = Math.acos(-1 + (2 * i) / particleCount);
      const targetTheta = Math.sqrt(particleCount * Math.PI) * targetPhi;
      const targetRadius = baseRadius * (0.4 + Math.random() * 0.8);
      const clusterFactor = Math.random() < 0.3 ? 0.5 : 1;
      const finalRadius = targetRadius * clusterFactor;
      
      const noisePhi = targetPhi + (Math.random() - 0.5) * 0.5;
      const noiseTheta = targetTheta + (Math.random() - 0.5) * 0.5;
      
      const targetPosition = new THREE.Vector3(
        finalRadius * Math.cos(noiseTheta) * Math.sin(noisePhi),
        finalRadius * Math.sin(noiseTheta) * Math.sin(noisePhi),
        finalRadius * Math.cos(noisePhi)
      );
      
      // Random scale variation
      const scaleVariation = 0.3 + Math.random() * 0.7;
      particle.scale.setScalar(scaleVariation);
      
      // Store animation properties
      particle.userData = {
        startPosition: particle.position.clone(),
        targetPosition: targetPosition,
        originalScale: scaleVariation,
        animationDelay: Math.random() * 2000, // Random delay up to 2 seconds
        startTime: Date.now()
      };
      
      scene.add(particle);
      particles.push(particle);
    }
    
    particlesRef.current = particles;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.4, 100);
    pointLight.position.set(0, 0, 8);
    scene.add(pointLight);

    camera.position.z = 8;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      const currentTime = Date.now();
      const globalTime = currentTime * 0.001;
      
      // Rotate entire particle system
      const rotationSpeed = 0.3;
      scene.rotation.y = globalTime * rotationSpeed;
      
      // Update particle positions - dispersed to combined
      particles.forEach((particle, index) => {
        const userData = particle.userData;
        const timeSinceStart = currentTime - userData.startTime;
        const adjustedTime = Math.max(0, timeSinceStart - userData.animationDelay);
        
        if (adjustedTime > 0) {
          // Animate from dispersed to assembled
          const animationDuration = 3000; // 3 seconds
          const progress = Math.min(adjustedTime / animationDuration, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
          
          particle.position.lerpVectors(
            userData.startPosition,
            userData.targetPosition,
            easedProgress
          );
        }
        
        // Add subtle floating motion when assembled
        if (timeSinceStart > 3000) {
          const staggeredTime = globalTime + (index * 0.02);
          const floatOffset = new THREE.Vector3(
            Math.sin(staggeredTime * 1.8 + particle.position.x * 3) * 0.03,
            Math.cos(staggeredTime * 1.4 + particle.position.y * 3) * 0.03,
            Math.sin(staggeredTime * 1.6 + particle.position.z * 3) * 0.03
          );
          particle.position.copy(userData.targetPosition.clone().add(floatOffset));
        }
        
        // Enhanced particle glow effect - Fixed TypeScript error
        const staggeredTime = globalTime + (index * 0.02);
        const glowIntensity = 0.4 + Math.sin(staggeredTime * 2.5 + index * 0.1) * 0.15;
        (particle.material as THREE.MeshPhongMaterial).emissiveIntensity = glowIntensity;
        
        // Scale particles based on original scale and glow
        const dynamicScale = userData.originalScale * (1 + glowIntensity * 0.3);
        particle.scale.setScalar(dynamicScale);
      });
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle completion
    const completionTimer = setTimeout(() => {
      setLoadingComplete(true);
      if (onComplete) {
        onComplete();
      }
    }, minLoadTime);

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      clearTimeout(completionTimer);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [emotion, onComplete, minLoadTime]);

  if (loadingComplete) {
    return null;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div ref={mountRef} className="absolute inset-0" />
      
      {/* Music integration point */}
      {/* TODO: Add ambient loading music based on emotion type */}
      
      {/* Loading text with premium typography */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center">
        <div className="relative">
          
          {/* Sophisticated progress indicator */}
          <div className="w-80 h-0.5 bg-gray-800 mx-auto relative overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -translate-x-full" 
                 style={{ 
                   animation: 'elegantProgress 4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                   width: '40%'
                 }}></div>
          </div>
          
          {/* Subtle accent line */}
          <div className="mt-4 w-12 h-px bg-white mx-auto opacity-30"></div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes elegantProgress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(250%); }
        }
        
        @keyframes elegantBounce {
          0%, 100% { 
            transform: translateY(0) scale(1); 
            opacity: 0.7;
          }
          50% { 
            transform: translateY(-8px) scale(1.2); 
            opacity: 1;
          }
        }
        
        @keyframes textGlow {
          0% { 
            opacity: 0.8;
            letter-spacing: 0.3em;
          }
          100% { 
            opacity: 1;
            letter-spacing: 0.35em;
          }
        }
      `}</style>
    </div>
  );
};

export default ParticleLoader;