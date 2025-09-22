/**
 * Project Template System
 * Defines different project types and their scaffolding configurations
 */

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: ProjectCategory;
  icon: string;
  platforms: Platform[];
  languages: string[];
  frameworks: string[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime: string;
  preview?: {
    image?: string;
    description: string;
  };
  scaffolding: ProjectScaffolding;
  guidelines?: {
    platformGuidelines: string[]; // IDs of applicable platform guidelines
    thirdPartyServices: string[]; // IDs of common third-party services for this template
    bestPractices: string[]; // Template-specific best practices
  };
}

export interface ProjectScaffolding {
  fileStructure: FileStructureNode[];
  dependencies: ProjectDependency[];
  scripts: Record<string, string>;
  configuration: ConfigurationFile[];
  initialCode: CodeTemplate[];
  setupSteps: SetupStep[];
}

export interface FileStructureNode {
  path: string;
  type: 'file' | 'directory';
  content?: string;
  template?: string;
  conditional?: string; // JavaScript expression to evaluate
}

export interface ProjectDependency {
  name: string;
  version?: string;
  type: 'dependency' | 'devDependency' | 'peerDependency';
  manager: 'npm' | 'yarn' | 'pnpm' | 'cocoapods' | 'gradle' | 'swift-pm';
  platform?: Platform;
}

export interface ConfigurationFile {
  path: string;
  format: 'json' | 'yaml' | 'toml' | 'xml' | 'plist' | 'gradle' | 'swift';
  content: Record<string, any> | string;
  merge?: boolean; // Whether to merge with existing file
}

export interface CodeTemplate {
  path: string;
  language: string;
  content: string;
  variables?: Record<string, string>;
}

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  type: 'command' | 'file-creation' | 'configuration' | 'user-input' | 'verification';
  command?: string;
  optional?: boolean;
  condition?: string;
  userPrompt?: UserPrompt;
}

export interface UserPrompt {
  type: 'text' | 'select' | 'multiselect' | 'boolean' | 'number';
  message: string;
  options?: Array<{ label: string; value: string; description?: string }>;
  validation?: {
    required?: boolean;
    pattern?: string;
    min?: number;
    max?: number;
  };
  default?: any;
}

export type ProjectCategory =
  | 'mobile-ios'
  | 'mobile-android'
  | 'mobile-cross-platform'
  | 'web-frontend'
  | 'web-backend'
  | 'web-fullstack'
  | 'desktop'
  | 'game'
  | 'ai-ml'
  | 'blockchain'
  | 'iot'
  | 'api'
  | 'library'
  | 'cli-tool';

export type Platform =
  | 'ios'
  | 'android'
  | 'web'
  | 'desktop'
  | 'tvos'
  | 'watchos'
  | 'macos'
  | 'windows'
  | 'linux'
  | 'unity'
  | 'unreal'
  | 'node'
  | 'browser';

export interface ProjectCreationOptions {
  templateId: string;
  projectName: string;
  description?: string;
  userInputs: Record<string, any>;
  targetDirectory?: string;
  skipSetup?: boolean;
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'boolean' | 'number' | 'array';
  default?: any;
  required?: boolean;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    options?: string[];
  };
}