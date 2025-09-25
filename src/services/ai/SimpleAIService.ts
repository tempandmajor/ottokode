// Simplified AI Service for production builds
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIModel } from '../../types/ai';

export class SimpleAIService {
  private clients = new Map<string, any>();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize with environment variables
    if (process.env.REACT_APP_OPENAI_API_KEY) {
      this.clients.set('openai', new OpenAI({
        apiKey: process.env.REACT_APP_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      }));
    }

    if (process.env.REACT_APP_ANTHROPIC_API_KEY) {
      this.clients.set('anthropic', new Anthropic({
        apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true
      }));
    }
  }

  public getAvailableProviders(): AIProvider[] {
    return [
      {
        name: 'openai',
        displayName: 'OpenAI',
        models: [
          {
            id: 'gpt-5',
            name: 'GPT-5',
            provider: 'openai',
            contextLength: 200000,
            costPer1KTokens: { input: 0.012, output: 0.036 } // 20% markup
          }
        ]
      },
      {
        name: 'anthropic',
        displayName: 'Anthropic',
        models: [
          {
            id: 'claude-opus-4.1',
            name: 'Claude 3.5 Sonnet',
            provider: 'anthropic',
            contextLength: 200000,
            costPer1KTokens: { input: 0.0036, output: 0.018 } // 20% markup
          }
        ]
      }
    ];
  }

  public async chat(provider: string, model: string, messages: any[]): Promise<any> {
    const client = this.clients.get(provider);
    if (!client) {
      throw new Error(`Provider ${provider} not configured`);
    }

    // Simple chat implementation
    if (provider === 'openai') {
      return await client.chat.completions.create({
        model,
        messages,
        max_tokens: 4096
      });
    }

    if (provider === 'anthropic') {
      const systemMessage = messages.find(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');

      return await client.messages.create({
        model,
        messages: conversationMessages,
        max_tokens: 4096,
        system: systemMessage?.content
      });
    }

    throw new Error(`Provider ${provider} not implemented`);
  }
}

export const simpleAIService = new SimpleAIService();