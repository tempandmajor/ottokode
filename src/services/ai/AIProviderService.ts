import { AIProvider, AIModel, AIMessage, CodeCompletionRequest, CodeCompletionResponse, AIStreamCallback } from '../../types/ai';
import { mcpRegistry } from '../mcp/MCPRegistry';
import { costTracker } from './CostTracker';
import { performanceMonitor } from '../performance/PerformanceMonitor';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class AIProviderService {
  private providers = new Map<string, AIProvider>();
  private clients = new Map<string, any>();
  private usageStats = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    byProvider: {} as Record<string, any>,
    byModel: {} as Record<string, any>,
    dailyUsage: [] as any[]
  };

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // OpenAI Provider
    const openaiProvider: AIProvider = {
      name: 'openai',
      displayName: 'OpenAI',
      models: [
        {
          id: 'gpt-5',
          name: 'GPT-5',
          provider: 'openai',
          contextLength: 200000,
          costPer1KTokens: { input: 0.01, output: 0.03 },
          capabilities: {
            chat: true,
            completion: true,
            codeGeneration: true,
            functionCalling: true,
            vision: true,
            reasoning: true,
            structuredOutput: true
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
    };

    // Anthropic Provider
    const anthropicProvider: AIProvider = {
      name: 'anthropic',
      displayName: 'Anthropic Claude',
      models: [
        {
          id: 'claude-opus-4.1',
          name: 'Claude Opus 4.1',
          provider: 'anthropic',
          contextLength: 200000,
          costPer1KTokens: { input: 0.015, output: 0.075 },
          capabilities: {
            chat: true,
            completion: true,
            codeGeneration: true,
            functionCalling: true,
            reasoning: true,
            agenticTasks: true,
            hybridReasoning: true
          }
        },
        {
          id: 'claude-sonnet-4',
          name: 'Claude Sonnet 4',
          provider: 'anthropic',
          contextLength: 200000,
          costPer1KTokens: { input: 0.003, output: 0.015 },
          capabilities: {
            chat: true,
            completion: true,
            codeGeneration: true,
            functionCalling: true,
            reasoning: true,
            hybridReasoning: true
          }
        },
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
    };

    // Google Provider
    const googleProvider: AIProvider = {
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
    };

    // Ollama Provider (Local)
    const ollamaProvider: AIProvider = {
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
            functionCalling: true
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
            functionCalling: true
          }
        }
      ],
      isConfigured: false,
      supportsStreaming: true,
      supportsCodeCompletion: true,
      supportsFunctionCalling: false,
      baseUrl: 'http://localhost:11434'
    };

    this.providers.set('openai', openaiProvider);
    this.providers.set('anthropic', anthropicProvider);
    this.providers.set('google', googleProvider);
    this.providers.set('ollama', ollamaProvider);
  }

  configureProvider(providerName: string, config: any): boolean {
    const provider = this.providers.get(providerName);
    if (!provider) {
      console.error(`Provider ${providerName} not found`);
      return false;
    }

    try {
      switch (providerName) {
        case 'openai':
          const openaiClient = new OpenAI({
            apiKey: config.apiKey,
            organization: config.organizationId,
            baseURL: config.baseUrl,
            dangerouslyAllowBrowser: true
          });
          this.clients.set('openai', openaiClient);
          provider.apiKey = config.apiKey;
          provider.baseUrl = config.baseUrl;
          break;

        case 'anthropic':
          const anthropicClient = new Anthropic({
            apiKey: config.apiKey,
            baseURL: config.baseUrl,
            dangerouslyAllowBrowser: true
          });
          this.clients.set('anthropic', anthropicClient);
          provider.apiKey = config.apiKey;
          provider.baseUrl = config.baseUrl;
          break;

        case 'google':
          const googleClient = new GoogleGenerativeAI(config.apiKey);
          this.clients.set('google', googleClient);
          provider.apiKey = config.apiKey;
          break;

        case 'ollama':
          // For Ollama, we just need the base URL
          provider.baseUrl = config.baseUrl || 'http://localhost:11434';
          this.clients.set('ollama', { baseUrl: provider.baseUrl });
          break;

        default:
          console.error(`Unknown provider: ${providerName}`);
          return false;
      }

      provider.isConfigured = true;
      console.log(`Provider ${providerName} configured successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to configure provider ${providerName}:`, error);
      return false;
    }
  }

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

  async chat(
    providerName: string,
    modelId: string,
    messages: AIMessage[],
    options?: {
      streaming?: boolean;
      maxTokens?: number;
      temperature?: number;
      onStream?: AIStreamCallback;
      includeMCP?: boolean;
    }
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

      // Prepare MCP tools if requested
      let availableTools: any[] = [];
      if (options?.includeMCP && provider.supportsFunctionCalling) {
        availableTools = this.prepareMCPTools();
      }

      switch (providerName) {
        case 'openai':
          response = await this.chatWithOpenAI(client, modelId, messages, options, availableTools);
          break;
        case 'anthropic':
          response = await this.chatWithAnthropic(client, modelId, messages, options, availableTools);
          break;
        case 'google':
          response = await this.chatWithGoogle(client, modelId, messages, options);
          break;
        case 'ollama':
          response = await this.chatWithOllama(client, modelId, messages, options);
          break;
        default:
          throw new Error(`Unsupported provider: ${providerName}`);
      }

      // Track usage with detailed cost tracking
      const endTime = Date.now();
      const requestDuration = endTime - startTime;

      // Track performance for monitoring
      performanceMonitor.recordAIRequestLatency(providerName, requestDuration);

      // Create usage record for cost tracker
      costTracker.recordUsage({
        provider: providerName,
        model: modelId,
        promptTokens: this.calculatePromptTokens(messages),
        completionTokens: response.tokens || 0,
        totalTokens: response.tokens || 0,
        cost: response.cost || 0,
        requestType: options?.streaming ? 'streaming' : 'chat',
        requestDuration,
        success: true
      });

      // Legacy usage tracking
      this.trackUsage(providerName, modelId, response.tokens || 0, response.cost || 0, requestDuration);

      return response;
    } catch (error) {
      // Track failed request
      const endTime = Date.now();
      const requestDuration = endTime - startTime;

      // Track performance for monitoring (even failed requests)
      performanceMonitor.recordAIRequestLatency(providerName, requestDuration);

      costTracker.recordUsage({
        provider: providerName,
        model: modelId,
        promptTokens: this.calculatePromptTokens(messages),
        completionTokens: 0,
        totalTokens: 0,
        cost: 0,
        requestType: options?.streaming ? 'streaming' : 'chat',
        requestDuration,
        success: false,
        errorCode: error instanceof Error ? error.message : 'Unknown error'
      });

      console.error(`Error in chat with ${providerName}:`, error);
      throw error;
    }
  }

  async completeCode(
    providerName: string,
    modelId: string,
    request: CodeCompletionRequest
  ): Promise<CodeCompletionResponse> {
    const provider = this.providers.get(providerName);
    const client = this.clients.get(providerName);
    
    if (!provider || !client || !provider.isConfigured) {
      throw new Error(`Provider ${providerName} is not configured`);
    }

    const model = this.getModel(providerName, modelId);
    if (!model || !model.capabilities.codeGeneration) {
      throw new Error(`Model ${modelId} does not support code completion`);
    }

    // Create a completion prompt
    const prompt = this.createCodeCompletionPrompt(request);
    
    try {
      const startTime = Date.now();
      let response: CodeCompletionResponse;

      switch (providerName) {
        case 'openai':
          response = await this.completeCodeWithOpenAI(client, modelId, prompt, request);
          break;
        case 'anthropic':
          response = await this.completeCodeWithAnthropic(client, modelId, prompt, request);
          break;
        case 'google':
          response = await this.completeCodeWithGoogle(client, modelId, prompt, request);
          break;
        case 'ollama':
          response = await this.completeCodeWithOllama(client, modelId, prompt, request);
          break;
        default:
          throw new Error(`Unsupported provider: ${providerName}`);
      }

      // Track usage
      const endTime = Date.now();
      this.trackUsage(providerName, modelId, response.usage.totalTokens, response.usage.cost, endTime - startTime);

      return response;
    } catch (error) {
      console.error(`Error in code completion with ${providerName}:`, error);
      throw error;
    }
  }

  private prepareMCPTools(): any[] {
    const availableTools = mcpRegistry.getAvailableTools();
    return availableTools.map(tool => ({
      type: 'function',
      function: {
        name: `${tool.serverName}_${tool.toolName}`,
        description: `${tool.description} (via ${tool.serverName} MCP server)`,
        parameters: tool.schema
      }
    }));
  }

  private async chatWithOpenAI(
    client: OpenAI,
    modelId: string,
    messages: AIMessage[],
    options?: any,
    tools?: any[]
  ): Promise<AIMessage> {
    const openaiMessages = messages.map(m => ({
      role: m.role as any,
      content: m.content
    }));

    const params: any = {
      model: modelId,
      messages: openaiMessages,
      max_tokens: options?.maxTokens || 2000,
      temperature: options?.temperature || 0.7
    };

    if (tools && tools.length > 0) {
      params.tools = tools;
      params.tool_choice = 'auto';
    }

    if (options?.streaming) {
      const stream = await client.chat.completions.create({
        ...params,
        stream: true
      });

      let content = '';
      let usage: any = null;

      for await (const chunk of stream as any) {
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

      // Handle function calls if present
      if (choice.message.tool_calls) {
        await this.executeMCPTools(choice.message.tool_calls);
        // In a real implementation, you'd continue the conversation with tool results
        return {
          role: 'assistant',
          content: choice.message.content || 'Function calls executed',
          timestamp: new Date(),
          tokens: response.usage?.total_tokens,
          cost: this.calculateCost('openai', modelId, response.usage?.total_tokens || 0)
        };
      }

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
    options?: any,
    tools?: any[]
  ): Promise<AIMessage> {
    const anthropicMessages = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    const params: any = {
      model: modelId,
      messages: anthropicMessages,
      max_tokens: options?.maxTokens || 2000,
      temperature: options?.temperature || 0.7
    };

    if (tools && tools.length > 0) {
      params.tools = tools.map((tool: any) => tool.function);
    }

    if (options?.streaming) {
      const stream = await client.messages.create({
        ...params,
        stream: true
      });

      let content = '';
      let usage: any = null;

      for await (const chunk of stream as any) {
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
          usage = chunk.message.usage;
        }
      }

      if (options.onStream) {
        options.onStream({ content: '', done: true, usage });
      }

      return {
        role: 'assistant',
        content,
        timestamp: new Date(),
        tokens: usage?.output_tokens + usage?.input_tokens,
        cost: this.calculateCost('anthropic', modelId, usage?.output_tokens + usage?.input_tokens || 0)
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
    _options?: any
  ): Promise<AIMessage> {
    const model = client.getGenerativeModel({ model: modelId });
    
    // Convert messages to Google format
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const lastMessage = messages[messages.length - 1];
    
    try {
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
    } catch (error) {
      throw new Error(`Google AI error: ${error}`);
    }
  }

  private async chatWithOllama(
    client: any,
    modelId: string,
    messages: AIMessage[],
    _options?: any
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

  private createCodeCompletionPrompt(request: CodeCompletionRequest): string {
    const { code, language, position, context } = request;
    
    const beforeCursor = code.substring(0, this.getPositionIndex(code, position));
    const afterCursor = code.substring(this.getPositionIndex(code, position));
    
    return `Complete the ${language} code at the cursor position:

${context?.filename ? `File: ${context.filename}` : ''}

Code before cursor:
\`\`\`${language}
${beforeCursor}
\`\`\`

Code after cursor:
\`\`\`${language}
${afterCursor}
\`\`\`

Provide only the code that should be inserted at the cursor position. Do not include explanations.`;
  }

  private getPositionIndex(code: string, position: { line: number; column: number }): number {
    const lines = code.split('\n');
    let index = 0;
    
    for (let i = 0; i < position.line && i < lines.length; i++) {
      index += lines[i].length + 1; // +1 for newline
    }
    
    return index + position.column;
  }

  private async completeCodeWithOpenAI(
    client: OpenAI,
    modelId: string,
    prompt: string,
    _request: CodeCompletionRequest
  ): Promise<CodeCompletionResponse> {
    const response = await client.chat.completions.create({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.1
    });

    const completion = response.choices[0].message.content || '';
    
    return {
      completions: [{
        text: completion,
        confidence: 0.8,
        type: 'inline'
      }],
      model: modelId,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
        cost: this.calculateCost('openai', modelId, response.usage?.total_tokens || 0)
      }
    };
  }

  private async completeCodeWithAnthropic(
    client: Anthropic,
    modelId: string,
    prompt: string,
    _request: CodeCompletionRequest
  ): Promise<CodeCompletionResponse> {
    const response = await client.messages.create({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.1
    });

    const completion = response.content[0];
    const text = completion.type === 'text' ? completion.text : '';
    
    return {
      completions: [{
        text,
        confidence: 0.8,
        type: 'inline'
      }],
      model: modelId,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        cost: this.calculateCost('anthropic', modelId, response.usage.input_tokens + response.usage.output_tokens)
      }
    };
  }

  private async completeCodeWithGoogle(
    client: GoogleGenerativeAI,
    modelId: string,
    prompt: string,
    _request: CodeCompletionRequest
  ): Promise<CodeCompletionResponse> {
    const model = client.getGenerativeModel({ model: modelId });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return {
      completions: [{
        text: response.text(),
        confidence: 0.7,
        type: 'inline'
      }],
      model: modelId,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cost: 0
      }
    };
  }

  private async completeCodeWithOllama(
    client: any,
    modelId: string,
    prompt: string,
    _request: CodeCompletionRequest
  ): Promise<CodeCompletionResponse> {
    const response = await fetch(`${client.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelId,
        prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      completions: [{
        text: data.response,
        confidence: 0.7,
        type: 'inline'
      }],
      model: modelId,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cost: 0
      }
    };
  }

  private async executeMCPTools(toolCalls: any[]): Promise<any[]> {
    const results = [];
    
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const [serverName, toolName] = functionName.split('_', 2);
      
      try {
        const result = await mcpRegistry.executeTool(
          serverName,
          toolName,
          JSON.parse(toolCall.function.arguments)
        );
        results.push(result);
      } catch (error) {
        results.push({
          content: [{ type: 'text', text: `Error executing ${functionName}: ${error}` }],
          isError: true
        });
      }
    }
    
    return results;
  }

  private calculateCost(provider: string, modelId: string, tokens: number): number {
    const model = this.getModel(provider, modelId);
    if (!model) return 0;
    
    // Simplified cost calculation - assumes equal input/output
    const avgCost = (model.costPer1KTokens.input + model.costPer1KTokens.output) / 2;
    return (tokens / 1000) * avgCost;
  }

  private trackUsage(provider: string, model: string, tokens: number, cost: number, latency: number): void {
    this.usageStats.totalRequests++;
    this.usageStats.totalTokens += tokens;
    this.usageStats.totalCost += cost;

    // Track by provider
    if (!this.usageStats.byProvider[provider]) {
      this.usageStats.byProvider[provider] = {
        requests: 0,
        tokens: 0,
        cost: 0,
        avgLatency: 0
      };
    }

    const providerStats = this.usageStats.byProvider[provider];
    providerStats.requests++;
    providerStats.tokens += tokens;
    providerStats.cost += cost;
    providerStats.avgLatency = (providerStats.avgLatency + latency) / 2;

    // Track by model
    const modelKey = `${provider}:${model}`;
    if (!this.usageStats.byModel[modelKey]) {
      this.usageStats.byModel[modelKey] = {
        requests: 0,
        tokens: 0,
        cost: 0,
        avgTokensPerRequest: 0
      };
    }

    const modelStats = this.usageStats.byModel[modelKey];
    modelStats.requests++;
    modelStats.tokens += tokens;
    modelStats.cost += cost;
    modelStats.avgTokensPerRequest = modelStats.tokens / modelStats.requests;
  }

  getUsageStats(): any {
    return { ...this.usageStats };
  }

  resetUsageStats(): void {
    this.usageStats = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      byProvider: {},
      byModel: {},
      dailyUsage: []
    };
  }

  private calculatePromptTokens(messages: AIMessage[]): number {
    // Rough estimation: 1 token per ~4 characters for English text
    const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    return Math.ceil(totalChars / 4);
  }
}

// Singleton instance
export const aiProviderService = new AIProviderService();