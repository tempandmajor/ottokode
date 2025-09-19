import { createClient } from '@supabase/supabase-js';

// Create a mock client for desktop builds or when Supabase is not configured
const mockClient = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
    signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    update: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    delete: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
  })
} as any;

// Lazily create the client to avoid build-time evaluation errors
let _client: any | null = null;

function getSupabaseClient() {
  // Always return mock client during build time or if URL contains placeholder
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    return mockClient;
  }

  if (url?.includes('placeholder') || key?.includes('placeholder')) {
    return mockClient;
  }

  if (_client) return _client;

  try {
    const isValidUrl = !!url && /^https:\/\/.+supabase\.co$/i.test(url);
    const isValidKey = !!key && key.length > 10;

    if (isValidUrl && isValidKey) {
      _client = createClient(url, key);
      return _client;
    }
  } catch (e) {
    // fall through to mock
  }

  _client = mockClient;
  return _client;
}

// Export the function as createClient for consistent naming
export { getSupabaseClient as createClient };

// Database Types (shared with desktop app)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_usage_records: {
        Row: {
          id: string;
          user_id: string;
          timestamp: string;
          provider: string;
          model: string;
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
          cost: number;
          request_type: 'chat' | 'completion' | 'streaming' | 'function_call';
          request_duration: number;
          success: boolean;
          error_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          timestamp?: string;
          provider: string;
          model: string;
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
          cost?: number;
          request_type: 'chat' | 'completion' | 'streaming' | 'function_call';
          request_duration?: number;
          success?: boolean;
          error_code?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          timestamp?: string;
          provider?: string;
          model?: string;
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
          cost?: number;
          request_type?: 'chat' | 'completion' | 'streaming' | 'function_call';
          request_duration?: number;
          success?: boolean;
          error_code?: string | null;
          created_at?: string;
        };
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          model: string;
          provider: string;
          total_tokens: number;
          total_cost: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          model: string;
          provider: string;
          total_tokens?: number;
          total_cost?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          model?: string;
          provider?: string;
          total_tokens?: number;
          total_cost?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system' | 'function';
          content: string;
          tokens: number | null;
          cost: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system' | 'function';
          content: string;
          tokens?: number | null;
          cost?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant' | 'system' | 'function';
          content?: string;
          tokens?: number | null;
          cost?: number | null;
          created_at?: string;
        };
      };
      collaboration_sessions: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner_id: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          owner_id?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      cost_alerts: {
        Row: {
          id: string;
          user_id: string;
          alert_type: 'budget_exceeded' | 'unusual_spike' | 'daily_limit' | 'monthly_limit';
          message: string;
          provider: string | null;
          amount: number;
          threshold: number;
          created_at: string;
          acknowledged_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          alert_type: 'budget_exceeded' | 'unusual_spike' | 'daily_limit' | 'monthly_limit';
          message: string;
          provider?: string | null;
          amount: number;
          threshold: number;
          created_at?: string;
          acknowledged_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          alert_type?: 'budget_exceeded' | 'unusual_spike' | 'daily_limit' | 'monthly_limit';
          message?: string;
          provider?: string | null;
          amount?: number;
          threshold?: number;
          created_at?: string;
          acknowledged_at?: string | null;
        };
      };
    };
  };
}