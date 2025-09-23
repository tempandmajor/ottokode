import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CohereClient } from 'cohere-ai';
// import MistralClient from '@mistralai/mistralai';
import { AIProvider, AIModel, AIMessage, AIStreamCallback } from '../../types/ai';
import { authService } from '../auth/AuthService';
import { supabase } from '../../lib/supabase';
import { EventEmitter } from '../../utils/EventEmitter';

export interface AIServiceConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  organizationId?: string;
  isUserKey?: boolean; // true if user provided their own key
}

export interface ChatOptions {
  streaming?: boolean;
  maxTokens?: number;
  temperature?: number;
  onStream?: AIStreamCallback;
  persistConversation?: boolean;
  conversationId?: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIResponse {
  content: string;
  usage: TokenUsage;
  cost: number;
  model: string;
  provider: string;
  success: boolean;
  error?: string;
}

class ProductionAIService extends EventEmitter {
  private providers = new Map<string, AIProvider>();
  private clients = new Map<string, any>();
  private configurations = new Map<string, AIServiceConfig>();

  // Production pricing (with markups applied)
  private readonly MODEL_PRICING: Record<string, Record<string, { input: number; output: number }>> = {
    'openai': {
      'gpt-4o': { input: 0.005 * 1.2, output: 0.015 * 1.2 }, // 20% markup
      'gpt-4o-mini': { input: 0.00015 * 1.2, output: 0.0006 * 1.2 },
      'gpt-3.5-turbo': { input: 0.0005 * 1.2, output: 0.0015 * 1.2 },
      'gpt-4-turbo': { input: 0.01 * 1.2, output: 0.03 * 1.2 }
    },
    'anthropic': {
      'claude-3-5-sonnet-20241022': { input: 0.003 * 1.2, output: 0.015 * 1.2 },
      'claude-3-5-haiku-20241022': { input: 0.00025 * 1.2, output: 0.00125 * 1.2 },
      'claude-3-opus-20240229': { input: 0.015 * 1.2, output: 0.075 * 1.2 }
    },
    'google': {
      'gemini-1.5-pro': { input: 0.00125 * 1.2, output: 0.005 * 1.2 },
      'gemini-1.5-flash': { input: 0.000075 * 1.2, output: 0.0003 * 1.2 }
    },
    'cohere': {
      'command-r-plus': { input: 0.003 * 1.2, output: 0.015 * 1.2 },
      'command-r': { input: 0.0005 * 1.2, output: 0.0015 * 1.2 }
    },
    'mistral': {
      'mistral-large-latest': { input: 0.004 * 1.2, output: 0.012 * 1.2 },
      'mistral-medium-latest': { input: 0.00275 * 1.2, output: 0.0081 * 1.2 }
    }
  };

  constructor() {
    super();
    this.initializeProviders();
    this.loadConfigurations();
    this.setupClients();
  }

  private initializeProviders(): void {
    // OpenAI Provider
    this.providers.set('openai', {
      name: 'openai',
      displayName: 'OpenAI',
      models: [
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          provider: 'openai',
          contextLength: 128000,
          costPer1KTokens: { input: 0.005, output: 0.015 },
          supportsStreaming: true,
          supportsVision: true,
          supportsFunctions: true
        },
        {
          id: 'gpt-4o-mini',
          name: 'GPT-4o Mini',
          provider: 'openai',
          contextLength: 128000,
          costPer1KTokens: { input: 0.00015, output: 0.0006 },
          supportsStreaming: true,
          supportsVision: true,
          supportsFunctions: true
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          provider: 'openai',
          contextLength: 16385,
          costPer1KTokens: { input: 0.0005, output: 0.0015 },
          supportsStreaming: true,
          supportsFunctions: true
        }
      ],
      requiresApiKey: true,
      configurable: true
    });

    // Anthropic Provider
    this.providers.set('anthropic', {
      name: 'anthropic',
      displayName: 'Anthropic',
      models: [
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          provider: 'anthropic',
          contextLength: 200000,
          costPer1KTokens: { input: 0.003, output: 0.015 },
          supportsStreaming: true,
          supportsVision: true,
          supportsFunctions: true
        },
        {
          id: 'claude-3-5-haiku-20241022',
          name: 'Claude 3.5 Haiku',
          provider: 'anthropic',
          contextLength: 200000,
          costPer1KTokens: { input: 0.00025, output: 0.00125 },
          supportsStreaming: true,
          supportsVision: true
        }
      ],
      requiresApiKey: true,
      configurable: true
    });

    // Google AI Provider
    this.providers.set('google', {
      name: 'google',
      displayName: 'Google AI',
      models: [
        {
          id: 'gemini-1.5-pro',
          name: 'Gemini 1.5 Pro',
          provider: 'google',
          contextLength: 1048576,
          costPer1KTokens: { input: 0.00125, output: 0.005 },
          supportsStreaming: true,
          supportsVision: true,
          supportsFunctions: true
        },
        {
          id: 'gemini-1.5-flash',
          name: 'Gemini 1.5 Flash',
          provider: 'google',
          contextLength: 1048576,
          costPer1KTokens: { input: 0.000075, output: 0.0003 },
          supportsStreaming: true,
          supportsVision: true,
          supportsFunctions: true
        }
      ],
      requiresApiKey: true,
      configurable: true
    });
  }

  private async loadConfigurations(): Promise<void> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) return;

    try {
      // Load user's API key configurations
      const { data: apiKeys, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', authState.user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Failed to load user API keys:', error);
        return;
      }

      // Set up configurations from user's keys
      apiKeys?.forEach(keyData => {
        this.configurations.set(keyData.provider, {
          provider: keyData.provider,
          apiKey: this.decryptApiKey(keyData.encrypted_key),
          isUserKey: true
        });
      });

      // Also load platform API keys from environment (with lower priority)
      this.loadEnvironmentKeys();

      this.setupClients();
    } catch (error) {
      console.error('Error loading AI configurations:', error);
    }
  }

  private loadEnvironmentKeys(): void {
    // Load from environment variables (platform keys)
    const envKeys = {
      'openai': process.env.REACT_APP_OPENAI_API_KEY,
      'anthropic': process.env.REACT_APP_ANTHROPIC_API_KEY,
      'google': process.env.REACT_APP_GOOGLE_AI_API_KEY,
      'cohere': process.env.REACT_APP_COHERE_API_KEY,
      'mistral': process.env.REACT_APP_MISTRAL_API_KEY
    };

    Object.entries(envKeys).forEach(([provider, key]) => {
      if (key && !this.configurations.has(provider)) {
        this.configurations.set(provider, {
          provider,
          apiKey: key,
          isUserKey: false
        });
      }
    });
  }

  private setupClients(): void {
    this.configurations.forEach((config, provider) => {
      try {
        switch (provider) {
          case 'openai':
            this.clients.set(provider, new OpenAI({
              apiKey: config.apiKey,
              baseURL: config.baseUrl,
              organization: config.organizationId,
              dangerouslyAllowBrowser: true
            }));
            break;

          case 'anthropic':
            this.clients.set(provider, new Anthropic({
              apiKey: config.apiKey,
              baseURL: config.baseUrl,
              dangerouslyAllowBrowser: true
            }));
            break;

          case 'google':
            this.clients.set(provider, new GoogleGenerativeAI(config.apiKey));
            break;

          case 'cohere':
            this.clients.set(provider, new CohereClient({
              token: config.apiKey
            }));
            break;

          case 'mistral':
            // Mistral client setup temporarily disabled due to compatibility issues
            console.warn('Mistral client not available');
            break;
        }
      } catch (error) {
        console.error(`Failed to setup client for ${provider}:`, error);
      }
    });
  }

  private decryptApiKey(encryptedKey: string): string {
    try {
      // Simple base64 decode for secure storage
      const decoded = atob(encryptedKey);
      // In production, add additional encryption layers as needed
      return decoded;
    } catch {
      // If not base64 encoded, assume it's already plaintext
      return encryptedKey;
    }
  }

  private calculateCost(provider: string, model: string, usage: TokenUsage): number {
    const providerPricing = this.MODEL_PRICING[provider];
    if (!providerPricing) return 0;

    const pricing = providerPricing[model];
    if (!pricing) return 0;

    const inputCost = (usage.promptTokens / 1000) * pricing.input;
    const outputCost = (usage.completionTokens / 1000) * pricing.output;

    return inputCost + outputCost;
  }

  private async recordUsage(
    provider: string,
    model: string,
    usage: TokenUsage,
    cost: number,
    success: boolean,
    error?: string
  ): Promise<void> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) return;

    try {
      // Use the database function to record usage and deduct credits
      const { error: usageError } = await supabase.rpc('record_ai_usage', {
        p_user_id: authState.user.id,
        p_provider: provider,
        p_model: model,
        p_prompt_tokens: usage.promptTokens,
        p_completion_tokens: usage.completionTokens,
        p_total_tokens: usage.totalTokens,
        p_cost: cost,
        p_request_type: 'chat',
        p_success: success,
        p_error_code: error
      });

      if (usageError) {
        console.error('Failed to record usage:', usageError);
      }

      // Check for cost alerts
      await supabase.rpc('check_cost_alerts', {
        p_user_id: authState.user.id
      });

    } catch (err) {
      console.error('Error recording AI usage:', err);
    }
  }

  public async chat(
    provider: string,
    model: string,
    messages: AIMessage[],
    options: ChatOptions = {}
  ): Promise<AIResponse> {
    const client = this.clients.get(provider);
    if (!client) {
      return {
        content: '',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        cost: 0,
        model,
        provider,
        success: false,
        error: `Provider ${provider} not configured`
      };
    }

    const startTime = Date.now();

    try {
      let response: any;
      let usage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      let content = '';

      switch (provider) {
        case 'openai':
          response = await this.chatOpenAI(client, model, messages, options);
          content = response.choices[0]?.message?.content || '';
          usage = {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0
          };
          break;

        case 'anthropic':
          response = await this.chatAnthropic(client, model, messages, options);
          content = response.content[0]?.text || '';
          usage = {
            promptTokens: response.usage?.input_tokens || 0,
            completionTokens: response.usage?.output_tokens || 0,
            totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
          };
          break;

        case 'google':
          response = await this.chatGoogle(client, model, messages, options);
          content = response.response.text();
          // Google doesn't provide detailed token usage, estimate
          usage = this.estimateTokenUsage(messages, content);
          break;

        default:
          throw new Error(`Chat not implemented for provider: ${provider}`);
      }

      const cost = this.calculateCost(provider, model, usage);
      const duration = Date.now() - startTime;

      // Record usage in database
      await this.recordUsage(provider, model, usage, cost, true);

      return {
        content,
        usage,
        cost,
        model,
        provider,
        success: true
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Record failed usage
      await this.recordUsage(provider, model, { promptTokens: 0, completionTokens: 0, totalTokens: 0 }, 0, false, errorMessage);

      return {
        content: '',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        cost: 0,
        model,
        provider,
        success: false,
        error: errorMessage
      };
    }
  }

  private async chatOpenAI(client: OpenAI, model: string, messages: AIMessage[], options: ChatOptions): Promise<any> {
    const openaiMessages = messages.map(msg => ({
      role: msg.role as any,
      content: msg.content
    }));

    if (options.streaming) {
      return client.chat.completions.create({
        model,
        messages: openaiMessages,
        stream: true,
        max_tokens: options.maxTokens,
        temperature: options.temperature
      });
    }

    return client.chat.completions.create({
      model,
      messages: openaiMessages,
      max_tokens: options.maxTokens,
      temperature: options.temperature
    });
  }

  private async chatAnthropic(client: Anthropic, model: string, messages: AIMessage[], options: ChatOptions): Promise<any> {
    // Convert messages for Anthropic format
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system').map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    const params: any = {
      model,
      messages: conversationMessages,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature
    };

    if (systemMessage) {
      params.system = systemMessage.content;
    }

    if (options.streaming) {
      params.stream = true;
    }

    return client.messages.create(params);
  }

  private async chatGoogle(client: GoogleGenerativeAI, model: string, messages: AIMessage[], options: ChatOptions): Promise<any> {
    const generativeModel = client.getGenerativeModel({ model });

    // Convert messages to Google format
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

    const result = await generativeModel.generateContent(prompt);
    return result;
  }

  private estimateTokenUsage(messages: AIMessage[], response: string): TokenUsage {
    // Simple estimation: ~4 characters per token
    const promptText = messages.map(m => m.content).join(' ');
    const promptTokens = Math.ceil(promptText.length / 4);
    const completionTokens = Math.ceil(response.length / 4);

    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    };
  }

  public getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  public getProviderModels(providerName: string): AIModel[] {
    return this.providers.get(providerName)?.models || [];
  }

  public isProviderConfigured(providerName: string): boolean {
    return this.configurations.has(providerName) && this.clients.has(providerName);
  }

  public async configureProvider(config: AIServiceConfig): Promise<boolean> {
    try {
      this.configurations.set(config.provider, config);
      this.setupClients();

      // If user provided their own key, encrypt and store it
      if (config.isUserKey) {
        await this.storeUserApiKey(config);
      }

      this.emit('providerConfigured', { provider: config.provider });
      return true;
    } catch (error) {
      console.error(`Failed to configure provider ${config.provider}:`, error);
      return false;
    }
  }

  private async storeUserApiKey(config: AIServiceConfig): Promise<void> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) return;

    try {
      // Simple base64 encoding - replace with proper encryption in production
      const encryptedKey = btoa(config.apiKey);

      const { error } = await supabase
        .from('user_api_keys')
        .upsert({
          user_id: authState.user.id,
          provider: config.provider,
          key_name: 'default',
          encrypted_key: encryptedKey,
          is_active: true
        });

      if (error) {
        console.error('Failed to store user API key:', error);
      }
    } catch (error) {
      console.error('Error storing user API key:', error);
    }
  }
}

export const productionAIService = new ProductionAIService();