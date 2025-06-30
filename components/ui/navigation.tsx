'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
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
  User,
  LogOut
} from 'lucide-react';

const navigationItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/octants', label: 'Octants', icon: Brain },
  { href: '/trending', label: 'Trending', icon: TrendingUp, requiresAuth: true },
  { href: '/chat', label: 'Chat', icon: MessageCircle, requiresAuth: true },
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const isActive = (href: string) => pathname === href;

  // Filter navigation items based on auth status
  const visibleNavItems = navigationItems.filter(item => 
    !item.requiresAuth || user
  );

  // Load button click sound
  useEffect(() => {
    const audio = new Audio('/sounds/buttonclick.mp3');
    audio.preload = 'auto';
    audio.volume = 0.5;
    
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
      (audioRef.current as HTMLAudioElement).currentTime = 0;
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

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get user display info
  const getUserDisplayName = () => {
    if (!user) return '';
    
    const firstName = user.user_metadata?.first_name;
    const lastName = user.user_metadata?.last_name;
    const fullName = user.user_metadata?.full_name;
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (fullName) {
      return fullName;
    } else if (firstName) {
      return firstName;
    } else {
      return user.email || 'User';
    }
  };

  const getUserInitial = () => {
    if (!user) return 'U';
    
    const firstName = user.user_metadata?.first_name;
    const fullName = user.user_metadata?.full_name;
    const email = user.email;
    
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (fullName) {
      return fullName.charAt(0).toUpperCase();
    } else if (email) {
      return email.charAt(0).toUpperCase();
    } else {
      return 'U';
    }
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
                  {visibleNavItems.map((item) => {
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

                {/* Sound Toggle Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-white/70 hover:text-white hover:bg-white/10 border border-white/20"
                  onClick={handleSoundToggle}
                  title={soundEnabled ? 'Disable Sounds' : 'Enable Sounds'}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>

                {/* Auth Section */}
                <div className="flex items-center space-x-2">
                  {loading ? (
                    <div className="h-9 w-20 bg-white/10 rounded-lg animate-pulse"></div>
                  ) : user ? (
                    /* User Profile Dropdown */
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-9 p-0 rounded-full border-white/30 text-white hover:bg-white/10 hover:border-white/50 bg-white/10"
                          onClick={playButtonSound}
                        >
                          <span className="text-sm font-semibold">
                            {getUserInitial()}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="end" 
                        className="w-56 bg-black/90 border-white/20 backdrop-blur-xl"
                      >
                        <DropdownMenuLabel className="text-white">
                          {getUserDisplayName()}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/20" />
                        <DropdownMenuItem 
                          onClick={handleLogout}
                          className="text-white hover:bg-white/10 cursor-pointer"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    /* Auth Buttons for non-logged in users */
                    <>
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
                    </>
                  )}
                </div>
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
                {visibleNavItems.map((item) => {
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

              {/* Mobile Sound Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-11 px-4 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleSoundToggle}
              >
                <div className="flex items-center space-x-3 w-full">
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
                </div>
              </Button>

              {/* Mobile Auth Section */}
              <div className="space-y-2">
                {loading ? (
                  <div className="h-11 bg-white/10 rounded-lg animate-pulse"></div>
                ) : user ? (
                  /* Mobile User Profile */
                  <>
                    <div className="px-4 py-2 text-white/80 text-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
                          {getUserInitial()}
                        </div>
                        <span>{getUserDisplayName()}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-11 px-4 text-sm font-medium border-white/30 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/50"
                      onClick={() => {
                        playButtonSound();
                        handleLogout();
                      }}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </div>
                    </Button>
                  </>
                ) : (
                  /* Mobile Auth Buttons */
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}