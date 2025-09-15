import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CohereClient } from 'cohere-ai';
import { MistralApi } from '@mistralai/mistralai';
import { APP_CONFIG } from '../../constants/app';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'cohere' | 'mistral';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AICompletionResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: AIProvider;
}

export interface AICodeSuggestion {
  code: string;
  description: string;
  confidence: number;
  startLine: number;
  endLine: number;
}

export interface AIProviderConfig {
  name: string;
  apiKey?: string;
  baseUrl?: string;
  models: string[];
  defaultModel: string;
  supportsStreaming: boolean;
  supportsCodeCompletion: boolean;
  supportsChat: boolean;
}

export class AIService {
  private providers: Map<AIProvider, AIProviderConfig> = new Map();
  private clients: Map<AIProvider, any> = new Map();
  private currentProvider: AIProvider = 'openai';

  constructor() {
    this.initializeProviders();
    this.loadAPIKeys();
  }

  private initializeProviders(): void {
    // OpenAI Configuration
    this.providers.set('openai', {
      name: 'OpenAI',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'],
      defaultModel: 'gpt-4',
      supportsStreaming: true,
      supportsCodeCompletion: true,
      supportsChat: true
    });

    // Anthropic Configuration
    this.providers.set('anthropic', {
      name: 'Anthropic',
      models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      defaultModel: 'claude-3-sonnet-20240229',
      supportsStreaming: true,
      supportsCodeCompletion: true,
      supportsChat: true
    });

    // Google AI Configuration
    this.providers.set('google', {
      name: 'Google AI',
      models: ['gemini-pro', 'gemini-pro-vision'],
      defaultModel: 'gemini-pro',
      supportsStreaming: true,
      supportsCodeCompletion: true,
      supportsChat: true
    });

    // Cohere Configuration
    this.providers.set('cohere', {
      name: 'Cohere',
      models: ['command', 'command-light', 'command-nightly'],
      defaultModel: 'command',
      supportsStreaming: true,
      supportsCodeCompletion: false,
      supportsChat: true
    });

    // Mistral Configuration
    this.providers.set('mistral', {
      name: 'Mistral AI',
      models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
      defaultModel: 'mistral-large-latest',
      supportsStreaming: true,
      supportsCodeCompletion: true,
      supportsChat: true
    });
  }

  private loadAPIKeys(): void {
    // Load API keys from environment variables or localStorage
    const savedKeys = this.getSavedAPIKeys();

    // Set API keys for each provider
    for (const [provider, config] of this.providers) {
      const envKey = APP_CONFIG.ai.fallbackKeys[provider];
      const savedKey = savedKeys[provider];

      config.apiKey = savedKey || envKey;

      if (config.apiKey) {
        this.initializeClient(provider, config);
      }
    }
  }

  private initializeClient(provider: AIProvider, config: AIProviderConfig): void {
    if (!config.apiKey) return;

    try {
      switch (provider) {
        case 'openai':
          this.clients.set(provider, new OpenAI({
            apiKey: config.apiKey,
            dangerouslyAllowBrowser: true
          }));
          break;

        case 'anthropic':
          this.clients.set(provider, new Anthropic({
            apiKey: config.apiKey,
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
          this.clients.set(provider, new MistralApi(config.apiKey));
          break;
      }
    } catch (error) {
      console.error(`Failed to initialize ${provider} client:`, error);
    }
  }

  // API Key Management
  setAPIKey(provider: AIProvider, apiKey: string): void {
    const config = this.providers.get(provider);
    if (!config) throw new Error(`Unknown provider: ${provider}`);

    config.apiKey = apiKey;
    this.initializeClient(provider, config);
    this.saveAPIKey(provider, apiKey);
  }

  getAPIKey(provider: AIProvider): string | undefined {
    return this.providers.get(provider)?.apiKey;
  }

  removeAPIKey(provider: AIProvider): void {
    const config = this.providers.get(provider);
    if (config) {
      config.apiKey = undefined;
      this.clients.delete(provider);
      this.removeStoredAPIKey(provider);
    }
  }

  private saveAPIKey(provider: AIProvider, apiKey: string): void {
    try {
      const keys = this.getSavedAPIKeys();
      keys[provider] = apiKey;
      localStorage.setItem('branchcode_ai_keys', JSON.stringify(keys));
    } catch (error) {
      console.error('Failed to save API key:', error);
    }
  }

  private getSavedAPIKeys(): Record<string, string> {
    try {
      const stored = localStorage.getItem('branchcode_ai_keys');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private removeStoredAPIKey(provider: AIProvider): void {
    try {
      const keys = this.getSavedAPIKeys();
      delete keys[provider];
      localStorage.setItem('branchcode_ai_keys', JSON.stringify(keys));
    } catch (error) {
      console.error('Failed to remove API key:', error);
    }
  }

  // Provider Management
  setCurrentProvider(provider: AIProvider): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    this.currentProvider = provider;
  }

  getCurrentProvider(): AIProvider {
    return this.currentProvider;
  }

  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.keys());
  }

  getProviderConfig(provider: AIProvider): AIProviderConfig | undefined {
    return this.providers.get(provider);
  }

  isProviderConfigured(provider: AIProvider): boolean {
    const config = this.providers.get(provider);
    return Boolean(config?.apiKey && this.clients.has(provider));
  }

  getConfiguredProviders(): AIProvider[] {
    return Array.from(this.providers.keys()).filter(provider =>
      this.isProviderConfigured(provider)
    );
  }

  // AI Completion
  async complete(
    messages: AIMessage[],
    options: AICompletionOptions = {}
  ): Promise<AICompletionResponse> {
    const provider = options.provider || this.currentProvider;
    const client = this.clients.get(provider);
    const config = this.providers.get(provider);

    if (!client || !config) {
      throw new Error(`Provider ${provider} is not configured`);
    }

    const model = options.model || config.defaultModel;

    try {
      switch (provider) {
        case 'openai':
          return await this.completeOpenAI(client, messages, model, options);
        case 'anthropic':
          return await this.completeAnthropic(client, messages, model, options);
        case 'google':
          return await this.completeGoogle(client, messages, model, options);
        case 'cohere':
          return await this.completeCohere(client, messages, model, options);
        case 'mistral':
          return await this.completeMistral(client, messages, model, options);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      throw new Error(`AI completion failed: ${error}`);
    }
  }

  private async completeOpenAI(
    client: OpenAI,
    messages: AIMessage[],
    model: string,
    options: AICompletionOptions
  ): Promise<AICompletionResponse> {
    const response = await client.chat.completions.create({
      model,
      messages: messages as any,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
      stream: false
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      },
      model,
      provider: 'openai'
    };
  }

  private async completeAnthropic(
    client: Anthropic,
    messages: AIMessage[],
    model: string,
    options: AICompletionOptions
  ): Promise<AICompletionResponse> {
    // Convert messages format for Anthropic
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await client.messages.create({
      model,
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      system: systemMessage,
      messages: conversationMessages as any
    });

    return {
      content: response.content[0].type === 'text' ? response.content[0].text : '',
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      model,
      provider: 'anthropic'
    };
  }

  private async completeGoogle(
    client: GoogleGenerativeAI,
    messages: AIMessage[],
    model: string,
    options: AICompletionOptions
  ): Promise<AICompletionResponse> {
    const genModel = client.getGenerativeModel({ model });

    // Convert conversation to Google's format
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

    const result = await genModel.generateContent(prompt);
    const response = await result.response;

    return {
      content: response.text() || '',
      usage: {
        promptTokens: 0, // Google doesn't provide token usage
        completionTokens: 0,
        totalTokens: 0
      },
      model,
      provider: 'google'
    };
  }

  private async completeCohere(
    client: CohereClient,
    messages: AIMessage[],
    model: string,
    options: AICompletionOptions
  ): Promise<AICompletionResponse> {
    // Convert messages to a single prompt for Cohere
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

    const response = await client.generate({
      model,
      prompt,
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 1000
    });

    return {
      content: response.generations[0]?.text || '',
      usage: {
        promptTokens: 0, // Cohere doesn't provide detailed token usage
        completionTokens: 0,
        totalTokens: 0
      },
      model,
      provider: 'cohere'
    };
  }

  private async completeMistral(
    client: MistralApi,
    messages: AIMessage[],
    model: string,
    options: AICompletionOptions
  ): Promise<AICompletionResponse> {
    const response = await client.chat({
      model,
      messages: messages as any,
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 1000
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      usage: {
        promptTokens: response.usage?.promptTokens || 0,
        completionTokens: response.usage?.completionTokens || 0,
        totalTokens: response.usage?.totalTokens || 0
      },
      model,
      provider: 'mistral'
    };
  }

  // Code-specific AI features
  async generateCodeCompletion(
    code: string,
    language: string,
    cursorPosition: { line: number; column: number },
    options: AICompletionOptions = {}
  ): Promise<AICodeSuggestion[]> {
    const provider = options.provider || this.currentProvider;
    const config = this.providers.get(provider);

    if (!config?.supportsCodeCompletion) {
      throw new Error(`Provider ${provider} does not support code completion`);
    }

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a code completion assistant. Generate relevant code completions for ${language} code. Return only the suggested code without explanations.`
      },
      {
        role: 'user',
        content: `Complete this ${language} code at line ${cursorPosition.line}, column ${cursorPosition.column}:\n\n${code}`
      }
    ];

    try {
      const response = await this.complete(messages, {
        ...options,
        maxTokens: 200,
        temperature: 0.3
      });

      return [{
        code: response.content.trim(),
        description: 'AI-generated code completion',
        confidence: 0.8,
        startLine: cursorPosition.line,
        endLine: cursorPosition.line
      }];
    } catch (error) {
      console.error('Code completion failed:', error);
      return [];
    }
  }

  async explainCode(
    code: string,
    language: string,
    options: AICompletionOptions = {}
  ): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'You are a code explanation assistant. Provide clear, concise explanations of code functionality.'
      },
      {
        role: 'user',
        content: `Explain this ${language} code:\n\n${code}`
      }
    ];

    const response = await this.complete(messages, options);
    return response.content;
  }

  async generateCode(
    description: string,
    language: string,
    options: AICompletionOptions = {}
  ): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a code generation assistant. Generate clean, well-documented ${language} code based on descriptions. Return only the code without additional explanations.`
      },
      {
        role: 'user',
        content: `Generate ${language} code for: ${description}`
      }
    ];

    const response = await this.complete(messages, options);
    return response.content;
  }

  async refactorCode(
    code: string,
    language: string,
    instructions: string,
    options: AICompletionOptions = {}
  ): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a code refactoring assistant. Improve code based on given instructions while maintaining functionality. Return only the refactored code.`
      },
      {
        role: 'user',
        content: `Refactor this ${language} code according to these instructions: ${instructions}\n\nCode:\n${code}`
      }
    ];

    const response = await this.complete(messages, options);
    return response.content;
  }

  async findBugs(
    code: string,
    language: string,
    options: AICompletionOptions = {}
  ): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'You are a bug detection assistant. Analyze code for potential issues, bugs, and improvements.'
      },
      {
        role: 'user',
        content: `Analyze this ${language} code for bugs and issues:\n\n${code}`
      }
    ];

    const response = await this.complete(messages, options);
    return response.content;
  }

  // Cleanup
  destroy(): void {
    this.clients.clear();
    this.providers.clear();
  }
}

// Singleton instance
export const aiService = new AIService();