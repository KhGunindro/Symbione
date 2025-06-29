'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
  UserPlus 
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
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

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
              <Link href="/" className="flex items-center space-x-3 group">
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
                      >
                        <Link href={item.href} className="flex items-center space-x-2">
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

                {/* Auth Buttons */}
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
                      >
                        <Link href={item.href} className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden h-10 w-10 p-0 text-white hover:bg-white/10 border border-white/20"
                onClick={() => setIsOpen(!isOpen)}
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
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href={item.href} className="flex items-center space-x-3 w-full">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                  );
                })}
              </div>

              {/* Mobile Separator */}
              <div className="h-px bg-white/20 my-3"></div>

              {/* Mobile Auth Buttons */}
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
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href={item.href} className="flex items-center space-x-3 w-full">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}