import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import emotionReducer from './slices/emotionSlice';
import newsReducer from './slices/newsSlice';

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