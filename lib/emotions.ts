export type EmotionType = 'joy' | 'trust' | 'fear' | 'surprise' | 'sadness' | 'anticipation' | 'anger' | 'disgust';

export interface EmotionConfig {
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  particleColor: string;
  musicType: string;
  uiSpeed: 'slow' | 'medium' | 'fast';
  motionType: 'upward' | 'orbiting' | 'recoil' | 'bursty' | 'drooping' | 'pulsing' | 'erratic' | 'twisting';
  gradient: string;
}

export const EMOTIONS: Record<EmotionType, EmotionConfig> = {
  joy: {
    name: 'Joy',
    color: '#FFA500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-900',
    borderColor: 'border-orange-200',
    particleColor: '#FFD700',
    musicType: 'Bright piano/electro',
    uiSpeed: 'fast',
    motionType: 'upward',
    gradient: 'from-yellow-400 to-orange-500'
  },
  trust: {
    name: 'Trust',
    color: '#10B981',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-900',
    borderColor: 'border-emerald-200',
    particleColor: '#34D399',
    musicType: 'Calm ambient',
    uiSpeed: 'medium',
    motionType: 'orbiting',
    gradient: 'from-emerald-400 to-green-500'
  },
  fear: {
    name: 'Fear',
    color: '#6366F1',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-900',
    borderColor: 'border-indigo-200',
    particleColor: '#8B5CF6',
    musicType: 'Tense drones',
    uiSpeed: 'slow',
    motionType: 'recoil',
    gradient: 'from-blue-500 to-purple-600'
  },
  surprise: {
    name: 'Surprise',
    color: '#06B6D4',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-900',
    borderColor: 'border-cyan-200',
    particleColor: '#22D3EE',
    musicType: 'Chimes/synth pop',
    uiSpeed: 'fast',
    motionType: 'bursty',
    gradient: 'from-teal-400 to-cyan-500'
  },
  sadness: {
    name: 'Sadness',
    color: '#1E40AF',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-900',
    borderColor: 'border-blue-200',
    particleColor: '#3B82F6',
    musicType: 'Ambient soft pads',
    uiSpeed: 'slow',
    motionType: 'drooping',
    gradient: 'from-blue-600 to-blue-800'
  },
  anticipation: {
    name: 'Anticipation',
    color: '#F97316',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-900',
    borderColor: 'border-orange-200',
    particleColor: '#FB923C',
    musicType: 'Minimal electronic',
    uiSpeed: 'medium',
    motionType: 'pulsing',
    gradient: 'from-orange-500 to-red-500'
  },
  anger: {
    name: 'Anger',
    color: '#DC2626',
    bgColor: 'bg-red-50',
    textColor: 'text-red-900',
    borderColor: 'border-red-200',
    particleColor: '#EF4444',
    musicType: 'Harsh strings/drums',
    uiSpeed: 'fast',
    motionType: 'erratic',
    gradient: 'from-red-500 to-red-700'
  },
  disgust: {
    name: 'Disgust',
    color: '#65A30D',
    bgColor: 'bg-lime-50',
    textColor: 'text-lime-900',
    borderColor: 'border-lime-200',
    particleColor: '#84CC16',
    musicType: 'Dissonant textures',
    uiSpeed: 'medium',
    motionType: 'twisting',
    gradient: 'from-lime-500 to-green-600'
  }
};

export function getEmotionTheme(emotion: EmotionType) {
  return EMOTIONS[emotion];
}

// This function is now replaced by Redux state management
// but kept for backward compatibility
export function getDominantEmotion(): EmotionType {
  // This will be overridden by Redux state in components
  const emotions: EmotionType[] = ['joy', 'trust', 'fear', 'surprise', 'sadness', 'anticipation', 'anger', 'disgust'];
  return emotions[Math.floor(Math.random() * emotions.length)];
}