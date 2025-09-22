/**
 * Documentation Guide System Types
 * Provides AI-powered platform guidelines and third-party service documentation assistance
 */

export interface GuidelineCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface PlatformGuideline {
  id: string;
  platform: DocumentationPlatform;
  category: GuidelineCategory;
  title: string;
  description: string;
  importance: 'critical' | 'recommended' | 'suggested';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  content: GuidelineContent;
  examples: CodeExample[];
  checklist: ChecklistItem[];
  relatedGuidelines: string[];
  lastUpdated: string;
}

export interface GuidelineContent {
  overview: string;
  requirements: string[];
  bestPractices: string[];
  commonMistakes: string[];
  resources: Resource[];
}

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  language: string;
  code: string;
  explanation: string;
  doNotExample?: string; // What not to do
}

export interface ChecklistItem {
  id: string;
  description: string;
  required: boolean;
  category: string;
  verification?: string; // How to verify this item
}

export interface Resource {
  title: string;
  url: string;
  type: 'documentation' | 'video' | 'article' | 'tool' | 'template';
  description: string;
}

export interface DocumentationPlatform {
  id: string;
  name: string;
  type: 'mobile' | 'web' | 'desktop' | 'api' | 'service';
  icon: string;
  color: string;
  guidelines: GuidelineCategory[];
}

export interface ThirdPartyService {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  icon: string;
  website: string;
  documentation: ServiceDocumentation;
  integrationGuides: IntegrationGuide[];
  commonPatterns: ServicePattern[];
  troubleshooting: TroubleshootingGuide[];
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface ServiceDocumentation {
  quickStart: string;
  apiReference: string;
  examples: string;
  sdks: SDK[];
  authentication: AuthenticationMethod[];
}

export interface SDK {
  language: string;
  packageName: string;
  installCommand: string;
  quickStartCode: string;
}

export interface AuthenticationMethod {
  type: 'api_key' | 'oauth' | 'jwt' | 'basic' | 'webhook';
  description: string;
  setupSteps: string[];
  exampleCode: string;
}

export interface IntegrationGuide {
  id: string;
  title: string;
  description: string;
  platform: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  prerequisites: string[];
  steps: IntegrationStep[];
  codeTemplates: DocCodeTemplate[];
  testing: TestingGuide;
}

export interface IntegrationStep {
  id: string;
  title: string;
  description: string;
  code?: string;
  notes?: string[];
  validation?: string;
}

export interface DocCodeTemplate {
  id: string;
  name: string;
  description: string;
  language: string;
  framework?: string;
  template: string;
  variables: DocTemplateVariable[];
}

export interface DocTemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  validation?: string;
}

export interface TestingGuide {
  setup: string[];
  testCases: TestCase[];
  debugging: DebuggingTip[];
}

export interface TestCase {
  scenario: string;
  expectedResult: string;
  code?: string;
}

export interface DebuggingTip {
  issue: string;
  solution: string;
  prevention: string;
}

export interface ServicePattern {
  id: string;
  name: string;
  description: string;
  useCase: string;
  implementation: string;
  pros: string[];
  cons: string[];
  alternatives?: string[];
}

export interface TroubleshootingGuide {
  id: string;
  issue: string;
  symptoms: string[];
  causes: string[];
  solutions: Solution[];
  prevention: string[];
}

export interface Solution {
  description: string;
  steps: string[];
  code?: string;
  notes?: string[];
}

// AI-Powered Analysis Types
export interface CodeAnalysisRequest {
  code: string;
  language: string;
  platform?: string;
  framework?: string;
  context?: AnalysisContext;
}

export interface AnalysisContext {
  fileName: string;
  projectType: string;
  targetPlatform: string[];
  dependencies: string[];
  userIntent?: string;
}

export interface CodeAnalysisResult {
  guidelines: GuidelineViolation[];
  suggestions: Suggestion[];
  bestPractices: BestPractice[];
  securityIssues: SecurityIssue[];
  performance: PerformanceHint[];
  accessibility: AccessibilityHint[];
  score: AnalysisScore;
}

export interface GuidelineViolation {
  guideline: string;
  severity: 'error' | 'warning' | 'info';
  description: string;
  location: CodeLocation;
  suggestion: string;
  autoFixAvailable: boolean;
  learnMoreUrl?: string;
}

export interface Suggestion {
  type: 'improvement' | 'alternative' | 'optimization';
  description: string;
  before: string;
  after: string;
  reasoning: string;
  impact: 'high' | 'medium' | 'low';
}

export interface BestPractice {
  category: string;
  description: string;
  implementation: string;
  benefits: string[];
  examples: string[];
}

export interface SecurityIssue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location: CodeLocation;
  remediation: string;
  references: string[];
}

export interface PerformanceHint {
  type: string;
  description: string;
  impact: string;
  solution: string;
  measurement?: string;
}

export interface AccessibilityHint {
  guideline: string;
  description: string;
  solution: string;
  priority: 'high' | 'medium' | 'low';
  testing: string;
}

export interface CodeLocation {
  line: number;
  column: number;
  length: number;
  file?: string;
}

export interface AnalysisScore {
  overall: number;
  guidelines: number;
  security: number;
  performance: number;
  accessibility: number;
  maintainability: number;
}

// Documentation Query Types
export interface DocumentationQuery {
  query: string;
  context: QueryContext;
  filters?: QueryFilters;
}

export interface QueryContext {
  platform?: string;
  service?: string;
  language?: string;
  framework?: string;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface QueryFilters {
  categories?: string[];
  importance?: string[];
  difficulty?: string[];
  platforms?: string[];
}

export interface DocumentationSearchResult {
  guidelines: PlatformGuideline[];
  services: ThirdPartyService[];
  examples: CodeExample[];
  tutorials: IntegrationGuide[];
  suggestions: string[];
  relatedQueries: string[];
}

// Real-time Assistant Types
export interface GuidelineAssistant {
  isActive: boolean;
  platforms: string[];
  services: string[];
  analysisMode: 'strict' | 'moderate' | 'lenient';
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  showCritical: boolean;
  showRecommended: boolean;
  showSuggested: boolean;
  showInline: boolean;
  showStatusBar: boolean;
  showOnSave: boolean;
}

export interface GuidelineNotification {
  id: string;
  type: 'guideline' | 'security' | 'performance' | 'accessibility';
  severity: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  location?: CodeLocation;
  actions: NotificationAction[];
  dismissible: boolean;
  autoHide?: number;
}

export interface NotificationAction {
  label: string;
  action: 'fix' | 'learn' | 'dismiss' | 'configure';
  data?: any;
}