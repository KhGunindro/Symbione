'use client';

import { useEffect, useState } from 'react';
import { EmotionType, getEmotionTheme } from '@/lib/emotions';

interface ParticleLoaderProps {
  emotion: EmotionType;
  loadingMessage?: string; // Added this missing prop
  onComplete: () => void;
  minLoadTime?: number;
}

export default function ParticleLoader({ 
  emotion, 
  loadingMessage = "Loading...", // Default value
  onComplete, 
  minLoadTime = 2000 
}: ParticleLoaderProps) {
  const [progress, setProgress] = useState(0);
  const emotionTheme = getEmotionTheme(emotion);

  useEffect(() => {
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / minLoadTime) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(interval);
        setTimeout(onComplete, 300);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [minLoadTime, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {/* Animated particles background */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: emotionTheme.color,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Loading content */}
      <div className="relative z-10 text-center">
        <div 
          className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-6"
          style={{ borderColor: `${emotionTheme.color} transparent transparent transparent` }}
        />
        
        <h2 className="text-2xl font-bold text-white mb-4 text-glow">
          {emotionTheme.name}
        </h2>
        
        <p className="text-white/70 mb-6">
          {loadingMessage}
        </p>
        
        {/* Progress bar */}
        <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden mx-auto">
          <div 
            className="h-full transition-all duration-300 ease-out rounded-full"
            style={{ 
              width: `${progress}%`,
              backgroundColor: emotionTheme.color,
              boxShadow: `0 0 10px ${emotionTheme.color}60`
            }}
          />
        </div>
        
        <div className="text-white/50 text-sm mt-3 font-mono">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}