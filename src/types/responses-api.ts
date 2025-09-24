// Types for OpenAI Responses API
export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: readonly string[] | string[];
  additionalProperties?: boolean;
  items?: JSONSchema;
  minimum?: number;
  maximum?: number;
  enum?: readonly string[] | string[];
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    schema: JSONSchema;
    strict?: boolean;
  };
}

export interface CodeContext {
  currentFile?: string;
  projectStructure?: FileTree;
  recentChanges?: Change[];
  userPreferences?: UserPreferences;
  codeStyle?: StyleGuide;
  dependencies?: string[];
}

export interface FileTree {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileTree[];
}

export interface Change {
  type: 'add' | 'modify' | 'delete';
  path: string;
  content?: string;
  timestamp: Date;
}

export interface UserPreferences {
  indentation: 'spaces' | 'tabs';
  indentSize: number;
  lineEnding: 'lf' | 'crlf';
  insertFinalNewline: boolean;
  trimTrailingWhitespace: boolean;
}

export interface StyleGuide {
  language: string;
  rules: Record<string, any>;
}

// Structured response types
export interface CodeGenerationResponse {
  code: string;
  explanation: string;
  tests: string[];
  dependencies: string[];
  complexity: {
    time: string;
    space: string;
  };
  alternatives: Array<{
    code: string;
    reason: string;
    tradeoffs: string;
  }>;
  documentation: string;
  bestPractices: string[];
}

export interface CodeReviewResponse {
  overall_score: number;
  issues: Array<{
    line: number;
    column?: number;
    severity: "error" | "warning" | "info" | "style";
    category: "bug" | "performance" | "security" | "maintainability" | "style";
    message: string;
    suggestion: string;
    example?: string;
  }>;
  improvements: string[];
  security_concerns: string[];
  performance_tips: string[];
  maintainability_score: number;
}

export interface ErrorExplanationResponse {
  error_type: string;
  explanation: string;
  common_causes: string[];
  fixes: Array<{
    solution: string;
    code_example: string;
    explanation: string;
  }>;
  prevention_tips: string[];
  related_concepts: string[];
  difficulty_level: "beginner" | "intermediate" | "advanced";
}

export interface RefactoringResponse {
  refactored_code: string;
  changes_made: Array<{
    type: "extract_method" | "rename" | "simplify" | "optimize" | "restructure";
    description: string;
    before: string;
    after: string;
    reasoning: string;
  }>;
  benefits: string[];
  potential_issues: string[];
  test_considerations: string[];
}

export interface ArchitectureResponse {
  design_patterns: Array<{
    pattern: string;
    reasoning: string;
    implementation: string;
  }>;
  structure: {
    recommended_files: Array<{
      path: string;
      purpose: string;
      dependencies: string[];
    }>;
    folder_organization: Record<string, string>;
  };
  scalability_considerations: string[];
  security_recommendations: string[];
  testing_strategy: {
    unit_tests: string[];
    integration_tests: string[];
    e2e_tests: string[];
  };
}

export interface DocumentationResponse {
  summary: string;
  detailed_description: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    default?: any;
  }>;
  returns: {
    type: string;
    description: string;
  };
  examples: Array<{
    title: string;
    code: string;
    explanation: string;
  }>;
  notes: string[];
  see_also: string[];
}

export interface LearningResponse {
  concept: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  explanation: string;
  key_points: string[];
  code_examples: Array<{
    title: string;
    code: string;
    explanation: string;
    output?: string;
  }>;
  exercises: Array<{
    question: string;
    hints: string[];
    solution: string;
  }>;
  prerequisites: string[];
  next_topics: string[];
  resources: Array<{
    title: string;
    url: string;
    type: "article" | "video" | "documentation" | "tutorial";
  }>;
}

// Response API options
export interface ResponsesAPIOptions {
  temperature?: number;
  max_tokens?: number;
  response_format?: ResponseFormat;
  stream?: boolean;
  context?: CodeContext;
}

export interface StreamingResponse {
  id: string;
  object: string;
  choices: Array<{
    delta: {
      content?: string;
    };
    finish_reason?: string;
  }>;
}

// Response API events for streaming
export type ResponsesAPIEvent =
  | { type: 'start'; data: { id: string } }
  | { type: 'content'; data: { content: string } }
  | { type: 'complete'; data: { response: any } }
  | { type: 'error'; data: { error: string } };

// Predefined schemas for common use cases
export const SCHEMAS = {
  CODE_GENERATION: {
    name: "code_generation",
    schema: {
      type: "object",
      properties: {
        code: { type: "string" },
        explanation: { type: "string" },
        tests: {
          type: "array",
          items: { type: "string" }
        },
        dependencies: {
          type: "array",
          items: { type: "string" }
        },
        complexity: {
          type: "object",
          properties: {
            time: { type: "string" },
            space: { type: "string" }
          },
          required: ["time", "space"]
        },
        alternatives: {
          type: "array",
          items: {
            type: "object",
            properties: {
              code: { type: "string" },
              reason: { type: "string" },
              tradeoffs: { type: "string" }
            },
            required: ["code", "reason", "tradeoffs"]
          }
        },
        documentation: { type: "string" },
        bestPractices: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["code", "explanation", "tests", "dependencies", "complexity"]
    }
  },

  CODE_REVIEW: {
    name: "code_review",
    schema: {
      type: "object",
      properties: {
        overall_score: { type: "number", minimum: 0, maximum: 100 },
        issues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              line: { type: "number" },
              column: { type: "number" },
              severity: { type: "string", enum: ["error", "warning", "info", "style"] },
              category: { type: "string", enum: ["bug", "performance", "security", "maintainability", "style"] },
              message: { type: "string" },
              suggestion: { type: "string" },
              example: { type: "string" }
            },
            required: ["line", "severity", "category", "message", "suggestion"]
          }
        },
        improvements: { type: "array", items: { type: "string" } },
        security_concerns: { type: "array", items: { type: "string" } },
        performance_tips: { type: "array", items: { type: "string" } },
        maintainability_score: { type: "number", minimum: 0, maximum: 100 }
      },
      required: ["overall_score", "issues", "improvements"]
    }
  },

  ERROR_EXPLANATION: {
    name: "error_explanation",
    schema: {
      type: "object",
      properties: {
        error_type: { type: "string" },
        explanation: { type: "string" },
        common_causes: { type: "array", items: { type: "string" } },
        fixes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              solution: { type: "string" },
              code_example: { type: "string" },
              explanation: { type: "string" }
            },
            required: ["solution", "code_example", "explanation"]
          }
        },
        prevention_tips: { type: "array", items: { type: "string" } },
        related_concepts: { type: "array", items: { type: "string" } },
        difficulty_level: { type: "string", enum: ["beginner", "intermediate", "advanced"] }
      },
      required: ["error_type", "explanation", "common_causes", "fixes"]
    }
  },

  LEARNING_CONTENT: {
    name: "learning_content",
    schema: {
      type: "object",
      properties: {
        concept: { type: "string" },
        difficulty_level: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
        explanation: { type: "string" },
        key_points: { type: "array", items: { type: "string" } },
        code_examples: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              code: { type: "string" },
              explanation: { type: "string" },
              output: { type: "string" }
            },
            required: ["title", "code", "explanation"]
          }
        },
        exercises: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              hints: { type: "array", items: { type: "string" } },
              solution: { type: "string" }
            },
            required: ["question", "hints", "solution"]
          }
        },
        prerequisites: { type: "array", items: { type: "string" } },
        next_topics: { type: "array", items: { type: "string" } }
      },
      required: ["concept", "difficulty_level", "explanation", "key_points"]
    }
  }
} as const;