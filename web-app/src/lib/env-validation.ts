/**
 * Environment variable validation and configuration
 */

import { logger } from './logger';

export interface EnvConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    name: string;
    version: string;
    domain: string;
  };
  ai: {
    openai?: string;
    anthropic?: string;
    google?: string;
    cohere?: string;
    mistral?: string;
  };
  stripe?: {
    publishableKey: string;
  };
  features: {
    debug: boolean;
    analytics: boolean;
    enterprise: boolean;
    collaboration: boolean;
    aiChat: boolean;
  };
}

export function validateEnvironment(): EnvConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Ottokode';
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'https://ottokode.com';

  // During build time, use placeholder values instead of throwing
  const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV === 'production';

  // Validate required environment variables (but don't throw during build)
  if (!supabaseUrl) {
    if (isBuildTime) {
      console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL not configured, using placeholder for build');
    } else {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
    }
  }
  if (!supabaseAnonKey) {
    if (isBuildTime) {
      console.warn('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY not configured, using placeholder for build');
    } else {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
    }
  }

  const required = {
    supabase: {
      url: supabaseUrl || 'https://placeholder.supabase.co',
      anonKey: supabaseAnonKey || 'placeholder_anon_key',
    },
    app: {
      name: appName,
      version: appVersion,
      domain: appDomain,
    },
  };

  // Check for placeholder values
  if (required.supabase.url.includes('your-project') || required.supabase.url.includes('placeholder')) {
    console.warn('⚠️ Supabase URL appears to be a placeholder');
  }
  if (required.supabase.anonKey.includes('placeholder') || required.supabase.anonKey.length < 10) {
    console.warn('⚠️ Supabase anon key appears to be a placeholder');
  }

  const config: EnvConfig = {
    ...required,
    ai: {
      openai: process.env.NEXT_PUBLIC_OPENAI_API_KEY?.includes('PLACEHOLDER') ? undefined : process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      anthropic: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY?.includes('PLACEHOLDER') ? undefined : process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      google: process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY?.includes('PLACEHOLDER') ? undefined : process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY,
      cohere: process.env.NEXT_PUBLIC_COHERE_API_KEY?.includes('PLACEHOLDER') ? undefined : process.env.NEXT_PUBLIC_COHERE_API_KEY,
      mistral: process.env.NEXT_PUBLIC_MISTRAL_API_KEY?.includes('PLACEHOLDER') ? undefined : process.env.NEXT_PUBLIC_MISTRAL_API_KEY,
    },
    stripe: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('PLACEHOLDER') ? undefined : {
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    },
    features: {
      debug: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
      analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
      enterprise: process.env.NEXT_PUBLIC_ENABLE_ENTERPRISE_FEATURES === 'true',
      collaboration: process.env.NEXT_PUBLIC_ENABLE_COLLABORATION === 'true',
      aiChat: process.env.NEXT_PUBLIC_ENABLE_AI_CHAT === 'true',
    },
  };

  // Log configuration status in development
  logger.debug('Environment Configuration', {
    hasSupabase: !!config.supabase.url && !!config.supabase.anonKey,
    hasAIKeys: Object.values(config.ai).some(key => !!key),
    hasStripe: !!config.stripe,
    features: config.features,
  });

  return config;
}

export function getAvailableAIProviders(config: EnvConfig): string[] {
  const providers: string[] = [];

  if (config.ai.openai) providers.push('OpenAI');
  if (config.ai.anthropic) providers.push('Anthropic');
  if (config.ai.google) providers.push('Google AI');
  if (config.ai.cohere) providers.push('Cohere');
  if (config.ai.mistral) providers.push('Mistral');

  return providers;
}

export function isProductionReady(config: EnvConfig): { ready: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for placeholder values
  if (!config.supabase.url || config.supabase.url.includes('placeholder')) {
    issues.push('Supabase URL not configured');
  }
  if (!config.supabase.anonKey || config.supabase.anonKey.includes('placeholder')) {
    issues.push('Supabase anon key not configured');
  }
  if (!config.stripe) {
    issues.push('Stripe not configured');
  }
  if (Object.values(config.ai).every(key => !key)) {
    issues.push('No AI providers configured');
  }

  return {
    ready: issues.length === 0,
    issues
  };
}