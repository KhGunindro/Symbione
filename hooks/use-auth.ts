'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthUser extends User {
  user_metadata: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
  };
}

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
        } else {
          setUser(session?.user as AuthUser || null);
        }
      } catch (err) {
        console.error('Unexpected error getting session:', err);
        setError('Failed to get session');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setUser(session?.user as AuthUser || null);
        setLoading(false);
        setError(null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        setError(error.message);
      } else {
        setUser(null);
        console.log('Successfully signed out');
      }
    } catch (err) {
      console.error('Unexpected error signing out:', err);
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    logout
  };
}