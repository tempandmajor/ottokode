// AI Provider Types and Interfaces

export interface AIProvider {
  name: string;
  displayName: string;
  models: AIModel[];
  apiKey?: string;
  baseUrl?: string;
  isConfigured?: boolean;
  supportsStreaming?: boolean;
  supportsCodeCompletion?: boolean;
  supportsFunctionCalling?: boolean;
  requiresApiKey?: boolean;
  configurable?: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  costPer1KTokens: {
    input: number;
    output: number;
  };
  capabilities?: ModelCapabilities;
  supportsStreaming?: boolean;
  supportsVision?: boolean;
  supportsFunctions?: boolean;
}

export interface ModelCapabilities {
  chat: boolean;
  completion: boolean;
  codeGeneration: boolean;
  functionCalling: boolean;
  vision?: boolean;
  reasoning?: boolean;
  agenticTasks?: boolean;
  hybridReasoning?: boolean;
  structuredOutput?: boolean;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  timestamp?: Date;
  tokens?: number;
  cost?: number;
  structuredData?: any;
  responseType?: string;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  model: string;
  provider: string;
  totalTokens: number;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
  user_id: string;
  updated_at: Date;
  message_count?: number;
}

export interface ConversationSummary {
  id: string;
  title: string;
  model: string;
  provider: string;
  totalTokens: number;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
  user_id: string;
  updated_at: Date;
  messages: AIMessage[];
  message_count?: number;
}

export interface CodeCompletionRequest {
  code: string;
  language: string;
  position: {
    line: number;
    column: number;
  };
  context?: {
    filename: string;
    projectFiles: string[];
    imports: string[];
  };
}

export interface CodeCompletionResponse {
  completions: CodeCompletion[];
  model: string;
  usage: TokenUsage;
}

export interface CodeCompletion {
  text: string;
  confidence: number;
  type: 'inline' | 'multiline' | 'function';
  range?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

export interface AIUsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byProvider: Record<string, ProviderStats>;
  byModel: Record<string, ModelStats>;
  dailyUsage: DailyUsage[];
}

export interface ProviderStats {
  requests: number;
  tokens: number;
  cost: number;
  avgLatency: number;
}

export interface ModelStats {
  requests: number;
  tokens: number;
  cost: number;
  avgTokensPerRequest: number;
}

export interface DailyUsage {
  date: string;
  requests: number;
  tokens: number;
  cost: number;
}

// Streaming response types
export interface StreamingResponse {
  content: string;
  done: boolean;
  usage?: TokenUsage;
}

export type AIStreamCallback = (response: StreamingResponse) => void;

// Function calling types (for MCP integration)
export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

// AI Configuration
export interface AIConfig {
  providers: {
    openai: {
      apiKey: string;
      organizationId?: string;
      baseUrl?: string;
    };
    anthropic: {
      apiKey: string;
      baseUrl?: string;
    };
    google: {
      apiKey: string;
      baseUrl?: string;
    };
    ollama: {
      baseUrl: string;
      models: string[];
    };
  };
  defaultProvider: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  streaming: boolean;
  costTrackingEnabled: boolean;
  budgetLimit?: number;
  budgetPeriod?: 'daily' | 'weekly' | 'monthly';
}

// Error types
export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export class RateLimitError extends AIProviderError {
  constructor(provider: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${provider}`, provider, 'RATE_LIMIT');
    this.details = { retryAfter };
  }
}

export class InsufficientCreditsError extends AIProviderError {
  constructor(provider: string) {
    super(`Insufficient credits for ${provider}`, provider, 'INSUFFICIENT_CREDITS');
  }
}

export class ModelNotFoundError extends AIProviderError {
  constructor(provider: string, model: string) {
    super(`Model ${model} not found for provider ${provider}`, provider, 'MODEL_NOT_FOUND');
    this.details = { model };
  }
}