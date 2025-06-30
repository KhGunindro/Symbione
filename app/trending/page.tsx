'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/ui/navigation';
import PageLoader from '@/components/ui/page-loader';
import { NotificationContainer, showNotification } from '@/components/ui/notification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EMOTIONS, EmotionType, getEmotionTheme } from '@/lib/emotions';
import { ProcessedNewsArticle } from '@/lib/news-data';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { fetchTrendingNews } from '@/lib/store/slices/newsSlice';
import { supabase } from '@/lib/supabase';
import { musicManager } from '@/lib/music';
import { TrendingUp, Clock, Globe, ExternalLink, Edit as Reddit, Database, Zap, Bookmark } from 'lucide-react';

export default function TrendingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { trendingArticles, isLoading } = useAppSelector(state => state.news);
  const { dominantEmotion } = useAppSelector(state => state.emotion);
  
  const [bookmarkingStates, setBookmarkingStates] = useState<Record<string, boolean>>({});

  // Play emotion-based music when page loads
  useEffect(() => {
    musicManager.playEmotionMusic(dominantEmotion);
  }, [dominantEmotion]);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth check error:', error);
          router.push('/login');
          return;
        }

        if (!session) {
          router.push('/login');
          return;
        }

        setUser(session.user);
        setLoadingAuth(false);
      } catch (error) {
        console.error('Unexpected auth error:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // Load trending articles on component mount - fetch 20 most recent
  useEffect(() => {
    if (!loadingAuth && trendingArticles.length === 0) {
      dispatch(fetchTrendingNews(20));
    }
  }, [dispatch, trendingArticles.length, loadingAuth]);

  // Add bookmark function with notification
  const addBookmark = async (article: ProcessedNewsArticle) => {
    if (!user) {
      console.error('User not authenticated');
      showNotification('Please sign in to bookmark articles', 'error');
      return;
    }

    // Set loading state for this specific article
    setBookmarkingStates(prev => ({ ...prev, [article.id]: true }));

    try {
      const bookmarkData = {
        user_id: user.id,
        news_id: article.id,
        title: article.headline,
        subreddit: article.subreddit,
        emotion: article.emotion,
        emotion_intensity: Math.round(article.intensity * 100), // Convert to integer percentage
        source_url: article.url
      };

      const { data, error } = await supabase
        .from('cosmark_bookmarks')
        .insert([bookmarkData]);

      if (error) {
        console.error('Error adding bookmark:', error);
        showNotification('Failed to add bookmark', 'error');
      } else {
        console.log('Bookmark added successfully:', data);
        showNotification('Added to Cosmark!', 'success');
      }
    } catch (error) {
      console.error('Unexpected error adding bookmark:', error);
      showNotification('An unexpected error occurred', 'error');
    } finally {
      // Remove loading state
      setBookmarkingStates(prev => ({ ...prev, [article.id]: false }));
    }
  };

  // Fixed formatTimeAgo function to handle string timestamps
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Unknown time';
    }
    
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  // Show loading screen while checking auth
  if (loadingAuth) {
    return (
      <PageLoader 
        type="trending" 
        emotion={dominantEmotion}
        message="Verifying access permissions"
        minLoadTime={1500}
      >
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white/50 mx-auto mb-6"></div>
            <div className="text-white text-xl font-semibold">Checking Authentication</div>
            <div className="text-white/60 text-sm mt-3">
              Verifying your access to trending news data...
            </div>
          </div>
        </div>
      </PageLoader>
    );
  }

  return (
    <PageLoader 
      type="trending" 
      emotion={dominantEmotion}
      message="Loading trending news from database"
      minLoadTime={3200}
    >
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <NotificationContainer />
        
        <div className="mt-16 pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Premium Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <TrendingUp className="h-8 w-8 mr-3 text-blue-400" />
                Most Recent News
              </h1>
              <p className="text-gray-400 text-lg">
                Discover the latest 20 stories from worldnews and politics communities
              </p>
              <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Reddit className="h-4 w-4 text-orange-500" />
                  <span>Live News Data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-green-400" />
                  <span>Real-time Updates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span>AI Classified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>{trendingArticles.length} Articles</span>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/50 mx-auto mb-4"></div>
                  <p className="text-lg text-white/70">Loading recent articles from database...</p>
                </div>
              </div>
            )}

            {/* Premium Articles Grid */}
            {!isLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {trendingArticles.map((article) => {
                  const emotionTheme = getEmotionTheme(article.emotion);
                  const isBookmarking = bookmarkingStates[article.id] || false;
                  
                  return (
                    <Card key={article.id} className="glass-card border-white/20 hover-glow premium-hover group">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-white mb-2 group-hover:text-blue-200 transition-colors leading-tight">
                              {article.headline}
                            </CardTitle>
                            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-3">
                              <Reddit className="h-4 w-4 text-orange-500" />
                              <span>r/{article.subreddit}</span>
                              <span>•</span>
                              <Clock className="h-4 w-4" />
                              <span>{formatTimeAgo(article.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge 
                              variant="outline" 
                              className="glass-button border-white/30 text-white px-3 py-1"
                              style={{ 
                                borderColor: emotionTheme.color + '60',
                                backgroundColor: emotionTheme.color + '20'
                              }}
                            >
                              <div 
                                className="w-2 h-2 rounded-full mr-2"
                                style={{ backgroundColor: emotionTheme.color }}
                              />
                              {emotionTheme.name}
                            </Badge>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-400">Intensity:</span>
                              <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full transition-all duration-300 rounded-full"
                                  style={{ 
                                    width: `${article.intensity * 100}%`,
                                    backgroundColor: emotionTheme.color,
                                    boxShadow: `0 0 10px ${emotionTheme.color}40`
                                  }}
                                />
                              </div>
                              <span className="text-sm text-gray-400 font-mono">{Math.round(article.intensity * 100)}%</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => addBookmark(article)}
                              disabled={isBookmarking}
                              className="glass-button border-white/30 text-white hover:bg-white/20 transition-all duration-300"
                            >
                              {isBookmarking ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/50 mr-2" />
                              ) : (
                                <Bookmark className="h-4 w-4 mr-2" />
                              )}
                              Cosmark
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild 
                              className="glass-button border-white/30 text-white hover:bg-white/20 transition-all duration-300"
                            >
                              <a href={article.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Read
                              </a>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* No Results State */}
            {!isLoading && trendingArticles.length === 0 && (
              <div className="text-center py-12">
                <div className="mb-4">
                  <Globe className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">No recent articles found.</p>
                  <p className="text-gray-500 text-sm">Check back later for the latest news updates.</p>
                </div>
              </div>
            )}

            {/* Premium Stats Footer */}
            {!isLoading && trendingArticles.length > 0 && (
              <div className="mt-12 p-6 glass-card border-white/20 hover-glow">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{trendingArticles.length}</div>
                    <div className="text-sm text-gray-400">Recent Articles</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {Math.round(trendingArticles.reduce((sum, article) => sum + article.intensity, 0) / trendingArticles.length * 100)}%
                    </div>
                    <div className="text-sm text-gray-400">Avg Intensity</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">
                      {new Set(trendingArticles.map(a => a.emotion)).size}
                    </div>
                    <div className="text-sm text-gray-400">Emotions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-400">
                      {new Set(trendingArticles.map(a => a.subreddit)).size}
                    </div>
                    <div className="text-sm text-gray-400">Subreddits</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLoader>
  );
}