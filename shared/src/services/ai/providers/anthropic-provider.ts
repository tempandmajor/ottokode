/**
 * Anthropic provider implementation
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, ChatMessage, AIGenerationOptions } from '../index';
import { environment } from '../../../config';

export class AnthropicProvider implements AIProvider {
  readonly name = 'Anthropic';
  private client: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!this.client) {
      const config = environment.getConfig();
      if (!config.ai.anthropic) {
        throw new Error('Anthropic API key not configured');
      }
      this.client = new Anthropic({ apiKey: config.ai.anthropic });
    }
    return this.client;
  }

  isAvailable(): boolean {
    const config = environment.getConfig();
    return !!config.ai.anthropic;
  }

  async generateText(prompt: string, options?: AIGenerationOptions): Promise<string> {
    const client = this.getClient();

    const response = await client.messages.create({
      model: options?.model || 'claude-3-sonnet-20240229',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  }

  async generateCode(prompt: string, language?: string): Promise<string> {
    const codePrompt = language
      ? `Generate ${language} code for the following request:\n\n${prompt}`
      : `Generate code for the following request:\n\n${prompt}`;

    return this.generateText(codePrompt, { temperature: 0.3 });
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const client = this.getClient();

    // Anthropic requires at least one user message
    const anthropicMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    // Extract system message if present
    const systemMessage = messages.find(msg => msg.role === 'system');

    const response = await client.messages.create({
      model: 'claude-3-sonnet-20240229',
      messages: anthropicMessages,
      max_tokens: 1000,
      temperature: 0.7,
      ...(systemMessage && { system: systemMessage.content }),
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  }
}