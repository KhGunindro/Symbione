import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error('❌ Supabase configuration missing. Please check your environment variables.');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create Supabase client with optimized settings for static export
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    // Disable realtime for static export to avoid WebSocket issues
    params: {
      eventsPerSecond: 0,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'symbione-web',
    },
  },
}) : null;

// Log configuration status only in browser
if (typeof window !== 'undefined') {
  if (isSupabaseConfigured) {
    console.log('✅ Supabase connected successfully to:', supabaseUrl);
  } else {
    console.warn('⚠️ Supabase not configured. Please add environment variables.');
  }
}

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      classified_reddit_news: {
        Row: {
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
        };
        Insert: {
          id?: string;
          title: string;
          summary?: string | null;
          source_url?: string | null;
          reddit_url?: string | null;
          image?: string | null;
          subreddit?: string | null;
          timestamp?: string | null;
          joy?: number | null;
          trust?: number | null;
          fear?: number | null;
          surprise?: number | null;
          sadness?: number | null;
          disgust?: number | null;
          anger?: number | null;
          anticipation?: number | null;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          summary?: string | null;
          source_url?: string | null;
          reddit_url?: string | null;
          image?: string | null;
          subreddit?: string | null;
          timestamp?: string | null;
          joy?: number | null;
          trust?: number | null;
          fear?: number | null;
          surprise?: number | null;
          sadness?: number | null;
          disgust?: number | null;
          anger?: number | null;
          anticipation?: number | null;
          processed_at?: string | null;
        };
      };
    };
  };
}

// Test database connection with error handling for static export
export const testDatabaseConnection = async () => {
  // Skip database tests during build/static generation
  if (typeof window === 'undefined' || !supabase) {
    return { success: false, error: 'Database not available during build' };
  }

  try {
    console.log('🔍 Testing database connection...');
    
    const { data, error, count } = await supabase
      .from('classified_reddit_news')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`✅ Database connected successfully! Found ${count} articles in database.`);
    return { success: true, count };
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return { success: false, error: 'Connection test failed' };
  }
};

// Test authentication with error handling for static export
export const testAuthConnection = async () => {
  // Skip auth tests during build/static generation
  if (typeof window === 'undefined' || !supabase) {
    return { success: false, error: 'Auth not available during build' };
  }

  try {
    console.log('🔍 Testing authentication...');
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error && error.message !== 'Invalid JWT') {
      console.error('❌ Auth connection failed:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ Authentication system connected successfully!');
    return { success: true, user };
  } catch (error) {
    console.error('❌ Auth connection test failed:', error);
    return { success: false, error: 'Auth test failed' };
  }
};