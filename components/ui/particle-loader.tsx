'use client';

import { useEffect, useRef } from 'react';
import { EmotionType, getEmotionTheme } from '@/lib/emotions';

interface ParticleLoaderProps {
  emotion: EmotionType;
  loadingMessage?: string; // Added this prop
  onComplete: () => void;
  minLoadTime?: number;
}

export default function ParticleLoader({ 
  emotion, 
  loadingMessage = "Loading...", // Added default value
  onComplete, 
  minLoadTime = 2000 
}: ParticleLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emotionTheme = getEmotionTheme(emotion);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
    }> = [];

    // Create particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        color: emotionTheme.color
      });
    }

    let animationFrame: number;
    const startTime = Date.now();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      });

      // Check if minimum time has passed
      if (Date.now() - startTime >= minLoadTime) {
        onComplete();
        return;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [emotion, emotionTheme.color, onComplete, minLoadTime]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      <div className="relative z-10 text-center">
        <div className="text-white text-xl font-semibold mb-4 text-glow">
          {loadingMessage}
        </div>
        <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full animate-pulse"
            style={{ backgroundColor: emotionTheme.color }}
          />
        </div>
      </div>
    </div>
  );
}