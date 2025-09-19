import { createClient } from '@/lib/supabase'
import { AISettingsService } from './AISettingsService'

export type ProviderPref = 'anthropic' | 'openai' | 'auto'

export interface ProposeDiffParams {
  file_path: string
  original_content: string
  user_instruction: string
  retrieved_context?: string
  provider?: ProviderPref
  model?: string
}

export interface ProposeDiffResult {
  unified_diff: string
  file_path: string
  changed: boolean
  provider: ProviderPref | 'local'
  model?: string
}

function getFunctionBaseUrl() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) throw new Error('NEXT_PUBLIC_SUPABASE_URL not set')
  return `${base}/functions/v1`
}

export class PatchService {
  static async proposeDiff(params: ProposeDiffParams): Promise<ProposeDiffResult> {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) throw new Error('Not authenticated')

    // Apply user settings if provider/model not explicitly provided
    const effectiveSettings = AISettingsService.getEffectiveProviderAndModel()
    const requestParams = {
      ...params,
      provider: params.provider || effectiveSettings.provider,
      model: params.model || effectiveSettings.model
    }

    const url = `${getFunctionBaseUrl()}/propose-diff`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestParams)
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data?.error || `HTTP ${res.status}`)
    }

    if (typeof data?.unified_diff !== 'string') {
      throw new Error('Invalid response: missing unified_diff')
    }

    return data as ProposeDiffResult
  }
}
