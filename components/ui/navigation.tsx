'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useAppSelector } from '@/lib/store/hooks';
import { getEmotionTheme } from '@/lib/emotions';
import { musicManager } from '@/lib/music';
import { 
  Home, 
  TrendingUp, 
  MessageCircle, 
  Clock, 
  BarChart3, 
  User, 
  LogOut, 
  Settings,
  Volume2,
  VolumeX,
  Menu,
  X,
  Orbit
} from 'lucide-react';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Get current emotion from Redux store
  const { dominantEmotion } = useAppSelector(state => state.emotion);
  const emotionTheme = getEmotionTheme(dominantEmotion);

  // Initialize music state
  useEffect(() => {
    setIsMusicEnabled(musicManager.getEnabled());
  }, []);

  const toggleMusic = () => {
    const newState = !isMusicEnabled;
    setIsMusicEnabled(newState);
    musicManager.setEnabled(newState);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/octants', label: 'Octants', icon: Orbit },
    { href: '/trending', label: 'Trending', icon: TrendingUp },
    { href: '/chat', label: 'Chat', icon: MessageCircle },
    { href: '/timeline', label: 'Timeline', icon: Clock },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    
    // Try to get name from user metadata
    const firstName = user.user_metadata?.first_name;
    const lastName = user.user_metadata?.last_name;
    const fullName = user.user_metadata?.full_name;
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (fullName) {
      return fullName;
    } else if (user.email) {
      // Extract name from email
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    return 'User';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card backdrop-blur-xl border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <img 
              src="/symlog.png" 
              alt="Symbione Logo" 
              className="h-8 w-8 object-contain"
            />
            <span className="text-xl font-bold text-white tracking-wider">
              SYMBIONE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`glass-button text-white hover:bg-white/20 transition-all duration-300 premium-hover ${
                      active ? 'bg-white/20 text-white shadow-lg' : ''
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-4">
            {/* Current Emotion Badge */}
            <Badge 
              variant="outline" 
              className="hidden sm:flex glass-button border-white/30 text-white px-3 py-1 animate-pulse-glow"
              style={{ 
                borderColor: emotionTheme.color + '60',
                backgroundColor: emotionTheme.color + '20'
              }}
            >
              <div 
                className="w-2 h-2 rounded-full mr-2 animate-pulse"
                style={{ backgroundColor: emotionTheme.color }}
              />
              {emotionTheme.name}
            </Badge>

            {/* Music Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMusic}
              className="glass-button text-white hover:bg-white/20 transition-all duration-300 premium-hover"
              title={isMusicEnabled ? 'Disable Music' : 'Enable Music'}
            >
              {isMusicEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="glass-button text-white hover:bg-white/20 transition-all duration-300 premium-hover"
                >
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{getUserDisplayName()}</span>
                </Button>

                {showUserMenu && (
                  <Card className="absolute right-0 top-full mt-2 w-48 glass-card border-white/20 z-50">
                    <CardContent className="p-2">
                      <div className="space-y-1">
                        <div className="px-3 py-2 text-sm text-white/70">
                          {user.email}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleLogout}
                          className="w-full justify-start text-white hover:bg-white/20"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" className="glass-button text-white hover:bg-white/20 transition-all duration-300 premium-hover">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="glass-button bg-white/15 border-white/30 hover:bg-white/25 text-white transition-all duration-300 premium-hover">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden glass-button text-white hover:bg-white/20"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 py-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start glass-button text-white hover:bg-white/20 transition-all duration-300 ${
                        active ? 'bg-white/20 text-white' : ''
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              
              {!user && (
                <div className="pt-4 border-t border-white/20 space-y-2">
                  <Link href="/login">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start glass-button text-white hover:bg-white/20"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button 
                      className="w-full justify-start glass-button bg-white/15 border-white/30 hover:bg-white/25 text-white"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
}