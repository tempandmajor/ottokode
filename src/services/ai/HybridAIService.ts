import { enhancedAIService } from './EnhancedAIService';
import { supabase } from '../../lib/supabase';
import { authService } from '../auth/AuthService';
import { EventEmitter } from '../../utils/EventEmitter';
import { AIMessage } from '../../types/ai';

export interface PlatformModel {
  id: string;
  provider: string;
  model_id: string;
  display_name: string;
  description: string;
  context_length: number;
  cost_per_1k_input_tokens: number;
  cost_per_1k_output_tokens: number;
  final_cost_per_1k_input_tokens: number;
  final_cost_per_1k_output_tokens: number;
  capabilities: Record<string, boolean>;
  is_available: boolean;
  requires_subscription: boolean;
  min_subscription_tier: string | null;
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
}

export interface UserCredits {
  total_credits: number;
  used_credits: number;
  available_credits: number;
}

export interface HybridChatOptions {
  streaming?: boolean;
  maxTokens?: number;
  temperature?: number;
  onStream?: (response: { content: string; done: boolean; usage?: any }) => void;
  persistConversation?: boolean;
  conversationId?: string;
  useMode: 'own_keys' | 'platform_credits' | 'auto';
}

class HybridAIService extends EventEmitter {
  private platformModels: PlatformModel[] = [];
  private userCredits: UserCredits | null = null;

  constructor() {
    super();
    this.loadPlatformModels();
  }

  async loadPlatformModels(): Promise<void> {
    try {
      const { data: models, error } = await supabase
        .from('platform_ai_models')
        .select('*')
        .eq('is_available', true)
        .order('provider', { ascending: true })
        .order('display_name', { ascending: true });

      if (error) throw error;

      this.platformModels = models || [];
      this.emit('modelsLoaded', this.platformModels);
    } catch (error) {
      console.error('Failed to load platform models:', error);
    }
  }

  async loadUserCredits(): Promise<void> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      this.userCredits = null;
      return;
    }

    try {
      const { data: credits, error } = await supabase
        .from('user_credits')
        .select('total_credits, used_credits, available_credits')
        .eq('user_id', authState.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error is ok
        throw error;
      }

      this.userCredits = credits || {
        total_credits: 0,
        used_credits: 0,
        available_credits: 0
      };

      this.emit('creditsLoaded', this.userCredits);
    } catch (error) {
      console.error('Failed to load user credits:', error);
      this.userCredits = null;
    }
  }

  async chat(
    providerName: string,
    modelId: string,
    messages: AIMessage[],
    options: HybridChatOptions
  ): Promise<AIMessage> {
    // Determine which mode to use
    const useMode = await this.determineUseMode(providerName, modelId, options.useMode);

    if (useMode === 'platform_credits') {
      return this.chatWithPlatformCredits(providerName, modelId, messages, options);
    } else {
      return this.chatWithOwnKeys(providerName, modelId, messages, options);
    }
  }

  private async determineUseMode(
    providerName: string,
    modelId: string,
    requestedMode: 'own_keys' | 'platform_credits' | 'auto'
  ): Promise<'own_keys' | 'platform_credits'> {
    if (requestedMode !== 'auto') {
      return requestedMode;
    }

    // Auto-determination logic:
    // 1. If user has no API key configured for provider, use platform credits
    const isProviderConfigured = enhancedAIService.isProviderConfigured(providerName);
    if (!isProviderConfigured) {
      return 'platform_credits';
    }

    // 2. If user has credits and model is available on platform, suggest platform
    const platformModel = this.getPlatformModel(providerName, modelId);
    if (platformModel && this.userCredits && this.userCredits.available_credits > 0) {
      return 'platform_credits';
    }

    // 3. Default to own keys if configured
    return 'own_keys';
  }

  private async chatWithPlatformCredits(
    providerName: string,
    modelId: string,
    messages: AIMessage[],
    options: HybridChatOptions
  ): Promise<AIMessage> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error('Authentication required for platform credits');
    }

    // Check if user has sufficient credits
    await this.loadUserCredits();
    if (!this.userCredits || this.userCredits.available_credits <= 0) {
      throw new Error('Insufficient credits. Please purchase more credits or add your own API keys.');
    }

    // Get platform model
    const platformModel = this.getPlatformModel(providerName, modelId);
    if (!platformModel) {
      throw new Error(`Model ${modelId} not available on platform. Please use your own API keys.`);
    }

    // Check rate limits
    await this.checkRateLimit(authState.user.id, platformModel.id);

    // Estimate cost
    const estimatedTokens = this.estimateTokenUsage(messages, options.maxTokens || 2000);
    const estimatedCost = this.calculatePlatformCost(platformModel, estimatedTokens.input, estimatedTokens.output);

    if (estimatedCost > this.userCredits.available_credits) {
      throw new Error(`Estimated cost ($${estimatedCost.toFixed(4)}) exceeds available credits ($${this.userCredits.available_credits.toFixed(4)})`);
    }

    try {
      // Use platform API proxy (this would be a backend service)
      const response = await this.callPlatformAPI(platformModel, messages, options);

      // Deduct credits and log transaction
      await this.deductCredits(authState.user.id, response.actualCost, {
        provider: providerName,
        model: modelId,
        tokens: response.tokens,
        requestId: response.requestId
      });

      // Update rate limits
      await this.updateRateLimit(authState.user.id, platformModel.id);

      return response.message;
    } catch (error) {
      console.error('Platform API call failed:', error);
      throw new Error(`Platform API error: ${error}`);
    }
  }

  private async chatWithOwnKeys(
    providerName: string,
    modelId: string,
    messages: AIMessage[],
    options: HybridChatOptions
  ): Promise<AIMessage> {
    // Use the existing enhanced AI service for own keys
    const chatOptions = {
      streaming: options.streaming,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      onStream: options.onStream,
      persistConversation: options.persistConversation,
      conversationId: options.conversationId
    };

    return await enhancedAIService.chat(providerName, modelId, messages, chatOptions);
  }

  private async callPlatformAPI(
    model: PlatformModel,
    messages: AIMessage[],
    options: HybridChatOptions
  ): Promise<{
    message: AIMessage;
    tokens: { input: number; output: number; total: number };
    actualCost: number;
    requestId: string;
  }> {
    // This would typically call a backend service that manages the actual API calls
    // For now, we'll simulate this with a direct call but track it as platform usage

    const requestId = `platform_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Call the actual AI service (this should be done on backend in production)
      const response = await enhancedAIService.chat(model.provider, model.model_id, messages, {
        streaming: options.streaming,
        maxTokens: options.maxTokens,
        temperature: options.temperature,
        onStream: options.onStream
      });

      // Calculate actual cost using platform pricing
      const inputTokens = this.calculatePromptTokens(messages);
      const outputTokens = response.tokens || 1000; // fallback estimate
      const actualCost = this.calculatePlatformCost(model, inputTokens, outputTokens);

      return {
        message: response,
        tokens: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens
        },
        actualCost,
        requestId
      };
    } catch (error) {
      console.error('Platform API proxy error:', error);
      throw error;
    }
  }

  private async deductCredits(
    userId: string,
    amount: number,
    metadata: {
      provider: string;
      model: string;
      tokens: { input: number; output: number; total: number };
      requestId: string;
    }
  ): Promise<void> {
    try {
      // Update user credits
      const { error: creditsError } = await supabase.rpc('deduct_user_credits', {
        p_user_id: userId,
        p_amount: amount
      });

      if (creditsError) throw creditsError;

      // Log the transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'usage',
          amount: -amount,
          credits_amount: -amount,
          description: `AI request: ${metadata.provider}:${metadata.model}`,
          ai_provider: metadata.provider,
          ai_model: metadata.model,
          tokens_used: metadata.tokens.total,
          request_id: metadata.requestId
        });

      if (transactionError) throw transactionError;

      // Reload user credits
      await this.loadUserCredits();

    } catch (error) {
      console.error('Failed to deduct credits:', error);
      throw error;
    }
  }

  private async checkRateLimit(userId: string, modelId: string): Promise<void> {
    try {
      const { data: rateLimits, error } = await supabase
        .from('user_rate_limits')
        .select('*')
        .eq('user_id', userId)
        .eq('model_id', modelId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const model = this.platformModels.find(m => m.id === modelId);
      if (!model) throw new Error('Model not found');

      if (rateLimits) {
        const now = new Date();
        const minutesPassed = Math.floor((now.getTime() - new Date(rateLimits.minute_window_start).getTime()) / 60000);
        const daysPassed = now.toDateString() !== new Date(rateLimits.day_window_start).toDateString() ? 1 : 0;

        // Reset windows if needed
        if (minutesPassed >= 1) {
          rateLimits.requests_this_minute = 0;
          rateLimits.minute_window_start = now.toISOString();
        }

        if (daysPassed >= 1) {
          rateLimits.requests_today = 0;
          rateLimits.day_window_start = now.toISOString().split('T')[0];
        }

        // Check limits
        if (rateLimits.requests_this_minute >= model.rate_limit_per_minute) {
          throw new Error(`Rate limit exceeded: ${model.rate_limit_per_minute} requests per minute`);
        }

        if (rateLimits.requests_today >= model.rate_limit_per_day) {
          throw new Error(`Rate limit exceeded: ${model.rate_limit_per_day} requests per day`);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        throw error;
      }
      console.error('Rate limit check error:', error);
      // Don't block on rate limit check errors
    }
  }

  private async updateRateLimit(userId: string, modelId: string): Promise<void> {
    try {
      await supabase.rpc('update_user_rate_limit', {
        p_user_id: userId,
        p_model_id: modelId
      });
    } catch (error) {
      console.error('Failed to update rate limit:', error);
    }
  }

  private getPlatformModel(provider: string, modelId: string): PlatformModel | null {
    return this.platformModels.find(m => m.provider === provider && m.model_id === modelId) || null;
  }

  private calculatePlatformCost(model: PlatformModel, inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000) * model.final_cost_per_1k_input_tokens;
    const outputCost = (outputTokens / 1000) * model.final_cost_per_1k_output_tokens;
    return inputCost + outputCost;
  }

  private estimateTokenUsage(messages: AIMessage[], maxTokens: number): { input: number; output: number } {
    const inputTokens = this.calculatePromptTokens(messages);
    const outputTokens = Math.min(maxTokens, Math.max(100, inputTokens * 0.5)); // Rough estimate
    return { input: inputTokens, output: outputTokens };
  }

  private calculatePromptTokens(messages: AIMessage[]): number {
    // Rough estimation: 1 token per ~4 characters for English text
    const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    return Math.ceil(totalChars / 4);
  }

  // Public API methods
  getPlatformModels(): PlatformModel[] {
    return this.platformModels;
  }

  getUserCredits(): UserCredits | null {
    return this.userCredits;
  }

  async refreshData(): Promise<void> {
    await Promise.all([
      this.loadPlatformModels(),
      this.loadUserCredits()
    ]);
  }

  getAvailableProviders(): Array<{ provider: string; hasOwnKeys: boolean; hasPlatformModels: boolean }> {
    const providers = new Map<string, { hasOwnKeys: boolean; hasPlatformModels: boolean }>();

    // Check configured providers (own keys)
    enhancedAIService.getConfiguredProviders().forEach(provider => {
      providers.set(provider.name, {
        hasOwnKeys: true,
        hasPlatformModels: providers.get(provider.name)?.hasPlatformModels || false
      });
    });

    // Check platform models
    this.platformModels.forEach(model => {
      const existing = providers.get(model.provider);
      providers.set(model.provider, {
        hasOwnKeys: existing?.hasOwnKeys || false,
        hasPlatformModels: true
      });
    });

    return Array.from(providers.entries()).map(([provider, info]) => ({
      provider,
      ...info
    }));
  }
}

export const hybridAIService = new HybridAIService();