import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CohereClient } from 'cohere-ai';
import MistralClient from '@mistralai/mistralai';
import { AIProvider, AIModel, AIMessage, CodeCompletionRequest, CodeCompletionResponse, AIStreamCallback } from '../../types/ai';
import { supabaseUsageTracker } from './SupabaseUsageTracker';
import { conversationService } from './ConversationService';
import { authService } from '../auth/AuthService';
import { EventEmitter } from '../../utils/EventEmitter';

export interface AIServiceConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  organizationId?: string;
}

export interface ChatOptions {
  streaming?: boolean;
  maxTokens?: number;
  temperature?: number;
  onStream?: AIStreamCallback;
  persistConversation?: boolean;
  conversationId?: string;
}

class EnhancedAIService extends EventEmitter {
  private providers = new Map<string, AIProvider>();
  private clients = new Map<string, any>();
  private configurations = new Map<string, AIServiceConfig>();

  constructor() {
    super();
    this.initializeProviders();
    this.loadConfigurations();
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
          capabilities: {
            chat: true,
            completion: true,
            codeGeneration: true,
            functionCalling: true,
            vision: true,
            reasoning: true
          }
        },
        {
          id: 'gpt-4o-mini',
          name: 'GPT-4o Mini',
          provider: 'openai',
          contextLength: 128000,
          costPer1KTokens: { input: 0.00015, output: 0.0006 },
          capabilities: {
            chat: true,
            completion: true,
            codeGeneration: true,
            functionCalling: true
          }
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          provider: 'openai',
          contextLength: 16384,
          costPer1KTokens: { input: 0.0005, output: 0.0015 },
          capabilities: {
            chat: true,
            completion: true,
            codeGeneration: true,
            functionCalling: true
          }
        }
      ],
      isConfigured: false,
      supportsStreaming: true,
      supportsCodeCompletion: true,
      supportsFunctionCalling: true
    });

    // Anthropic Provider
    this.providers.set('anthropic', {
      name: 'anthropic',
      displayName: 'Anthropic Claude',
      models: [
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          provider: 'anthropic',
          contextLength: 200000,
          costPer1KTokens: { input: 0.003, output: 0.015 },
          capabilities: {
            chat: true,
            completion: true,
            codeGeneration: true,
            functionCalling: true,
            reasoning: true
          }
        },
        {
          id: 'claude-3-haiku-20240307',
          name: 'Claude 3 Haiku',
          provider: 'anthropic',
          contextLength: 200000,
          costPer1KTokens: { input: 0.00025, output: 0.00125 },
          capabilities: {
            chat: true,
            completion: true,
            codeGeneration: true,
            functionCalling: true
          }
        }
      ],
      isConfigured: false,
      supportsStreaming: true,
      supportsCodeCompletion: true,
      supportsFunctionCalling: true
    });

    // Google Provider
    this.providers.set('google', {
      name: 'google',
      displayName: 'Google Gemini',
      models: [
        {
          id: 'gemini-pro',
          name: 'Gemini Pro',
          provider: 'google',
          contextLength: 32768,
          costPer1KTokens: { input: 0.0005, output: 0.0015 },
          capabilities: {
            chat: true,
            completion: true,
            codeGeneration: true,
            functionCalling: true,
            vision: true
          }
        },
        {
          id: 'gemini-pro-vision',
          name: 'Gemini Pro Vision',
          provider: 'google',
          contextLength: 16384,
          costPer1KTokens: { input: 0.00025, output: 0.0005 },
          capabilities: {
            chat: true,
            completion: true,
            codeGeneration: true,
            functionCalling: true,
            vision: true
          }
        }
      ],
      isConfigured: false,
      supportsStreaming: true,
      supportsCodeCompletion: true,
      supportsFunctionCalling: false
    });

    // Cohere Provider
    this.providers.set('cohere', {
      name: 'cohere',
      displayName: 'Cohere',
      models: [
        {
          id: 'command-r-plus',
          name: 'Command R+',
          provider: 'cohere',
          contextLength: 128000,
          costPer1KTokens: { input: 0.003, output: 0.015 },
          capabilities: {
            chat: true,
            completion: true,
            codeGeneration: true,
            functionCalling: true,
            reasoning: true
          }
        },
        {
          id: 'command-r',
          name: 'Command R',
          provider: 'cohere',
          contextLength: 128000,
          costPer1KTokens: { input: 0.0005, output: 0.0015 },
          capabilities: {
            chat: true,
            completion: true,
            codeGeneration: true,
            functionCalling: true
          }
        }
      ],
      isConfigured: false,
      supportsStreaming: true,
      supportsCodeCompletion: true,
      supportsFunctionCalling: true
    });

    // Mistral Provider
    this.providers.set('mistral', {
      name: 'mistral',
      displayName: 'Mistral AI',
      models: [
        {
          id: 'mistral-large-latest',
          name: 'Mistral Large',
          provider: 'mistral',
          contextLength: 128000,
          costPer1KTokens: { input: 0.008, output: 0.024 },
          capabilities: {
            chat: true,
            completion: true,
            codeGeneration: true,
            functionCalling: true,
            reasoning: true
          }
        },
        {
          id: 'mistral-medium-latest',
          name: 'Mistral Medium',
          provider: 'mistral',
          contextLength: 32000,
          costPer1KTokens: { input: 0.0027, output: 0.0081 },
          capabilities: {
            chat: true,
            completion: true,
            codeGeneration: true,
            functionCalling: true
          }
        }
      ],
      isConfigured: false,
      supportsStreaming: true,
      supportsCodeCompletion: true,
      supportsFunctionCalling: true
    });

    // Ollama Provider (Local)
    this.providers.set('ollama', {
      name: 'ollama',
      displayName: 'Ollama (Local)',
      models: [
        {
          id: 'codellama:7b',
          name: 'Code Llama 7B',
          provider: 'ollama',
          contextLength: 4096,
          costPer1KTokens: { input: 0, output: 0 },
          capabilities: {
            chat: true,
            completion: true,
            codeGeneration: true,
            functionCalling: false
          }
        },
        {
          id: 'mistral:7b',
          name: 'Mistral 7B',
          provider: 'ollama',
          contextLength: 8192,
          costPer1KTokens: { input: 0, output: 0 },
          capabilities: {
            chat: true,
            completion: true,
            codeGeneration: true,
            functionCalling: false
          }
        }
      ],
      isConfigured: false,
      supportsStreaming: true,
      supportsCodeCompletion: true,
      supportsFunctionCalling: false,
      baseUrl: 'http://localhost:11434'
    });
  }

  async configureProvider(config: AIServiceConfig): Promise<boolean> {
    const provider = this.providers.get(config.provider);
    if (!provider) {
      throw new Error(`Provider ${config.provider} not found`);
    }

    try {
      let client: any;

      switch (config.provider) {
        case 'openai':
          client = new OpenAI({
            apiKey: config.apiKey,
            organization: config.organizationId,
            baseURL: config.baseUrl,
            dangerouslyAllowBrowser: true
          });
          break;

        case 'anthropic':
          client = new Anthropic({
            apiKey: config.apiKey,
            baseURL: config.baseUrl,
            dangerouslyAllowBrowser: true
          });
          break;

        case 'google':
          client = new GoogleGenerativeAI(config.apiKey);
          break;

        case 'cohere':
          client = new CohereClient({
            token: config.apiKey,
          });
          break;

        case 'mistral':
          client = new MistralClient(config.apiKey, config.baseUrl);
          break;

        case 'ollama':
          client = { baseUrl: config.baseUrl || 'http://localhost:11434' };
          break;

        default:
          throw new Error(`Unknown provider: ${config.provider}`);
      }

      // Test the configuration
      await this.testConnection(config.provider, client);

      this.clients.set(config.provider, client);
      this.configurations.set(config.provider, config);
      provider.isConfigured = true;
      provider.apiKey = config.apiKey;
      provider.baseUrl = config.baseUrl;

      this.saveConfigurations();
      this.emit('providerConfigured', config.provider);

      return true;
    } catch (error) {
      console.error(`Failed to configure provider ${config.provider}:`, error);
      throw error;
    }
  }

  private async testConnection(provider: string, client: any): Promise<void> {
    try {
      switch (provider) {
        case 'openai':
          await client.models.list();
          break;
        case 'anthropic':
          // Test with a small message
          await client.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }]
          });
          break;
        case 'google':
          const model = client.getGenerativeModel({ model: 'gemini-pro' });
          await model.generateContent('Hi');
          break;
        case 'cohere':
          await client.chat({ message: 'Hi', maxTokens: 10 });
          break;
        case 'mistral':
          await client.chat({
            model: 'mistral-medium-latest',
            messages: [{ role: 'user', content: 'Hi' }],
            maxTokens: 10
          });
          break;
        case 'ollama':
          const response = await fetch(`${client.baseUrl}/api/tags`);
          if (!response.ok) throw new Error('Ollama connection failed');
          break;
      }
    } catch (error) {
      throw new Error(`Connection test failed: ${error}`);
    }
  }

  async chat(
    providerName: string,
    modelId: string,
    messages: AIMessage[],
    options: ChatOptions = {}
  ): Promise<AIMessage> {
    const provider = this.providers.get(providerName);
    const client = this.clients.get(providerName);

    if (!provider || !client || !provider.isConfigured) {
      throw new Error(`Provider ${providerName} is not configured`);
    }

    const model = this.getModel(providerName, modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found for provider ${providerName}`);
    }

    const startTime = Date.now();

    try {
      let response: AIMessage;

      switch (providerName) {
        case 'openai':
          response = await this.chatWithOpenAI(client, modelId, messages, options);
          break;
        case 'anthropic':
          response = await this.chatWithAnthropic(client, modelId, messages, options);
          break;
        case 'google':
          response = await this.chatWithGoogle(client, modelId, messages, options);
          break;
        case 'cohere':
          response = await this.chatWithCohere(client, modelId, messages, options);
          break;
        case 'mistral':
          response = await this.chatWithMistral(client, modelId, messages, options);
          break;
        case 'ollama':
          response = await this.chatWithOllama(client, modelId, messages, options);
          break;
        default:
          throw new Error(`Unsupported provider: ${providerName}`);
      }

      const endTime = Date.now();
      const requestDuration = endTime - startTime;

      // Track usage with Supabase
      await supabaseUsageTracker.recordUsage({
        timestamp: new Date(),
        provider: providerName,
        model: modelId,
        prompt_tokens: this.calculatePromptTokens(messages),
        completion_tokens: response.tokens || 0,
        total_tokens: (response.tokens || 0) + this.calculatePromptTokens(messages),
        cost: response.cost || 0,
        request_type: options.streaming ? 'streaming' : 'chat',
        request_duration: requestDuration,
        success: true
      });

      // Persist conversation if requested
      if (options.persistConversation) {
        await this.persistConversationMessage(options.conversationId, messages, response, providerName, modelId);
      }

      this.emit('chatResponse', { provider: providerName, model: modelId, response });
      return response;

    } catch (error) {
      const endTime = Date.now();
      const requestDuration = endTime - startTime;

      // Track failed request
      await supabaseUsageTracker.recordUsage({
        timestamp: new Date(),
        provider: providerName,
        model: modelId,
        prompt_tokens: this.calculatePromptTokens(messages),
        completion_tokens: 0,
        total_tokens: this.calculatePromptTokens(messages),
        cost: 0,
        request_type: options.streaming ? 'streaming' : 'chat',
        request_duration: requestDuration,
        success: false,
        error_code: error instanceof Error ? error.message : 'Unknown error'
      });

      this.emit('chatError', { provider: providerName, model: modelId, error });
      throw error;
    }
  }

  private async chatWithOpenAI(
    client: OpenAI,
    modelId: string,
    messages: AIMessage[],
    options: ChatOptions
  ): Promise<AIMessage> {
    const openaiMessages = messages.map(m => ({
      role: m.role as any,
      content: m.content
    }));

    const params: any = {
      model: modelId,
      messages: openaiMessages,
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7
    };

    if (options.streaming) {
      const stream = await client.chat.completions.create({
        ...params,
        stream: true
      });

      let content = '';
      let usage: any = null;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          content += delta.content;
          if (options.onStream) {
            options.onStream({
              content: delta.content,
              done: false
            });
          }
        }
        if (chunk.usage) {
          usage = chunk.usage;
        }
      }

      if (options.onStream) {
        options.onStream({ content: '', done: true, usage });
      }

      return {
        role: 'assistant',
        content,
        timestamp: new Date(),
        tokens: usage?.total_tokens,
        cost: this.calculateCost('openai', modelId, usage?.total_tokens || 0)
      };
    } else {
      const response = await client.chat.completions.create(params);
      const choice = response.choices[0];

      return {
        role: 'assistant',
        content: choice.message.content || '',
        timestamp: new Date(),
        tokens: response.usage?.total_tokens,
        cost: this.calculateCost('openai', modelId, response.usage?.total_tokens || 0)
      };
    }
  }

  private async chatWithAnthropic(
    client: Anthropic,
    modelId: string,
    messages: AIMessage[],
    options: ChatOptions
  ): Promise<AIMessage> {
    const anthropicMessages = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    const params: any = {
      model: modelId,
      messages: anthropicMessages,
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7
    };

    if (options.streaming) {
      const stream = await client.messages.create({
        ...params,
        stream: true
      });

      let content = '';
      let usage: any = null;

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          if (chunk.delta.type === 'text_delta') {
            content += chunk.delta.text;
            if (options.onStream) {
              options.onStream({
                content: chunk.delta.text,
                done: false
              });
            }
          }
        }
        if (chunk.type === 'message_stop') {
          usage = chunk.message?.usage;
        }
      }

      if (options.onStream) {
        options.onStream({ content: '', done: true, usage });
      }

      return {
        role: 'assistant',
        content,
        timestamp: new Date(),
        tokens: usage ? usage.output_tokens + usage.input_tokens : 0,
        cost: usage ? this.calculateCost('anthropic', modelId, usage.output_tokens + usage.input_tokens) : 0
      };
    } else {
      const response = await client.messages.create(params);
      const content = response.content[0];

      return {
        role: 'assistant',
        content: content.type === 'text' ? content.text : '',
        timestamp: new Date(),
        tokens: response.usage.output_tokens + response.usage.input_tokens,
        cost: this.calculateCost('anthropic', modelId, response.usage.output_tokens + response.usage.input_tokens)
      };
    }
  }

  private async chatWithGoogle(
    client: GoogleGenerativeAI,
    modelId: string,
    messages: AIMessage[],
    options: ChatOptions
  ): Promise<AIMessage> {
    const model = client.getGenerativeModel({ model: modelId });

    // Convert messages to Google format
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;

    return {
      role: 'assistant',
      content: response.text(),
      timestamp: new Date(),
      tokens: 0, // Google doesn't provide detailed token usage in free tier
      cost: 0
    };
  }

  private async chatWithCohere(
    client: CohereClient,
    modelId: string,
    messages: AIMessage[],
    options: ChatOptions
  ): Promise<AIMessage> {
    // Convert messages to Cohere format
    const chatHistory = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'USER' : 'CHATBOT',
      message: m.content
    }));

    const lastMessage = messages[messages.length - 1];

    const response = await client.chat({
      model: modelId,
      message: lastMessage.content,
      chatHistory: chatHistory,
      maxTokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7
    });

    return {
      role: 'assistant',
      content: response.text,
      timestamp: new Date(),
      tokens: response.meta?.tokens?.totalTokens || 0,
      cost: this.calculateCost('cohere', modelId, response.meta?.tokens?.totalTokens || 0)
    };
  }

  private async chatWithMistral(
    client: MistralClient,
    modelId: string,
    messages: AIMessage[],
    options: ChatOptions
  ): Promise<AIMessage> {
    const mistralMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const response = await client.chat({
      model: modelId,
      messages: mistralMessages,
      maxTokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7
    });

    const choice = response.choices[0];
    return {
      role: 'assistant',
      content: choice.message.content || '',
      timestamp: new Date(),
      tokens: response.usage?.totalTokens || 0,
      cost: this.calculateCost('mistral', modelId, response.usage?.totalTokens || 0)
    };
  }

  private async chatWithOllama(
    client: any,
    modelId: string,
    messages: AIMessage[],
    options: ChatOptions
  ): Promise<AIMessage> {
    const response = await fetch(`${client.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      role: 'assistant',
      content: data.message.content,
      timestamp: new Date(),
      tokens: 0, // Ollama is local, no cost
      cost: 0
    };
  }

  private async persistConversationMessage(
    conversationId: string | undefined,
    messages: AIMessage[],
    response: AIMessage,
    provider: string,
    model: string
  ): Promise<void> {
    try {
      let currentConversationId = conversationId;

      if (!currentConversationId) {
        // Create new conversation
        const conversation = await conversationService.createConversation({
          title: messages[0]?.content.slice(0, 50) + '...' || 'New Conversation',
          model,
          provider
        });
        currentConversationId = conversation.id;
      }

      // Add user message if it's the last one
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        await conversationService.addMessage(currentConversationId, {
          role: lastMessage.role,
          content: lastMessage.content,
          tokens: this.calculatePromptTokens([lastMessage]),
          cost: 0
        });
      }

      // Add assistant response
      await conversationService.addMessage(currentConversationId, {
        role: response.role,
        content: response.content,
        tokens: response.tokens || 0,
        cost: response.cost || 0
      });
    } catch (error) {
      console.error('Failed to persist conversation:', error);
    }
  }

  private calculateCost(provider: string, modelId: string, tokens: number): number {
    const model = this.getModel(provider, modelId);
    if (!model) return 0;

    // Simplified cost calculation - assumes equal input/output
    const avgCost = (model.costPer1KTokens.input + model.costPer1KTokens.output) / 2;
    return (tokens / 1000) * avgCost;
  }

  private calculatePromptTokens(messages: AIMessage[]): number {
    // Rough estimation: 1 token per ~4 characters for English text
    const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    return Math.ceil(totalChars / 4);
  }

  private saveConfigurations(): void {
    try {
      const configs = Object.fromEntries(this.configurations.entries());
      localStorage.setItem('ai-provider-configs', JSON.stringify(configs));
    } catch (error) {
      console.warn('Failed to save AI provider configurations:', error);
    }
  }

  private loadConfigurations(): void {
    try {
      const data = localStorage.getItem('ai-provider-configs');
      if (data) {
        const configs = JSON.parse(data);
        for (const [provider, config] of Object.entries(configs)) {
          this.configureProvider(config as AIServiceConfig);
        }
      }
    } catch (error) {
      console.warn('Failed to load AI provider configurations:', error);
    }
  }

  // Public API methods
  getProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  getConfiguredProviders(): AIProvider[] {
    return Array.from(this.providers.values()).filter(p => p.isConfigured);
  }

  getModel(providerId: string, modelId: string): AIModel | undefined {
    const provider = this.providers.get(providerId);
    return provider?.models.find(m => m.id === modelId);
  }

  isProviderConfigured(providerName: string): boolean {
    const provider = this.providers.get(providerName);
    return provider?.isConfigured || false;
  }

  removeProvider(providerName: string): void {
    this.configurations.delete(providerName);
    this.clients.delete(providerName);
    const provider = this.providers.get(providerName);
    if (provider) {
      provider.isConfigured = false;
      delete provider.apiKey;
    }
    this.saveConfigurations();
    this.emit('providerRemoved', providerName);
  }
}

export const enhancedAIService = new EnhancedAIService();