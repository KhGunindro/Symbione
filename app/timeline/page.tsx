'use client';

import { useState } from 'react';
import Navigation from '@/components/ui/navigation';
import PageLoader from '@/components/ui/page-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EMOTIONS, EmotionType, getEmotionTheme, getDominantEmotion } from '@/lib/emotions';
import { Clock, Calendar, Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface TimelineData {
  date: string;
  dominantEmotion: EmotionType;
  intensity: number;
  anchorStory: {
    headline: string;
    source: string;
    summary: string;
  };
  emotionBreakdown: Record<EmotionType, number>;
}

// Mock timeline data for the year
const generateTimelineData = (): TimelineData[] => {
  const data: TimelineData[] = [];
  const emotions = Object.keys(EMOTIONS) as EmotionType[];
  
  for (let i = 0; i < 365; i++) {
    const date = new Date(2024, 0, i + 1);
    const dominantEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    const emotionBreakdown: Record<EmotionType, number> = {} as Record<EmotionType, number>;
    emotions.forEach(emotion => {
      emotionBreakdown[emotion] = Math.random() * 0.3 + (emotion === dominantEmotion ? 0.4 : 0);
    });
    
    data.push({
      date: date.toISOString().split('T')[0],
      dominantEmotion,
      intensity: Math.random() * 0.5 + 0.5,
      anchorStory: {
        headline: `Major ${dominantEmotion} event on ${date.toLocaleDateString()}`,
        source: ['BBC', 'Reuters', 'CNN', 'AP'][Math.floor(Math.random() * 4)],
        summary: `This was a significant story that shaped the emotional landscape on this date, primarily characterized by ${dominantEmotion}.`
      },
      emotionBreakdown
    });
  }
  
  return data;
};

export default function TimelinePage() {
  const [timelineData] = useState<TimelineData[]>(generateTimelineData());
  const [currentDay, setCurrentDay] = useState([100]); // Start at day 100
  const [isPlaying, setIsPlaying] = useState(false);
  const currentEmotion = getDominantEmotion();

  const currentData = timelineData[currentDay[0]];
  const emotionTheme = getEmotionTheme(currentData.dominantEmotion);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In a real implementation, you'd set up an interval to auto-advance
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <PageLoader 
      type="timeline" 
      emotion={currentEmotion}
      message="Building emotional timeline"
      minLoadTime={3800}
    >
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        
        <div className="pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <Clock className="h-8 w-8 mr-3 text-blue-400" />
                Emotional Timeline 2024
              </h1>
              <p className="text-gray-400">
                Journey through the year's emotional landscape of global news
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Timeline Control */}
              <div className="lg:col-span-2">
                <Card className="bg-gray-900 border-gray-700 mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-blue-400" />
                      {formatDate(currentData.date)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Timeline Slider */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>January 1, 2024</span>
                          <span>December 31, 2024</span>
                        </div>
                        <Slider
                          value={currentDay}
                          onValueChange={setCurrentDay}
                          max={364}
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
                        >
                          <SkipBack className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePlayPause}
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentDay([Math.min(364, currentDay[0] + 7)])}
                        >
                          <SkipForward className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Anchor Story */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Anchor Story</span>
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
                      <h3 className="text-lg font-semibold">{currentData.anchorStory.headline}</h3>
                      <div className="text-sm text-gray-400">
                        Source: {currentData.anchorStory.source}
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
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Emotion Breakdown */}
              <div>
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle>Daily Emotion Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(currentData.emotionBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .map(([emotion, value]) => {
                          const theme = getEmotionTheme(emotion as EmotionType);
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
                                    width: `${value * 100}%`,
                                    backgroundColor: theme.color
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-400 w-8 text-right">
                                {Math.round(value * 100)}%
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="bg-gray-900 border-gray-700 mt-6">
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Day of year:</span>
                        <span>{currentDay[0] + 1}/365</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Dominant emotion:</span>
                        <span className={emotionTheme.textColor}>{emotionTheme.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Emotional volatility:</span>
                        <span>{Math.round(currentData.intensity * 100)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLoader>
  );
}