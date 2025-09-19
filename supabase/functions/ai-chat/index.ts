import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// AI Provider configurations
const AI_PROVIDERS = {
  openai: {
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    defaultModel: 'gpt-4o-mini'
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1/messages',
    authHeader: 'x-api-key',
    authPrefix: '',
    defaultModel: 'claude-3-5-sonnet-20241022'
  },
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    defaultModel: 'gemini-pro'
  }
}

interface AIRequest {
  provider: 'openai' | 'anthropic' | 'google' | 'local'
  model: string
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  options?: {
    maxTokens?: number
    temperature?: number
    stream?: boolean
  }
}

interface UsageRecord {
  user_id: string
  provider: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cost: number
  request_type: string
  request_duration: number
  success: boolean
  error_code?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get user from auth token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { provider, model, messages, options }: AIRequest = await req.json()

    // Validate request
    if (!provider || !messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check usage limits for the user
    const usageCheck = await checkUsageLimits(supabaseClient, user.id, provider)
    if (!usageCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Usage limit exceeded',
          details: usageCheck.reason,
          remainingTokens: usageCheck.remainingTokens
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const startTime = Date.now()

    // Handle local AI provider
    if (provider === 'local') {
      const localResponse = await generateLocalAIResponse(messages)
      const duration = Date.now() - startTime

      // Record usage
      await recordUsage(supabaseClient, {
        user_id: user.id,
        provider: 'local',
        model: 'ottokode-assistant',
        prompt_tokens: estimateTokens(messages.map(m => m.content).join(' ')),
        completion_tokens: estimateTokens(localResponse.content),
        total_tokens: estimateTokens(messages.map(m => m.content).join(' ') + localResponse.content),
        cost: 0,
        request_type: 'chat',
        request_duration: duration,
        success: true
      })

      return new Response(
        JSON.stringify(localResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get API key for the provider
    const apiKey = await getProviderApiKey(provider)
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: `${provider} not configured on server` }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Make request to AI provider
    const aiResponse = await callAIProvider(provider, model, messages, options || {}, apiKey)
    const duration = Date.now() - startTime

    // Calculate costs and usage
    const usage = calculateUsage(provider, aiResponse)

    // Record usage in database
    await recordUsage(supabaseClient, {
      user_id: user.id,
      provider,
      model,
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      total_tokens: usage.totalTokens,
      cost: usage.cost,
      request_type: options?.stream ? 'streaming' : 'chat',
      request_duration: duration,
      success: true
    })

    return new Response(
      JSON.stringify(aiResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('AI Chat Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function getProviderApiKey(provider: string): Promise<string | null> {
  switch (provider) {
    case 'openai':
      return Deno.env.get('OPENAI_API_KEY')
    case 'anthropic':
      return Deno.env.get('ANTHROPIC_API_KEY')
    case 'google':
      return Deno.env.get('GOOGLE_AI_API_KEY')
    default:
      return null
  }
}

async function callAIProvider(
  provider: string,
  model: string,
  messages: any[],
  options: any,
  apiKey: string
): Promise<any> {
  const config = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS]
  if (!config) {
    throw new Error(`Unsupported provider: ${provider}`)
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    [config.authHeader]: `${config.authPrefix}${apiKey}`
  }

  let body: any
  let url = config.baseUrl

  switch (provider) {
    case 'openai':
      body = {
        model: model || config.defaultModel,
        messages,
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.7,
        stream: false // Handle streaming separately if needed
      }
      break

    case 'anthropic':
      headers['anthropic-version'] = '2023-06-01'
      body = {
        model: model || config.defaultModel,
        messages: messages.filter(m => m.role !== 'system'),
        system: messages.find(m => m.role === 'system')?.content,
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.7
      }
      break

    case 'google':
      url = `${config.baseUrl}/${model || config.defaultModel}:generateContent?key=${apiKey}`
      headers[config.authHeader] = '' // Google uses query param for auth
      body = {
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : m.role,
          parts: [{ text: m.content }]
        })),
        generationConfig: {
          maxOutputTokens: options.maxTokens || 2000,
          temperature: options.temperature || 0.7
        }
      }
      break

    default:
      throw new Error(`Provider ${provider} not implemented`)
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`${provider} API error: ${response.status} ${errorData}`)
  }

  const data = await response.json()

  // Normalize response format
  return normalizeAIResponse(provider, data)
}

function normalizeAIResponse(provider: string, data: any): any {
  switch (provider) {
    case 'openai':
      return {
        role: 'assistant',
        content: data.choices[0]?.message?.content || '',
        timestamp: new Date(),
        tokens: data.usage?.total_tokens,
        cost: 0, // Calculate in calculateUsage
        provider: 'openai'
      }

    case 'anthropic':
      return {
        role: 'assistant',
        content: data.content[0]?.text || '',
        timestamp: new Date(),
        tokens: data.usage?.input_tokens + data.usage?.output_tokens,
        cost: 0,
        provider: 'anthropic'
      }

    case 'google':
      return {
        role: 'assistant',
        content: data.candidates[0]?.content?.parts[0]?.text || '',
        timestamp: new Date(),
        tokens: data.usageMetadata?.totalTokenCount || 0,
        cost: 0,
        provider: 'google'
      }

    default:
      return data
  }
}

function calculateUsage(provider: string, response: any): any {
  const tokens = response.tokens || 0
  let cost = 0

  // Simplified cost calculation - you can make this more sophisticated
  switch (provider) {
    case 'openai':
      cost = (tokens / 1000) * 0.002 // Rough estimate
      break
    case 'anthropic':
      cost = (tokens / 1000) * 0.004
      break
    case 'google':
      cost = (tokens / 1000) * 0.001
      break
  }

  return {
    promptTokens: Math.floor(tokens * 0.7), // Rough estimate
    completionTokens: Math.floor(tokens * 0.3),
    totalTokens: tokens,
    cost
  }
}

async function checkUsageLimits(supabase: any, userId: string, provider: string): Promise<{
  allowed: boolean
  reason?: string
  remainingTokens?: number
}> {
  // Check daily usage limits
  const today = new Date().toISOString().split('T')[0]

  const { data: todayUsage } = await supabase
    .from('ai_usage_records')
    .select('total_tokens, cost')
    .eq('user_id', userId)
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at', `${today}T23:59:59.999Z`)

  const totalTokensToday = todayUsage?.reduce((sum: number, record: any) => sum + record.total_tokens, 0) || 0
  const totalCostToday = todayUsage?.reduce((sum: number, record: any) => sum + record.cost, 0) || 0

  // Free tier limits
  const DAILY_TOKEN_LIMIT = 50000 // 50k tokens per day for free users
  const DAILY_COST_LIMIT = 1.00 // $1 per day max

  if (totalTokensToday >= DAILY_TOKEN_LIMIT) {
    return {
      allowed: false,
      reason: 'Daily token limit exceeded',
      remainingTokens: 0
    }
  }

  if (totalCostToday >= DAILY_COST_LIMIT) {
    return {
      allowed: false,
      reason: 'Daily cost limit exceeded',
      remainingTokens: Math.max(0, DAILY_TOKEN_LIMIT - totalTokensToday)
    }
  }

  return {
    allowed: true,
    remainingTokens: Math.max(0, DAILY_TOKEN_LIMIT - totalTokensToday)
  }
}

async function recordUsage(supabase: any, record: UsageRecord): Promise<void> {
  const { error } = await supabase
    .from('ai_usage_records')
    .insert([{
      ...record,
      timestamp: new Date().toISOString()
    }])

  if (error) {
    console.error('Failed to record usage:', error)
  }
}

function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4)
}

async function generateLocalAIResponse(messages: any[]): Promise<any> {
  // Enhanced local AI responses
  const lastMessage = messages[messages.length - 1]
  const userInput = lastMessage.content.toLowerCase()

  // Simple but intelligent responses
  let content = ''

  if (userInput.includes('hello') || userInput.includes('hi')) {
    content = "Hello! I'm Ottokode AI, your free coding assistant. I can help with programming questions, code examples, and development guidance. What would you like to work on today?"
  } else if (userInput.includes('react') || userInput.includes('component')) {
    content = `I can help you with React! Here's a modern functional component pattern:

\`\`\`typescript
import React, { useState, useEffect } from 'react';

interface Props {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onAction?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="component">
      <h2>{title}</h2>
      <button onClick={handleClick} disabled={loading}>
        {loading ? 'Loading...' : 'Action'}
      </button>
    </div>
  );
}
\`\`\`

This follows React best practices with TypeScript, proper error handling, and loading states. Need help with any specific React concept?`
  } else if (userInput.includes('api') || userInput.includes('fetch')) {
    content = `Here's a robust API call pattern:

\`\`\`typescript
async function fetchData<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Usage
const userData = await fetchData<User>('/api/user/123');
\`\`\`

This includes proper error handling, TypeScript generics, and follows async/await best practices.`
  } else {
    content = `I understand you're working on: "${lastMessage.content}"

As your free Ottokode AI assistant, I can help with:
• **Code Examples** - React, TypeScript, Node.js, Python, and more
• **Best Practices** - Clean code, architecture patterns, performance
• **Debugging** - Error analysis and troubleshooting tips
• **Learning** - Explanations of programming concepts

For more advanced AI capabilities with real-time code analysis and complex problem solving, consider configuring an AI provider like OpenAI or Anthropic in your settings.

What specific aspect would you like help with?`
  }

  return {
    role: 'assistant',
    content,
    timestamp: new Date(),
    tokens: estimateTokens(content),
    cost: 0,
    provider: 'local'
  }
}