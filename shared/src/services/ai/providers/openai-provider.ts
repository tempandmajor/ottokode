/**
 * OpenAI provider implementation
 */

import OpenAI from 'openai';
import type { AIProvider, ChatMessage, AIGenerationOptions } from '../index';
import { environment } from '../../../config';

export class OpenAIProvider implements AIProvider {
  readonly name = 'OpenAI';
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      const config = environment.getConfig();
      if (!config.ai.openai) {
        throw new Error('OpenAI API key not configured');
      }
      this.client = new OpenAI({ apiKey: config.ai.openai });
    }
    return this.client;
  }

  isAvailable(): boolean {
    const config = environment.getConfig();
    return !!config.ai.openai;
  }

  async generateText(prompt: string, options?: AIGenerationOptions): Promise<string> {
    const client = this.getClient();

    const response = await client.chat.completions.create({
      model: options?.model || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
    });

    return response.choices[0]?.message?.content || '';
  }

  async generateCode(prompt: string, language?: string): Promise<string> {
    const codePrompt = language
      ? `Generate ${language} code for the following request:\n\n${prompt}`
      : `Generate code for the following request:\n\n${prompt}`;

    return this.generateText(codePrompt, { temperature: 0.3 });
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const client = this.getClient();

    const openaiMessages = messages.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    }));

    const response = await client.chat.completions.create({
      model: 'gpt-4',
      messages: openaiMessages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || '';
  }
}