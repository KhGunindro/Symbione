import { EmotionType } from './emotions';

export interface MusicConfig {
  emotion: EmotionType;
  filename: string;
  volume: number;
  loop: boolean;
}

// Music configuration for each emotion
export const EMOTION_MUSIC: Record<EmotionType, MusicConfig> = {
  joy: {
    emotion: 'joy',
    filename: '(Joy)ES_Getaway - Ruiqi Zhao.mp3', // Bright piano/electro music
    volume: 0.3,
    loop: true
  },
  trust: {
    emotion: 'trust',
    filename: '(Peace Happy)ES_In a Trance - Jon Bjork.mp3', // Calm ambient music
    volume: 0.3,
    loop: true
  },
  fear: {
    emotion: 'fear',
    filename: '(Fear)ES_The Mire - Anders Schill Paulsen.mp3', // Tense drones music
    volume: 0.3,
    loop: true
  },
  surprise: {
    emotion: 'surprise',
    filename: '(Surprise)ES_Adaption - Out To The World.mp3', // Chimes/synth pop music
    volume: 0.3,
    loop: true
  },
  sadness: {
    emotion: 'sadness',
    filename: '(Sentimental)ES_Buried Time - Rand Aldo.mp3', // Ambient soft pads music
    volume: 0.3,
    loop: true
  },
  anticipation: {
    emotion: 'anticipation',
    filename: '(anticipation)ES_DOX - Lennon Hutton.mp3', // Minimal electronic music
    volume: 0.3,
    loop: true
  },
  anger: {
    emotion: 'anger',
    filename: 'anger-harsh-strings.mp3', // Harsh strings/drums music
    volume: 0.3,
    loop: true
  },
  disgust: {
    emotion: 'disgust',
    filename: '(disgust)ES_Uranium - Lennon Hutton.mp3', // Dissonant textures music
    volume: 0.3,
    loop: true
  }
};

// Chat page specific music
export const CHAT_MUSIC = {
  ambient: {
    filename: 'ES_Dozin\' Off - Timothy Infinite.mp3', // Ambient background music for chat
    volume: 0.3,
    loop: true
  },
  focus: {
    filename: 'ES_Ferns - Guustavv.mp3', // Focus/concentration music for chat
    volume: 0.3,
    loop: true
  }
};

export class MusicManager {
  private currentAudio: HTMLAudioElement | null = null;
  private isEnabled: boolean = true;
  private currentEmotion: EmotionType | null = null;
  private isChatMode: boolean = false;

  constructor() {
    // Load music preference from localStorage
    const savedPreference = localStorage.getItem('musicEnabled');
    this.isEnabled = savedPreference !== 'false';
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    localStorage.setItem('musicEnabled', enabled.toString());
    
    if (!enabled && this.currentAudio) {
      this.stop();
    }
  }

  isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }

  getEnabled(): boolean {
    return this.isEnabled;
  }

  playEmotionMusic(emotion: EmotionType) {
    if (!this.isEnabled) return;
    
    // Don't restart if same emotion is already playing
    if (this.currentEmotion === emotion && this.isPlaying() && !this.isChatMode) {
      return;
    }

    this.stop();
    this.currentEmotion = emotion;
    this.isChatMode = false;

    const config = EMOTION_MUSIC[emotion];
    this.playMusic(`/sounds/${config.filename}`, config.volume, config.loop);
  }

  playChatMusic(type: 'ambient' | 'focus' = 'ambient') {
    if (!this.isEnabled) return;
    
    // Don't restart if chat music is already playing
    if (this.isChatMode && this.isPlaying()) {
      return;
    }

    this.stop();
    this.currentEmotion = null;
    this.isChatMode = true;

    const config = CHAT_MUSIC[type];
    this.playMusic(`/sounds/${config.filename}`, config.volume, config.loop);
  }

  private playMusic(src: string, volume: number, loop: boolean) {
    try {
      this.currentAudio = new Audio(src);
      this.currentAudio.volume = volume;
      this.currentAudio.loop = loop;
      
      // Handle loading errors gracefully
      this.currentAudio.addEventListener('error', (e) => {
        console.warn(`Music file not found: ${src}. Please add the music file to public/sounds/`);
      });
      
      this.currentAudio.play().catch(error => {
        console.warn('Music autoplay blocked by browser:', error);
      });
    } catch (error) {
      console.warn('Error playing music:', error);
    }
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  pause() {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
  }

  resume() {
    if (this.currentAudio && this.isEnabled) {
      this.currentAudio.play().catch(error => {
        console.warn('Error resuming music:', error);
      });
    }
  }
}

// Global music manager instance
export const musicManager = new MusicManager();