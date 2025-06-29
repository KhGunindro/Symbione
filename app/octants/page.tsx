'use client';

import { useState, useEffect } from 'react';
import OctantVisualization from '@/components/three/OctantVisualization';
import NewsModal from '@/components/ui/news-modal';
import Navigation from '@/components/ui/navigation';
import PageLoader from '@/components/ui/page-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EMOTIONS, EmotionType, getEmotionTheme } from '@/lib/emotions';
import { ProcessedNewsArticle } from '@/lib/news-data';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { fetchOctantNews, fetchHistoricalOctantNews } from '@/lib/store/slices/newsSlice';
import { Brain, Filter, Sparkles, Zap, Eye, MousePointer, Calendar, Clock, TrendingUp, BarChart3, ChevronLeft, ChevronRight, Atom, Layers, Hexagon, Database, Cpu } from 'lucide-react';

type OctantView = 'today' | 'yearly';

export default function OctantsPage() {
  const dispatch = useAppDispatch();
  const [selectedArticle, setSelectedArticle] = useState<ProcessedNewsArticle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<OctantView>('today');
  const [distributionCarouselIndex, setDistributionCarouselIndex] = useState(0);
  
  // Get state from store
  const { dominantEmotion, octantEmotionDistribution } = useAppSelector(state => state.emotion);
  const { octantArticles, historicalOctantArticles, isLoading } = useAppSelector(state => state.news);

  const emotions = Object.entries(EMOTIONS);

  // For distribution carousel - show 4 emotions at a time
  const distributionEmotionsPerPage = 4;
  const distributionTotalPages = Math.ceil(emotions.length / distributionEmotionsPerPage);

  // Get current articles based on view type
  const currentArticles = currentView === 'yearly' ? historicalOctantArticles : octantArticles;

  // Load articles on mount and when view changes
  useEffect(() => {
    if (currentView === 'today' && octantArticles.length === 0 && !isLoading) {
      dispatch(fetchOctantNews(1000));
    } else if (currentView === 'yearly' && historicalOctantArticles.length === 0 && !isLoading) {
      dispatch(fetchHistoricalOctantNews());
    }
  }, [dispatch, currentView, octantArticles.length, historicalOctantArticles.length, isLoading]);

  const handleParticleClick = (article: ProcessedNewsArticle) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedArticle(null);
  };

  const handleViewChange = (view: OctantView) => {
    setCurrentView(view);
  };

  // Distribution carousel functions
  const nextDistributionPage = () => {
    setDistributionCarouselIndex((prev) => (prev + 1) % distributionTotalPages);
  };

  const prevDistributionPage = () => {
    setDistributionCarouselIndex((prev) => (prev - 1 + distributionTotalPages) % distributionTotalPages);
  };

  const getCurrentDistributionEmotions = () => {
    const startIndex = distributionCarouselIndex * distributionEmotionsPerPage;
    return emotions.slice(startIndex, startIndex + distributionEmotionsPerPage);
  };

  const emotionTheme = getEmotionTheme(dominantEmotion);
  const totalArticles = Object.values(octantEmotionDistribution).reduce((sum, count) => sum + count, 0);

  return (
    <PageLoader 
      type="octant" 
      emotion={dominantEmotion}
      message="Loading premium octant visualization"
      minLoadTime={3500}
    >
      <div className="min-h-screen mt-16 bg-transparent text-white relative overflow-hidden">
        {/* Enhanced Cosmic Background - Same as Hero */}
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

        <Navigation />
        
        <div className="pt-16 h-screen flex relative z-10">
          {/* Enhanced Premium Sidebar */}
          <div className="w-96 glass-card border-r border-white/10 p-6 overflow-y-auto backdrop-blur-xl bg-gradient-to-b from-white/8 to-white/3">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="relative">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-bold ml-3 text-glow">Premium Octant Space</h2>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                Explore real news data with hourly updates and AI emotion classification in 3D space.
              </p>
              
              {/* Status Indicators */}
              <div className="mt-4 flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-2">
                  <Database className="h-3 w-3 text-green-400" />
                  <span className="text-green-400">Live Data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Cpu className="h-3 w-3 text-blue-400" />
                  <span className="text-blue-400">Real-time</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white/60">{currentArticles.length} Articles</span>
                </div>
              </div>
            </div>

            {/* View Toggle Buttons */}
            <Card className="mb-8 glass-card border-white/20 hover-glow">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm flex items-center text-white/90">
                  <BarChart3 className="h-4 w-4 mr-2 text-white" />
                  Data Source Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={currentView === 'today' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleViewChange('today')}
                    className={`glass-button premium-hover transition-all duration-300 ${
                      currentView === 'today' 
                        ? 'bg-blue-500/20 border-blue-400/50 text-blue-200 shadow-lg shadow-blue-500/20' 
                        : 'border-white/20 text-white/70 hover:border-blue-400/30 hover:text-blue-200'
                    }`}
                  >
                    <Clock className="h-4 w-4 mr-2 text-white" />
                    Recent
                  </Button>
                  <Button
                    variant={currentView === 'yearly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleViewChange('yearly')}
                    className={`glass-button premium-hover transition-all duration-300 ${
                      currentView === 'yearly' 
                        ? 'bg-purple-500/20 border-purple-400/50 text-purple-200 shadow-lg shadow-purple-500/20' 
                        : 'border-white/20 text-white/70 hover:border-purple-400/30 hover:text-purple-200'
                    }`}
                  >
                    <Calendar className="h-4 w-4 mr-2 text-white" />
                    Historical
                  </Button>
                </div>
                
                {/* View Description */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-white/5 to-transparent border border-white/10">
                  <div className="text-xs text-white/70 leading-relaxed">
                    {currentView === 'today' ? (
                      <>
                        <div className="flex items-center mb-1">
                          <TrendingUp className="h-3 w-3 mr-1 text-white" />
                          <strong className="text-blue-200">Recent News Data</strong>
                        </div>
                        Real-time analysis of classified news from worldnews and politics communities.
                      </>
                    ) : (
                      <>
                        <div className="flex items-center mb-1">
                          <BarChart3 className="h-3 w-3 mr-1 text-white" />
                          <strong className="text-purple-200">End-of-Day Snapshots</strong>
                        </div>
                        Top 8 highest intensity articles - updated daily at midnight with each day's peak emotional moment.
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Premium Emotional Distribution Carousel */}
            <Card className="mb-8 glass-card border-white/20 hover-glow">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm flex items-center justify-between text-white/90">
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-white" />
                    Emotional Distribution
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prevDistributionPage}
                      className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Navigation Dots for Distribution */}
                    <div className="flex items-center space-x-2">
                      {Array.from({ length: distributionTotalPages }).map((_, index) => (
                        <div key={index} className="relative">
                          <button
                            onClick={() => setDistributionCarouselIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              index === distributionCarouselIndex 
                                ? 'bg-blue-400 shadow-lg shadow-blue-400/50 scale-150' 
                                : 'bg-white/30 hover:bg-blue-400/60 hover:scale-125'
                            }`}
                          />
                          {index < distributionTotalPages - 1 && (
                            <div className="absolute top-1/2 left-2 w-3 h-px bg-white/20 transform -translate-y-1/2" />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextDistributionPage}
                      className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="transition-all duration-500 ease-in-out space-y-3">
                  {getCurrentDistributionEmotions().map(([key, emotion]) => {
                    const count = octantEmotionDistribution[key as EmotionType] || 0;
                    const percentage = totalArticles > 0 ? ((count / totalArticles) * 100).toFixed(1) : '0.0';
                    
                    return (
                      <div key={key} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full shadow-lg animate-pulse"
                              style={{ 
                                backgroundColor: emotion.color,
                                boxShadow: `0 0 10px ${emotion.color}40`
                              }}
                            />
                            <span className="text-white/90 font-medium capitalize text-sm">
                              {emotion.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-white/70 text-sm font-mono">{count}</span>
                            <span className="text-white/50 text-xs">({percentage}%)</span>
                          </div>
                        </div>
                        
                        {/* Premium progress bar */}
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ 
                              width: `${percentage}%`,
                              background: `linear-gradient(90deg, ${emotion.color}, ${emotion.color}80)`,
                              boxShadow: `0 0 8px ${emotion.color}60`
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Premium footer stats for distribution */}
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-400">{currentArticles.length}</div>
                      <div className="text-xs text-white/60">
                        {currentView === 'yearly' ? 'Daily Peaks' : 'Total Articles'}
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-400">
                        {Object.values(octantEmotionDistribution).filter(count => count > 0).length}
                      </div>
                      <div className="text-xs text-white/60">Active Emotions</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Stats */}
            <div className="mt-6 p-4 rounded-lg glass border-white/10 bg-gradient-to-br from-white/5 to-transparent">
              <div className="text-xs text-white/50 mb-2">
                {currentView === 'yearly' ? 'Historical Statistics' : 'Live Statistics'}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {currentArticles.length}
                  </div>
                  <div className="text-white/60">
                    {currentView === 'yearly' ? 'Peak Articles' : 'Live Articles'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">
                    {currentView === 'yearly' ? 'Daily' : 'Ready'}
                  </div>
                  <div className="text-white/60">
                    {currentView === 'yearly' ? 'Updates' : 'Status'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Visualization */}
          <div className="flex-1 relative">
            <div className="relative z-10 h-full">
              <OctantVisualization 
                onParticleClick={handleParticleClick} 
                viewType={currentView}
                key={currentView} // Force re-render when view changes
              />
            </div>
            
            {/* View Indicator */}
            <div className="absolute top-6 left-6 glass-card z-20">
              <div className="px-4 py-2 flex items-center space-x-2">
                {currentView === 'today' ? (
                  <>
                    <Clock className="h-4 w-4 text-white" />
                    <span className="text-sm text-blue-200 font-medium">Recent Data</span>
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 text-white" />
                    <span className="text-sm text-purple-200 font-medium">Daily Peaks</span>
                  </>
                )}
              </div>
            </div>

            {/* Enhanced Overlay Instructions - MOVED TO BOTTOM RIGHT */}
            <div className="absolute bottom-6 right-6 glass-card max-w-sm animate-float z-20">
              <div className="p-6">
                <div className="flex items-center mb-3">
                  <Sparkles className="h-5 w-5 text-white mr-2" />
                  <h3 className="font-semibold text-white/90">
                    {currentView === 'yearly' ? 'Daily Peak Snapshots' : 'Premium News Data'}
                  </h3>
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-4">
                  {currentView === 'yearly' 
                    ? 'Each particle represents the highest emotional intensity article from each day. These snapshots are updated daily at midnight with the peak emotional moment of that day.'
                    : 'Each particle represents a real news article from worldnews and politics communities with hourly updates. Hover to see emotion colors, click for details.'
                  }
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full animate-pulse bg-green-400"></div>
                  <span className="text-xs text-white/60">
                    {currentView === 'yearly' ? 'Daily snapshots • End-of-day updates' : 'Live updates • Real-time data'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <NewsModal 
          article={selectedArticle}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />

        {/* Enhanced Cosmic CSS - Same as Hero */}
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