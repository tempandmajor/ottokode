// AI Service Types - Common interfaces for AI providers
export interface AIProvider {
  name: string;
  displayName: string;
  models: AIModel[];
  isConfigured: boolean;
  supportsStreaming: boolean;
  supportsCodeCompletion: boolean;
  supportsFunctionCalling: boolean;
  apiKey?: string;
  baseUrl?: string;
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
  capabilities: {
    chat: boolean;
    completion: boolean;
    codeGeneration: boolean;
    functionCalling: boolean;
    vision?: boolean;
    reasoning?: boolean;
  };
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokens?: number;
  cost?: number;
}

export interface AIResponse {
  content: string;
  usage: AIUsage;
  model: string;
  provider: string;
  responseTime: number;
  cost: number;
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CodeCompletionRequest {
  language: string;
  prefix: string;
  suffix?: string;
  context?: string;
}

export interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
}

export interface AIStreamCallback {
  (chunk: { content: string; done: boolean; usage?: any }): void;
}