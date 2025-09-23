import { createClient } from '@supabase/supabase-js';

// For Tauri desktop app - hardcoded for now, can be configured at build time
const supabaseUrl = 'https://gbugafddunddrvkvgifl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdidWdhZmRkdW5kZHJ2a3ZnaWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYyMTIyNzgsImV4cCI6MjA0MTc4ODI3OH0.VXxY7Nc6QNJYfX8FU-nJF8nHtjhYX5vPGq8KnVu9X7o';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database Types
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