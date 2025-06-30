'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/lib/store/hooks';
import { getEmotionTheme } from '@/lib/emotions';
import { supabase } from '@/lib/supabase';
import { 
  Home, 
  Orbit, 
  TrendingUp, 
  MessageCircle, 
  Clock, 
  User, 
  LogOut, 
  Menu, 
  X,
  Brain
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Get current emotion from Redux store
  const { dominantEmotion } = useAppSelector(state => state.emotion);
  const emotionTheme = getEmotionTheme(dominantEmotion);

  // Check authentication status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/octants', label: 'Octants', icon: Orbit },
    { href: '/trending', label: 'Trending', icon: TrendingUp },
    { href: '/rag-chat', label: 'AI Assistant', icon: Brain },
    { href: '/chat', label: 'Chat', icon: MessageCircle },
    { href: '/timeline', label: 'Timeline', icon: Clock },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ 
                  backgroundColor: emotionTheme.color,
                  boxShadow: `0 0 20px ${emotionTheme.color}40`
                }}
              >
                <div className="w-4 h-4 rounded-full bg-white/30 animate-pulse" />
              </div>
            </div>
            <span className="text-xl font-bold text-white group-hover:text-glow transition-all duration-300">
              Symbione
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`glass-button premium-hover transition-all duration-300 ${
                      isActive 
                        ? 'bg-white/20 text-white border-white/30' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Current Emotion Badge & User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Badge 
              variant="outline" 
              className="glass-button border-white/30 text-white px-3 py-1 animate-pulse-glow"
              style={{ 
                borderColor: emotionTheme.color + '60',
                boxShadow: `0 0 20px ${emotionTheme.color}30`
              }}
            >
              <div 
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: emotionTheme.color }}
              />
              {emotionTheme.name}
            </Badge>

            {user ? (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="glass-button text-white/80 hover:text-white"
                >
                  <User className="h-4 w-4 mr-2" />
                  {user.email?.split('@')[0] || 'User'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="glass-button text-white/80 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="glass-button text-white/80 hover:text-white"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className="glass-button bg-white/15 border-white/30 hover:bg-white/25 text-white"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden glass-button text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start glass-button transition-all duration-300 ${
                        isActive 
                          ? 'bg-white/20 text-white border-white/30' 
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              
              {/* Mobile Emotion Badge */}
              <div className="pt-2 border-t border-white/10">
                <Badge 
                  variant="outline" 
                  className="glass-button border-white/30 text-white px-3 py-1 animate-pulse-glow"
                  style={{ 
                    borderColor: emotionTheme.color + '60',
                    boxShadow: `0 0 20px ${emotionTheme.color}30`
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: emotionTheme.color }}
                  />
                  Current: {emotionTheme.name}
                </Badge>
              </div>

              {/* Mobile User Menu */}
              <div className="pt-2 border-t border-white/10">
                {user ? (
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start glass-button text-white/80"
                    >
                      <User className="h-4 w-4 mr-2" />
                      {user.email?.split('@')[0] || 'User'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="w-full justify-start glass-button text-white/80"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start glass-button text-white/80"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setIsOpen(false)}>
                      <Button
                        className="w-full justify-start glass-button bg-white/15 border-white/30 hover:bg-white/25 text-white"
                      >
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}