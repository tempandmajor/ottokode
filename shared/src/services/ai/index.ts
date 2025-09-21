/**
 * Unified AI service architecture
 * Provides consistent interface across web and desktop
 */

export interface AIProvider {
  name: string;
  isAvailable(): boolean;
  generateText(prompt: string, options?: AIGenerationOptions): Promise<string>;
  generateCode(prompt: string, language?: string): Promise<string>;
  chat(messages: ChatMessage[]): Promise<string>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIGenerationOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export class AIServiceManager {
  private static instance: AIServiceManager;
  private providers: Map<string, AIProvider> = new Map();

  static getInstance(): AIServiceManager {
    if (!this.instance) {
      this.instance = new AIServiceManager();
    }
    return this.instance;
  }

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.name, provider);
  }

  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.values()).filter(provider => provider.isAvailable());
  }

  async generateText(prompt: string, providerName?: string, options?: AIGenerationOptions): Promise<string> {
    const provider = providerName
      ? this.getProvider(providerName)
      : this.getAvailableProviders()[0];

    if (!provider) {
      throw new Error('No AI provider available');
    }

    return provider.generateText(prompt, options);
  }

  async generateCode(prompt: string, language?: string, providerName?: string): Promise<string> {
    const provider = providerName
      ? this.getProvider(providerName)
      : this.getAvailableProviders()[0];

    if (!provider) {
      throw new Error('No AI provider available');
    }

    return provider.generateCode(prompt, language);
  }

  async chat(messages: ChatMessage[], providerName?: string): Promise<string> {
    const provider = providerName
      ? this.getProvider(providerName)
      : this.getAvailableProviders()[0];

    if (!provider) {
      throw new Error('No AI provider available');
    }

    return provider.chat(messages);
  }
}

// Export singleton instance
export const aiService = AIServiceManager.getInstance();

// Export providers
export * from './providers';