import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import emotionReducer from './slices/emotionSlice';
import newsReducer from './slices/newsSlice';

// Create a no-op storage for SSR environments
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

// Use dynamic storage that works in both SSR and client environments
const storage = typeof window !== 'undefined' 
  ? require('redux-persist/lib/storage').default 
  : createNoopStorage();

const emotionPersistConfig = {
  key: 'emotion',
  storage,
  whitelist: ['dominantEmotion', 'lastUpdated']
};

const newsPersistConfig = {
  key: 'news',
  storage,
  whitelist: ['lastFetchTime', 'cacheExpiry']
};

const persistedEmotionReducer = persistReducer(emotionPersistConfig, emotionReducer);
const persistedNewsReducer = persistReducer(newsPersistConfig, newsReducer);

export const store = configureStore({
  reducer: {
    emotion: persistedEmotionReducer,
    news: persistedNewsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;