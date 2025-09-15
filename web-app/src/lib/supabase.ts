import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0OTQyNjI3MiwiZXhwIjoxOTY1MDAyMjcyfQ.nBx9ZkJLgKBsGDLc9MjVSMw_Q-4pNvDv5XslJSrKKBE';

// For desktop builds, we'll use placeholder values
// This will trigger for all production builds without real Supabase config
const isPlaceholder = supabaseUrl.includes('xyzcompany');

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

// Always use mock client for desktop/production builds without real Supabase
export const supabase = mockClient;

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