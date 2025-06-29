'use client';

import { useState, useEffect } from 'react';
import ParticleLoader from './particle-loader';
import { EmotionType } from '@/lib/emotions';

interface PageLoaderProps {
  children: React.ReactNode;
  type?: 'earth' | 'octant' | 'chat' | 'trending' | 'timeline' | 'general';
  emotion?: EmotionType;
  message?: string;
  minLoadTime?: number;
}

const loadingMessages = {
  earth: 'Analyzing global emotional landscape',
  octant: 'Constructing emotional octant space',
  chat: 'Connecting to emotional AI assistant',
  trending: 'Analyzing trending emotional news',
  timeline: 'Building emotional timeline',
  general: 'Preparing your experience'
};

export default function PageLoader({ 
  children, 
  type = 'general', 
  emotion = 'joy',
  message,
  minLoadTime = 3000
}: PageLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  const loadingMessage = message || loadingMessages[type];

  useEffect(() => {
    // Ensure minimum loading time for smooth experience
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Small delay for smooth transition
      setTimeout(() => setShowContent(true), 300);
    }, minLoadTime);

    return () => clearTimeout(timer);
  }, [minLoadTime]);

  if (isLoading) {
    return (
      <ParticleLoader
        emotion={emotion}
        loadingMessage={loadingMessage}
        onComplete={() => {
          setIsLoading(false);
          setTimeout(() => setShowContent(true), 300);
        }}
        minLoadTime={minLoadTime}
      />
    );
  }

  return (
    <div className={`transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  );
}