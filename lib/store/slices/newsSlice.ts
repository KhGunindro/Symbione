import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ProcessedNewsArticle, fetchNewsArticles, fetchTrendingArticles, fetchOctantArticles, fetchHistoricalOctantArticles } from '@/lib/news-data';
import { updateOctantEmotions } from './emotionSlice';

interface NewsState {
  articles: ProcessedNewsArticle[];
  trendingArticles: ProcessedNewsArticle[];
  octantArticles: ProcessedNewsArticle[];
  historicalOctantArticles: ProcessedNewsArticle[];
  isLoading: boolean;
  error: string | null;
  lastFetchTime: string | null;
  cacheExpiry: number; // in milliseconds
}

const initialState: NewsState = {
  articles: [],
  trendingArticles: [],
  octantArticles: [],
  historicalOctantArticles: [],
  isLoading: false,
  error: null,
  lastFetchTime: null,
  cacheExpiry: 60 * 60 * 1000, // 1 hour cache
};

// Fetch trending articles - updated to fetch 20 most recent
export const fetchTrendingNews = createAsyncThunk(
  'news/fetchTrending',
  async (limit: number = 20, { rejectWithValue }) => {
    try {
      console.log(`Fetching ${limit} most recent trending articles...`);
      const articles = await fetchTrendingArticles(limit);
      console.log(`Successfully fetched ${articles.length} trending articles`);
      return articles;
    } catch (error: any) {
      console.error('Error fetching trending articles:', error);
      return rejectWithValue(error.message || 'Failed to fetch trending articles');
    }
  }
);

// Fetch octant articles and update emotion tracking
export const fetchOctantNews = createAsyncThunk(
  'news/fetchOctant',
  async (limit: number = 1000, { rejectWithValue, dispatch }) => {
    try {
      console.log(`Fetching ${limit} octant articles...`);
      const articles = await fetchOctantArticles(limit);
      console.log(`Successfully fetched ${articles.length} octant articles`);
      
      // Update octant emotions based on the fetched articles
      dispatch(updateOctantEmotions(articles));
      
      return articles;
    } catch (error: any) {
      console.error('Error fetching octant articles:', error);
      return rejectWithValue(error.message || 'Failed to fetch octant articles');
    }
  }
);

// Fetch historical octant articles (top 8 highest intensity)
export const fetchHistoricalOctantNews = createAsyncThunk(
  'news/fetchHistoricalOctant',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      console.log('Fetching historical octant articles...');
      const articles = await fetchHistoricalOctantArticles();
      console.log(`Successfully fetched ${articles.length} historical octant articles`);
      
      // Update octant emotions based on the historical articles
      dispatch(updateOctantEmotions(articles));
      
      return articles;
    } catch (error: any) {
      console.error('Error fetching historical octant articles:', error);
      return rejectWithValue(error.message || 'Failed to fetch historical octant articles');
    }
  }
);

// Fetch all news with cache check
export const fetchAllNews = createAsyncThunk(
  'news/fetchAll',
  async (_, { getState, dispatch }) => {
    const state = getState() as { news: NewsState };
    const { lastFetchTime, cacheExpiry } = state.news;
    
    const now = new Date().getTime();
    const lastFetch = lastFetchTime ? new Date(lastFetchTime).getTime() : 0;
    
    // Check if cache is still valid
    if (now - lastFetch < cacheExpiry) {
      console.log('Using cached news data');
      return null; // Use cached data
    }
    
    console.log('Cache expired, fetching fresh news data...');
    
    // Fetch fresh data
    try {
      await Promise.all([
        dispatch(fetchTrendingNews(20)), // Updated to fetch 20 articles
        dispatch(fetchOctantNews()),
        dispatch(fetchHistoricalOctantNews())
      ]);
      console.log('All news data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing news data:', error);
    }
    
    return true;
  }
);

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCacheExpiry: (state, action: PayloadAction<number>) => {
      state.cacheExpiry = action.payload;
    },
    clearCache: (state) => {
      state.articles = [];
      state.trendingArticles = [];
      state.octantArticles = [];
      state.historicalOctantArticles = [];
      state.lastFetchTime = null;
    },
    // Manual update of octant articles with emotion tracking
    updateOctantArticles: (state, action: PayloadAction<ProcessedNewsArticle[]>) => {
      state.octantArticles = action.payload;
      state.lastFetchTime = new Date().toISOString();
    },
    // Manual update of historical octant articles
    updateHistoricalOctantArticles: (state, action: PayloadAction<ProcessedNewsArticle[]>) => {
      state.historicalOctantArticles = action.payload;
      state.lastFetchTime = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder
      // Trending articles
      .addCase(fetchTrendingNews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTrendingNews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trendingArticles = action.payload;
        state.lastFetchTime = new Date().toISOString();
      })
      .addCase(fetchTrendingNews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Octant articles
      .addCase(fetchOctantNews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOctantNews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.octantArticles = action.payload;
        state.lastFetchTime = new Date().toISOString();
      })
      .addCase(fetchOctantNews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Historical octant articles
      .addCase(fetchHistoricalOctantNews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHistoricalOctantNews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.historicalOctantArticles = action.payload;
        state.lastFetchTime = new Date().toISOString();
      })
      .addCase(fetchHistoricalOctantNews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCacheExpiry, clearCache, updateOctantArticles, updateHistoricalOctantArticles } = newsSlice.actions;
export default newsSlice.reducer;