import { OpenAI } from 'openai';

export interface ParsedCommand {
  id: string;
  originalQuery: string;
  commands: Command[];
  confidence: number;
  riskLevel: RiskLevel;
  explanation: string;
  alternatives?: Command[];
  warnings?: string[];
  requiresConfirmation: boolean;
  estimatedDuration: number;
}

export interface Command {
  id: string;
  command: string;
  args: string[];
  description: string;
  workingDirectory?: string;
  environment?: Record<string, string>;
  riskLevel: RiskLevel;
  category: CommandCategory;
  requiresElevation: boolean;
  expectedOutput?: string;
  successCriteria?: string[];
  failureCriteria?: string[];
  dependencies?: string[];
  timeout?: number;
}

export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export type CommandCategory =
  | 'file_management'
  | 'git'
  | 'package_management'
  | 'process_management'
  | 'network'
  | 'system_info'
  | 'development'
  | 'database'
  | 'docker'
  | 'custom';

export interface CommandPattern {
  pattern: RegExp;
  category: CommandCategory;
  riskLevel: RiskLevel;
  generator: (match: RegExpMatchArray, context: ParsingContext) => Command[];
  aliases: string[];
  description: string;
}

export interface ParsingContext {
  currentDirectory: string;
  platform: string;
  shellType: string;
  environmentVariables: Record<string, string>;
  projectType?: 'node' | 'python' | 'rust' | 'go' | 'web' | 'mobile';
  gitRepository?: {
    isRepo: boolean;
    currentBranch?: string;
    hasChanges?: boolean;
  };
  recentCommands: string[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  confirmDestructiveCommands: boolean;
  preferredPackageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
  defaultEditor: string;
  allowElevation: boolean;
  maxConcurrentCommands: number;
  defaultTimeout: number;
}

export class NLCommandParser {
  private openai: OpenAI;
  private commandPatterns: CommandPattern[] = [];
  private systemPrompt: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.initializeCommandPatterns();
    this.initializeSystemPrompt();
  }

  private initializeSystemPrompt() {
    this.systemPrompt = `You are an expert system administrator and developer who can translate natural language requests into safe, efficient command line operations.

Your responsibilities:
1. Parse natural language into appropriate shell commands
2. Assess risk levels and warn about dangerous operations
3. Suggest alternatives when commands might be destructive
4. Provide clear explanations of what commands will do
5. Consider the user's context (OS, project type, current directory)

Risk Assessment Guidelines:
- SAFE: Read-only operations (ls, cat, git status, etc.)
- LOW: Safe modifications (mkdir, touch non-critical files)
- MEDIUM: Potentially impactful changes (git commit, npm install)
- HIGH: System-level changes or destructive operations
- CRITICAL: Operations that could cause data loss or system damage

Always prioritize user safety while being helpful and efficient.

Response format: Provide a JSON object with the parsed commands, risk assessment, and explanations.`;
  }

  private initializeCommandPatterns() {
    this.commandPatterns = [
      // Git operations
      {
        pattern: /(?:show|list|display|what are).+(?:recent|latest|last)\s+(?:git\s+)?(?:branches|commits)/i,
        category: 'git',
        riskLevel: 'safe',
        aliases: ['recent branches', 'latest commits', 'git history'],
        description: 'List recent git branches or commits',
        generator: (match, context) => [
          {
            id: 'git-recent-branches',
            command: 'git',
            args: ['branch', '--sort=-committerdate', '-a'],
            description: 'Show recent branches sorted by latest commit',
            riskLevel: 'safe',
            category: 'git',
            requiresElevation: false,
            expectedOutput: 'List of git branches',
            successCriteria: ['Exit code 0', 'Branch list displayed']
          }
        ]
      },

      // File operations
      {
        pattern: /(?:find|search|locate).+files?.+(?:containing|with|that have)\s+['""](.+?)['""]|(?:find|search)\s+['""](.+?)['""]/i,
        category: 'file_management',
        riskLevel: 'safe',
        aliases: ['find files', 'search files', 'grep files'],
        description: 'Search for files containing specific content',
        generator: (match, context) => {
          const searchTerm = match[1] || match[2];
          return [
            {
              id: 'find-files-content',
              command: 'grep',
              args: ['-r', '-l', searchTerm, '.'],
              description: `Find files containing "${searchTerm}"`,
              riskLevel: 'safe',
              category: 'file_management',
              requiresElevation: false,
              expectedOutput: 'List of files containing the search term',
              timeout: 10000
            }
          ];
        }
      },

      // Package management
      {
        pattern: /(?:install|add|get).+(?:package|dependency|module|library)\s+(.+)/i,
        category: 'package_management',
        riskLevel: 'medium',
        aliases: ['install package', 'add dependency'],
        description: 'Install a package or dependency',
        generator: (match, context) => {
          const packageName = match[1].trim();
          const packageManager = context.preferences.preferredPackageManager;

          return [
            {
              id: 'install-package',
              command: packageManager,
              args: packageManager === 'npm' ? ['install', packageName] : ['add', packageName],
              description: `Install ${packageName} using ${packageManager}`,
              riskLevel: 'medium',
              category: 'package_management',
              requiresElevation: false,
              successCriteria: ['Package installed successfully', 'package.json updated'],
              failureCriteria: ['Package not found', 'Network error', 'Permission denied'],
              timeout: 120000 // 2 minutes
            }
          ];
        }
      },

      // Process management
      {
        pattern: /(?:kill|stop|terminate).+(?:process|processes|pid).+(\d+|.+)/i,
        category: 'process_management',
        riskLevel: 'high',
        aliases: ['kill process', 'stop process'],
        description: 'Terminate a running process',
        generator: (match, context) => [
          {
            id: 'kill-process',
            command: 'kill',
            args: ['-15', match[1]], // SIGTERM first
            description: `Gracefully terminate process ${match[1]}`,
            riskLevel: 'high',
            category: 'process_management',
            requiresElevation: false,
            alternatives: [
              {
                id: 'kill-process-force',
                command: 'kill',
                args: ['-9', match[1]],
                description: `Force kill process ${match[1]} (use if graceful termination fails)`,
                riskLevel: 'critical',
                category: 'process_management',
                requiresElevation: false
              }
            ]
          }
        ]
      },

      // Development operations
      {
        pattern: /(?:build|compile|make).+(?:project|app|application)/i,
        category: 'development',
        riskLevel: 'low',
        aliases: ['build project', 'compile app'],
        description: 'Build or compile the current project',
        generator: (match, context) => {
          const commands: Command[] = [];

          if (context.projectType === 'node') {
            commands.push({
              id: 'build-node',
              command: 'npm',
              args: ['run', 'build'],
              description: 'Build Node.js project',
              riskLevel: 'low',
              category: 'development',
              requiresElevation: false,
              timeout: 300000 // 5 minutes
            });
          } else if (context.projectType === 'rust') {
            commands.push({
              id: 'build-rust',
              command: 'cargo',
              args: ['build'],
              description: 'Build Rust project',
              riskLevel: 'low',
              category: 'development',
              requiresElevation: false,
              timeout: 600000 // 10 minutes
            });
          }

          return commands;
        }
      }
    ];
  }

  async parseNaturalLanguage(
    query: string,
    context: ParsingContext
  ): Promise<ParsedCommand> {
    try {
      // First try pattern matching for common commands
      const patternResult = this.tryPatternMatching(query, context);
      if (patternResult) {
        return patternResult;
      }

      // Fall back to AI parsing for complex queries
      return await this.aiParseCommand(query, context);
    } catch (error) {
      console.error('Command parsing failed:', error);
      return this.createErrorResult(query, error as Error);
    }
  }

  private tryPatternMatching(query: string, context: ParsingContext): ParsedCommand | null {
    for (const pattern of this.commandPatterns) {
      const match = query.match(pattern.pattern);
      if (match) {
        try {
          const commands = pattern.generator(match, context);

          return {
            id: `pattern-${Date.now()}`,
            originalQuery: query,
            commands,
            confidence: 0.9,
            riskLevel: pattern.riskLevel,
            explanation: `Matched pattern: ${pattern.description}`,
            requiresConfirmation: pattern.riskLevel === 'high' || pattern.riskLevel === 'critical',
            estimatedDuration: this.estimateCommandDuration(commands)
          };
        } catch (error) {
          console.error('Pattern generator failed:', error);
          continue;
        }
      }
    }

    return null;
  }

  private async aiParseCommand(query: string, context: ParsingContext): Promise<ParsedCommand> {
    const contextPrompt = this.buildContextPrompt(context);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: `Context: ${contextPrompt}\n\nQuery: "${query}"\n\nPlease parse this into appropriate shell commands with risk assessment.` }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse AI response (assuming it returns structured JSON)
    try {
      const parsedResponse = JSON.parse(aiResponse);
      return this.validateAndNormalizeAIResponse(parsedResponse, query);
    } catch (parseError) {
      // If AI doesn't return valid JSON, create a safe fallback
      return this.createFallbackResponse(query, aiResponse);
    }
  }

  private buildContextPrompt(context: ParsingContext): string {
    return `
Platform: ${context.platform}
Current Directory: ${context.currentDirectory}
Shell: ${context.shellType}
Project Type: ${context.projectType || 'unknown'}
Git Repository: ${context.gitRepository?.isRepo ? `Yes (branch: ${context.gitRepository.currentBranch})` : 'No'}
Recent Commands: ${context.recentCommands.slice(-3).join(', ')}
Package Manager: ${context.preferences.preferredPackageManager}
Safety Settings: Confirm destructive commands = ${context.preferences.confirmDestructiveCommands}
    `.trim();
  }

  private validateAndNormalizeAIResponse(response: any, originalQuery: string): ParsedCommand {
    // Validate and normalize AI response structure
    const commands: Command[] = (response.commands || []).map((cmd: any, index: number) => ({
      id: cmd.id || `ai-cmd-${index}`,
      command: cmd.command,
      args: cmd.args || [],
      description: cmd.description || 'AI-generated command',
      workingDirectory: cmd.workingDirectory,
      environment: cmd.environment,
      riskLevel: this.validateRiskLevel(cmd.riskLevel),
      category: cmd.category || 'custom',
      requiresElevation: Boolean(cmd.requiresElevation),
      expectedOutput: cmd.expectedOutput,
      successCriteria: cmd.successCriteria,
      failureCriteria: cmd.failureCriteria,
      timeout: cmd.timeout || 30000
    }));

    return {
      id: `ai-${Date.now()}`,
      originalQuery,
      commands,
      confidence: Math.min(Math.max(response.confidence || 0.7, 0), 1),
      riskLevel: this.calculateOverallRiskLevel(commands),
      explanation: response.explanation || 'AI-parsed command sequence',
      alternatives: response.alternatives,
      warnings: response.warnings,
      requiresConfirmation: response.requiresConfirmation || this.requiresConfirmation(commands),
      estimatedDuration: this.estimateCommandDuration(commands)
    };
  }

  private createFallbackResponse(query: string, aiResponse: string): ParsedCommand {
    return {
      id: `fallback-${Date.now()}`,
      originalQuery: query,
      commands: [],
      confidence: 0.1,
      riskLevel: 'safe',
      explanation: `Could not parse command. AI suggested: ${aiResponse}`,
      requiresConfirmation: true,
      estimatedDuration: 0,
      warnings: ['Command could not be parsed automatically. Manual review required.']
    };
  }

  private createErrorResult(query: string, error: Error): ParsedCommand {
    return {
      id: `error-${Date.now()}`,
      originalQuery: query,
      commands: [],
      confidence: 0,
      riskLevel: 'safe',
      explanation: `Error parsing command: ${error.message}`,
      requiresConfirmation: true,
      estimatedDuration: 0,
      warnings: ['Command parsing failed. Please try rephrasing your request.']
    };
  }

  private validateRiskLevel(riskLevel: string): RiskLevel {
    const validLevels: RiskLevel[] = ['safe', 'low', 'medium', 'high', 'critical'];
    return validLevels.includes(riskLevel as RiskLevel) ? riskLevel as RiskLevel : 'medium';
  }

  private calculateOverallRiskLevel(commands: Command[]): RiskLevel {
    if (commands.length === 0) return 'safe';

    const riskScores = { safe: 0, low: 1, medium: 2, high: 3, critical: 4 };
    const maxRisk = Math.max(...commands.map(cmd => riskScores[cmd.riskLevel]));

    const riskLevels: RiskLevel[] = ['safe', 'low', 'medium', 'high', 'critical'];
    return riskLevels[maxRisk];
  }

  private requiresConfirmation(commands: Command[]): boolean {
    return commands.some(cmd =>
      cmd.riskLevel === 'high' ||
      cmd.riskLevel === 'critical' ||
      cmd.requiresElevation
    );
  }

  private estimateCommandDuration(commands: Command[]): number {
    if (commands.length === 0) return 0;

    return commands.reduce((total, cmd) => {
      const baseDuration = cmd.timeout || 30000;
      const categoryMultiplier = this.getCategoryDurationMultiplier(cmd.category);
      return total + (baseDuration * categoryMultiplier);
    }, 0);
  }

  private getCategoryDurationMultiplier(category: CommandCategory): number {
    const multipliers = {
      file_management: 0.1,
      git: 0.2,
      package_management: 1.0,
      process_management: 0.1,
      network: 0.5,
      system_info: 0.1,
      development: 1.5,
      database: 0.8,
      docker: 1.2,
      custom: 0.5
    };

    return multipliers[category] || 0.5;
  }

  // Helper methods for getting command suggestions
  getCommandSuggestions(partialQuery: string, context: ParsingContext): string[] {
    const suggestions: string[] = [];

    // Add pattern-based suggestions
    this.commandPatterns.forEach(pattern => {
      pattern.aliases.forEach(alias => {
        if (alias.toLowerCase().includes(partialQuery.toLowerCase())) {
          suggestions.push(alias);
        }
      });
    });

    // Add context-aware suggestions
    if (context.projectType === 'node') {
      suggestions.push('install package', 'run build', 'run tests', 'show package.json');
    }

    if (context.gitRepository?.isRepo) {
      suggestions.push('show recent branches', 'check git status', 'create new branch');
    }

    return suggestions.slice(0, 10); // Limit to top 10 suggestions
  }

  // Validate command safety before execution
  validateCommandSafety(command: Command): { safe: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Check for dangerous patterns
    const dangerousPatterns = [
      /rm\s+-rf\s+\//,
      /sudo\s+rm/,
      /format/i,
      /fdisk/,
      />.*\/dev\//
    ];

    const commandString = `${command.command} ${command.args.join(' ')}`;

    dangerousPatterns.forEach(pattern => {
      if (pattern.test(commandString)) {
        warnings.push('Command contains potentially dangerous operations');
      }
    });

    // Check elevation requirements
    if (command.requiresElevation) {
      warnings.push('Command requires elevated privileges');
    }

    // Check risk level
    if (command.riskLevel === 'critical' || command.riskLevel === 'high') {
      warnings.push(`Command has ${command.riskLevel} risk level`);
    }

    return {
      safe: warnings.length === 0,
      warnings
    };
  }
}

export default NLCommandParser;