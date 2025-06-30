import { supabase, isSupabaseConfigured, testDatabaseConnection } from './supabase';
import { EmotionType } from './emotions';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string | null;
  source_url: string | null;
  reddit_url: string | null;
  image: string | null;
  subreddit: string | null;
  timestamp: string | null;
  joy: number | null;
  trust: number | null;
  fear: number | null;
  surprise: number | null;
  sadness: number | null;
  disgust: number | null;
  anger: number | null;
  anticipation: number | null;
  processed_at: string | null;
}

export interface ProcessedNewsArticle {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string | null;
  subreddit: string;
  emotion: EmotionType;
  intensity: number;
  timestamp: string;
  emotionScores: Record<EmotionType, number>;
}

export interface BookmarkedArticle {
  id: string;
  user_id: string;
  news_id: string;
  title: string;
  subreddit: string;
  emotion: string;
  emotion_intensity: number;
  source_url: string;
  bookmarked_at: string;
}

// Map database emotion columns to our EmotionType
const emotionMapping: Record<string, EmotionType> = {
  joy: 'joy',
  trust: 'trust',
  fear: 'fear',
  surprise: 'surprise',
  sadness: 'sadness',
  disgust: 'disgust',
  anger: 'anger',
  anticipation: 'anticipation'
};

// Get the dominant emotion from emotion scores
export function getDominantEmotionFromScores(article: NewsArticle): { emotion: EmotionType; intensity: number } {
  const emotions: Array<{ emotion: EmotionType; score: number }> = [];
  
  // Collect all emotion scores
  Object.entries(emotionMapping).forEach(([dbColumn, emotionType]) => {
    const score = article[dbColumn as keyof NewsArticle] as number;
    if (score !== null && score !== undefined && !isNaN(score)) {
      emotions.push({ emotion: emotionType, score });
    }
  });

  // Find the emotion with the highest score
  if (emotions.length === 0) {
    return { emotion: 'joy', intensity: 0.5 }; // Default fallback
  }

  emotions.sort((a, b) => b.score - a.score);
  const dominant = emotions[0];
  
  // Normalize intensity to 0-1 range
  const intensity = Math.min(Math.max(dominant.score, 0), 1);
  
  return { emotion: dominant.emotion, intensity };
}

// Process raw news article into our format
export function processNewsArticle(article: NewsArticle): ProcessedNewsArticle {
  const { emotion, intensity } = getDominantEmotionFromScores(article);
  
  // Create emotion scores object
  const emotionScores: Record<EmotionType, number> = {
    joy: article.joy || 0,
    trust: article.trust || 0,
    fear: article.fear || 0,
    surprise: article.surprise || 0,
    sadness: article.sadness || 0,
    disgust: article.disgust || 0,
    anger: article.anger || 0,
    anticipation: article.anticipation || 0
  };

  // Handle timestamp conversion
  let timestampString: string;
  try {
    if (article.timestamp) {
      const date = new Date(article.timestamp);
      if (!isNaN(date.getTime())) {
        timestampString = date.toISOString();
      } else {
        timestampString = new Date().toISOString();
      }
    } else {
      timestampString = new Date().toISOString();
    }
  } catch (error) {
    console.warn('Invalid timestamp in article:', article.timestamp, error);
    timestampString = new Date().toISOString();
  }

  return {
    id: article.id,
    headline: article.title || 'Untitled',
    summary: article.summary || 'No summary available',
    source: article.subreddit || 'Reddit',
    url: article.reddit_url || article.source_url || '#',
    image: article.image,
    subreddit: article.subreddit || 'unknown',
    emotion,
    intensity,
    timestamp: timestampString,
    emotionScores
  };
}

// Fetch news articles from Supabase with enhanced error handling
export async function fetchNewsArticles(options: {
  limit?: number;
  subreddits?: string[];
  emotions?: EmotionType[];
  sortBy?: 'timestamp' | 'intensity';
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<ProcessedNewsArticle[]> {
  // Return empty array during build/static generation
  if (typeof window === 'undefined' || !supabase || !isSupabaseConfigured) {
    console.warn('⚠️ Database not available during build, returning empty array');
    return [];
  }

  try {
    console.log('🔍 Fetching articles from Supabase with options:', options);
    
    // Test connection first
    const connectionTest = await testDatabaseConnection();
    if (!connectionTest.success) {
      throw new Error(`Database connection failed: ${connectionTest.error}`);
    }

    let query = supabase
      .from('classified_reddit_news')
      .select('*');

    // Filter by subreddits if specified
    if (options.subreddits && options.subreddits.length > 0) {
      query = query.in('subreddit', options.subreddits);
    }

    // Apply sorting - default to timestamp descending for most recent first
    if (options.sortBy === 'timestamp') {
      query = query.order('timestamp', { ascending: options.sortOrder === 'asc' });
    } else {
      // Default to processed_at for recency, then timestamp
      query = query.order('processed_at', { ascending: false });
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Supabase query error:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No articles found in database');
      return [];
    }

    console.log(`✅ Successfully fetched ${data.length} articles from database`);

    // Process articles and filter by emotions if specified
    let processedArticles = data.map(processNewsArticle);

    if (options.emotions && options.emotions.length > 0) {
      processedArticles = processedArticles.filter(article => 
        options.emotions!.includes(article.emotion)
      );
    }

    // Sort by intensity if requested (after processing)
    if (options.sortBy === 'intensity') {
      processedArticles.sort((a, b) => 
        options.sortOrder === 'asc' ? a.intensity - b.intensity : b.intensity - a.intensity
      );
    }

    return processedArticles;
  } catch (error) {
    console.error('❌ Error fetching news articles:', error);
    return []; // Return empty array instead of throwing during build
  }
}

// Fetch trending articles (most recent 20 articles)
export async function fetchTrendingArticles(limit: number = 20): Promise<ProcessedNewsArticle[]> {
  console.log('📈 Fetching most recent trending articles from database...');
  
  const articles = await fetchNewsArticles({
    limit,
    subreddits: ['worldnews', 'politics'], // Keep trending focused on main news
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });

  console.log(`✅ Found ${articles.length} trending articles`);
  return articles;
}

// Fetch articles for octant visualization - Gets ALL articles
export async function fetchOctantArticles(limit: number = 1000): Promise<ProcessedNewsArticle[]> {
  console.log('🎯 Fetching ALL octant articles from database...');
  
  return fetchNewsArticles({
    limit,
    // No subreddit filter - get all articles from all subreddits
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
}

// Fetch historical octant articles (top intensity articles from recent days)
export async function fetchHistoricalOctantArticles(): Promise<ProcessedNewsArticle[]> {
  console.log('📚 Fetching historical octant articles from ALL subreddits...');
  
  // Return empty array during build/static generation
  if (typeof window === 'undefined' || !supabase) {
    return [];
  }
  
  try {
    // Get articles from the last 30 days to have enough data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const { data, error } = await supabase
      .from('classified_reddit_news')
      .select('*')
      // Remove subreddit filter to get ALL articles
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('❌ Error fetching historical articles:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No historical articles found');
      return [];
    }

    console.log(`✅ Found ${data.length} historical articles from ALL subreddits`);

    // Process all articles
    const processedArticles = data.map(processNewsArticle);

    // Group articles by day and find the highest intensity article for each day
    const articlesByDay: { [key: string]: ProcessedNewsArticle[] } = {};
    
    processedArticles.forEach(article => {
      const date = new Date(article.timestamp);
      const dayKey = date.toDateString();
      
      if (!articlesByDay[dayKey]) {
        articlesByDay[dayKey] = [];
      }
      articlesByDay[dayKey].push(article);
    });

    // Get the highest intensity article from each day
    const dailyPeakArticles: ProcessedNewsArticle[] = [];
    
    Object.entries(articlesByDay).forEach(([dayKey, dayArticles]) => {
      if (dayArticles.length > 0) {
        // Sort by intensity and take the highest
        dayArticles.sort((a, b) => b.intensity - a.intensity);
        const peakArticle = dayArticles[0];
        
        // Mark this as a daily peak
        peakArticle.id = `daily-peak-${dayKey}-${peakArticle.id}`;
        
        dailyPeakArticles.push(peakArticle);
      }
    });

    // Sort by date and take the most recent 8 days
    dailyPeakArticles.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const result = dailyPeakArticles.slice(0, 8);
    console.log(`✅ Found ${result.length} historical peak articles from ALL subreddits`);
    
    return result;
  } catch (error) {
    console.error('❌ Error fetching historical articles:', error);
    return [];
  }
}

// Fetch user bookmarks
export async function fetchUserBookmarks(userId: string): Promise<BookmarkedArticle[]> {
  if (!isSupabaseConfigured || !supabase || typeof window === 'undefined') {
    return [];
  }

  try {
    console.log('📚 Fetching user bookmarks from database...');
    
    const { data, error } = await supabase
      .from('cosmark_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('bookmarked_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching bookmarks:', error);
      return [];
    }

    console.log(`✅ Found ${data?.length || 0} bookmarks for user`);
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching user bookmarks:', error);
    return [];
  }
}

// Delete user bookmark
export async function deleteUserBookmark(bookmarkId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase || typeof window === 'undefined') {
    throw new Error('Database not available');
  }

  try {
    console.log('🗑️ Deleting bookmark from database...');
    
    const { error } = await supabase
      .from('cosmark_bookmarks')
      .delete()
      .eq('id', bookmarkId);

    if (error) {
      console.error('❌ Error deleting bookmark:', error);
      throw new Error(`Database delete failed: ${error.message}`);
    }

    console.log('✅ Bookmark deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting bookmark:', error);
    throw error;
  }
}

// Get emotion distribution from articles
export function getEmotionDistribution(articles: ProcessedNewsArticle[]): Record<EmotionType, number> {
  const distribution: Record<EmotionType, number> = {
    joy: 0,
    trust: 0,
    fear: 0,
    surprise: 0,
    sadness: 0,
    disgust: 0,
    anger: 0,
    anticipation: 0
  };

  if (articles.length === 0) return distribution;

  articles.forEach(article => {
    distribution[article.emotion]++;
  });

  return distribution;
}

// Get current dominant emotion from recent articles
export async function getCurrentDominantEmotion(): Promise<EmotionType> {
  // Return default during build/static generation
  if (typeof window === 'undefined') {
    return 'joy';
  }

  try {
    console.log('🎭 Fetching current dominant emotion from ALL articles...');
    
    const recentArticles = await fetchNewsArticles({
      limit: 100,
      // No subreddit filter - analyze ALL articles
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });

    if (recentArticles.length === 0) {
      console.warn('⚠️ No recent articles found, using default emotion');
      return 'joy';
    }

    const distribution = getEmotionDistribution(recentArticles);
    
    // Find emotion with highest count
    let dominantEmotion: EmotionType = 'joy';
    let highestCount = 0;

    Object.entries(distribution).forEach(([emotion, count]) => {
      if (count > highestCount) {
        highestCount = count;
        dominantEmotion = emotion as EmotionType;
      }
    });

    console.log(`✅ Current dominant emotion: ${dominantEmotion} (${highestCount} articles from database)`);
    return dominantEmotion;
  } catch (error) {
    console.error('❌ Error getting current dominant emotion:', error);
    return 'joy'; // Default fallback
  }
}