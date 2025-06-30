'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ThreeGlobe from '@/components/three/ThreeGlobe';
import Navigation from '@/components/ui/navigation';
import PageLoader from '@/components/ui/page-loader';
import { getEmotionTheme, EmotionType, EMOTIONS } from '@/lib/emotions';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { forceEmotionUpdate } from '@/lib/store/slices/emotionSlice';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Brain, Globe, TrendingUp, MessageCircle, Clock, BarChart3, Eye, Orbit, ChevronDown, Database, Zap } from 'lucide-react';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Get current emotion from Redux store (octant-driven)
  const { dominantEmotion, octantDominantEmotion, octantEmotionDistribution, isLoading: emotionLoading } = useAppSelector(state => state.emotion);
  
  // Use octant dominant emotion for the Earth's glow, fallback to regular dominant emotion
  const currentEmotion = octantDominantEmotion || dominantEmotion;

  // Force emotion update if we don't have fresh data
  useEffect(() => {
    // If we don't have any emotion data or it's still loading, force an update
    if (!dominantEmotion || emotionLoading) {
      console.log('🏠 Landing page: Forcing emotion update for immediate display');
      dispatch(forceEmotionUpdate());
    }
  }, [dispatch, dominantEmotion, emotionLoading]);

  // Check database connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { testDatabaseConnection } = await import('@/lib/supabase');
        const result = await testDatabaseConnection();
        
        if (result.success) {
          setConnectionStatus('connected');
          console.log(`✅ Database connected with ${result.count} articles`);
        } else {
          setConnectionStatus('error');
          console.error('❌ Database connection failed:', result.error);
        }
      } catch (error) {
        setConnectionStatus('error');
        console.error('❌ Connection check failed:', error);
      }
    };

    checkConnection();
  }, []);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleGlobeClick = () => {
    setIsTransitioning(true);
    // Allow time for black hole animation to complete
    setTimeout(() => {
      router.push('/octants');
    }, 1200);
  };

  const emotionTheme = getEmotionTheme(currentEmotion);

  const features = [
    {
      icon: Brain,
      title: 'Emotional Intelligence',
      description: 'Advanced AI analyzes news sentiment and emotional patterns in real-time',
      href: '/octants'
    },
    {
      icon: Globe,
      title: '3D Visualization',
      description: 'Explore news through interactive 3D octant spaces and particle systems',
      href: '/octants'
    },
    {
      icon: TrendingUp,
      title: 'Trending Analysis',
      description: 'Discover the most emotionally intense stories from around the world',
      href: '/trending'
    },
    {
      icon: MessageCircle,
      title: 'AI Assistant',
      description: 'Chat with our emotional news assistant for personalized insights',
      href: '/chat'
    },
    {
      icon: Clock,
      title: 'Timeline View',
      description: 'Journey through the year\'s emotional landscape of global news',
      href: '/timeline'
    },
    {
      icon: BarChart3,
      title: 'Data Analytics',
      description: 'Deep dive into emotional patterns and statistical breakdowns',
      href: '/trending'
    }
  ];

  // Calculate total articles in octants
  const totalOctantArticles = Object.values(octantEmotionDistribution).reduce((sum, count) => sum + count, 0);

  return (
    <PageLoader 
      type="general" 
      emotion={currentEmotion} 
      message="Connecting to live database and initializing platform"
      minLoadTime={3000}
    >
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <Navigation />
        
        {/* Enhanced Cosmic Background with Starfield, Stardust, and Nebulae */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          {/* Main Starfield */}
          <div className="starfield-container">
            {Array.from({ length: 300 }).map((_, i) => (
              <div
                key={i}
                className="star"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 4}s`
                }}
              />
            ))}
          </div>

          {/* Stardust Particles */}
          <div className="stardust-container">
            {Array.from({ length: 150 }).map((_, i) => (
              <div
                key={i}
                className="stardust"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${8 + Math.random() * 12}s`
                }}
              />
            ))}
          </div>

          {/* Nebula Clouds */}
          <div className="nebula-container">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="nebula"
                style={{
                  left: `${Math.random() * 120 - 10}%`,
                  top: `${Math.random() * 120 - 10}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${20 + Math.random() * 30}s`,
                  '--nebula-color': i % 2 === 0 ? emotionTheme.color : 
                    i % 3 === 0 ? '#4A90E2' : 
                    i % 4 === 0 ? '#9B59B6' : '#E74C3C'
                } as React.CSSProperties}
              />
            ))}
          </div>

          {/* Cosmic Dust Trails */}
          <div className="cosmic-dust-container">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="cosmic-dust"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 15}s`,
                  animationDuration: `${25 + Math.random() * 20}s`,
                  '--dust-color': emotionTheme.particleColor
                } as React.CSSProperties}
              />
            ))}
          </div>

          {/* Distant Galaxies */}
          <div className="galaxy-container">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="galaxy"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 20}s`,
                  animationDuration: `${40 + Math.random() * 40}s`
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="relative z-10 pt-16">
          {/* Database Connection Status */}
          <div className="fixed top-20 right-6 z-50">
            <Card className="glass-card border-white/20 backdrop-blur-md">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  {connectionStatus === 'checking' && (
                    <>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                      <span className="text-xs text-white/70">Connecting...</span>
                    </>
                  )}
                  {connectionStatus === 'connected' && (
                    <></>
                      <span className="text-xs text-green-400">Live Database</span>
                    </>
                  )}
                  {connectionStatus === 'error' && (
                    <>
                      <div className="w-2 h-2 bg-red-400 rounded-full" />
                      <span className="text-xs text-red-400">Connection Error</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hero Section - Mobile Responsive */}
          <section className="min-h-screen relative overflow-hidden">
            {/* Mobile-First Hero Layout */}
            <div className="flex flex-col min-h-screen relative z-20">
              
              {/* Mobile: Globe First (Top) */}
              <div className="w-full h-64 sm:h-80 md:h-96 lg:h-screen lg:w-1/2 lg:absolute lg:right-0 lg:top-0 relative flex-shrink-0">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl max-h-xs sm:max-h-sm md:max-h-md lg:max-h-2xl">
                    <ThreeGlobe onGlobeClick={handleGlobeClick} />
                  </div>
                </div>
                
                {/* Globe interaction hint - Mobile positioned */}
                <div className="absolute bottom-2 sm:bottom-4 lg:bottom-20 left-1/2 transform -translate-x-1/2 glass-card animate-bounce z-30">
                  <div className="px-3 py-2 lg:px-6 lg:py-3 text-xs sm:text-sm lg:text-sm text-white/80 flex items-center">
                    <Orbit className="h-3 w-3 sm:h-4 sm:w-4 lg:h-4 lg:w-4 mr-1 sm:mr-2 lg:mr-2" />
                    <span className="hidden sm:inline">Click the Earth to explore octants</span>
                    <span className="sm:hidden">Tap to explore</span>
                  </div>
                </div>
              </div>

              {/* Mobile: Content Second (Bottom) */}
              <div className="flex-1 lg:w-1/2 px-4 sm:px-6 lg:px-16 py-8 lg:py-0 lg:flex lg:items-center relative z-30">
                {/* Main Hero Content */}
                <div className="w-full text-center lg:text-left">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 lg:mb-8 text-glow bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-white animate-breathe">
                    Symbione
                  </h1>
                  
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-white/90 mb-4 sm:mb-6 lg:mb-8 font-light">
                    Emotionally Intelligent News Platform
                  </p>
                  
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/70 mb-6 sm:mb-8 lg:mb-12 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                    Experience news through the lens of emotion. Our AI-powered platform analyzes global news sentiment, 
                    revealing the emotional landscape of world events through stunning 3D visualizations.
                  </p>

                  {/* Current Emotion Display - Mobile Optimized with Live Database Status */}
                  <Card className="max-w-lg mx-auto lg:mx-0 glass-card border-white/30 hover-glow animate-float mb-6 sm:mb-8 lg:mb-12 backdrop-blur-md">
                    <CardContent className="p-4 sm:p-6 lg:p-8">
                      <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                        <div 
                          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full animate-pulse shadow-lg"
                          style={{ 
                            backgroundColor: emotionTheme.color,
                            boxShadow: `0 0 20px ${emotionTheme.color}60`
                          }}
                        />
                        <span className="text-white/80 font-medium text-xs sm:text-sm lg:text-base">
                          {emotionLoading ? 'Analyzing...' : 'Live Database Emotion'}
                        </span>
                        {connectionStatus === 'connected' && (
                          <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                        )}
                      </div>
                      <Badge 
                        variant="outline" 
                        className="glass-button border-white/40 text-white text-sm sm:text-lg lg:text-xl px-4 sm:px-6 lg:px-8 py-2 lg:py-3 animate-pulse-glow font-semibold"
                        style={{ 
                          borderColor: emotionTheme.color + '60',
                          boxShadow: `0 0 30px ${emotionTheme.color}30`
                        }}
                      >
                        {emotionTheme.name}
                      </Badge>
                      <p className="text-xs sm:text-xs lg:text-sm text-white/60 mt-3 sm:mt-4 font-medium">
                        {emotionLoading ? (
                          'Fetching live emotion data from database...'
                        ) : (
                          totalOctantArticles > 0 
                            ? `Based on ${totalOctantArticles} articles from live database`
                            : connectionStatus === 'connected' 
                              ? 'Live analysis of global news sentiment from database'
                              : 'Connecting to live database...'
                        )}
                      </p>
                    </CardContent>
                  </Card>

                  {/* CTA Buttons - Mobile Stacked */}
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-8">
                    <Button 
                      size="lg" 
                      onClick={() => router.push('/octants')}
                      className="glass-button bg-white/15 border-white/30 hover:bg-white/25 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 text-base sm:text-lg lg:text-xl premium-hover btn-shimmer backdrop-blur-md w-full sm:w-auto"
                    >
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-2 lg:mr-3" />
                        <span className="hidden sm:inline">Explore 3D Visualization</span>
                        <span className="sm:hidden">Explore 3D</span>
                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ml-2 lg:ml-3" />
                      </span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => router.push('/trending')}
                      className="glass-button border-white/40 text-white hover:bg-white/15 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 text-base sm:text-lg lg:text-xl premium-hover backdrop-blur-md w-full sm:w-auto"
                    >
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-2 lg:mr-3" />
                      <span className="hidden sm:inline">View Trending News</span>
                      <span className="sm:hidden">Trending</span>
                    </Button>
                  </div>

                  {/* Mobile Scroll Indicator */}
                  <div className="lg:hidden mt-8 flex justify-center">
                    <div className="animate-bounce">
                      <ChevronDown className="h-6 w-6 text-white/60" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transition overlay */}
            {isTransitioning && (
              <div className="absolute inset-0 flex items-center justify-center glass z-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white/50 mx-auto mb-4"></div>
                  <p className="text-xl text-white/70">Entering the Emotional Octant...</p>
                </div>
              </div>
            )}
          </section>

          {/* Features Section - Mobile Grid */}
          <section className="py-12 sm:py-16 lg:py-32 px-4 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/80"></div>
            
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="text-center mb-8 sm:mb-12 lg:mb-20">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 lg:mb-8 text-glow">
                  Powerful Features
                </h2>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed">
                  Discover how Symbione transforms the way you understand and interact with global news
                </p>
              </div>

              {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {features.map((feature, index) => (
                  <Card 
                    key={index} 
                    className="glass-card border-white/20 hover-glow premium-hover cursor-pointer group backdrop-blur-md"
                    onClick={() => router.push(feature.href)}
                  >
                    <CardContent className="p-4 sm:p-6 lg:p-10">
                      <div className="flex items-center mb-3 sm:mb-4 lg:mb-6">
                        <div className="p-2 sm:p-3 lg:p-4 rounded-xl glass-button mr-2 sm:mr-3 lg:mr-4 group-hover:scale-110 transition-transform">
                          <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
                        </div>
                        <h3 className="text-base sm:text-lg lg:text-2xl font-semibold text-white group-hover:text-glow transition-all">
                          {feature.title}
                        </h3>
                      </div>
                      <p className="text-white/80 leading-relaxed text-xs sm:text-sm lg:text-lg">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Emotion Spectrum Preview - Mobile Responsive */}
          <section className="py-12 sm:py-16 lg:py-32 px-4 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80"></div>
            
            <div className="max-w-6xl mx-auto relative z-10">
              <div className="text-center mb-8 sm:mb-12 lg:mb-20">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 lg:mb-8 text-glow">
                  Emotion Spectrum
                </h2>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/80">
                  Eight core emotions that shape our understanding of global news
                </p>
              </div>

              {/* Mobile: 2 columns, Tablet: 4 columns, Desktop: 4 columns */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
                {Object.entries(EMOTIONS).map(([key, emotion], index) => (
                  <Card 
                    key={key} 
                    className="glass-card border-white/20 hover-glow premium-hover group cursor-pointer backdrop-blur-md"
                    onClick={() => router.push('/octants')}
                  >
                    <CardContent className="p-3 sm:p-4 lg:p-8 text-center">
                      <div 
                        className="w-8 h-8 sm:w-12 sm:h-12 lg:w-20 lg:h-20 rounded-full mx-auto mb-2 sm:mb-4 lg:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl"
                        style={{ 
                          backgroundColor: emotion.color,
                          boxShadow: `0 0 40px ${emotion.color}50, inset 0 4px 8px rgba(255,255,255,0.2)`
                        }}
                      >
                        <div className="w-3 h-3 sm:w-6 sm:h-6 lg:w-10 lg:h-10 rounded-full bg-white/30 animate-pulse" />
                      </div>
                      <h3 className="text-xs sm:text-sm lg:text-xl font-semibold text-white mb-1 sm:mb-2 lg:mb-3 group-hover:text-glow transition-all">
                        {emotion.name}
                      </h3>
                      <div className="text-xs sm:text-xs lg:text-sm text-white/60 uppercase tracking-wider font-medium">
                        {emotion.motionType}
                      </div>
                      {/* Show count if available */}
                      {octantEmotionDistribution[key as EmotionType] > 0 && (
                        <div className="text-xs text-white/40 mt-1 sm:mt-2">
                          {octantEmotionDistribution[key as EmotionType]} articles
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Footer CTA - Mobile Responsive */}
          <section className="py-12 sm:py-16 lg:py-32 px-4 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black"></div>
            
            <div className="max-w-4xl mx-auto text-center relative z-10">
              <Card className="glass-card border-white/30 hover-glow animate-breathe backdrop-blur-md">
                <CardContent className="p-6 sm:p-8 lg:p-16">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 lg:mb-8 text-glow">
                    Ready to Explore?
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/80 mb-6 sm:mb-8 lg:mb-12 leading-relaxed">
                    Dive into the emotional dimension of global news and discover patterns you never knew existed.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => router.push('/octants')}
                    className="glass-button bg-white/15 border-white/30 hover:bg-white/25 text-white px-6 sm:px-8 lg:px-16 py-3 sm:py-4 lg:py-6 text-base sm:text-lg lg:text-xl premium-hover btn-shimmer backdrop-blur-md w-full sm:w-auto"
                  >
                    <span className="flex items-center">
                      <Brain className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 mr-2 sm:mr-3 lg:mr-4" />
                      Start Your Journey
                      <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 ml-2 sm:ml-3 lg:ml-4" />
                    </span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Footer - Mobile Responsive */}
          <footer className="py-6 sm:py-8 lg:py-16 px-4 border-t border-white/20 relative">
            <div className="absolute inset-0 bg-black/90"></div>
            <div className="max-w-6xl mx-auto text-center relative z-10">
              <p className="text-white/60 text-xs sm:text-sm lg:text-lg mb-1 sm:mb-2 lg:mb-3">
                Powered by emotional intelligence • Real-time news analysis • Interactive 3D visualization
              </p>
              <p className="text-white/40 text-xs sm:text-xs lg:text-sm">
                © 2024 Symbione. Transforming how we understand global news through emotion.
              </p>
            </div>
          </footer>
        </div>

        {/* Enhanced Cosmic CSS with Stardust and Nebulae */}
        <style jsx>{`
          .starfield-container {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          .star {
            position: absolute;
            width: 2px;
            height: 2px;
            background: white;
            border-radius: 50%;
            animation: twinkle linear infinite;
          }

          .star:nth-child(2n) {
            width: 1px;
            height: 1px;
            background: rgba(255, 255, 255, 0.8);
          }

          .star:nth-child(3n) {
            width: 3px;
            height: 3px;
            background: rgba(255, 255, 255, 0.9);
          }

          .star:nth-child(4n) {
            background: rgba(173, 216, 230, 0.8);
          }

          .star:nth-child(5n) {
            background: rgba(255, 182, 193, 0.8);
          }

          .star:nth-child(6n) {
            background: rgba(255, 255, 224, 0.9);
          }

          @keyframes twinkle {
            0%, 100% {
              opacity: 0.3;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.2);
            }
          }

          /* Stardust Particles */
          .stardust-container {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          .stardust {
            position: absolute;
            width: 1px;
            height: 1px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            animation: stardustFloat linear infinite;
          }

          .stardust:nth-child(2n) {
            background: rgba(135, 206, 235, 0.5);
            animation-duration: 12s;
          }

          .stardust:nth-child(3n) {
            background: rgba(255, 192, 203, 0.4);
            animation-duration: 15s;
          }

          .stardust:nth-child(4n) {
            background: rgba(255, 215, 0, 0.3);
            animation-duration: 18s;
          }

          @keyframes stardustFloat {
            0% {
              transform: translateY(100vh) translateX(0) scale(0);
              opacity: 0;
            }
            10% {
              opacity: 1;
              transform: scale(1);
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(-10vh) translateX(50px) scale(0);
              opacity: 0;
            }
          }

          /* Nebula Clouds */
          .nebula-container {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          .nebula {
            position: absolute;
            width: 300px;
            height: 200px;
            border-radius: 50%;
            background: radial-gradient(
              ellipse at center,
              var(--nebula-color, #4A90E2) 0%,
              rgba(74, 144, 226, 0.3) 30%,
              rgba(74, 144, 226, 0.1) 60%,
              transparent 100%
            );
            filter: blur(40px);
            animation: nebulaFlow linear infinite;
            opacity: 0.4;
          }

          .nebula:nth-child(2n) {
            width: 400px;
            height: 250px;
            filter: blur(60px);
            opacity: 0.3;
          }

          .nebula:nth-child(3n) {
            width: 200px;
            height: 150px;
            filter: blur(30px);
            opacity: 0.5;
          }

          @keyframes nebulaFlow {
            0% {
              transform: translateX(-50px) translateY(0) rotate(0deg) scale(0.8);
              opacity: 0.2;
            }
            25% {
              opacity: 0.6;
              transform: scale(1.1);
            }
            50% {
              transform: translateX(25px) translateY(-20px) rotate(180deg) scale(1);
              opacity: 0.4;
            }
            75% {
              opacity: 0.7;
              transform: scale(0.9);
            }
            100% {
              transform: translateX(50px) translateY(0) rotate(360deg) scale(0.8);
              opacity: 0.2;
            }
          }

          /* Cosmic Dust Trails */
          .cosmic-dust-container {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          .cosmic-dust {
            position: absolute;
            width: 2px;
            height: 80px;
            background: linear-gradient(
              to bottom,
              transparent 0%,
              var(--dust-color, #FFD700) 50%,
              transparent 100%
            );
            border-radius: 50%;
            animation: cosmicDustTrail linear infinite;
            opacity: 0.3;
          }

          .cosmic-dust:nth-child(2n) {
            height: 120px;
            width: 1px;
            opacity: 0.2;
          }

          .cosmic-dust:nth-child(3n) {
            height: 60px;
            width: 3px;
            opacity: 0.4;
          }

          @keyframes cosmicDustTrail {
            0% {
              transform: translateY(-100px) translateX(0) rotate(45deg);
              opacity: 0;
            }
            10% {
              opacity: 0.6;
            }
            90% {
              opacity: 0.3;
            }
            100% {
              transform: translateY(calc(100vh + 100px)) translateX(200px) rotate(45deg);
              opacity: 0;
            }
          }

          /* Distant Galaxies */
          .galaxy-container {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          .galaxy {
            position: absolute;
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: radial-gradient(
              ellipse at center,
              rgba(255, 255, 255, 0.1) 0%,
              rgba(135, 206, 235, 0.05) 30%,
              rgba(255, 192, 203, 0.03) 60%,
              transparent 100%
            );
            filter: blur(20px);
            animation: galaxyRotate linear infinite;
            opacity: 0.2;
          }

          .galaxy:nth-child(2n) {
            width: 100px;
            height: 100px;
            opacity: 0.15;
          }

          .galaxy:nth-child(3n) {
            width: 200px;
            height: 200px;
            opacity: 0.1;
          }

          @keyframes galaxyRotate {
            0% {
              transform: rotate(0deg) scale(0.8);
              opacity: 0.1;
            }
            50% {
              transform: rotate(180deg) scale(1.2);
              opacity: 0.3;
            }
            100% {
              transform: rotate(360deg) scale(0.8);
              opacity: 0.1;
            }
          }

          /* Enhanced cosmic atmosphere */
          .starfield-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(
              ellipse at 20% 30%,
              rgba(74, 144, 226, 0.1) 0%,
              transparent 50%
            ),
            radial-gradient(
              ellipse at 80% 70%,
              rgba(155, 89, 182, 0.08) 0%,
              transparent 50%
            ),
            radial-gradient(
              ellipse at 50% 50%,
              rgba(231, 76, 60, 0.05) 0%,
              transparent 50%
            );
            pointer-events: none;
          }
        `}</style>
      </div>
    </PageLoader>
  );
}