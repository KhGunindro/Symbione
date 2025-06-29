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
  timestamp: string; // Changed from Date to string for Redux serialization
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

// Mock data generator for when Supabase is not configured
function generateMockArticles(count: number): ProcessedNewsArticle[] {
  const emotions: EmotionType[] = ['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'];
  const subreddits = ['worldnews', 'politics', 'technology', 'science'];
  const headlines = [
    'Breaking: Major diplomatic breakthrough in international relations',
    'Scientists discover revolutionary new renewable energy source',
    'Global markets respond positively to economic reforms',
    'New technology promises to transform healthcare delivery',
    'International cooperation leads to environmental progress',
    'Research breakthrough offers hope for climate solutions',
    'Political leaders announce historic peace agreement',
    'Innovation in AI brings new possibilities for education',
    'Medical advancement shows promise for treating diseases',
    'Economic policies show positive impact on communities'
  ];

  return Array.from({ length: count }, (_, i) => {
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    const emotionScores: Record<EmotionType, number> = {} as Record<EmotionType, number>;
    
    // Generate realistic emotion scores
    emotions.forEach(e => {
      if (e === emotion) {
        emotionScores[e] = 0.6 + Math.random() * 0.4; // Dominant emotion: 0.6-1.0
      } else {
        emotionScores[e] = Math.random() * 0.3; // Other emotions: 0.0-0.3
      }
    });

    return {
      id: `mock-${i}`,
      headline: headlines[Math.floor(Math.random() * headlines.length)],
      summary: 'This is a mock article generated for development purposes when Supabase is not configured.',
      source: 'Reddit',
      url: `https://reddit.com/r/${subreddits[Math.floor(Math.random() * subreddits.length)]}/mock-${i}`,
      image: null,
      subreddit: subreddits[Math.floor(Math.random() * subreddits.length)],
      emotion,
      intensity: emotionScores[emotion],
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      emotionScores
    };
  });
}

// Generate mock historical data representing end-of-day snapshots
function generateMockHistoricalArticles(): ProcessedNewsArticle[] {
  const emotions: EmotionType[] = ['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'];
  const subreddits = ['worldnews', 'politics'];
  
  // Historical headlines representing peak emotional moments of each day
  const historicalHeadlines = [
    'Historic Peace Agreement Signed After Decades of Conflict',
    'Global Economic Crisis Triggers Worldwide Market Collapse',
    'Revolutionary Medical Breakthrough Offers Hope for Millions',
    'Unexpected Political Victory Shocks International Community',
    'Devastating Natural Disaster Claims Thousands of Lives',
    'Major Corruption Scandal Rocks Government Leadership',
    'Scientific Discovery Could Transform Climate Change Response',
    'Terrorist Attack Leaves Nation in State of Fear and Mourning'
  ];

  return emotions.map((emotion, i) => {
    const emotionScores: Record<EmotionType, number> = {} as Record<EmotionType, number>;
    
    // Generate very high intensity scores for historical peak articles
    emotions.forEach(e => {
      if (e === emotion) {
        emotionScores[e] = 0.85 + Math.random() * 0.15; // Very high intensity: 0.85-1.0
      } else {
        emotionScores[e] = Math.random() * 0.2; // Other emotions: 0.0-0.2
      }
    });

    // Create dates representing end-of-day snapshots from the last 8 days
    const daysAgo = 7 - i;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(23, 59, 59, 999); // Set to end of day (11:59:59 PM)

    return {
      id: `historical-peak-${i}`,
      headline: historicalHeadlines[i],
      summary: `This article represents the peak emotional intensity for ${emotion} at the end of ${date.toDateString()}. This would be updated daily at midnight with the highest intensity article of that day.`,
      source: 'Reddit',
      url: `https://reddit.com/r/${subreddits[Math.floor(Math.random() * subreddits.length)]}/historical-peak-${i}`,
      image: null,
      subreddit: subreddits[Math.floor(Math.random() * subreddits.length)],
      emotion,
      intensity: emotionScores[emotion],
      timestamp: date.toISOString(),
      emotionScores
    };
  });
}

// Get the dominant emotion from emotion scores
export function getDominantEmotionFromScores(article: NewsArticle): { emotion: EmotionType; intensity: number } {
  const emotions: Array<{ emotion: EmotionType; score: number }> = [];
  
  // Collect all emotion scores
  Object.entries(emotionMapping).forEach(([dbColumn, emotionType]) => {
    const score = article[dbColumn as keyof NewsArticle] as number;
    if (score !== null && score !== undefined) {
      emotions.push({ emotion: emotionType, score });
    }
  });

  // Find the emotion with the highest score
  if (emotions.length === 0) {
    return { emotion: 'joy', intensity: 0.5 }; // Default fallback
  }

  emotions.sort((a, b) => b.score - a.score);
  const dominant = emotions[0];
  
  // Normalize intensity to 0-1 range (assuming scores are 0-1, adjust if needed)
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

  // Handle timestamp conversion to string for Redux serialization
  let timestampString: string;
  try {
    if (article.timestamp) {
      const date = new Date(article.timestamp);
      // Check if the date is valid
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
  // If Supabase is not configured, return mock data
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, returning mock data');
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
      filteredArticles.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return options.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }
    
    return filteredArticles.slice(0, options.limit || 50);
  }

  try {
    let query = supabase
      .from('classified_reddit_news')
      .select('*');

    // Filter by subreddits if specified
    if (options.subreddits && options.subreddits.length > 0) {
      query = query.in('subreddit', options.subreddits);
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    // Apply sorting
    if (options.sortBy === 'timestamp') {
      query = query.order('timestamp', { ascending: options.sortOrder === 'asc' });
    } else {
      // Default to processed_at for recency
      query = query.order('processed_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching news articles:', error);
      return generateMockArticles(options.limit || 50);
    }

    if (!data) {
      return generateMockArticles(options.limit || 50);
    }

    // Process articles and filter by emotions if specified
    let processedArticles = data.map(processNewsArticle);

    if (options.emotions && options.emotions.length > 0) {
      processedArticles = processedArticles.filter(article => 
        options.emotions!.includes(article.emotion)
      );
    }

    // Sort by intensity if requested
    if (options.sortBy === 'intensity') {
      processedArticles.sort((a, b) => 
        options.sortOrder === 'asc' ? a.intensity - b.intensity : b.intensity - a.intensity
      );
    }

    return processedArticles;
  } catch (error) {
    console.error('Unexpected error fetching news articles:', error);
    return generateMockArticles(options.limit || 50);
  }
}

// NEW: Fetch top 8 highest intensity articles representing end-of-day snapshots
// This simulates what would be updated daily at midnight with the day's peak articles
export async function fetchHistoricalOctantArticles(): Promise<ProcessedNewsArticle[]> {
  // If Supabase is not configured, return mock historical data
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, returning mock historical end-of-day data');
    return generateMockHistoricalArticles();
  }

  try {
    // In a real implementation, this would query a separate table or view
    // that gets updated daily at midnight with the highest intensity article per day
    // For now, we simulate this by getting the highest intensity article from each of the last 8 days
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // 8 days ago

    // This query would ideally be against a "daily_peak_articles" table
    // that gets populated by a daily cron job at midnight
    const { data, error } = await supabase
      .from('classified_reddit_news')
      .select('*')
      .in('subreddit', ['worldnews', 'politics'])
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('processed_at', { ascending: false });

    if (error) {
      console.error('Error fetching historical articles:', error);
      return generateMockHistoricalArticles();
    }

    if (!data || data.length === 0) {
      return generateMockHistoricalArticles();
    }

    // Process all articles
    const processedArticles = data.map(processNewsArticle);

    // Group articles by day and find the highest intensity article for each day
    // This simulates what would be done by a daily batch job
    const articlesByDay: { [key: string]: ProcessedNewsArticle[] } = {};
    
    processedArticles.forEach(article => {
      const date = new Date(article.timestamp);
      const dayKey = date.toDateString();
      
      if (!articlesByDay[dayKey]) {
        articlesByDay[dayKey] = [];
      }
      articlesByDay[dayKey].push(article);
    });

    // Get the highest intensity article from each day (simulating daily batch processing)
    const dailyPeakArticles: ProcessedNewsArticle[] = [];
    
    Object.entries(articlesByDay).forEach(([dayKey, dayArticles]) => {
      if (dayArticles.length > 0) {
        // Sort by intensity and take the highest (this would be done at end of day)
        dayArticles.sort((a, b) => b.intensity - a.intensity);
        const peakArticle = dayArticles[0];
        
        // Mark this as an end-of-day snapshot
        peakArticle.id = `daily-peak-${dayKey}-${peakArticle.id}`;
        peakArticle.summary = `Peak emotional intensity article for ${dayKey}. ${peakArticle.summary}`;
        
        dailyPeakArticles.push(peakArticle);
      }
    });

    // Sort by date and take the most recent 8 days
    dailyPeakArticles.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // If we have fewer than 8 articles, fill with mock data
    const result = dailyPeakArticles.slice(0, 8);
    if (result.length < 8) {
      const mockArticles = generateMockHistoricalArticles();
      result.push(...mockArticles.slice(result.length));
    }

    return result.slice(0, 8); // Ensure exactly 8 articles
  } catch (error) {
    console.error('Unexpected error fetching historical articles:', error);
    return generateMockHistoricalArticles();
  }
}

// Fetch trending articles (high intensity, recent)
export async function fetchTrendingArticles(limit: number = 50): Promise<ProcessedNewsArticle[]> {
  return fetchNewsArticles({
    limit: limit * 2, // Fetch more to filter for high intensity
    subreddits: ['worldnews', 'politics'], // Focus on worldnews and politics
    sortBy: 'timestamp',
    sortOrder: 'desc'
  }).then(articles => {
    // Filter for high intensity articles and sort by intensity
    return articles
      .filter(article => article.intensity > 0.6) // Only high intensity articles
      .sort((a, b) => b.intensity - a.intensity) // Sort by intensity descending
      .slice(0, limit); // Take top articles
  });
}

// Fetch articles for octant visualization
export async function fetchOctantArticles(limit: number = 1000): Promise<ProcessedNewsArticle[]> {
  return fetchNewsArticles({
    limit,
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
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

  // Convert to percentages
  Object.keys(distribution).forEach(emotion => {
    distribution[emotion as EmotionType] = distribution[emotion as EmotionType] / articles.length;
  });

  return distribution;
}

// Get current dominant emotion from recent articles
export async function getCurrentDominantEmotion(): Promise<EmotionType> {
  try {
    const recentArticles = await fetchNewsArticles({
      limit: 100,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });

    if (recentArticles.length === 0) {
      return 'joy'; // Default fallback
    }

    const distribution = getEmotionDistribution(recentArticles);
    
    // Find emotion with highest percentage
    let dominantEmotion: EmotionType = 'joy';
    let highestPercentage = 0;

    Object.entries(distribution).forEach(([emotion, percentage]) => {
      if (percentage > highestPercentage) {
        highestPercentage = percentage;
        dominantEmotion = emotion as EmotionType;
      }
    });

    return dominantEmotion;
  } catch (error) {
    console.error('Error getting current dominant emotion:', error);
    return 'joy'; // Default fallback
  }
}