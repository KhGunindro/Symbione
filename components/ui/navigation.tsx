'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { musicManager } from '@/lib/music';
import { 
  Menu, 
  X, 
  Sparkles, 
  Home, 
  Brain, 
  TrendingUp, 
  MessageCircle, 
  Clock, 
  LogIn, 
  UserPlus,
  Volume2,
  VolumeX,
  LogOut
} from 'lucide-react';

const navigationItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/octants', label: 'Octants', icon: Brain },
  { href: '/trending', label: 'Trending', icon: TrendingUp },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/timeline', label: 'Timeline', icon: Clock },
];

const authItems = [
  { href: '/login', label: 'Login', icon: LogIn },
  { href: '/signup', label: 'Sign Up', icon: UserPlus },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundLoaded, setSoundLoaded] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const isActive = (href: string) => pathname === href;

  // Initialize music state
  useEffect(() => {
    setMusicEnabled(musicManager.getEnabled());
  }, []);

  // Load button click sound
  useEffect(() => {
    const audio = new Audio('/sounds/buttonclick.mp3');
    audio.preload = 'auto';
    audio.volume = 0.5; // Adjust volume as needed
    
    // Handle loading
    audio.addEventListener('canplaythrough', () => {
      setSoundLoaded(true);
    });
    
    audio.addEventListener('error', () => {
      console.warn('Could not load button click sound');
      setSoundLoaded(false);
    });
    
    audioRef.current = audio;
  }, []);

  // Play button click sound
  const playButtonSound = () => {
    if (!soundEnabled || !soundLoaded || !audioRef.current) return;
    
    try {
      (audioRef.current as HTMLAudioElement).currentTime = 0; // Reset to beginning
      (audioRef.current as HTMLAudioElement).play().catch((error: unknown) => {
        console.warn('Error playing button sound:', error);
      });
    } catch (error: unknown) {
      console.warn('Error playing button sound:', error);
    }
  };

  const handleMenuToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleNavClick = () => {
    setIsOpen(false);
  };

  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled);
  };

  const handleMusicToggle = () => {
    const newMusicState = !musicEnabled;
    setMusicEnabled(newMusicState);
    musicManager.setEnabled(newMusicState);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get user's first letter for avatar
  const getUserInitial = () => {
    if (!user) return '';
    
    // Try to get from user metadata first
    const firstName = user.user_metadata?.first_name;
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    
    // Fallback to email
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U'; // Ultimate fallback
  };

  // Get user's display name
  const getUserName = () => {
    if (!user) return '';
    
    const firstName = user.user_metadata?.first_name;
    const lastName = user.user_metadata?.last_name;
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (user.email) {
      return user.email.split('@')[0];
    }
    
    return 'User';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        {/* Main Navigation Container */}
        <div className="relative backdrop-blur-2xl bg-black/60 border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-float">
          {/* Gradient Border Effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 via-transparent to-white/20 opacity-50 blur-sm"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          
          <div className="relative px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link 
                href="/" 
                className="flex items-center space-x-3 group"
              >
                <div className="relative">
                  <Sparkles className="h-8 w-8 text-white group-hover:text-white/80 transition-all duration-300 group-hover:scale-110 animate-pulse" />
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-lg group-hover:bg-white/30 transition-all duration-300"></div>
                </div>
                <span className="text-xl font-bold text-white text-glow group-hover:scale-105 transition-transform duration-300">
                  Symbione
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-2">
                {/* Main Navigation Items */}
                <div className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.href}
                        variant={isActive(item.href) ? "premium" : "ghost"}
                        size="sm"
                        asChild
                        className={`
                          relative h-9 px-4 text-sm font-medium transition-all duration-300
                          ${isActive(item.href) 
                            ? 'bg-white/20 text-white shadow-lg border-white/30' 
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                          }
                        `}
                        onClick={playButtonSound}
                      >
                        <Link 
                          href={item.href} 
                          className="flex items-center space-x-2"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                          {isActive(item.href) && (
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/10 to-white/5 animate-shimmer"></div>
                          )}
                        </Link>
                      </Button>
                    );
                  })}
                </div>

                {/* Separator */}
                <div className="w-px h-6 bg-white/20 mx-2"></div>

                {/* Music Toggle Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-white/70 hover:text-white hover:bg-white/10 border border-white/20"
                  onClick={handleMusicToggle}
                  title={musicEnabled ? 'Disable Music' : 'Enable Music'}
                >
                  {musicEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>

                {/* Auth Section */}
                {loading ? (
                  <div className="h-9 w-20 bg-white/10 rounded animate-pulse"></div>
                ) : user ? (
                  /* Logged In State */
                  <div className="flex items-center space-x-3">
                    {/* User Avatar with Initial */}
                    <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-white/10 border border-white/20">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {getUserInitial()}
                      </div>
                      <span className="text-white/90 text-sm font-medium hidden lg:block">
                        {getUserName()}
                      </span>
                    </div>
                    
                    {/* Logout Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="h-9 px-4 text-sm font-medium border-white/30 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      <span className="hidden lg:inline">Logout</span>
                      <span className="lg:hidden">Out</span>
                    </Button>
                  </div>
                ) : (
                  /* Logged Out State */
                  <div className="flex items-center space-x-2">
                    {authItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Button
                          key={item.href}
                          variant={item.href === '/signup' ? "premium" : "outline"}
                          size="sm"
                          asChild
                          className={`
                            h-9 px-4 text-sm font-medium transition-all duration-300
                            ${item.href === '/signup' 
                              ? 'bg-white/20 text-white border-white/30 hover:bg-white/30 shadow-lg' 
                              : 'border-white/30 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/50'
                            }
                          `}
                          onClick={playButtonSound}
                        >
                          <Link 
                            href={item.href} 
                            className="flex items-center space-x-2"
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden h-10 w-10 p-0 text-white hover:bg-white/10 border border-white/20"
                onClick={() => {
                  playButtonSound();
                  handleMenuToggle();
                }}
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        {isOpen && (
          <div className="md:hidden mt-2 backdrop-blur-2xl bg-black/80 border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-breathe">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent opacity-50"></div>
            <div className="relative p-4 space-y-2">
              {/* Mobile Navigation Items */}
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.href}
                      variant={isActive(item.href) ? "premium" : "ghost"}
                      size="sm"
                      asChild
                      className={`
                        w-full justify-start h-11 px-4 text-sm font-medium transition-all duration-300
                        ${isActive(item.href) 
                          ? 'bg-white/20 text-white shadow-lg border-white/30' 
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                        }
                      `}
                      onClick={() => {
                        playButtonSound();
                        handleNavClick();
                      }}
                    >
                      <Link 
                        href={item.href} 
                        className="flex items-center space-x-3 w-full"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                  );
                })}
              </div>

              {/* Mobile Separator */}
              <div className="h-px bg-white/20 my-3"></div>

              {/* Mobile Music Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-11 px-4 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleMusicToggle}
              >
                <div className="flex items-center space-x-3 w-full">
                  {musicEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  <span>{musicEnabled ? 'Music On' : 'Music Off'}</span>
                </div>
              </Button>

              {/* Mobile Auth Section */}
              {loading ? (
                <div className="h-11 bg-white/10 rounded animate-pulse"></div>
              ) : user ? (
                /* Mobile Logged In State */
                <div className="space-y-2">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-white/10 border border-white/20">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {getUserInitial()}
                    </div>
                    <span className="text-white/90 text-sm font-medium">
                      {getUserName()}
                    </span>
                  </div>
                  
                  {/* Mobile Logout Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleLogout();
                      handleNavClick();
                    }}
                    className="w-full justify-start h-11 px-4 text-sm font-medium border-white/30 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    <span>Logout</span>
                  </Button>
                </div>
              ) : (
                /* Mobile Logged Out State */
                <div className="space-y-2">
                  {authItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.href}
                        variant={item.href === '/signup' ? "premium" : "outline"}
                        size="sm"
                        asChild
                        className={`
                          w-full justify-start h-11 px-4 text-sm font-medium transition-all duration-300
                          ${item.href === '/signup' 
                            ? 'bg-white/20 text-white border-white/30 hover:bg-white/30 shadow-lg' 
                            : 'border-white/30 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/50'
                          }
                        `}
                        onClick={() => {
                          playButtonSound();
                          handleNavClick();
                        }}
                      >
                        <Link 
                          href={item.href} 
                          className="flex items-center space-x-3 w-full"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}