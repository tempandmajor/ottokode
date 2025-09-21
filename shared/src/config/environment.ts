/**
 * Centralized environment configuration
 * Replaces multiple env validation files across the project
 */

export interface EnvConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    name: string;
    version: string;
    domain: string;
    isDesktop: boolean;
    isDevelopment: boolean;
    isProduction: boolean;
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
  security: {
    enableCSP: boolean;
    enableHSTS: boolean;
    strictMode: boolean;
  };
}

export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvConfig | null = null;

  static getInstance(): EnvironmentManager {
    if (!this.instance) {
      this.instance = new EnvironmentManager();
    }
    return this.instance;
  }

  getConfig(): EnvConfig {
    if (!this.config) {
      this.config = this.validateAndBuildConfig();
    }
    return this.config;
  }

  private validateAndBuildConfig(): EnvConfig {
    // Determine environment context
    const isDesktop = typeof window !== 'undefined' && '__TAURI__' in window;
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';
    const isBuildTime = typeof window === 'undefined' && isProduction;

    // Required environment variables
    const supabaseUrl = this.getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseAnonKey = this.getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    // Validate required variables (but allow placeholders during build)
    if (!supabaseUrl && !isBuildTime) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
    }
    if (!supabaseAnonKey && !isBuildTime) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
    }

    const config: EnvConfig = {
      supabase: {
        url: supabaseUrl || 'https://placeholder.supabase.co',
        anonKey: supabaseAnonKey || 'placeholder_anon_key',
      },
      app: {
        name: this.getEnvVar('NEXT_PUBLIC_APP_NAME', 'Ottokode'),
        version: this.getEnvVar('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
        domain: this.getEnvVar('NEXT_PUBLIC_APP_DOMAIN', 'https://ottokode.com'),
        isDesktop,
        isDevelopment,
        isProduction,
      },
      ai: {
        openai: this.getSecureEnvVar('NEXT_PUBLIC_OPENAI_API_KEY'),
        anthropic: this.getSecureEnvVar('NEXT_PUBLIC_ANTHROPIC_API_KEY'),
        google: this.getSecureEnvVar('NEXT_PUBLIC_GOOGLE_AI_API_KEY'),
        cohere: this.getSecureEnvVar('NEXT_PUBLIC_COHERE_API_KEY'),
        mistral: this.getSecureEnvVar('NEXT_PUBLIC_MISTRAL_API_KEY'),
      },
      stripe: this.getSecureEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
        ? { publishableKey: this.getSecureEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')! }
        : undefined,
      features: {
        debug: this.getBooleanEnvVar('NEXT_PUBLIC_DEBUG_MODE', false),
        analytics: this.getBooleanEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS', true),
        enterprise: this.getBooleanEnvVar('NEXT_PUBLIC_ENABLE_ENTERPRISE_FEATURES', false),
        collaboration: this.getBooleanEnvVar('NEXT_PUBLIC_ENABLE_COLLABORATION', true),
        aiChat: this.getBooleanEnvVar('NEXT_PUBLIC_ENABLE_AI_CHAT', true),
      },
      security: {
        enableCSP: this.getBooleanEnvVar('NEXT_PUBLIC_ENABLE_CSP', true),
        enableHSTS: this.getBooleanEnvVar('NEXT_PUBLIC_ENABLE_HSTS', isProduction),
        strictMode: this.getBooleanEnvVar('NEXT_PUBLIC_STRICT_MODE', isProduction),
      },
    };

    // Validate configuration
    this.validateConfig(config, isBuildTime);

    return config;
  }

  private getEnvVar(key: string, defaultValue?: string): string {
    return process.env[key] || defaultValue || '';
  }

  private getBooleanEnvVar(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  private getSecureEnvVar(key: string): string | undefined {
    const value = process.env[key];
    if (!value || value.includes('PLACEHOLDER') || value.includes('placeholder')) {
      return undefined;
    }
    return value;
  }

  private validateConfig(config: EnvConfig, isBuildTime: boolean): void {
    const issues: string[] = [];

    // Check for placeholder values
    if (config.supabase.url.includes('placeholder') && !isBuildTime) {
      issues.push('Supabase URL not configured');
    }
    if (config.supabase.anonKey.includes('placeholder') && !isBuildTime) {
      issues.push('Supabase anon key not configured');
    }

    // Check for at least one AI provider in production
    if (config.app.isProduction && Object.values(config.ai).every(key => !key)) {
      issues.push('No AI providers configured');
    }

    // Security validation
    if (config.app.isProduction && !config.security.strictMode) {
      console.warn('⚠️ Strict mode disabled in production');
    }

    if (issues.length > 0 && !isBuildTime) {
      console.error('❌ Environment validation failed:', issues);
      if (config.app.isProduction) {
        throw new Error(`Environment validation failed: ${issues.join(', ')}`);
      }
    }

    if (issues.length > 0 && isBuildTime) {
      console.warn('⚠️ Build-time environment issues:', issues);
    }
  }

  getAvailableAIProviders(): string[] {
    const config = this.getConfig();
    const providers: string[] = [];

    if (config.ai.openai) providers.push('OpenAI');
    if (config.ai.anthropic) providers.push('Anthropic');
    if (config.ai.google) providers.push('Google AI');
    if (config.ai.cohere) providers.push('Cohere');
    if (config.ai.mistral) providers.push('Mistral');

    return providers;
  }

  isProductionReady(): { ready: boolean; issues: string[] } {
    const config = this.getConfig();
    const issues: string[] = [];

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
}

// Export singleton instance
export const environment = EnvironmentManager.getInstance();