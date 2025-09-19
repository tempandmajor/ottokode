import { AIMessage, AIStreamCallback } from '../../types/ai';
import { getSupabaseClient } from '../../web-app/src/lib/supabase';

export interface SecureAIRequest {
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  model: string;
  messages: AIMessage[];
  options?: {
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
    onStream?: AIStreamCallback;
  };
}

export interface SecureAIResponse {
  role: 'assistant';
  content: string;
  timestamp: Date;
  tokens?: number;
  cost?: number;
  provider: string;
  remainingTokens?: number;
}

export interface UsageLimits {
  dailyTokenLimit: number;
  dailyCostLimit: number;
  remainingTokens: number;
  remainingCost: number;
}

export class SecureAIService {
  private supabase = getSupabaseClient();

  async chat(request: SecureAIRequest): Promise<SecureAIResponse> {
    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Authentication required. Please sign in to use AI features.');
      }

      // Make request to our secure Edge Function
      const response = await fetch(`${this.getSupabaseUrl()}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 429) {
          throw new Error(`Usage limit exceeded: ${errorData.details || 'Too many requests'}`);
        }

        if (response.status === 401) {
          throw new Error('Authentication failed. Please sign in again.');
        }

        if (response.status === 503) {
          throw new Error(`AI provider not available: ${errorData.error || 'Service unavailable'}`);
        }

        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();

      return {
        ...data,
        timestamp: new Date(data.timestamp)
      };

    } catch (error) {
      console.error('Secure AI Service Error:', error);
      throw error;
    }
  }

  async getUsageLimits(): Promise<UsageLimits> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();

      if (!session) {
        throw new Error('Authentication required');
      }

      // Get today's usage
      const today = new Date().toISOString().split('T')[0];

      const { data: todayUsage, error } = await this.supabase
        .from('ai_usage_records')
        .select('total_tokens, cost')
        .eq('user_id', session.user.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      if (error) {
        throw new Error(`Failed to fetch usage data: ${error.message}`);
      }

      const totalTokensToday = todayUsage?.reduce((sum, record) => sum + record.total_tokens, 0) || 0;
      const totalCostToday = todayUsage?.reduce((sum, record) => sum + record.cost, 0) || 0;

      // Free tier limits
      const DAILY_TOKEN_LIMIT = 50000; // 50k tokens per day
      const DAILY_COST_LIMIT = 1.00; // $1 per day

      return {
        dailyTokenLimit: DAILY_TOKEN_LIMIT,
        dailyCostLimit: DAILY_COST_LIMIT,
        remainingTokens: Math.max(0, DAILY_TOKEN_LIMIT - totalTokensToday),
        remainingCost: Math.max(0, DAILY_COST_LIMIT - totalCostToday)
      };

    } catch (error) {
      console.error('Failed to get usage limits:', error);
      throw error;
    }
  }

  async getUsageHistory(days: number = 7): Promise<any[]> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();

      if (!session) {
        throw new Error('Authentication required');
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: usage, error } = await this.supabase
        .from('ai_usage_records')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch usage history: ${error.message}`);
      }

      return usage || [];

    } catch (error) {
      console.error('Failed to get usage history:', error);
      throw error;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      return !!session;
    } catch {
      return false;
    }
  }

  async getAvailableProviders(): Promise<string[]> {
    // Always include local provider
    const providers = ['local'];

    try {
      // Check which providers are configured on the server
      // by making a test request (this could be optimized with a dedicated endpoint)
      const { data: { session } } = await this.supabase.auth.getSession();

      if (session) {
        // You could create a separate Edge Function to check provider availability
        // For now, we'll assume OpenAI and Anthropic are available if user is authenticated
        providers.push('openai', 'anthropic', 'google');
      }
    } catch (error) {
      console.warn('Could not check provider availability:', error);
    }

    return providers;
  }

  private getSupabaseUrl(): string {
    // Get Supabase URL from environment
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL not configured');
    }
    return url;
  }

  // Utility method for streaming responses (future enhancement)
  async streamChat(request: SecureAIRequest): Promise<ReadableStream> {
    const { data: { session } } = await this.supabase.auth.getSession();

    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${this.getSupabaseUrl()}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...request, options: { ...request.options, stream: true } }),
    });

    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.status}`);
    }

    return response.body || new ReadableStream();
  }
}

// Singleton instance
export const secureAIService = new SecureAIService();