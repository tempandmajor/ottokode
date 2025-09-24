import { EventEmitter } from '../../utils/EventEmitter';
import { aiService } from './ResponsesAIService';
import { agentOrchestrator } from '../agents/AgentOrchestrator';

export interface TerminalCommand {
  id: string;
  command: string;
  naturalLanguageInput: string;
  directory: string;
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: TerminalCommandResult;
  confidence?: number;
  suggestedAlternatives?: string[];
}

export interface TerminalCommandResult {
  success: boolean;
  output: string;
  exitCode?: number;
  duration: number;
  warnings?: string[];
  suggestedFollowUp?: string[];
  contextualInfo?: ContextualInfo;
}

export interface ContextualInfo {
  fileChanges?: string[];
  processesStarted?: string[];
  networkActivity?: boolean;
  systemChanges?: string[];
  securityImplications?: string[];
}

export interface CommandContext {
  currentDirectory: string;
  gitBranch?: string;
  gitStatus?: string;
  nodeVersion?: string;
  npmPackages?: string[];
  runningProcesses?: string[];
  recentCommands?: string[];
  projectType?: string;
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun';
}

export interface CommandSuggestion {
  command: string;
  description: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  category: 'file_operation' | 'git' | 'package_management' | 'build' | 'development' | 'system';
}

export class AITerminalService extends EventEmitter {
  private commandHistory: Map<string, TerminalCommand> = new Map();
  private contextCache: Map<string, CommandContext> = new Map();
  private commandPatterns: Map<string, RegExp[]> = new Map();
  private safetyFilters: RegExp[] = [];

  constructor() {
    super();
    this.initializeCommandPatterns();
    this.initializeSafetyFilters();
  }

  private initializeCommandPatterns(): void {
    // Common command patterns for better recognition
    this.commandPatterns.set('git', [
      /git\s+(add|commit|push|pull|status|checkout|branch|merge|rebase)/i,
      /(?:create|switch\s+to|checkout)\s+(?:a\s+)?(?:new\s+)?branch/i,
      /commit\s+(?:these\s+)?changes/i,
      /push\s+(?:to\s+)?(?:remote|origin)/i
    ]);

    this.commandPatterns.set('npm', [
      /npm\s+(install|run|start|build|test|update)/i,
      /(?:install|add)\s+(?:package|dependency)/i,
      /run\s+(?:the\s+)?(build|dev|start|test)/i,
      /update\s+(?:all\s+)?(?:packages|dependencies)/i
    ]);

    this.commandPatterns.set('file_operations', [
      /(?:create|make)\s+(?:a\s+)?(?:new\s+)?(?:file|directory|folder)/i,
      /(?:delete|remove)\s+(?:the\s+)?(?:file|directory|folder)/i,
      /(?:copy|move)\s+(?:the\s+)?file/i,
      /(?:list|show)\s+(?:all\s+)?files/i
    ]);

    this.commandPatterns.set('development', [
      /(?:start|run)\s+(?:the\s+)?(?:dev\s+)?server/i,
      /(?:build|compile)\s+(?:the\s+)?(?:project|app)/i,
      /(?:run|execute)\s+(?:the\s+)?tests/i,
      /(?:format|lint)\s+(?:the\s+)?code/i
    ]);
  }

  private initializeSafetyFilters(): void {
    // Patterns for potentially dangerous commands
    this.safetyFilters = [
      /rm\s+-rf\s+\/(?!tmp|var\/tmp)/i, // Prevent deletion of root directories
      /sudo\s+rm/i, // Sudo deletion commands
      /dd\s+if=/i, // Disk operations
      /mkfs\./i, // Filesystem creation
      /fdisk/i, // Disk partitioning
      /reboot|shutdown/i, // System shutdown
      /chmod\s+777/i, // Overly permissive permissions
      /curl.*\|\s*sh/i, // Piping to shell
      /wget.*\|\s*sh/i, // Piping to shell
      />\s*\/etc\//i, // Writing to system directories
    ];
  }

  async processNaturalLanguageCommand(
    input: string,
    context?: CommandContext
  ): Promise<TerminalCommand> {
    const command: TerminalCommand = {
      id: this.generateCommandId(),
      command: '',
      naturalLanguageInput: input.trim(),
      directory: context?.currentDirectory || process.cwd(),
      timestamp: new Date(),
      status: 'processing'
    };

    this.commandHistory.set(command.id, command);
    this.emit('commandStarted', command);

    try {
      // Step 1: Get current context
      const commandContext = context || await this.getCurrentContext(command.directory);

      // Step 2: Generate command suggestions
      const suggestions = await this.generateCommandSuggestions(input, commandContext);

      if (suggestions.length === 0) {
        command.status = 'failed';
        command.result = {
          success: false,
          output: 'Could not understand the command. Please try rephrasing.',
          duration: 0
        };
        this.emit('commandCompleted', command);
        return command;
      }

      // Step 3: Select best command
      const bestSuggestion = suggestions[0];
      command.command = bestSuggestion.command;
      command.confidence = bestSuggestion.confidence;
      command.suggestedAlternatives = suggestions.slice(1, 4).map(s => s.command);

      // Step 4: Safety check
      const safetyCheck = this.performSafetyCheck(bestSuggestion);
      if (!safetyCheck.safe) {
        command.status = 'failed';
        command.result = {
          success: false,
          output: `Command blocked for safety: ${safetyCheck.reason}`,
          duration: 0,
          warnings: ['This command was blocked to prevent potential system damage']
        };
        this.emit('commandBlocked', { command, reason: safetyCheck.reason });
        return command;
      }

      // Step 5: Execute command if confidence is high enough
      if (bestSuggestion.confidence > 0.7) {
        await this.executeCommand(command, commandContext);
      } else {
        // Request confirmation for low-confidence commands
        command.status = 'pending';
        this.emit('confirmationRequired', {
          command,
          suggestions: suggestions.slice(0, 3)
        });
      }

      return command;

    } catch (error) {
      command.status = 'failed';
      command.result = {
        success: false,
        output: `Error processing command: ${error instanceof Error ? error.message : String(error)}`,
        duration: 0
      };
      this.emit('commandFailed', { command, error });
      return command;
    }
  }

  private async getCurrentContext(directory: string): Promise<CommandContext> {
    // Check cache first
    const cached = this.contextCache.get(directory);
    if (cached) {
      return cached;
    }

    const context: CommandContext = {
      currentDirectory: directory
    };

    try {
      // Get git information
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      try {
        const gitBranch = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: directory });
        context.gitBranch = gitBranch.stdout.trim();

        const gitStatus = await execAsync('git status --porcelain', { cwd: directory });
        context.gitStatus = gitStatus.stdout.trim();
      } catch {
        // Not a git repository or git not available
      }

      // Detect project type and package manager
      const fs = require('fs');
      const path = require('path');

      if (fs.existsSync(path.join(directory, 'package.json'))) {
        context.projectType = 'node';

        if (fs.existsSync(path.join(directory, 'yarn.lock'))) {
          context.packageManager = 'yarn';
        } else if (fs.existsSync(path.join(directory, 'pnpm-lock.yaml'))) {
          context.packageManager = 'pnpm';
        } else if (fs.existsSync(path.join(directory, 'bun.lockb'))) {
          context.packageManager = 'bun';
        } else {
          context.packageManager = 'npm';
        }

        // Get installed packages (simplified)
        try {
          const packageJson = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
          context.npmPackages = Object.keys({
            ...packageJson.dependencies,
            ...packageJson.devDependencies
          });
        } catch {
          // Error reading package.json
        }
      }

      // Cache context for 5 minutes
      this.contextCache.set(directory, context);
      setTimeout(() => this.contextCache.delete(directory), 5 * 60 * 1000);

      return context;

    } catch (error) {
      console.warn('Error getting command context:', error);
      return context;
    }
  }

  private async generateCommandSuggestions(
    input: string,
    context: CommandContext
  ): Promise<CommandSuggestion[]> {
    try {
      // Create contextual prompt
      const contextInfo = this.buildContextPrompt(context);

      const prompt = `
You are a terminal command translator that converts natural language to shell commands.

Context:
${contextInfo}

User Input: "${input}"

Generate up to 5 shell command suggestions that accomplish what the user wants.
Consider the project context, safety, and best practices.

Respond with JSON array:
[
  {
    "command": "exact shell command",
    "description": "what this command does",
    "confidence": 0.95,
    "riskLevel": "low|medium|high|critical",
    "category": "file_operation|git|package_management|build|development|system"
  }
]

Rules:
1. Use the detected package manager (${context.packageManager || 'npm'})
2. Consider current git branch: ${context.gitBranch || 'unknown'}
3. Stay within current directory context
4. Prioritize safe commands
5. Use relative paths when possible
6. For file operations, use appropriate flags (-p, -r, etc.)
7. For git operations, consider current branch and status
8. Order by confidence (highest first)
`;

      const response = await aiService.complete([{
        role: 'user',
        content: prompt
      }], {
        model: 'gpt-5',
        temperature: 0.2,
        maxTokens: 1500
      });

      const suggestions = JSON.parse(response.content);
      return this.validateSuggestions(suggestions);

    } catch (error) {
      console.warn('Error generating suggestions, falling back to patterns:', error);
      return this.generateFallbackSuggestions(input, context);
    }
  }

  private buildContextPrompt(context: CommandContext): string {
    const parts = [`Current Directory: ${context.currentDirectory}`];

    if (context.projectType) {
      parts.push(`Project Type: ${context.projectType}`);
    }

    if (context.packageManager) {
      parts.push(`Package Manager: ${context.packageManager}`);
    }

    if (context.gitBranch) {
      parts.push(`Git Branch: ${context.gitBranch}`);
    }

    if (context.gitStatus) {
      parts.push(`Git Status: ${context.gitStatus ? 'changes present' : 'clean'}`);
    }

    if (context.npmPackages?.length) {
      parts.push(`Key Packages: ${context.npmPackages.slice(0, 10).join(', ')}`);
    }

    return parts.join('\n');
  }

  private validateSuggestions(suggestions: any[]): CommandSuggestion[] {
    return suggestions
      .filter(s => s.command && s.description && typeof s.confidence === 'number')
      .map(s => ({
        command: s.command.trim(),
        description: s.description.trim(),
        confidence: Math.max(0, Math.min(1, s.confidence)),
        riskLevel: ['low', 'medium', 'high', 'critical'].includes(s.riskLevel) ? s.riskLevel : 'medium',
        category: ['file_operation', 'git', 'package_management', 'build', 'development', 'system'].includes(s.category) ? s.category : 'system'
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  private generateFallbackSuggestions(input: string, context: CommandContext): CommandSuggestion[] {
    const suggestions: CommandSuggestion[] = [];
    const lowerInput = input.toLowerCase();

    // Git operations
    if (lowerInput.includes('commit')) {
      suggestions.push({
        command: 'git add . && git commit -m "Update files"',
        description: 'Stage all changes and commit',
        confidence: 0.8,
        riskLevel: 'low',
        category: 'git'
      });
    }

    if (lowerInput.includes('push')) {
      const branch = context.gitBranch || 'main';
      suggestions.push({
        command: `git push origin ${branch}`,
        description: `Push changes to remote ${branch}`,
        confidence: 0.8,
        riskLevel: 'low',
        category: 'git'
      });
    }

    // Package management
    if (lowerInput.includes('install') || lowerInput.includes('add')) {
      const pm = context.packageManager || 'npm';
      suggestions.push({
        command: `${pm} install`,
        description: 'Install all dependencies',
        confidence: 0.7,
        riskLevel: 'low',
        category: 'package_management'
      });
    }

    // Development commands
    if (lowerInput.includes('start') || lowerInput.includes('dev')) {
      const pm = context.packageManager || 'npm';
      suggestions.push({
        command: `${pm} run dev`,
        description: 'Start development server',
        confidence: 0.8,
        riskLevel: 'low',
        category: 'development'
      });
    }

    if (lowerInput.includes('build')) {
      const pm = context.packageManager || 'npm';
      suggestions.push({
        command: `${pm} run build`,
        description: 'Build the project',
        confidence: 0.8,
        riskLevel: 'low',
        category: 'build'
      });
    }

    // File operations
    if (lowerInput.includes('list') || lowerInput.includes('show files')) {
      suggestions.push({
        command: 'ls -la',
        description: 'List all files with details',
        confidence: 0.9,
        riskLevel: 'low',
        category: 'file_operation'
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private performSafetyCheck(suggestion: CommandSuggestion): { safe: boolean; reason?: string } {
    // Check against safety filters
    for (const filter of this.safetyFilters) {
      if (filter.test(suggestion.command)) {
        return {
          safe: false,
          reason: 'Command contains potentially dangerous operations'
        };
      }
    }

    // Check risk level
    if (suggestion.riskLevel === 'critical') {
      return {
        safe: false,
        reason: 'Command has critical risk level'
      };
    }

    // Additional safety checks for high-risk commands
    if (suggestion.riskLevel === 'high') {
      const highRiskPatterns = [
        /rm\s+-r/i,
        /chmod\s+[0-7]{3}/i,
        /chown/i,
        /sudo/i
      ];

      for (const pattern of highRiskPatterns) {
        if (pattern.test(suggestion.command)) {
          return {
            safe: false,
            reason: 'High-risk command requires explicit confirmation'
          };
        }
      }
    }

    return { safe: true };
  }

  private async executeCommand(
    command: TerminalCommand,
    context: CommandContext
  ): Promise<void> {
    const startTime = Date.now();
    command.status = 'processing';
    this.emit('commandExecuting', command);

    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      const result = await execAsync(command.command, {
        cwd: command.directory,
        timeout: 60000, // 60 second timeout
        maxBuffer: 1024 * 1024 // 1MB buffer
      });

      const duration = Date.now() - startTime;

      command.result = {
        success: true,
        output: result.stdout || result.stderr || 'Command completed successfully',
        exitCode: 0,
        duration,
        contextualInfo: await this.analyzeCommandResult(command, result.stdout, result.stderr)
      };

      command.status = 'completed';
      this.emit('commandCompleted', command);

      // Update context cache if this might have changed the environment
      if (this.isContextChangingCommand(command.command)) {
        this.contextCache.delete(command.directory);
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;

      command.result = {
        success: false,
        output: error.stderr || error.stdout || error.message || 'Command failed',
        exitCode: error.code || 1,
        duration,
        warnings: ['Command execution failed'],
        contextualInfo: await this.analyzeCommandResult(command, error.stdout, error.stderr)
      };

      command.status = 'failed';
      this.emit('commandFailed', { command, error });
    }
  }

  private async analyzeCommandResult(
    command: TerminalCommand,
    stdout: string,
    stderr: string
  ): Promise<ContextualInfo> {
    const contextInfo: ContextualInfo = {};

    try {
      // Analyze for file changes
      if (command.command.match(/^(touch|mkdir|cp|mv|rm)/)) {
        contextInfo.fileChanges = this.extractFileChanges(command.command, stdout, stderr);
      }

      // Analyze for process starts
      if (command.command.includes('npm run') || command.command.includes('serve')) {
        contextInfo.processesStarted = ['Development server'];
      }

      // Analyze for network activity
      if (command.command.includes('install') || command.command.includes('fetch')) {
        contextInfo.networkActivity = true;
      }

      // Security implications
      if (command.command.includes('chmod') || command.command.includes('sudo')) {
        contextInfo.securityImplications = ['Permission changes made to files or system'];
      }

      return contextInfo;

    } catch (error) {
      console.warn('Error analyzing command result:', error);
      return contextInfo;
    }
  }

  private extractFileChanges(command: string, stdout: string, stderr: string): string[] {
    const changes: string[] = [];

    // Extract file paths from common commands
    const touchMatch = command.match(/touch\s+(.+)/);
    if (touchMatch) {
      changes.push(`Created: ${touchMatch[1]}`);
    }

    const mkdirMatch = command.match(/mkdir\s+(.+)/);
    if (mkdirMatch) {
      changes.push(`Directory created: ${mkdirMatch[1]}`);
    }

    // More sophisticated extraction could be done here
    return changes;
  }

  private isContextChangingCommand(command: string): boolean {
    const contextChangingPatterns = [
      /npm\s+install/,
      /git\s+checkout/,
      /mkdir/,
      /rm/,
      /cd\s+/
    ];

    return contextChangingPatterns.some(pattern => pattern.test(command));
  }

  // Public API methods
  async confirmCommand(commandId: string): Promise<boolean> {
    const command = this.commandHistory.get(commandId);
    if (!command || command.status !== 'pending') {
      return false;
    }

    const context = await this.getCurrentContext(command.directory);
    await this.executeCommand(command, context);
    return true;
  }

  async executeManualCommand(
    commandText: string,
    directory?: string
  ): Promise<TerminalCommand> {
    const command: TerminalCommand = {
      id: this.generateCommandId(),
      command: commandText,
      naturalLanguageInput: commandText,
      directory: directory || process.cwd(),
      timestamp: new Date(),
      status: 'processing',
      confidence: 1.0
    };

    this.commandHistory.set(command.id, command);

    const context = await this.getCurrentContext(command.directory);
    await this.executeCommand(command, context);

    return command;
  }

  getCommand(commandId: string): TerminalCommand | undefined {
    return this.commandHistory.get(commandId);
  }

  getCommandHistory(limit: number = 50): TerminalCommand[] {
    return Array.from(this.commandHistory.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getCommandsByStatus(status: TerminalCommand['status']): TerminalCommand[] {
    return Array.from(this.commandHistory.values())
      .filter(cmd => cmd.status === status);
  }

  async getCommandSuggestions(
    partialInput: string,
    directory?: string
  ): Promise<CommandSuggestion[]> {
    const context = await this.getCurrentContext(directory || process.cwd());
    return this.generateCommandSuggestions(partialInput, context);
  }

  // Utility methods
  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clearHistory(): void {
    this.commandHistory.clear();
    this.emit('historyCleared');
  }

  clearContextCache(): void {
    this.contextCache.clear();
    this.emit('contextCacheCleared');
  }

  // Integration with Agent Orchestrator
  async createTerminalTask(
    naturalLanguageInput: string,
    directory?: string
  ): Promise<string> {
    const taskId = await agentOrchestrator.createTask({
      type: 'multi_file_operation',
      description: `Execute terminal command: ${naturalLanguageInput}`,
      context: {
        language: 'bash',
        currentFile: directory,
        requirements: ['terminal_integration']
      },
      priority: 'medium',
      requiredCapabilities: ['execute_commands', 'analyze_output']
    });

    // Listen for task completion to execute the command
    agentOrchestrator.once('taskCompleted', async (event) => {
      if (event.task.id === taskId && event.result.success) {
        await this.processNaturalLanguageCommand(naturalLanguageInput, await this.getCurrentContext(directory || process.cwd()));
      }
    });

    return taskId;
  }

  // Cleanup
  destroy(): void {
    this.commandHistory.clear();
    this.contextCache.clear();
    this.removeAllListeners();
  }
}

// Singleton instance
export const aiTerminalService = new AITerminalService();