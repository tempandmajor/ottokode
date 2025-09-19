'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGithub: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    // Get initial session with error handling
    supabase.auth.getSession()
      .then(({ data: { session }, error }: { data: { session: Session | null }; error: AuthError | null }) => {
        if (error) {
          console.error('Error getting session:', error);
          throw error;
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((error: unknown) => {
        console.error('Auth initialization error:', error);
        setLoading(false);
        // Don't throw here to prevent app crash, but user will see auth issues
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Create user profile if it doesn't exist
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: existingUser, error: selectError } = await supabase
            .from('users')
            .select('id')
            .eq('id', session.user.id)
            .single();

          if (selectError && selectError.code !== 'PGRST116') {
            console.error('Error checking existing user:', selectError);
            return;
          }

          if (!existingUser) {
            const { error: insertError } = await supabase.from('users').insert({
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              color: getRandomColor()
            });

            if (insertError) {
              console.error('Error creating user profile:', insertError);
              // Continue anyway - the app can work without the profile
            }
          }
        } catch (error) {
          console.error('Error handling user profile:', error);
          // Continue anyway - authentication still works
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  };

  const signInWithGithub = async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/ide`,
      },
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGithub,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function getRandomColor(): string {
  const colors = [
    '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
    '#EC4899', '#84CC16', '#6366F1', '#F97316', '#14B8A6'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}