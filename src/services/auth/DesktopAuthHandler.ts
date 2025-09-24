import { EventEmitter } from '../../utils/EventEmitter';
import { supabase } from '../../lib/supabase';
import { AuthUser, AuthState } from './AuthService';

export interface DesktopAuthConfig {
  webAppUrl: string;
  redirectScheme: string;
  authEndpoint: string;
  tokenEndpoint: string;
}

export class DesktopAuthHandler extends EventEmitter {
  private config: DesktopAuthConfig;
  private currentUser: AuthUser | null = null;
  private loading: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor(config: DesktopAuthConfig) {
    super();
    this.config = config;
    this.initializeDesktopAuth();
  }

  private async initializeDesktopAuth(): Promise<void> {
    this.loading = true;
    this.emit('authStateChanged', this.getAuthState());

    try {
      // Check if we have a stored session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting stored session:', error);
      } else if (session) {
        await this.handleSession(session);
        this.loading = false;
        this.emit('authStateChanged', this.getAuthState());
        return;
      }

      // Check for URL-based authentication (from web redirect)
      await this.checkForAuthCallback();

    } catch (error) {
      console.error('Error initializing desktop auth:', error);
    } finally {
      this.loading = false;
      this.emit('authStateChanged', this.getAuthState());
    }

    // Listen for auth state changes from Supabase
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Desktop auth state changed:', event);

      if (event === 'SIGNED_IN' && session) {
        await this.handleSession(session);
      } else if (event === 'SIGNED_OUT') {
        this.clearSession();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        await this.handleSession(session);
      }
    });
  }

  /**
   * Initiates authentication by opening web browser
   * This is the primary authentication method for desktop app
   */
  public async signInViaBrowser(): Promise<void> {
    try {
      // Create a unique session ID for this auth attempt
      const sessionId = this.generateSessionId();

      // Construct authentication URL with callback scheme
      const authUrl = new URL(`${this.config.webAppUrl}${this.config.authEndpoint}`);
      authUrl.searchParams.set('desktop_auth', 'true');
      authUrl.searchParams.set('session_id', sessionId);
      authUrl.searchParams.set('redirect_uri', `${this.config.redirectScheme}://auth/callback`);

      console.log('Opening browser for authentication:', authUrl.toString());

      // Open browser for authentication
      await this.openExternalBrowser(authUrl.toString());

      // Start polling for authentication completion
      this.startAuthPolling(sessionId);

    } catch (error) {
      console.error('Error initiating browser authentication:', error);
      this.emit('authError', error);
    }
  }

  /**
   * Alternative authentication method using manual token input
   * Fallback for cases where browser redirect fails
   */
  public async signInWithToken(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify token with backend
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        return { success: false, error: 'Invalid authentication token' };
      }

      // Set session with token
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: '' // Will be provided by the token validation
      });

      if (sessionError) {
        return { success: false, error: sessionError.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to authenticate with token' };
    }
  }

  /**
   * Sign out and clear all authentication data
   */
  public async signOut(): Promise<void> {
    try {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }

      await supabase.auth.signOut();
      this.clearSession();
    } catch (error) {
      console.error('Error signing out:', error);
      // Clear session even if API call fails
      this.clearSession();
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  /**
   * Get current authentication state
   */
  public getAuthState(): AuthState {
    return {
      user: this.currentUser,
      session: null, // Desktop doesn't expose session directly
      loading: this.loading,
      isAuthenticated: this.isAuthenticated()
    };
  }

  /**
   * Get current authenticated user
   */
  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Open web browser to specific URL
   */
  public async openWebDashboard(): Promise<void> {
    const dashboardUrl = `${this.config.webAppUrl}/dashboard`;
    await this.openExternalBrowser(dashboardUrl);
  }

  // Private methods

  private async openExternalBrowser(url: string): Promise<void> {
    try {
      // Use Tauri API to open external browser if available
      if (typeof window !== 'undefined' && 'open' in window) {
        const { open } = await import('@tauri-apps/api/shell');
        await open(url);
      } else {
        // Fallback for development
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error opening browser:', error);
      throw new Error('Failed to open authentication browser');
    }
  }

  private async checkForAuthCallback(): Promise<void> {
    // Check if app was opened with auth callback URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('access_token');
    const sessionId = urlParams.get('session_id');

    if (token && sessionId) {
      console.log('Processing auth callback with token');
      const result = await this.signInWithToken(token);

      if (!result.success) {
        console.error('Auth callback failed:', result.error);
        this.emit('authError', new Error(result.error));
      }

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  private startAuthPolling(sessionId: string): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    // Poll for authentication completion every 2 seconds
    this.pollInterval = setInterval(async () => {
      try {
        // Check if authentication completed by trying to get session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log('Authentication completed via polling');
          if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
          }
          await this.handleSession(session);
        }
      } catch (error) {
        console.error('Error polling for auth completion:', error);
      }
    }, 2000);

    // Stop polling after 5 minutes
    setTimeout(() => {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
        console.log('Authentication polling timeout');
      }
    }, 300000);
  }

  private async handleSession(session: any): Promise<void> {
    try {
      if (session.user) {
        // Fetch user profile
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          // Create basic user from auth data
          this.currentUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            avatar_url: session.user.user_metadata?.avatar_url,
            color: '#4F46E5'
          };
        } else {
          this.currentUser = {
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.name || session.user.email?.split('@')[0],
            avatar_url: userProfile.avatar_url,
            color: userProfile.color || '#4F46E5'
          };
        }

        console.log('Desktop authentication successful for:', this.currentUser.email);
        this.emit('authStateChanged', this.getAuthState());
        this.emit('authSuccess', this.currentUser);
      }
    } catch (error) {
      console.error('Error handling session:', error);
      this.emit('authError', error);
    }
  }

  private clearSession(): void {
    this.currentUser = null;
    console.log('Desktop session cleared');
    this.emit('authStateChanged', this.getAuthState());
    this.emit('authSignedOut');
  }

  private generateSessionId(): string {
    return `desktop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Configuration for production
const desktopAuthConfig: DesktopAuthConfig = {
  webAppUrl: 'https://ottokode.com', // Your web app URL
  redirectScheme: 'ottokode',
  authEndpoint: '/auth/desktop',
  tokenEndpoint: '/auth/token'
};

export const desktopAuthHandler = new DesktopAuthHandler(desktopAuthConfig);