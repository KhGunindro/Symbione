import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Create a mock client for development when Supabase is not configured
const createMockClient = () => ({
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null }),
    in: () => ({ data: [], error: null }),
    order: () => ({ data: [], error: null }),
    limit: () => ({ data: [], error: null }),
    gte: () => ({ data: [], error: null }),
    lte: () => ({ data: [], error: null }),
  }),
  auth: {
    signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    signInWithOAuth: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    signOut: () => Promise.resolve({ error: null }),
    getUser: () => Promise.resolve({ data: { user: null } }),
    getSession: () => Promise.resolve({ data: { session: null } }),
    resetPasswordForEmail: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    updateUser: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
});

// Create Supabase client or mock client
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createMockClient() as any;

// Log configuration status
if (typeof window !== 'undefined') {
  if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase not configured. Create a .env.local file with:');
    console.warn('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  } else {
    console.log('✅ Supabase configured successfully');
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