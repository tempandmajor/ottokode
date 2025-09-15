// Ollama Local AI Provider - Privacy-focused local AI integration
import { AIResponse, CodeCompletionRequest, ChatRequest, AIUsage } from '../types';

export interface OllamaModel {
  name: string;
  size: string;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[] | null;
    parameter_size: string;
    quantization_level: string;
  };
  expires_at: string;
  size_vb: number;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  template?: string;
  context?: number[];
  stream?: boolean;
  raw?: boolean;
  format?: string;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
    seed?: number;
    num_predict?: number;
    stop?: string[];
  };
}

export interface OllamaChatRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  stream?: boolean;
  format?: string;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
  };
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaProvider {
  private baseUrl: string;
  private currentModel: string;
  private availableModels: OllamaModel[] = [];
  private isConnected: boolean = false;

  constructor(baseUrl: string = 'http://localhost:11434', defaultModel: string = 'codellama:7b') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.currentModel = defaultModel;
  }

  async initialize(): Promise<boolean> {
    try {
      // Check if Ollama is running
      const response = await fetch(`${this.baseUrl}/api/version`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Ollama not responding: ${response.status}`);
      }

      // Load available models
      await this.loadAvailableModels();
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Ollama:', error);
      this.isConnected = false;
      return false;
    }
  }

  async loadAvailableModels(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load models: ${response.status}`);
      }

      const data = await response.json();
      this.availableModels = data.models || [];

      // If current model is not available, select the first available model
      if (this.availableModels.length > 0) {
        const modelExists = this.availableModels.some(model => model.name === this.currentModel);
        if (!modelExists) {
          this.currentModel = this.availableModels[0].name;
        }
      }
    } catch (error) {
      console.error('Failed to load available models:', error);
      this.availableModels = [];
    }
  }

  async completeCode(request: CodeCompletionRequest): Promise<AIResponse> {
    if (!this.isConnected) {
      throw new Error('Ollama is not connected. Please ensure Ollama is running.');
    }

    const startTime = Date.now();

    try {
      // Create prompt for code completion
      const systemPrompt = `You are an expert code completion assistant. Complete the code based on the context provided. Only return the completion, no explanations.

Language: ${request.language}
Context: ${request.context || 'No additional context'}`;

      const prompt = `${request.prefix}${request.suffix ? '\n\n// Complete the code above. The cursor is here, and the following code comes after:\n' + request.suffix : ''}`;

      const ollamaRequest: OllamaGenerateRequest = {
        model: this.currentModel,
        prompt: prompt,
        system: systemPrompt,
        stream: false,
        options: {
          temperature: 0.3, // Lower temperature for more consistent completions
          top_p: 0.9,
          num_predict: 100, // Limit completion length
          stop: ['\n\n', '```', '---'],
        },
      };

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ollamaRequest),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      const duration = Date.now() - startTime;

      return {
        content: data.response.trim(),
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        model: this.currentModel,
        provider: 'ollama',
        responseTime: duration,
        cost: 0, // Local models are free
      };
    } catch (error) {
      console.error('Ollama code completion error:', error);
      throw new Error(`Code completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async chat(request: ChatRequest): Promise<AIResponse> {
    if (!this.isConnected) {
      throw new Error('Ollama is not connected. Please ensure Ollama is running.');
    }

    const startTime = Date.now();

    try {
      const ollamaRequest: OllamaChatRequest = {
        model: this.currentModel,
        messages: request.messages.map((msg: any) => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        })),
        stream: false,
        options: {
          temperature: request.temperature || 0.7,
          top_p: 0.9,
          top_k: 40,
        },
      };

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ollamaRequest),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const duration = Date.now() - startTime;

      return {
        content: data.message?.content || data.response || 'No response',
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        model: this.currentModel,
        provider: 'ollama',
        responseTime: duration,
        cost: 0, // Local models are free
      };
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw new Error(`Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async streamChat(request: ChatRequest): Promise<AsyncIterable<string>> {
    if (!this.isConnected) {
      throw new Error('Ollama is not connected. Please ensure Ollama is running.');
    }

    const ollamaRequest: OllamaChatRequest = {
      model: this.currentModel,
      messages: request.messages.map((msg: any) => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      })),
      stream: true,
      options: {
        temperature: request.temperature || 0.7,
        top_p: 0.9,
        top_k: 40,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ollamaRequest),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    return this.parseStreamResponse(response);
  }

  private async *parseStreamResponse(response: Response): AsyncIterable<string> {
    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.message?.content) {
                yield data.message.content;
              } else if (data.response) {
                yield data.response;
              }
            } catch (error) {
              console.warn('Failed to parse streaming chunk:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // Model management methods
  async pullModel(modelName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model: ${response.status}`);
    }

    // Reload available models after pulling
    await this.loadAvailableModels();
  }

  async deleteModel(modelName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete model: ${response.status}`);
    }

    // Reload available models after deletion
    await this.loadAvailableModels();
  }

  // Getters and setters
  getAvailableModels(): OllamaModel[] {
    return this.availableModels;
  }

  getCurrentModel(): string {
    return this.currentModel;
  }

  async setModel(modelName: string): Promise<boolean> {
    const modelExists = this.availableModels.some(model => model.name === modelName);
    if (!modelExists) {
      throw new Error(`Model ${modelName} is not available. Pull it first.`);
    }

    this.currentModel = modelName;
    return true;
  }

  isModelAvailable(modelName: string): boolean {
    return this.availableModels.some(model => model.name === modelName);
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      this.isConnected = response.ok;
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  // AIProvider interface requirements
  getUsage(): AIUsage {
    return {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
  }

  getProviderName(): string {
    return 'Ollama (Local)';
  }

  // Recommended models for different use cases
  static getRecommendedModels(): { [key: string]: string } {
    return {
      'Code Generation': 'codellama:7b',
      'Code Chat': 'codellama:13b-instruct',
      'General Chat': 'llama2:7b',
      'Fast Responses': 'tinyllama:1.1b',
      'High Quality': 'llama2:13b',
      'Code Completion': 'codellama:7b-code',
    };
  }

  // Installation instructions
  static getInstallationInstructions(): string {
    return `
To use Ollama local AI:

1. Install Ollama:
   - macOS/Linux: curl -fsSL https://ollama.ai/install.sh | sh
   - Windows: Download from https://ollama.ai/download

2. Start Ollama service:
   ollama serve

3. Pull a recommended model:
   ollama pull codellama:7b

4. The AI IDE will automatically detect Ollama when it's running.

Recommended models:
- codellama:7b (2.6GB) - Fast code generation
- codellama:13b-instruct (7.8GB) - Better code understanding
- llama2:7b (3.8GB) - General chat capabilities
`;
  }
}

// Export singleton instance
export const ollamaProvider = new OllamaProvider();