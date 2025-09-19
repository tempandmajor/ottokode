/**
 * AI Provider Integration
 * Handles multiple AI providers with fallback support
 */

import { validateEnvironment, getAvailableAIProviders } from './env-validation';
import { logger } from './logger';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  codeSnippet?: string;
}

export interface AIProvider {
  name: string;
  isAvailable: boolean;
  generateResponse: (messages: AIMessage[]) => Promise<AIResponse>;
}

class OpenAIProvider implements AIProvider {
  name = 'OpenAI';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  get isAvailable(): boolean {
    return !!this.apiKey && !this.apiKey.includes('PLACEHOLDER');
  }

  async generateResponse(messages: AIMessage[]): Promise<AIResponse> {
    if (!this.isAvailable) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || 'No response generated';

      return {
        content,
        provider: 'OpenAI',
        codeSnippet: this.extractCodeSnippet(content),
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  private extractCodeSnippet(content: string): string | undefined {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/;
    const match = content.match(codeBlockRegex);
    return match ? match[1] : undefined;
  }
}

class AnthropicProvider implements AIProvider {
  name = 'Anthropic';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  get isAvailable(): boolean {
    return !!this.apiKey && !this.apiKey.includes('PLACEHOLDER');
  }

  async generateResponse(messages: AIMessage[]): Promise<AIResponse> {
    if (!this.isAvailable) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: messages.filter(m => m.role !== 'system'),
          system: messages.find(m => m.role === 'system')?.content,
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0]?.text || 'No response generated';

      return {
        content,
        provider: 'Anthropic',
        codeSnippet: this.extractCodeSnippet(content),
      };
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw error;
    }
  }

  private extractCodeSnippet(content: string): string | undefined {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/;
    const match = content.match(codeBlockRegex);
    return match ? match[1] : undefined;
  }
}

class MockProvider implements AIProvider {
  name = 'Mock';
  isAvailable = true;

  async generateResponse(messages: AIMessage[]): Promise<AIResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

    if (userMessage.includes('function') || userMessage.includes('create')) {
      return {
        content: 'I can help you create a function! Here\'s a template with TypeScript types and error handling:',
        provider: 'Mock',
        codeSnippet: `function processData(data: any[]): any[] {
  try {
    if (!Array.isArray(data)) {
      throw new Error('Input must be an array');
    }

    const result = data.map(item => {
      // Add your processing logic
      return item;
    });

    return result;
  } catch (error) {
    console.error('Error processing data:', error);
    throw error;
  }
}`
      };
    }

    if (userMessage.includes('react') || userMessage.includes('component')) {
      return {
        content: 'Here\'s a modern React component with TypeScript:',
        provider: 'Mock',
        codeSnippet: `interface MyComponentProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

export function MyComponent({ title, description, onAction }: MyComponentProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onAction?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-card rounded-lg border">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="text-muted-foreground mt-2">{description}</p>
      )}
      <Button onClick={handleClick} disabled={isLoading} className="mt-4">
        {isLoading ? 'Loading...' : 'Action'}
      </Button>
    </div>
  );
}`
      };
    }

    const responses = [
      'I\'d be happy to help with that! Can you provide more details about what you\'re trying to accomplish?',
      'That\'s an interesting question! Here\'s what I would suggest based on best practices...',
      'Great question! Let me break this down for you with some practical examples.',
      'I can definitely help with that. Here\'s a clean and efficient approach:'
    ];

    return {
      content: responses[Math.floor(Math.random() * responses.length)],
      provider: 'Mock',
    };
  }
}

export class AIService {
  private providers: AIProvider[] = [];
  private fallbackProvider: MockProvider;

  constructor() {
    this.fallbackProvider = new MockProvider();
    this.initializeProviders();
  }

  private initializeProviders() {
    try {
      const config = validateEnvironment();

      if (config.ai.openai) {
        this.providers.push(new OpenAIProvider(config.ai.openai));
      }

      if (config.ai.anthropic) {
        this.providers.push(new AnthropicProvider(config.ai.anthropic));
      }

      // Add other providers as needed

      logger.ai('AI Providers initialized', {
        available: this.providers.filter(p => p.isAvailable).map(p => p.name),
        total: this.providers.length,
      });

    } catch (error) {
      logger.warn('Error initializing AI providers', error);
    }
  }

  async generateResponse(messages: AIMessage[]): Promise<AIResponse> {
    const availableProviders = this.providers.filter(p => p.isAvailable);

    if (availableProviders.length === 0) {
      logger.ai('No AI providers available, using mock responses');
      return this.fallbackProvider.generateResponse(messages);
    }

    // Try providers in order until one succeeds
    for (const provider of availableProviders) {
      try {
        return await provider.generateResponse(messages);
      } catch (error) {
        logger.warn(`${provider.name} provider failed`, error);
        continue;
      }
    }

    // If all providers fail, use mock
    logger.ai('All AI providers failed, using mock responses');
    return this.fallbackProvider.generateResponse(messages);
  }

  getAvailableProviders(): string[] {
    return this.providers
      .filter(p => p.isAvailable)
      .map(p => p.name);
  }

  hasRealProviders(): boolean {
    return this.providers.some(p => p.isAvailable);
  }
}

// Lazy singleton instance - only created when first accessed
let _aiService: AIService | null = null;

export function getAIService(): AIService {
  if (!_aiService) {
    _aiService = new AIService();
  }
  return _aiService;
}

// For backwards compatibility, but this will only work at runtime
// Use lazy getters to avoid any evaluation during build
export const aiService = {
  get generateResponse() {
    return (...args: Parameters<AIService['generateResponse']>) => getAIService().generateResponse(...args);
  },
  get getAvailableProviders() {
    return () => getAIService().getAvailableProviders();
  },
  get hasRealProviders() {
    return () => getAIService().hasRealProviders();
  },
};