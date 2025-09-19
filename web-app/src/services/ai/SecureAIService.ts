import { getSupabaseClient } from '@/lib/supabase'

export type ChatRole = 'system' | 'user' | 'assistant'
export interface ChatMessage { role: ChatRole; content: string }
export type Provider = 'local' | 'openai' | 'anthropic' | 'google'

export interface ChatResult {
  provider: Provider
  text: string
  usage?: { tokens: number; cost_cents: number; limited?: boolean }
  error?: string
}

export class SecureAIService {
  private static async getAuthHeader() {
    try {
      const supabase = getSupabaseClient()
      const { data } = await supabase.auth.getSession()
      const access = data?.session?.access_token
      return access ? { Authorization: `Bearer ${access}` } : {}
    } catch {
      return {}
    }
  }

  static async chat(messages: ChatMessage[], provider: Provider = 'local', options?: { max_tokens?: number; temperature?: number }): Promise<ChatResult> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(await this.getAuthHeader()),
    }

    // Use env public URL if provided, otherwise fall back to relative path (when served behind Supabase)
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const url = baseUrl
      ? `${baseUrl}/functions/v1/ai-chat`
      : `/functions/v1/ai-chat`

    const r = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ provider, messages, ...options }),
    })

    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      return { provider, text: '', usage: data?.usage, error: data?.error || `HTTP ${r.status}` }
    }

    return data as ChatResult
  }
}
