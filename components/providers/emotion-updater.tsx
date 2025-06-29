'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/lib/store/hooks';
import { checkAndUpdateEmotion } from '@/lib/store/slices/emotionSlice';
import { fetchAllNews } from '@/lib/store/slices/newsSlice';

export default function EmotionUpdater() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initial check and update
    dispatch(checkAndUpdateEmotion());
    dispatch(fetchAllNews());

    // Set up hourly interval for emotion updates
    const emotionInterval = setInterval(() => {
      dispatch(checkAndUpdateEmotion());
    }, 60 * 60 * 1000); // Every hour

    // Set up news data refresh every 30 minutes
    const newsInterval = setInterval(() => {
      dispatch(fetchAllNews());
    }, 30 * 60 * 1000); // Every 30 minutes

    return () => {
      clearInterval(emotionInterval);
      clearInterval(newsInterval);
    };
  }, [dispatch]);

  return null; // This component doesn't render anything
}