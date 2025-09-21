/**
 * AI Provider exports
 */

export * from './openai-provider';
export * from './anthropic-provider';

import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { aiService } from '../index';

/**
 * Initialize all available AI providers
 */
export function initializeAIProviders(): void {
  // Register all providers
  aiService.registerProvider(new OpenAIProvider());
  aiService.registerProvider(new AnthropicProvider());

  // Note: Add more providers as needed (Google, Cohere, Mistral, etc.)
}