'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/ui/navigation';
import PageLoader from '@/components/ui/page-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EMOTIONS, EmotionType, getEmotionTheme } from '@/lib/emotions';
import { ProcessedNewsArticle } from '@/lib/news-data';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { fetchTrendingNews } from '@/lib/store/slices/newsSlice';
import { TrendingUp, Clock, Globe, Filter, Search, ExternalLink, Edit as Reddit, Database, Zap } from 'lucide-react';

export default function TrendingPage() {
  const dispatch = useAppDispatch();
  const { trendingArticles, isLoading } = useAppSelector(state => state.news);
  const { dominantEmotion } = useAppSelector(state => state.emotion);
  
  const [filteredArticles, setFilteredArticles] = useState<ProcessedNewsArticle[]>([]);
  const [emotionFilter, setEmotionFilter] = useState<string>('all');
  const [subredditFilter, setSubredditFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const subreddits = ['worldnews', 'politics'];

  // Load trending articles on component mount
  useEffect(() => {
    if (trendingArticles.length === 0) {
      dispatch(fetchTrendingNews(50));
    }
  }, [dispatch, trendingArticles.length]);

  const applyFilters = () => {
    let filtered = trendingArticles;

    if (emotionFilter !== 'all') {
      filtered = filtered.filter(article => article.emotion === emotionFilter);
    }

    if (subredditFilter !== 'all') {
      filtered = filtered.filter(article => article.subreddit === subredditFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(article => 
        article.headline.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredArticles(filtered);
  };

  const handleFilterChange = (type: string, value: string) => {
    switch (type) {
      case 'emotion':
        setEmotionFilter(value);
        break;
      case 'subreddit':
        setSubredditFilter(value);
        break;
    }
  };

  const handleSearch = () => {
    applyFilters();
  };

  // Apply filters when filter values change
  useEffect(() => {
    applyFilters();
  }, [emotionFilter, subredditFilter, trendingArticles]);

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

  return (
    <PageLoader 
      type="trending" 
      emotion={dominantEmotion}
      message="Loading trending news from database"
      minLoadTime={3200}
    >
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        
        <div className="mt-16 pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Premium Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <TrendingUp className="h-8 w-8 mr-3 text-blue-400" />
                Trending Emotional News
              </h1>
              <p className="text-gray-400 text-lg">
                Discover the most emotionally intense stories from worldnews and politics communities
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
                  <span>{filteredArticles.length} Articles</span>
                </div>
              </div>
            </div>

            {/* Premium Filters */}
            <Card className="mb-8 glass-card border-white/20 hover-glow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-blue-400" />
                  Advanced Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {/* Emotion Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/90">Emotion</label>
                    <Select value={emotionFilter} onValueChange={(value) => handleFilterChange('emotion', value)}>
                      <SelectTrigger className="glass-input bg-gray-800 border-gray-600">
                        <SelectValue placeholder="All emotions" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="all">All emotions</SelectItem>
                        {Object.entries(EMOTIONS).map(([key, emotion]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: emotion.color }}
                              />
                              <span>{emotion.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subreddit Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/90">Subreddit</label>
                    <Select value={subredditFilter} onValueChange={(value) => handleFilterChange('subreddit', value)}>
                      <SelectTrigger className="glass-input bg-gray-800 border-gray-600">
                        <SelectValue placeholder="All subreddits" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="all">All subreddits</SelectItem>
                        {subreddits.map((subreddit) => (
                          <SelectItem key={subreddit} value={subreddit}>
                            r/{subreddit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/90">Search</label>
                    <div className="flex space-x-2">
                      <Input
                        type="text"
                        placeholder="Search headlines..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="glass-input bg-gray-800 border-gray-600"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <Button onClick={handleSearch} size="sm" className="glass-button">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => {
                    setEmotionFilter('all');
                    setSubredditFilter('all');
                    setSearchQuery('');
                  }} 
                  variant="outline"
                  className="glass-button border-white/40 text-white hover:bg-white/15"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/50 mx-auto mb-4"></div>
                  <p className="text-lg text-white/70">Loading trending articles from database...</p>
                </div>
              </div>
            )}

            {/* Premium Articles Grid */}
            {!isLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredArticles.map((article) => {
                  const emotionTheme = getEmotionTheme(article.emotion);
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            asChild 
                            className="glass-button group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-300"
                          >
                            <a href={article.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Read Article
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* No Results State */}
            {!isLoading && filteredArticles.length === 0 && (
              <div className="text-center py-12">
                <div className="mb-4">
                  <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">No articles match your current filters.</p>
                  <p className="text-gray-500 text-sm">Try adjusting your filters or search terms.</p>
                </div>
                <Button onClick={() => {
                  setEmotionFilter('all');
                  setSubredditFilter('all');
                  setSearchQuery('');
                }} className="glass-button mt-4">
                  Clear All Filters
                </Button>
              </div>
            )}

            {/* Premium Stats Footer */}
            {!isLoading && filteredArticles.length > 0 && (
              <div className="mt-12 p-6 glass-card border-white/20 hover-glow">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{filteredArticles.length}</div>
                    <div className="text-sm text-gray-400">Trending Articles</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {Math.round(filteredArticles.reduce((sum, article) => sum + article.intensity, 0) / filteredArticles.length * 100)}%
                    </div>
                    <div className="text-sm text-gray-400">Avg Intensity</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">
                      {new Set(filteredArticles.map(a => a.emotion)).size}
                    </div>
                    <div className="text-sm text-gray-400">Emotions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-400">
                      {new Set(filteredArticles.map(a => a.subreddit)).size}
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