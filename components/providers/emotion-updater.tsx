'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/lib/store/hooks';
import { forceEmotionUpdate, checkAndUpdateEmotion } from '@/lib/store/slices/emotionSlice';
import { fetchAllNews } from '@/lib/store/slices/newsSlice';
import { testDatabaseConnection, testAuthConnection } from '@/lib/supabase';

export default function EmotionUpdater() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // IMMEDIATE emotion update on app startup with database connection test
    const initializeData = async () => {
      try {
        console.log('🚀 App startup: Testing database connections...');
        
        // Test database connection
        const dbTest = await testDatabaseConnection();
        if (!dbTest.success) {
          console.error('❌ Database connection failed:', dbTest.error);
          return;
        }
        
        // Test auth connection
        const authTest = await testAuthConnection();
        if (!authTest.success) {
          console.warn('⚠️ Auth connection issue:', authTest.error);
        }
        
        console.log('🚀 Connections verified, forcing immediate emotion update...');
        
        // Force emotion update first (this will fetch from database immediately)
        await dispatch(forceEmotionUpdate());
        
        // Then fetch news data
        await dispatch(fetchAllNews());
        
        console.log('✅ Initial data load completed - emotion should be updated from live database');
      } catch (error) {
        console.error('❌ Error during initial data load:', error);
      }
    };

    initializeData();

    // Set up hourly interval for emotion updates
    const emotionInterval = setInterval(() => {
      console.log('⏰ Hourly emotion update check...');
      dispatch(checkAndUpdateEmotion());
    }, 60 * 60 * 1000); // Every hour

    // Set up news data refresh every 30 minutes
    const newsInterval = setInterval(() => {
      console.log('📰 30-minute news data refresh...');
      dispatch(fetchAllNews());
    }, 30 * 60 * 1000); // Every 30 minutes

    return () => {
      clearInterval(emotionInterval);
      clearInterval(newsInterval);
    };
  }, [dispatch]);

  return null; // This component doesn't render anything
}