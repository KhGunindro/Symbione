import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { EmotionType } from '@/lib/emotions';
import { getCurrentDominantEmotion } from '@/lib/news-data';
import { ProcessedNewsArticle } from '@/lib/news-data';

interface OctantEmotionData {
  emotion: EmotionType;
  count: number;
  articles: ProcessedNewsArticle[];
}

interface EmotionState {
  dominantEmotion: EmotionType;
  octantDominantEmotion: EmotionType; // New: emotion from octant with most datapoints
  octantEmotionDistribution: Record<EmotionType, number>; // New: count of articles per emotion in octants
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
  updateInterval: number; // in milliseconds
}

const initialState: EmotionState = {
  dominantEmotion: 'joy',
  octantDominantEmotion: 'joy',
  octantEmotionDistribution: {
    joy: 0,
    trust: 0,
    fear: 0,
    surprise: 0,
    sadness: 0,
    disgust: 0,
    anger: 0,
    anticipation: 0
  },
  lastUpdated: null,
  isLoading: false,
  error: null,
  updateInterval: 60 * 60 * 1000, // 1 hour in milliseconds
};

// Async thunk to fetch dominant emotion from database
export const fetchDominantEmotion = createAsyncThunk(
  'emotion/fetchDominantEmotion',
  async (_, { rejectWithValue }) => {
    try {
      // Skip during SSR/build
      if (typeof window === 'undefined') {
        return 'joy' as EmotionType;
      }

      console.log('Fetching dominant emotion from database...');
      const emotion = await getCurrentDominantEmotion();
      console.log(`Dominant emotion fetched: ${emotion}`);
      return emotion;
    } catch (error: any) {
      console.error('Error fetching dominant emotion:', error);
      return rejectWithValue(error.message || 'Failed to fetch dominant emotion');
    }
  }
);

// Async thunk to check if update is needed and fetch if so
export const checkAndUpdateEmotion = createAsyncThunk(
  'emotion/checkAndUpdateEmotion',
  async (_, { getState, dispatch }) => {
    // Skip during SSR/build
    if (typeof window === 'undefined') {
      return null;
    }

    const state = getState() as { emotion: EmotionState };
    const { lastUpdated, updateInterval } = state.emotion;
    
    const now = new Date().getTime();
    const lastUpdateTime = lastUpdated ? new Date(lastUpdated).getTime() : 0;
    
    // Check if an hour has passed since last update OR if this is the first load
    if (now - lastUpdateTime >= updateInterval || !lastUpdated) {
      console.log('Emotion update needed, fetching fresh data...');
      return dispatch(fetchDominantEmotion());
    }
    
    console.log('Emotion data is still fresh, using cached data');
    return null;
  }
);

// NEW: Force immediate emotion update (for app startup)
export const forceEmotionUpdate = createAsyncThunk(
  'emotion/forceUpdate',
  async (_, { dispatch }) => {
    // Skip during SSR/build
    if (typeof window === 'undefined') {
      return null;
    }

    console.log('Forcing immediate emotion update...');
    return dispatch(fetchDominantEmotion());
  }
);

const emotionSlice = createSlice({
  name: 'emotion',
  initialState,
  reducers: {
    setDominantEmotion: (state, action: PayloadAction<EmotionType>) => {
      state.dominantEmotion = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    // New: Update octant emotion data based on articles
    updateOctantEmotions: (state, action: PayloadAction<ProcessedNewsArticle[]>) => {
      const articles = action.payload;
      
      // Reset distribution
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
      
      // Count articles by emotion
      articles.forEach(article => {
        distribution[article.emotion]++;
      });
      
      // Find emotion with most articles
      let dominantEmotion: EmotionType = 'joy';
      let maxCount = 0;
      
      Object.entries(distribution).forEach(([emotion, count]) => {
        if (count > maxCount) {
          maxCount = count;
          dominantEmotion = emotion as EmotionType;
        }
      });
      
      state.octantEmotionDistribution = distribution;
      state.octantDominantEmotion = dominantEmotion;
      state.dominantEmotion = dominantEmotion; // Update main dominant emotion too
      state.lastUpdated = new Date().toISOString();
      
      console.log(`Octant emotions updated: ${dominantEmotion} is dominant with ${maxCount} articles`);
    },
    clearError: (state) => {
      state.error = null;
    },
    setUpdateInterval: (state, action: PayloadAction<number>) => {
      state.updateInterval = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDominantEmotion.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDominantEmotion.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dominantEmotion = action.payload;
        state.octantDominantEmotion = action.payload; // Also update octant emotion
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchDominantEmotion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle force update
      .addCase(forceEmotionUpdate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forceEmotionUpdate.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(forceEmotionUpdate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setDominantEmotion, 
  updateOctantEmotions, 
  clearError, 
  setUpdateInterval 
} = emotionSlice.actions;

export default emotionSlice.reducer;