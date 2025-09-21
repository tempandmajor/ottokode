import { createClient } from '@/lib/supabase'
import { SubscriptionService } from '@/services/subscription/SubscriptionService'
import { aiService, initializeAIProviders, environment } from '@ottokode/shared'
import type { ChatMessage as SharedChatMessage } from '@ottokode/shared'

// Re-export shared types with compatibility layer
export type ChatRole = 'system' | 'user' | 'assistant'
export interface ChatMessage { role: ChatRole; content: string }
export type Provider = 'local' | 'openai' | 'anthropic' | 'google'

export interface ChatResult {
  provider: Provider
  text: string
  usage?: { tokens: number; cost_cents: number; limited?: boolean }
  error?: string
  creditWarning?: string
}

export class SecureAIService {
  // Initialize AI providers on first use
  private static initialized = false;

  private static ensureInitialized() {
    if (!this.initialized) {
      initializeAIProviders();
      this.initialized = true;
    }
  }

  private static async getAuthHeader() {
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      const access = data?.session?.access_token
      const headers: Record<string, string> = {}
      if (access) headers.Authorization = `Bearer ${access}`
      return headers
    } catch {
      return {} as Record<string, string>
    }
  }

  static async chat(messages: ChatMessage[], provider: Provider = 'local', options?: { max_tokens?: number; temperature?: number }): Promise<ChatResult> {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      // Check user credits before making request
      if (session?.user) {
        const credits = await SubscriptionService.getUserCredits(session.user.id)
        if (credits && credits.available_credits < 0.01) {
          return {
            provider,
            text: '',
            error: 'Insufficient credits. Please upgrade your plan or purchase additional credits.',
            creditWarning: 'Your credit balance is too low to make AI requests.'
          }
        }
      }

      const auth = await this.getAuthHeader()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...Object.fromEntries(Object.entries(auth).filter(([_, v]) => v !== undefined))
      }

      // Use env public URL if provided, otherwise fall back to relative path (when served behind Supabase)
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const url = baseUrl
        ? `${baseUrl}/functions/v1/ai-chat`
        : `/functions/v1/ai-chat`

      const r = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          provider,
          messages,
          userId: session?.user?.id,
          ...options
        }),
      })

      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        return { provider, text: '', usage: data?.usage, error: data?.error || `HTTP ${r.status}` }
      }

      // Add credit warning if running low
      if (session?.user && data.usage?.cost_cents) {
        const credits = await SubscriptionService.getUserCredits(session.user.id)
        if (credits && credits.available_credits < 1) {
          data.creditWarning = 'You\'re running low on credits. Consider upgrading your plan.'
        }
      }

      return data as ChatResult
    } catch (error) {
      console.error('AI service error:', error)
      return {
        provider,
        text: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Direct AI chat using shared service (for desktop or when credits aren't needed)
   */
  static async directChat(messages: ChatMessage[], providerName?: string): Promise<string> {
    this.ensureInitialized();

    // Convert to shared format
    const sharedMessages: SharedChatMessage[] = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      return await aiService.chat(sharedMessages, providerName);
    } catch (error) {
      console.error('Direct AI service error:', error);
      throw error;
    }
  }

  /**
   * Generate code using shared service
   */
  static async generateCode(prompt: string, language?: string, providerName?: string): Promise<string> {
    this.ensureInitialized();

    try {
      return await aiService.generateCode(prompt, language, providerName);
    } catch (error) {
      console.error('AI code generation error:', error);
      throw error;
    }
  }

  /**
   * Get available AI providers
   */
  static getAvailableProviders(): string[] {
    this.ensureInitialized();
    return aiService.getAvailableProviders().map(provider => provider.name);
  }
}
