'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useAppSelector } from '@/lib/store/hooks';
import { getEmotionTheme } from '@/lib/emotions';
import { musicManager } from '@/lib/music';
import { 
  Home, 
  TrendingUp, 
  MessageCircle, 
  Calendar, 
  Orbit, 
  LogOut, 
  User,
  Volume2,
  VolumeX
} from 'lucide-react';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { dominantEmotion } = useAppSelector(state => state.emotion);
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);

  // Initialize music state
  useEffect(() => {
    setIsMusicEnabled(musicManager.getEnabled());
  }, []);

  const emotionTheme = getEmotionTheme(dominantEmotion);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/octants', label: 'Octants', icon: Orbit },
    { href: '/trending', label: 'Trending', icon: TrendingUp },
    { href: '/chat', label: 'Chat', icon: MessageCircle },
    { href: '/timeline', label: 'Timeline', icon: Calendar },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMusic = () => {
    const newState = !isMusicEnabled;
    setIsMusicEnabled(newState);
    musicManager.setEnabled(newState);
    
    if (!newState) {
      musicManager.stop();
    } else {
      // Resume music based on current page
      if (pathname === '/chat') {
        musicManager.playChatMusic('ambient');
      } else {
        musicManager.playEmotionMusic(dominantEmotion);
      }
    }
  };

  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    
    // Try to get name from user metadata
    const metadata = user.user_metadata;
    if (metadata?.first_name) {
      return metadata.first_name;
    }
    if (metadata?.full_name) {
      return metadata.full_name.split(' ')[0];
    }
    
    // Fallback to email
    if (user.email) {
      return user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1);
    }
    
    return 'User';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card backdrop-blur-xl border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="text-2xl font-bold text-white group-hover:text-glow transition-all duration-300">
              Symbione
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`glass-button text-white hover:bg-white/20 transition-all duration-300 premium-hover ${
                      isActive ? 'bg-white/15 text-glow' : ''
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Right Side - Music Toggle, Current Emotion, User Profile */}
          <div className="flex items-center space-x-4">
            {/* Music Toggle Button */}
            <Button
              onClick={toggleMusic}
              variant="ghost"
              size="sm"
              className="glass-button text-white hover:bg-white/20 transition-all duration-300"
              title={isMusicEnabled ? 'Disable Music' : 'Enable Music'}
            >
              {isMusicEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>

            {/* Current Emotion Badge */}
            <Badge 
              variant="outline" 
              className="glass-button border-white/40 text-white px-3 py-1 animate-pulse-glow"
              style={{ 
                borderColor: emotionTheme.color + '60',
                backgroundColor: emotionTheme.color + '20',
                boxShadow: `0 0 20px ${emotionTheme.color}30`
              }}
            >
              <div 
                className="w-2 h-2 rounded-full mr-2 animate-pulse"
                style={{ backgroundColor: emotionTheme.color }}
              />
              {emotionTheme.name}
            </Badge>

            {/* User Profile */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 glass-button px-3 py-1 rounded-full">
                  <User className="h-4 w-4 text-white" />
                  <span className="text-white text-sm font-medium">
                    {getUserDisplayName()}
                  </span>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="glass-button text-white hover:bg-red-500/20 hover:text-red-200 transition-all duration-300"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button className="glass-button bg-white/15 border-white/30 hover:bg-white/25 text-white">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}