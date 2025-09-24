import { SCHEMAS } from '../../types/responses-api';

// Mock external dependencies before importing ResponsesAIService
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');
jest.mock('@google/generative-ai');
jest.mock('cohere-ai');
jest.mock('@mistralai/mistralai', () => ({
  Mistral: jest.fn().mockImplementation(() => ({}))
}));

// Mock ReadableStream for Node.js test environment
global.ReadableStream = jest.fn();

import { ResponsesAIService } from './ResponsesAIService';

describe('ResponsesAIService', () => {
  let service: ResponsesAIService;

  beforeEach(() => {
    service = new ResponsesAIService();
  });

  describe('Schema validation', () => {
    it('should have valid JSON schemas for all structured response types', () => {
      expect(SCHEMAS.CODE_GENERATION).toBeDefined();
      expect(SCHEMAS.CODE_GENERATION.schema).toBeDefined();
      expect(SCHEMAS.CODE_GENERATION.schema.type).toBe('object');
      expect(SCHEMAS.CODE_GENERATION.schema.properties).toBeDefined();
      expect(SCHEMAS.CODE_GENERATION.schema.required).toContain('code');

      expect(SCHEMAS.CODE_REVIEW).toBeDefined();
      expect(SCHEMAS.CODE_REVIEW.schema).toBeDefined();
      expect(SCHEMAS.CODE_REVIEW.schema.properties).toBeDefined();
      expect(SCHEMAS.CODE_REVIEW.schema.required).toContain('overall_score');

      expect(SCHEMAS.ERROR_EXPLANATION).toBeDefined();
      expect(SCHEMAS.ERROR_EXPLANATION.schema).toBeDefined();
      expect(SCHEMAS.ERROR_EXPLANATION.schema.properties).toBeDefined();
      expect(SCHEMAS.ERROR_EXPLANATION.schema.required).toContain('error_type');

      expect(SCHEMAS.LEARNING_CONTENT).toBeDefined();
      expect(SCHEMAS.LEARNING_CONTENT.schema).toBeDefined();
      expect(SCHEMAS.LEARNING_CONTENT.schema.properties).toBeDefined();
      expect(SCHEMAS.LEARNING_CONTENT.schema.required).toContain('concept');
    });

    it('should validate required properties in schemas', () => {
      const codeGenSchema = SCHEMAS.CODE_GENERATION.schema;
      expect(codeGenSchema.required).toEqual([
        'code',
        'explanation',
        'tests',
        'dependencies',
        'complexity'
      ]);

      const codeReviewSchema = SCHEMAS.CODE_REVIEW.schema;
      expect(codeReviewSchema.required).toEqual([
        'overall_score',
        'issues',
        'improvements'
      ]);
    });
  });

  describe('Provider support', () => {
    it('should return correct structured response support status', () => {
      expect(service.isStructuredResponseSupported()).toBeDefined();
      expect(typeof service.isStructuredResponseSupported()).toBe('boolean');
    });

    it('should return supported models for structured responses', () => {
      const supportedModels = service.getSupportedModelsForStructuredResponse();
      expect(Array.isArray(supportedModels)).toBe(true);
      expect(supportedModels.length).toBeGreaterThan(0);
      expect(supportedModels).toContain('gpt-5');
    });
  });

  describe('Integration with AIService', () => {
    it('should extend AIService properly', () => {
      expect(service).toBeInstanceOf(ResponsesAIService);
      expect(service.getAvailableProviders).toBeDefined();
      expect(service.getCurrentProvider).toBeDefined();
      expect(service.setCurrentProvider).toBeDefined();
    });

    it('should have OpenAI configured with structured response models', () => {
      const openaiConfig = service.getProviderConfig('openai');
      expect(openaiConfig).toBeDefined();
      expect(openaiConfig?.models).toContain('gpt-5');
      expect(openaiConfig?.supportsStructuredResponse).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should throw error for unsupported providers', async () => {
      const mockService = new ResponsesAIService();
      mockService.setCurrentProvider('anthropic');

      await expect(
        mockService.getStructuredResponse(
          'test prompt',
          { type: 'json_schema', json_schema: SCHEMAS.CODE_GENERATION }
        )
      ).rejects.toThrow('Structured responses are currently only supported with OpenAI');
    });

    it('should throw error for unsupported models', async () => {
      const mockService = new ResponsesAIService();

      await expect(
        mockService.getStructuredResponse(
          'test prompt',
          { type: 'json_schema', json_schema: SCHEMAS.CODE_GENERATION },
          { model: 'gpt-3.5-turbo' }
        )
      ).rejects.toThrow('does not support structured responses');
    });
  });

  describe('Response formatting', () => {
    it('should generate proper system prompts with context', () => {
      const service = new ResponsesAIService();

      // Test with minimal context
      expect(() => {
        (service as any).getSystemPrompt();
      }).not.toThrow();

      // Test with full context
      const context = {
        currentFile: 'test.ts',
        codeStyle: { language: 'typescript' },
        userPreferences: { indentation: 'spaces' as const, indentSize: 2 },
        dependencies: ['react', 'typescript']
      };

      expect(() => {
        (service as any).getSystemPrompt(context);
      }).not.toThrow();
    });
  });
});