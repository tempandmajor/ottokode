import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { EventEmitter } from '../../utils/EventEmitter';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  color: string;
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

class AuthService extends EventEmitter {
  private currentUser: AuthUser | null = null;
  private currentSession: Session | null = null;
  private loading: boolean = true;

  constructor() {
    super();
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
      } else if (session) {
        await this.setSession(session);
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (event === 'SIGNED_IN' && session) {
          await this.setSession(session);
        } else if (event === 'SIGNED_OUT') {
          this.clearSession();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          await this.setSession(session);
        }
      });

    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      this.loading = false;
      this.emit('authStateChanged', this.getAuthState());
    }
  }

  private async setSession(session: Session) {
    this.currentSession = session;

    if (session.user) {
      // Fetch user profile from our users table
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // Create a basic user object from auth data
        this.currentUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
          avatar_url: session.user.user_metadata?.avatar_url,
          color: '#007acc'
        };
      } else {
        this.currentUser = {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name || session.user.email?.split('@')[0],
          avatar_url: userProfile.avatar_url,
          color: userProfile.color
        };
      }
    }

    this.emit('authStateChanged', this.getAuthState());
  }

  private clearSession() {
    this.currentUser = null;
    this.currentSession = null;
    this.emit('authStateChanged', this.getAuthState());
  }

  public getAuthState(): AuthState {
    return {
      user: this.currentUser,
      session: this.currentSession,
      loading: this.loading,
      isAuthenticated: this.isAuthenticated()
    };
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return !!this.currentUser && !!this.currentSession;
  }

  // Sign up with email and password
  public async signUp(email: string, password: string, name?: string): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0]
        }
      }
    });

    if (error) {
      console.error('Sign up error:', error);
    }

    return { user: data.user, error };
  }

  // Sign in with email and password
  public async signIn(email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Sign in error:', error);
    }

    return { user: data.user, error };
  }

  // Sign in with OAuth provider
  public async signInWithOAuth(provider: 'github' | 'google' | 'discord'): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      console.error('OAuth sign in error:', error);
    }

    return { error };
  }

  // Sign out
  public async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
    }

    return { error };
  }

  // Update user profile
  public async updateProfile(updates: Partial<AuthUser>): Promise<{ error: any }> {
    if (!this.currentUser) {
      return { error: new Error('No authenticated user') };
    }

    const { error } = await supabase
      .from('users')
      .update({
        name: updates.name,
        avatar_url: updates.avatar_url,
        color: updates.color
      })
      .eq('id', this.currentUser.id);

    if (error) {
      console.error('Profile update error:', error);
      return { error };
    }

    // Update local user state
    this.currentUser = { ...this.currentUser, ...updates };
    this.emit('authStateChanged', this.getAuthState());

    return { error: null };
  }

  // Reset password
  public async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      console.error('Password reset error:', error);
    }

    return { error };
  }

  // Update password
  public async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('Password update error:', error);
    }

    return { error };
  }

  // Event listener for auth state changes
  public onAuthStateChange(callback: (state: AuthState) => void): () => void {
    const handler = (state: AuthState) => callback(state);
    this.on('authStateChanged', handler);
    return () => this.off('authStateChanged', handler);
  }
}

export const authService = new AuthService();