import { supabase, isSupabaseConfigured } from './supabase';
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

// Mock data for development when Supabase is not configured
const generateMockArticles = (count: number): ProcessedNewsArticle[] => {
  const emotions: EmotionType[] = ['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'];
  const subreddits = ['worldnews', 'politics', 'technology', 'science'];
  const mockTitles = [
    'Global Climate Summit Reaches Historic Agreement',
    'New Technology Breakthrough Changes Everything',
    'Economic Markets Show Surprising Resilience',
    'Political Leaders Meet for Peace Talks',
    'Scientific Discovery Opens New Possibilities',
    'Community Rallies Together in Times of Need',
    'Innovation Drives Progress in Healthcare',
    'Environmental Protection Measures Announced'
  ];

  return Array.from({ length: count }, (_, i) => {
    const emotion = emotions[i % emotions.length];
    const subreddit = subreddits[i % subreddits.length];
    const title = mockTitles[i % mockTitles.length];
    
    return {
      id: `mock-${i}`,
      headline: title,
      summary: `This is a mock article about ${emotion} in ${subreddit}. This data is generated for development purposes when Supabase is not configured.`,
      source: 'Mock Data',
      url: '#',
      image: null,
      subreddit,
      emotion,
      intensity: Math.random() * 0.5 + 0.5,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      emotionScores: {
        joy: emotion === 'joy' ? 0.8 : Math.random() * 0.3,
        trust: emotion === 'trust' ? 0.8 : Math.random() * 0.3,
        fear: emotion === 'fear' ? 0.8 : Math.random() * 0.3,
        surprise: emotion === 'surprise' ? 0.8 : Math.random() * 0.3,
        sadness: emotion === 'sadness' ? 0.8 : Math.random() * 0.3,
        disgust: emotion === 'disgust' ? 0.8 : Math.random() * 0.3,
        anger: emotion === 'anger' ? 0.8 : Math.random() * 0.3,
        anticipation: emotion === 'anticipation' ? 0.8 : Math.random() * 0.3,
      }
    };
  });
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

// Fetch news articles from Supabase
export async function fetchNewsArticles(options: {
  limit?: number;
  subreddits?: string[];
  emotions?: EmotionType[];
  sortBy?: 'timestamp' | 'intensity';
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<ProcessedNewsArticle[]> {
  if (!isSupabaseConfigured) {
    console.warn('🔄 Using mock data - Supabase not configured');
    const mockArticles = generateMockArticles(options.limit || 50);
    
    // Apply filters to mock data
    let filteredArticles = mockArticles;
    
    if (options.subreddits && options.subreddits.length > 0) {
      filteredArticles = filteredArticles.filter(article => 
        options.subreddits!.includes(article.subreddit)
      );
    }
    
    if (options.emotions && options.emotions.length > 0) {
      filteredArticles = filteredArticles.filter(article => 
        options.emotions!.includes(article.emotion)
      );
    }
    
    // Apply sorting
    if (options.sortBy === 'intensity') {
      filteredArticles.sort((a, b) => 
        options.sortOrder === 'asc' ? a.intensity - b.intensity : b.intensity - a.intensity
      );
    } else {
      filteredArticles.sort((a, b) => 
        options.sortOrder === 'asc' 
          ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }
    
    return filteredArticles;
  }

  try {
    console.log('Fetching articles from Supabase with options:', options);
    
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
      console.error('Supabase query error:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn('No articles found in database');
      return [];
    }

    console.log(`Successfully fetched ${data.length} articles from database`);

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
    console.error('Error fetching news articles:', error);
    throw error;
  }
}

// Fetch trending articles (high intensity, recent)
export async function fetchTrendingArticles(limit: number = 50): Promise<ProcessedNewsArticle[]> {
  console.log('Fetching trending articles...');
  
  const articles = await fetchNewsArticles({
    limit: limit * 2, // Fetch more to filter for high intensity
    subreddits: ['worldnews', 'politics'], // Keep trending focused on main news
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });

  // Filter for high intensity articles and sort by intensity
  const trendingArticles = articles
    .filter(article => article.intensity > 0.6) // Only high intensity articles
    .sort((a, b) => b.intensity - a.intensity) // Sort by intensity descending
    .slice(0, limit); // Take top articles

  console.log(`Found ${trendingArticles.length} trending articles`);
  return trendingArticles;
}

// Fetch articles for octant visualization - NOW GETS ALL ARTICLES
export async function fetchOctantArticles(limit: number = 1000): Promise<ProcessedNewsArticle[]> {
  console.log('Fetching ALL octant articles from database...');
  
  // Remove subreddit filter to get ALL articles
  return fetchNewsArticles({
    limit,
    // No subreddit filter - get all articles from all subreddits
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
}

// Fetch historical octant articles (top intensity articles from recent days)
export async function fetchHistoricalOctantArticles(): Promise<ProcessedNewsArticle[]> {
  console.log('Fetching historical octant articles from ALL subreddits...');
  
  if (!isSupabaseConfigured) {
    console.warn('🔄 Using mock historical data - Supabase not configured');
    const mockArticles = generateMockArticles(30);
    
    // Group by day and get highest intensity from each day
    const articlesByDay: { [key: string]: ProcessedNewsArticle[] } = {};
    
    mockArticles.forEach(article => {
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
        dayArticles.sort((a, b) => b.intensity - a.intensity);
        const peakArticle = dayArticles[0];
        peakArticle.id = `daily-peak-${dayKey}-${peakArticle.id}`;
        dailyPeakArticles.push(peakArticle);
      }
    });

    dailyPeakArticles.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return dailyPeakArticles.slice(0, 8);
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
      console.error('Error fetching historical articles:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn('No historical articles found');
      return [];
    }

    console.log(`Found ${data.length} historical articles from ALL subreddits`);

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
    console.log(`Found ${result.length} historical peak articles from ALL subreddits`);
    
    return result;
  } catch (error) {
    console.error('Error fetching historical articles:', error);
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
  try {
    console.log('Fetching current dominant emotion from ALL articles...');
    
    const recentArticles = await fetchNewsArticles({
      limit: 100,
      // No subreddit filter - analyze ALL articles
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });

    if (recentArticles.length === 0) {
      console.warn('No recent articles found, using default emotion');
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

    const dataSource = isSupabaseConfigured ? 'database' : 'mock data';
    console.log(`Current dominant emotion: ${dominantEmotion} (${highestCount} articles from ${dataSource})`);
    return dominantEmotion;
  } catch (error) {
    console.error('Error getting current dominant emotion:', error);
    return 'joy'; // Default fallback
  }
}