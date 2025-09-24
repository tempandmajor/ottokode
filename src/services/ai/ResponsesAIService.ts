import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CohereClient } from 'cohere-ai';
import { Mistral as MistralApi } from '@mistralai/mistralai';
import { APP_CONFIG } from '../../constants/app';
import { AIMessage, AICompletionOptions, AIProvider, AIProviderConfig, AICompletionResponse, AICodeSuggestion } from '../../types/ai';
import {
  ResponseFormat,
  CodeContext,
  ResponsesAPIOptions,
  CodeGenerationResponse,
  CodeReviewResponse,
  ErrorExplanationResponse,
  RefactoringResponse,
  ArchitectureResponse,
  DocumentationResponse,
  LearningResponse,
  SCHEMAS
} from '../../types/responses-api';

export interface StructuredCompletionOptions extends AICompletionOptions {
  context?: CodeContext;
  responseFormat?: ResponseFormat;
}

export class ResponsesAIService {
  protected providers: Map<AIProvider, AIProviderConfig> = new Map();
  protected clients: Map<AIProvider, any> = new Map();
  private currentProvider: AIProvider = 'openai';
  private readonly SUPPORTED_MODELS = [
    'gpt-5'
  ];

  constructor() {
    this.initializeProviders();
    this.loadAPIKeys();
  }

  private initializeProviders(): void {
    // OpenAI Configuration (Primary provider for structured responses)
    this.providers.set('openai', {
      name: 'OpenAI',
      models: ['gpt-5'],
      defaultModel: 'gpt-5',
      supportsStreaming: true,
      supportsCodeCompletion: true,
      supportsChat: true,
      supportsStructuredResponse: true
    });

    // Anthropic Configuration (fallback)
    this.providers.set('anthropic', {
      name: 'Anthropic',
      models: ['claude-opus-4.1', 'claude-sonnet-4', 'claude-3.5-sonnet-20241022', 'claude-3-haiku-20240307'],
      defaultModel: 'claude-sonnet-4',
      supportsStreaming: true,
      supportsCodeCompletion: true,
      supportsChat: true,
      supportsStructuredResponse: false
    });

    // Google AI Configuration (fallback)
    this.providers.set('google', {
      name: 'Google AI',
      models: ['gemini-pro', 'gemini-pro-vision'],
      defaultModel: 'gemini-pro',
      supportsStreaming: true,
      supportsCodeCompletion: true,
      supportsChat: true,
      supportsStructuredResponse: false
    });

    // Cohere Configuration (fallback)
    this.providers.set('cohere', {
      name: 'Cohere',
      models: ['command', 'command-light', 'command-nightly'],
      defaultModel: 'command',
      supportsStreaming: true,
      supportsCodeCompletion: false,
      supportsChat: true,
      supportsStructuredResponse: false
    });

    // Mistral Configuration (fallback)
    this.providers.set('mistral', {
      name: 'Mistral AI',
      models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
      defaultModel: 'mistral-large-latest',
      supportsStreaming: true,
      supportsCodeCompletion: true,
      supportsChat: true,
      supportsStructuredResponse: false
    });
  }

  private loadAPIKeys(): void {
    // Load API keys from environment variables or localStorage
    const savedKeys = this.getSavedAPIKeys();

    // Set API keys for each provider
    for (const [provider, config] of Array.from(this.providers.entries())) {
      const envKey = APP_CONFIG.ai.fallbackKeys[provider];
      const savedKey = savedKeys[provider];

      config.apiKey = savedKey || envKey;

      if (config.apiKey) {
        this.initializeClient(provider, config);
      }
    }
  }

  private initializeClient(provider: AIProvider, config: AIProviderConfig): void {
    if (!config.apiKey) return;

    try {
      switch (provider) {
        case 'openai':
          this.clients.set(provider, new OpenAI({
            apiKey: config.apiKey,
            dangerouslyAllowBrowser: true
          }));
          break;

        case 'anthropic':
          this.clients.set(provider, new Anthropic({
            apiKey: config.apiKey,
            dangerouslyAllowBrowser: true
          }));
          break;

        case 'google':
          this.clients.set(provider, new GoogleGenerativeAI(config.apiKey));
          break;

        case 'cohere':
          this.clients.set(provider, new CohereClient({
            token: config.apiKey
          }));
          break;

        case 'mistral':
          this.clients.set(provider, new MistralApi({ apiKey: config.apiKey }));
          break;
      }
    } catch (error) {
      console.error(`Failed to initialize ${provider} client:`, error);
    }
  }

  // API Key Management
  setAPIKey(provider: AIProvider, apiKey: string): void {
    const config = this.providers.get(provider);
    if (!config) throw new Error(`Unknown provider: ${provider}`);

    config.apiKey = apiKey;
    this.initializeClient(provider, config);
    this.saveAPIKey(provider, apiKey);
  }

  getAPIKey(provider: AIProvider): string | undefined {
    return this.providers.get(provider)?.apiKey;
  }

  removeAPIKey(provider: AIProvider): void {
    const config = this.providers.get(provider);
    if (config) {
      config.apiKey = undefined;
      this.clients.delete(provider);
      this.removeStoredAPIKey(provider);
    }
  }

  private saveAPIKey(provider: AIProvider, apiKey: string): void {
    try {
      const keys = this.getSavedAPIKeys();
      keys[provider] = apiKey;
      localStorage.setItem('branchcode_ai_keys', JSON.stringify(keys));
    } catch (error) {
      console.error('Failed to save API key:', error);
    }
  }

  private getSavedAPIKeys(): Record<string, string> {
    try {
      const stored = localStorage.getItem('branchcode_ai_keys');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private removeStoredAPIKey(provider: AIProvider): void {
    try {
      const keys = this.getSavedAPIKeys();
      delete keys[provider];
      localStorage.setItem('branchcode_ai_keys', JSON.stringify(keys));
    } catch (error) {
      console.error('Failed to remove API key:', error);
    }
  }

  // Provider Management
  setCurrentProvider(provider: AIProvider): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    this.currentProvider = provider;
  }

  getCurrentProvider(): AIProvider {
    return this.currentProvider;
  }

  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.keys());
  }

  getProviderConfig(provider: AIProvider): AIProviderConfig | undefined {
    return this.providers.get(provider);
  }

  isProviderConfigured(provider: AIProvider): boolean {
    const config = this.providers.get(provider);
    return Boolean(config?.apiKey && this.clients.has(provider));
  }

  getConfiguredProviders(): AIProvider[] {
    return Array.from(this.providers.keys()).filter(provider =>
      this.isProviderConfigured(provider)
    );
  }

  // AI Completion (with fallback to legacy methods for non-OpenAI providers)
  async complete(
    messages: AIMessage[],
    options: AICompletionOptions = {}
  ): Promise<AICompletionResponse> {
    const provider = options.provider || this.currentProvider;
    const client = this.clients.get(provider);
    const config = this.providers.get(provider);

    if (!client || !config) {
      throw new Error(`Provider ${provider} is not configured`);
    }

    const model = options.model || config.defaultModel;

    try {
      switch (provider) {
        case 'openai':
          return await this.completeOpenAI(client, messages, model, options);
        case 'anthropic':
          return await this.completeAnthropic(client, messages, model, options);
        case 'google':
          return await this.completeGoogle(client, messages, model, options);
        case 'cohere':
          return await this.completeCohere(client, messages, model, options);
        case 'mistral':
          return await this.completeMistral(client, messages, model, options);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      throw new Error(`AI completion failed: ${error}`);
    }
  }

  private async completeOpenAI(
    client: OpenAI,
    messages: AIMessage[],
    model: string,
    options: AICompletionOptions
  ): Promise<AICompletionResponse> {
    const response = await client.chat.completions.create({
      model,
      messages: messages as any,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
      stream: false
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      },
      model,
      provider: 'openai'
    };
  }

  private async completeAnthropic(
    client: Anthropic,
    messages: AIMessage[],
    model: string,
    options: AICompletionOptions
  ): Promise<AICompletionResponse> {
    // Convert messages format for Anthropic
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await client.messages.create({
      model,
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      system: systemMessage,
      messages: conversationMessages as any
    });

    return {
      content: response.content[0].type === 'text' ? response.content[0].text : '',
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      model,
      provider: 'anthropic'
    };
  }

  private async completeGoogle(
    client: GoogleGenerativeAI,
    messages: AIMessage[],
    model: string,
    options: AICompletionOptions
  ): Promise<AICompletionResponse> {
    const genModel = client.getGenerativeModel({ model });

    // Convert conversation to Google's format
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

    const result = await genModel.generateContent(prompt);
    const response = await result.response;

    return {
      content: response.text() || '',
      usage: {
        promptTokens: 0, // Google doesn't provide token usage
        completionTokens: 0,
        totalTokens: 0
      },
      model,
      provider: 'google'
    };
  }

  private async completeCohere(
    client: CohereClient,
    messages: AIMessage[],
    model: string,
    options: AICompletionOptions
  ): Promise<AICompletionResponse> {
    // Convert messages to a single prompt for Cohere
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

    const response = await client.generate({
      model,
      prompt,
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 1000
    });

    return {
      content: response.generations[0]?.text || '',
      usage: {
        promptTokens: 0, // Cohere doesn't provide detailed token usage
        completionTokens: 0,
        totalTokens: 0
      },
      model,
      provider: 'cohere'
    };
  }

  private async completeMistral(
    client: MistralApi,
    messages: AIMessage[],
    model: string,
    options: AICompletionOptions
  ): Promise<AICompletionResponse> {
    const response = await client.chat.complete({
      model,
      messages: messages as any,
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 1000
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      usage: {
        promptTokens: response.usage?.promptTokens || 0,
        completionTokens: response.usage?.completionTokens || 0,
        totalTokens: response.usage?.totalTokens || 0
      },
      model,
      provider: 'mistral'
    };
  }

  // Legacy methods (simplified for fallback compatibility)
  async generateCodeCompletion(
    code: string,
    language: string,
    cursorPosition: { line: number; column: number },
    options: AICompletionOptions = {}
  ): Promise<AICodeSuggestion[]> {
    const provider = options.provider || this.currentProvider;

    // Prefer structured response for OpenAI
    if (provider === 'openai' && this.isStructuredResponseSupported()) {
      try {
        const structuredResponse = await this.generateCodeWithStructure(
          `Complete this ${language} code at line ${cursorPosition.line}, column ${cursorPosition.column}:\n\n${code}`,
          language
        );

        return [{
          code: structuredResponse.code,
          description: structuredResponse.explanation,
          confidence: 0.9,
          startLine: cursorPosition.line,
          endLine: cursorPosition.line
        }];
      } catch (error) {
        // Fall back to legacy method
        console.warn('Structured response failed, falling back to legacy method:', error);
      }
    }

    // Legacy fallback
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a code completion assistant. Generate relevant code completions for ${language} code. Return only the suggested code without explanations.`
      },
      {
        role: 'user',
        content: `Complete this ${language} code at line ${cursorPosition.line}, column ${cursorPosition.column}:\n\n${code}`
      }
    ];

    try {
      const response = await this.complete(messages, {
        ...options,
        maxTokens: 200,
        temperature: 0.3
      });

      return [{
        code: response.content.trim(),
        description: 'AI-generated code completion',
        confidence: 0.8,
        startLine: cursorPosition.line,
        endLine: cursorPosition.line
      }];
    } catch (error) {
      console.error('Code completion failed:', error);
      return [];
    }
  }

  async explainCode(
    code: string,
    language: string,
    options: AICompletionOptions = {}
  ): Promise<string> {
    // Prefer structured response for OpenAI
    if (this.currentProvider === 'openai' && this.isStructuredResponseSupported()) {
      try {
        const docs = await this.generateDocumentation(code, language);
        return `${docs.summary}\n\n${docs.detailed_description}`;
      } catch (error) {
        console.warn('Structured response failed, falling back to legacy method:', error);
      }
    }

    // Legacy fallback
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'You are a code explanation assistant. Provide clear, concise explanations of code functionality.'
      },
      {
        role: 'user',
        content: `Explain this ${language} code:\n\n${code}`
      }
    ];

    const response = await this.complete(messages, options);
    return response.content;
  }

  async generateCode(
    description: string,
    language: string,
    options: AICompletionOptions = {}
  ): Promise<string> {
    // Prefer structured response for OpenAI
    if (this.currentProvider === 'openai' && this.isStructuredResponseSupported()) {
      try {
        const structuredResponse = await this.generateCodeWithStructure(description, language);
        return structuredResponse.code;
      } catch (error) {
        console.warn('Structured response failed, falling back to legacy method:', error);
      }
    }

    // Legacy fallback
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a code generation assistant. Generate clean, well-documented ${language} code based on descriptions. Return only the code without additional explanations.`
      },
      {
        role: 'user',
        content: `Generate ${language} code for: ${description}`
      }
    ];

    const response = await this.complete(messages, options);
    return response.content;
  }

  async refactorCode(
    code: string,
    language: string,
    instructions: string,
    options: AICompletionOptions = {}
  ): Promise<string> {
    // Prefer structured response for OpenAI
    if (this.currentProvider === 'openai' && this.isStructuredResponseSupported()) {
      try {
        const structuredResponse = await this.refactorCodeWithStructure(code, language, instructions);
        return structuredResponse.refactored_code;
      } catch (error) {
        console.warn('Structured response failed, falling back to legacy method:', error);
      }
    }

    // Legacy fallback
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a code refactoring assistant. Improve code based on given instructions while maintaining functionality. Return only the refactored code.`
      },
      {
        role: 'user',
        content: `Refactor this ${language} code according to these instructions: ${instructions}\n\nCode:\n${code}`
      }
    ];

    const response = await this.complete(messages, options);
    return response.content;
  }

  async findBugs(
    code: string,
    language: string,
    options: AICompletionOptions = {}
  ): Promise<string> {
    // Prefer structured response for OpenAI
    if (this.currentProvider === 'openai' && this.isStructuredResponseSupported()) {
      try {
        const reviewResponse = await this.reviewCodeWithStructure(code, language);
        return `Overall Score: ${reviewResponse.overall_score}/100\n\nIssues Found:\n${
          reviewResponse.issues.map(issue =>
            `Line ${issue.line}: ${issue.severity.toUpperCase()} - ${issue.message}`
          ).join('\n')
        }\n\nSecurity Concerns:\n${reviewResponse.security_concerns.join('\n')}`;
      } catch (error) {
        console.warn('Structured response failed, falling back to legacy method:', error);
      }
    }

    // Legacy fallback
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'You are a bug detection assistant. Analyze code for potential issues, bugs, and improvements.'
      },
      {
        role: 'user',
        content: `Analyze this ${language} code for bugs and issues:\n\n${code}`
      }
    ];

    const response = await this.complete(messages, options);
    return response.content;
  }

  // Cleanup
  destroy(): void {
    this.clients.clear();
    this.providers.clear();
  }

  private getSystemPrompt(context?: CodeContext): string {
    let prompt = 'You are an expert programming assistant that provides structured, helpful responses.';

    if (context) {
      if (context.currentFile) {
        prompt += ` You are currently working on file: ${context.currentFile}.`;
      }

      if (context.codeStyle) {
        prompt += ` Follow ${context.codeStyle.language} coding standards.`;
      }

      if (context.userPreferences) {
        const { indentation, indentSize } = context.userPreferences;
        prompt += ` Use ${indentation === 'tabs' ? 'tabs' : `${indentSize} spaces`} for indentation.`;
      }

      if (context.dependencies && context.dependencies.length > 0) {
        prompt += ` Available dependencies: ${context.dependencies.join(', ')}.`;
      }
    }

    return prompt;
  }

  async getStructuredResponse<T>(
    prompt: string,
    responseFormat: ResponseFormat,
    options: StructuredCompletionOptions = {}
  ): Promise<T> {
    const provider = options.provider || this.getCurrentProvider();

    if (provider !== 'openai') {
      throw new Error('Structured responses are currently only supported with OpenAI');
    }

    const client = this.clients.get('openai') as OpenAI;
    if (!client) {
      throw new Error('OpenAI client not configured');
    }

    const model = options.model || 'gpt-5';

    if (!this.SUPPORTED_MODELS.includes(model)) {
      throw new Error(`Model ${model} does not support structured responses`);
    }

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(options.context)
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await client.chat.completions.create({
        model,
        messages: messages as any,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        response_format: responseFormat as any
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content received');
      }

      return JSON.parse(content) as T;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Failed to parse structured response as JSON');
      }
      throw new Error(`Structured response failed: ${error}`);
    }
  }

  async generateCodeWithStructure(
    description: string,
    language: string,
    context?: CodeContext
  ): Promise<CodeGenerationResponse> {
    const prompt = `Generate ${language} code for: ${description}

    Please provide a comprehensive response including:
    - Clean, well-documented code
    - Clear explanation of the implementation
    - Relevant tests
    - Dependencies needed
    - Complexity analysis
    - Alternative approaches
    - Best practices followed`;

    return await this.getStructuredResponse<CodeGenerationResponse>(
      prompt,
      {
        type: "json_schema",
        json_schema: SCHEMAS.CODE_GENERATION
      },
      { context, temperature: 0.3 }
    );
  }

  async reviewCodeWithStructure(
    code: string,
    language: string,
    context?: CodeContext
  ): Promise<CodeReviewResponse> {
    const prompt = `Review this ${language} code for quality, bugs, performance, and maintainability:

\`\`\`${language}
${code}
\`\`\`

Provide detailed feedback including:
- Overall quality score (0-100)
- Specific issues with line numbers
- Improvement suggestions
- Security concerns
- Performance optimization tips
- Maintainability assessment`;

    return await this.getStructuredResponse<CodeReviewResponse>(
      prompt,
      {
        type: "json_schema",
        json_schema: SCHEMAS.CODE_REVIEW
      },
      { context, temperature: 0.2 }
    );
  }

  async explainErrorWithStructure(
    error: string,
    code?: string,
    language?: string,
    context?: CodeContext
  ): Promise<ErrorExplanationResponse> {
    let prompt = `Explain this error: ${error}`;

    if (code && language) {
      prompt += `\n\nCode context:\n\`\`\`${language}\n${code}\n\`\`\``;
    }

    prompt += `

    Please provide:
    - Clear explanation of what the error means
    - Common causes of this error
    - Multiple solutions with code examples
    - Prevention tips
    - Related concepts to learn
    - Appropriate difficulty level`;

    return await this.getStructuredResponse<ErrorExplanationResponse>(
      prompt,
      {
        type: "json_schema",
        json_schema: SCHEMAS.ERROR_EXPLANATION
      },
      { context, temperature: 0.4 }
    );
  }

  async refactorCodeWithStructure(
    code: string,
    language: string,
    instructions: string,
    context?: CodeContext
  ): Promise<RefactoringResponse> {
    const prompt = `Refactor this ${language} code according to these instructions: ${instructions}

Original code:
\`\`\`${language}
${code}
\`\`\`

Provide:
- Complete refactored code
- Detailed explanation of changes made
- Benefits of the refactoring
- Potential issues to watch for
- Test considerations`;

    return await this.getStructuredResponse<RefactoringResponse>(
      prompt,
      {
        type: "json_schema",
        json_schema: {
          name: "refactoring_response",
          schema: {
            type: "object",
            properties: {
              refactored_code: { type: "string" },
              changes_made: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["extract_method", "rename", "simplify", "optimize", "restructure"]
                    },
                    description: { type: "string" },
                    before: { type: "string" },
                    after: { type: "string" },
                    reasoning: { type: "string" }
                  },
                  required: ["type", "description", "before", "after", "reasoning"]
                }
              },
              benefits: { type: "array", items: { type: "string" } },
              potential_issues: { type: "array", items: { type: "string" } },
              test_considerations: { type: "array", items: { type: "string" } }
            },
            required: ["refactored_code", "changes_made", "benefits"]
          }
        }
      },
      { context, temperature: 0.3 }
    );
  }

  async generateArchitectureAdvice(
    projectDescription: string,
    requirements: string[],
    language: string,
    context?: CodeContext
  ): Promise<ArchitectureResponse> {
    const prompt = `Design architecture for: ${projectDescription}

Requirements:
${requirements.map(req => `- ${req}`).join('\n')}

Target language/framework: ${language}

Provide comprehensive architecture advice including:
- Recommended design patterns
- File and folder structure
- Scalability considerations
- Security recommendations
- Testing strategy`;

    return await this.getStructuredResponse<ArchitectureResponse>(
      prompt,
      {
        type: "json_schema",
        json_schema: {
          name: "architecture_response",
          schema: {
            type: "object",
            properties: {
              design_patterns: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    pattern: { type: "string" },
                    reasoning: { type: "string" },
                    implementation: { type: "string" }
                  },
                  required: ["pattern", "reasoning", "implementation"]
                }
              },
              structure: {
                type: "object",
                properties: {
                  recommended_files: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        path: { type: "string" },
                        purpose: { type: "string" },
                        dependencies: { type: "array", items: { type: "string" } }
                      },
                      required: ["path", "purpose", "dependencies"]
                    }
                  },
                  folder_organization: { type: "object" }
                },
                required: ["recommended_files", "folder_organization"]
              },
              scalability_considerations: { type: "array", items: { type: "string" } },
              security_recommendations: { type: "array", items: { type: "string" } },
              testing_strategy: {
                type: "object",
                properties: {
                  unit_tests: { type: "array", items: { type: "string" } },
                  integration_tests: { type: "array", items: { type: "string" } },
                  e2e_tests: { type: "array", items: { type: "string" } }
                },
                required: ["unit_tests", "integration_tests", "e2e_tests"]
              }
            },
            required: ["design_patterns", "structure", "scalability_considerations", "security_recommendations", "testing_strategy"]
          }
        }
      },
      { context, temperature: 0.4 }
    );
  }

  async generateDocumentation(
    code: string,
    language: string,
    context?: CodeContext
  ): Promise<DocumentationResponse> {
    const prompt = `Generate comprehensive documentation for this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Include:
- Summary and detailed description
- Parameter documentation
- Return value information
- Usage examples
- Important notes
- Related references`;

    return await this.getStructuredResponse<DocumentationResponse>(
      prompt,
      {
        type: "json_schema",
        json_schema: {
          name: "documentation_response",
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              detailed_description: { type: "string" },
              parameters: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string" },
                    description: { type: "string" },
                    required: { type: "boolean" },
                    default: {}
                  },
                  required: ["name", "type", "description", "required"]
                }
              },
              returns: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  description: { type: "string" }
                },
                required: ["type", "description"]
              },
              examples: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    code: { type: "string" },
                    explanation: { type: "string" }
                  },
                  required: ["title", "code", "explanation"]
                }
              },
              notes: { type: "array", items: { type: "string" } },
              see_also: { type: "array", items: { type: "string" } }
            },
            required: ["summary", "detailed_description", "parameters", "returns", "examples"]
          }
        }
      },
      { context, temperature: 0.3 }
    );
  }

  async generateLearningContent(
    topic: string,
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced',
    language?: string,
    context?: CodeContext
  ): Promise<LearningResponse> {
    const prompt = `Create educational content about: ${topic}

    Target level: ${difficultyLevel}
    ${language ? `Programming language: ${language}` : ''}

    Provide comprehensive learning material including:
    - Clear explanation of the concept
    - Key points to remember
    - Practical code examples with explanations
    - Hands-on exercises with solutions
    - Prerequisites and next steps
    - Additional resources`;

    return await this.getStructuredResponse<LearningResponse>(
      prompt,
      {
        type: "json_schema",
        json_schema: SCHEMAS.LEARNING_CONTENT
      },
      { context, temperature: 0.5 }
    );
  }

  isStructuredResponseSupported(): boolean {
    const currentProvider = this.getCurrentProvider();
    return currentProvider === 'openai' && this.isProviderConfigured('openai');
  }

  getSupportedModelsForStructuredResponse(): string[] {
    return [...this.SUPPORTED_MODELS];
  }
}

// Singleton instance - now the primary AI service
export const responsesAIService = new ResponsesAIService();
export const aiService = responsesAIService; // For backward compatibility
export { ResponsesAIService as AIService }; // For backward compatibility