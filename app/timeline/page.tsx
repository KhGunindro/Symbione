'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/ui/navigation';
import PageLoader from '@/components/ui/page-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EMOTIONS, EmotionType, getEmotionTheme, getDominantEmotion } from '@/lib/emotions';
import { ProcessedNewsArticle, fetchNewsArticles, getEmotionDistribution } from '@/lib/news-data';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { Clock, Calendar, Play, Pause, SkipBack, SkipForward, TrendingUp, Database, Zap, CalendarDays } from 'lucide-react';

interface TimelineData {
  date: string;
  dominantEmotion: EmotionType;
  intensity: number;
  anchorStory: ProcessedNewsArticle | null;
  emotionBreakdown: Record<EmotionType, number>;
  totalArticles: number;
  isFuture: boolean;
}

export default function TimelinePage() {
  const dispatch = useAppDispatch();
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [currentDay, setCurrentDay] = useState([0]); // Start at day 0 (today)
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playInterval, setPlayInterval] = useState<NodeJS.Timeout | null>(null);
  const currentEmotion = getDominantEmotion();

  // Generate timeline data for the next 30 days
  useEffect(() => {
    const generateFutureTimelineData = async () => {
      setIsLoading(true);
      try {
        console.log('Generating future timeline data for next 30 days...');
        
        const timelineEntries: TimelineData[] = [];
        const today = new Date();
        
        // Generate data for the next 30 days (starting from today)
        for (let i = 0; i < 30; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() + i);
          
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);
          
          const isToday = i === 0;
          const isFuture = i > 0;
          
          try {
            let filteredArticles: ProcessedNewsArticle[] = [];
            
            // Only fetch articles for today, future days will have zero emotions
            if (isToday) {
              console.log('Fetching articles for today...');
              const dayArticles = await fetchNewsArticles({
                limit: 100,
                sortBy: 'timestamp',
                sortOrder: 'desc'
              });
              
              // Filter articles for today only
              filteredArticles = dayArticles.filter(article => {
                const articleDate = new Date(article.timestamp);
                return articleDate >= startOfDay && articleDate <= endOfDay;
              });
            }
            
            // Calculate emotion distribution
            let emotionBreakdown: Record<EmotionType, number>;
            let dominantEmotion: EmotionType = 'joy';
            let anchorStory: ProcessedNewsArticle | null = null;
            let intensity = 0;
            
            if (isFuture) {
              // Future days: all emotions are 0
              emotionBreakdown = {
                joy: 0, trust: 0, fear: 0, surprise: 0,
                sadness: 0, disgust: 0, anger: 0, anticipation: 0
              };
              dominantEmotion = 'joy'; // Default neutral emotion
              intensity = 0;
            } else {
              // Today: calculate from real articles
              emotionBreakdown = getEmotionDistribution(filteredArticles);
              
              // Find dominant emotion
              let maxCount = 0;
              Object.entries(emotionBreakdown).forEach(([emotion, count]) => {
                if (count > maxCount) {
                  maxCount = count;
                  dominantEmotion = emotion as EmotionType;
                }
              });
              
              // Find the highest intensity article as anchor story
              let highestIntensity = 0;
              filteredArticles.forEach(article => {
                if (article.intensity > highestIntensity) {
                  highestIntensity = article.intensity;
                  anchorStory = article;
                }
              });
              
              intensity = highestIntensity;
              
              // If no articles for today, set all emotions to 0
              if (filteredArticles.length === 0) {
                emotionBreakdown = {
                  joy: 0, trust: 0, fear: 0, surprise: 0,
                  sadness: 0, disgust: 0, anger: 0, anticipation: 0
                };
                dominantEmotion = 'joy';
                intensity = 0;
              }
            }
            
            timelineEntries.push({
              date: date.toISOString().split('T')[0],
              dominantEmotion,
              intensity,
              anchorStory,
              emotionBreakdown,
              totalArticles: filteredArticles.length,
              isFuture
            });
            
          } catch (error) {
            console.error(`Error processing data for ${date.toDateString()}:`, error);
            
            // Create fallback data with zero emotions
            const zeroBreakdown: Record<EmotionType, number> = {
              joy: 0, trust: 0, fear: 0, surprise: 0,
              sadness: 0, disgust: 0, anger: 0, anticipation: 0
            };
            
            timelineEntries.push({
              date: date.toISOString().split('T')[0],
              dominantEmotion: 'joy',
              intensity: 0,
              anchorStory: null,
              emotionBreakdown: zeroBreakdown,
              totalArticles: 0,
              isFuture
            });
          }
        }
        
        console.log(`Generated future timeline data for ${timelineEntries.length} days`);
        setTimelineData(timelineEntries);
      } catch (error) {
        console.error('Error generating future timeline data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateFutureTimelineData();
  }, []);

  const currentData = timelineData[currentDay[0]] || {
    date: new Date().toISOString().split('T')[0],
    dominantEmotion: 'joy' as EmotionType,
    intensity: 0,
    anchorStory: null,
    emotionBreakdown: { joy: 0, trust: 0, fear: 0, surprise: 0, sadness: 0, disgust: 0, anger: 0, anticipation: 0 },
    totalArticles: 0,
    isFuture: true
  };

  const emotionTheme = getEmotionTheme(currentData.dominantEmotion);

  const handlePlayPause = () => {
    if (isPlaying) {
      // Stop playing
      if (playInterval) {
        clearInterval(playInterval);
        setPlayInterval(null);
      }
      setIsPlaying(false);
    } else {
      // Start playing
      setIsPlaying(true);
      const interval = setInterval(() => {
        setCurrentDay(prev => {
          const newDay = prev[0] + 1;
          if (newDay >= timelineData.length) {
            // Stop at the end
            setIsPlaying(false);
            if (playInterval) {
              clearInterval(playInterval);
              setPlayInterval(null);
            }
            return [timelineData.length - 1];
          }
          return [newDay];
        });
      }, 1500); // Change day every 1.5 seconds
      setPlayInterval(interval);
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (playInterval) {
        clearInterval(playInterval);
      }
    };
  }, [playInterval]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDateLabel = (dateString: string, index: number) => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays <= 14) return `In ${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) > 1 ? 's' : ''}`;
    return `In ${Math.ceil(diffDays / 7)} weeks`;
  };

  return (
    <PageLoader 
      type="timeline" 
      emotion={currentEmotion}
      message="Building future emotional timeline"
      minLoadTime={3800}
    >
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
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
        
        <div className="relative z-10 pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Premium Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <CalendarDays className="h-8 w-8 mr-3 text-blue-400" />
                Future Emotional Timeline
              </h1>
              <p className="text-gray-400 text-lg">
                Explore the next 30 days - emotions will update automatically as news develops
              </p>
              <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-green-400" />
                  <span>Live Updates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span>Auto-Refresh</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <span>Future Predictions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  <span>30 Days Ahead</span>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white/50 mx-auto mb-6"></div>
                  <div className="text-white text-xl font-semibold">Preparing Future Timeline</div>
                  <div className="text-white/60 text-sm mt-3">
                    Setting up the next 30 days with zero emotions by default...
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timeline Control */}
                <div className="lg:col-span-2">
                  <Card className="glass-card border-white/20 hover-glow mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 mr-2 text-blue-400" />
                          {formatDate(currentData.date)}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline" 
                            className={`glass-button border-white/30 text-white px-3 py-1 ${
                              currentData.isFuture ? 'bg-blue-500/20' : 'bg-green-500/20'
                            }`}
                          >
                            {getDateLabel(currentData.date, currentDay[0])}
                          </Badge>
                          {currentData.isFuture && (
                            <Badge 
                              variant="outline" 
                              className="glass-button border-orange-400/50 text-orange-200 px-2 py-1 text-xs"
                            >
                              Future
                            </Badge>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Timeline Slider */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <span>Today</span>
                            <span>30 days from now</span>
                          </div>
                          <Slider
                            value={currentDay}
                            onValueChange={setCurrentDay}
                            max={timelineData.length - 1}
                            min={0}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        {/* Playback Controls */}
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentDay([Math.max(0, currentDay[0] - 7)])}
                            className="glass-button"
                          >
                            <SkipBack className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePlayPause}
                            className="glass-button"
                          >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentDay([Math.min(timelineData.length - 1, currentDay[0] + 7)])}
                            className="glass-button"
                          >
                            <SkipForward className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Anchor Story */}
                  <Card className="glass-card border-white/20 hover-glow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{currentData.isFuture ? 'Future Story Slot' : 'Today\'s Peak Story'}</span>
                        <Badge 
                          variant="outline" 
                          className={`${emotionTheme.bgColor} ${emotionTheme.textColor} ${emotionTheme.borderColor} bg-opacity-80`}
                        >
                          {emotionTheme.name}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {currentData.anchorStory && !currentData.isFuture ? (
                          <>
                            <h3 className="text-lg font-semibold">{currentData.anchorStory.headline}</h3>
                            <div className="text-sm text-gray-400">
                              Source: r/{currentData.anchorStory.subreddit} • {currentData.anchorStory.source}
                            </div>
                            <p className="text-gray-300">{currentData.anchorStory.summary}</p>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-400">Emotional Intensity:</span>
                              <div className="flex-1 max-w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full bg-gradient-to-r ${emotionTheme.gradient} transition-all duration-300`}
                                  style={{ width: `${currentData.intensity * 100}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-400">{Math.round(currentData.intensity * 100)}%</span>
                            </div>
                            {currentData.anchorStory.url !== '#' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                asChild 
                                className="glass-button mt-3"
                              >
                                <a href={currentData.anchorStory.url} target="_blank" rel="noopener noreferrer">
                                  Read Full Article
                                </a>
                              </Button>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-8">
                            {currentData.isFuture ? (
                              <>
                                <div className="text-blue-400 mb-2 text-lg">📅 Future Day</div>
                                <div className="text-gray-400 mb-2">This day hasn't happened yet</div>
                                <div className="text-sm text-gray-500">
                                  Emotions will automatically update when news develops for this date
                                </div>
                                <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                  <div className="text-xs text-blue-300">
                                    🔄 Auto-updates enabled • All emotions currently at 0
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-gray-400 mb-2">No articles found for today</div>
                                <div className="text-sm text-gray-500">
                                  Check back later as news develops throughout the day
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Emotion Breakdown */}
                <div>
                  <Card className="glass-card border-white/20 hover-glow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Emotion Breakdown</span>
                        {currentData.isFuture && (
                          <Badge variant="outline" className="text-xs bg-blue-500/20 border-blue-400/50 text-blue-200">
                            Zero State
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(currentData.emotionBreakdown)
                          .sort(([, a], [, b]) => b - a)
                          .map(([emotion, value]) => {
                            const theme = getEmotionTheme(emotion as EmotionType);
                            const percentage = currentData.totalArticles > 0 ? ((value / currentData.totalArticles) * 100).toFixed(1) : '0.0';
                            return (
                              <div key={emotion} className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: theme.color }}
                                />
                                <span className="text-sm flex-1">{theme.name}</span>
                                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full transition-all duration-300"
                                    style={{ 
                                      width: `${percentage}%`,
                                      backgroundColor: theme.color
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400 w-8 text-right">
                                  {value}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                      
                      {currentData.isFuture && (
                        <div className="mt-4 p-3 rounded-lg bg-gray-800/50 border border-gray-600/30">
                          <div className="text-xs text-gray-400 text-center">
                            All emotions are currently at 0 for this future date.<br/>
                            Values will update automatically when news develops.
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card className="glass-card border-white/20 hover-glow mt-6">
                    <CardHeader>
                      <CardTitle>Day Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Day:</span>
                          <span>{currentDay[0] + 1}/30</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className={currentData.isFuture ? 'text-blue-400' : 'text-green-400'}>
                            {currentData.isFuture ? 'Future' : 'Current'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Dominant emotion:</span>
                          <span className={currentData.isFuture ? 'text-gray-500' : emotionTheme.textColor}>
                            {currentData.isFuture ? 'None (0)' : emotionTheme.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Peak intensity:</span>
                          <span>{Math.round(currentData.intensity * 100)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Articles:</span>
                          <span>{currentData.totalArticles}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Updates:</span>
                          <span className="text-blue-400">Auto-Enabled</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>

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