import { EventEmitter } from 'events';
import NLCommandParser, {
  ParsedCommand,
  Command,
  RiskLevel,
  ParsingContext,
  UserPreferences
} from './NLCommandParser';

export interface TerminalSession {
  id: string;
  name: string;
  workingDirectory: string;
  environment: Record<string, string>;
  history: CommandHistory[];
  preferences: UserPreferences;
  status: 'active' | 'inactive' | 'error';
  createdAt: Date;
  lastActivity: Date;
}

export interface CommandHistory {
  id: string;
  sessionId: string;
  originalQuery?: string;
  command: string;
  args: string[];
  workingDirectory: string;
  startedAt: Date;
  completedAt?: Date;
  exitCode?: number;
  output: string;
  error?: string;
  duration: number;
  riskLevel: RiskLevel;
  userApproved: boolean;
  success: boolean;
}

export interface ExecutionResult {
  id: string;
  command: Command;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  success: boolean;
  analysis?: OutputAnalysis;
  followUpSuggestions?: string[];
}

export interface OutputAnalysis {
  summary: string;
  errorDetected: boolean;
  warningsDetected: boolean;
  successIndicators: string[];
  failureIndicators: string[];
  extractedData?: any;
  recommendations?: string[];
}

export interface ExecutionOptions {
  timeout?: number;
  workingDirectory?: string;
  environment?: Record<string, string>;
  requireApproval?: boolean;
  dryRun?: boolean;
  continueOnError?: boolean;
}

export type TerminalEventType =
  | 'session_created'
  | 'session_destroyed'
  | 'command_parsed'
  | 'command_approved'
  | 'command_rejected'
  | 'command_started'
  | 'command_completed'
  | 'command_failed'
  | 'output_analyzed'
  | 'suggestion_generated';

export interface TerminalEvent {
  type: TerminalEventType;
  sessionId: string;
  timestamp: Date;
  data: any;
}

export class AITerminalService extends EventEmitter {
  private parser: NLCommandParser;
  private sessions: Map<string, TerminalSession> = new Map();
  private activeExecutions: Map<string, AbortController> = new Map();
  private commandHistory: Map<string, CommandHistory[]> = new Map();

  constructor() {
    super();
    this.parser = new NLCommandParser();
  }

  // Session Management
  async createSession(name: string, options?: {
    workingDirectory?: string;
    environment?: Record<string, string>;
    preferences?: Partial<UserPreferences>;
  }): Promise<TerminalSession> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const defaultPreferences: UserPreferences = {
      confirmDestructiveCommands: true,
      preferredPackageManager: 'npm',
      defaultEditor: 'code',
      allowElevation: false,
      maxConcurrentCommands: 3,
      defaultTimeout: 30000
    };

    const session: TerminalSession = {
      id: sessionId,
      name,
      workingDirectory: options?.workingDirectory || process.cwd(),
      environment: { ...process.env, ...options?.environment },
      history: [],
      preferences: { ...defaultPreferences, ...options?.preferences },
      status: 'active',
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(sessionId, session);
    this.commandHistory.set(sessionId, []);

    this.emit('session_created', { sessionId, session });

    return session;
  }

  getSession(sessionId: string): TerminalSession | null {
    return this.sessions.get(sessionId) || null;
  }

  async destroySession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    // Cancel any active executions
    const activeExecution = this.activeExecutions.get(sessionId);
    if (activeExecution) {
      activeExecution.abort();
      this.activeExecutions.delete(sessionId);
    }

    // Update status and cleanup
    session.status = 'inactive';
    this.sessions.delete(sessionId);
    this.commandHistory.delete(sessionId);

    this.emit('session_destroyed', { sessionId });

    return true;
  }

  // Command Processing
  async processNaturalLanguage(
    sessionId: string,
    query: string,
    options?: ExecutionOptions
  ): Promise<ParsedCommand> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const context = this.buildParsingContext(session);
    const parsed = await this.parser.parseNaturalLanguage(query, context);

    session.lastActivity = new Date();

    this.emit('command_parsed', {
      sessionId,
      query,
      parsed,
      timestamp: new Date()
    });

    return parsed;
  }

  async executeCommands(
    sessionId: string,
    commands: Command[],
    options?: ExecutionOptions
  ): Promise<ExecutionResult[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const results: ExecutionResult[] = [];
    const abortController = new AbortController();
    this.activeExecutions.set(sessionId, abortController);

    try {
      for (const command of commands) {
        if (abortController.signal.aborted) {
          break;
        }

        // Check if command requires approval
        if (this.requiresApproval(command, session.preferences) && !options?.dryRun) {
          const approved = await this.requestApproval(sessionId, command);
          if (!approved) {
            this.emit('command_rejected', { sessionId, command });
            continue;
          }
          this.emit('command_approved', { sessionId, command });
        }

        // Execute command
        const result = await this.executeSingleCommand(
          sessionId,
          command,
          options,
          abortController.signal
        );

        results.push(result);

        // Add to history
        await this.addToHistory(sessionId, command, result);

        // Stop execution on failure if not continuing on error
        if (!result.success && !options?.continueOnError) {
          break;
        }
      }
    } finally {
      this.activeExecutions.delete(sessionId);
    }

    return results;
  }

  private async executeSingleCommand(
    sessionId: string,
    command: Command,
    options?: ExecutionOptions,
    abortSignal?: AbortSignal
  ): Promise<ExecutionResult> {
    const session = this.sessions.get(sessionId)!;
    const startTime = Date.now();

    this.emit('command_started', { sessionId, command });

    try {
      // Dry run mode
      if (options?.dryRun) {
        return {
          id: `dry-run-${Date.now()}`,
          command,
          exitCode: 0,
          stdout: `[DRY RUN] Would execute: ${command.command} ${command.args.join(' ')}`,
          stderr: '',
          duration: 0,
          success: true
        };
      }

      // Import SafeCommandExecutor here to avoid circular dependencies
      const { SafeCommandExecutor } = await import('./SafeCommandExecutor');
      const executor = new SafeCommandExecutor();

      const result = await executor.execute({
        command: command.command,
        args: command.args,
        workingDirectory: options?.workingDirectory || command.workingDirectory || session.workingDirectory,
        environment: { ...session.environment, ...command.environment, ...options?.environment },
        timeout: options?.timeout || command.timeout || session.preferences.defaultTimeout,
        abortSignal
      });

      const executionResult: ExecutionResult = {
        id: `exec-${Date.now()}`,
        command,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        duration: Date.now() - startTime,
        success: result.exitCode === 0
      };

      // Analyze output
      if (result.stdout || result.stderr) {
        executionResult.analysis = await this.analyzeOutput(command, result);
        executionResult.followUpSuggestions = this.generateFollowUpSuggestions(
          command,
          executionResult
        );
      }

      this.emit('command_completed', { sessionId, command, result: executionResult });

      return executionResult;

    } catch (error) {
      const executionResult: ExecutionResult = {
        id: `exec-error-${Date.now()}`,
        command,
        exitCode: -1,
        stdout: '',
        stderr: (error as Error).message,
        duration: Date.now() - startTime,
        success: false
      };

      this.emit('command_failed', { sessionId, command, error, result: executionResult });

      return executionResult;
    }
  }

  private async analyzeOutput(command: Command, result: any): Promise<OutputAnalysis> {
    // Import OutputAnalyzer here to avoid circular dependencies
    const { OutputAnalyzer } = await import('./OutputAnalyzer');
    const analyzer = new OutputAnalyzer();

    const analysis = await analyzer.analyze({
      command: `${command.command} ${command.args.join(' ')}`,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      category: command.category,
      expectedOutput: command.expectedOutput
    });

    this.emit('output_analyzed', { command, analysis });

    return analysis;
  }

  private generateFollowUpSuggestions(
    command: Command,
    result: ExecutionResult
  ): string[] {
    const suggestions: string[] = [];

    // Success-based suggestions
    if (result.success) {
      switch (command.category) {
        case 'git':
          if (command.command === 'git' && command.args.includes('clone')) {
            suggestions.push('cd into the cloned repository');
            suggestions.push('install dependencies');
          }
          if (command.args.includes('commit')) {
            suggestions.push('push changes to remote');
            suggestions.push('create a pull request');
          }
          break;

        case 'package_management':
          if (command.args.includes('install')) {
            suggestions.push('run the project');
            suggestions.push('check for vulnerabilities');
          }
          break;

        case 'development':
          if (command.args.includes('build')) {
            suggestions.push('run tests');
            suggestions.push('start the application');
          }
          break;
      }
    }

    // Error-based suggestions
    if (!result.success) {
      if (result.stderr.includes('permission denied')) {
        suggestions.push('try with sudo');
        suggestions.push('check file permissions');
      }

      if (result.stderr.includes('command not found')) {
        suggestions.push('install the required package');
        suggestions.push('check if command is in PATH');
      }

      if (result.stderr.includes('git')) {
        suggestions.push('check git status');
        suggestions.push('verify repository exists');
      }
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  private buildParsingContext(session: TerminalSession): ParsingContext {
    const recentCommands = this.getRecentCommands(session.id, 10);

    return {
      currentDirectory: session.workingDirectory,
      platform: process.platform,
      shellType: process.env.SHELL?.split('/').pop() || 'bash',
      environmentVariables: session.environment,
      projectType: this.detectProjectType(session.workingDirectory),
      gitRepository: this.detectGitRepository(session.workingDirectory),
      recentCommands: recentCommands.map(cmd => `${cmd.command} ${cmd.args.join(' ')}`),
      preferences: session.preferences
    };
  }

  private detectProjectType(directory: string): ParsingContext['projectType'] {
    try {
      const { existsSync } = require('fs');
      const { join } = require('path');

      if (existsSync(join(directory, 'package.json'))) return 'node';
      if (existsSync(join(directory, 'Cargo.toml'))) return 'rust';
      if (existsSync(join(directory, 'go.mod'))) return 'go';
      if (existsSync(join(directory, 'requirements.txt')) || existsSync(join(directory, 'pyproject.toml'))) return 'python';

      return undefined;
    } catch {
      return undefined;
    }
  }

  private detectGitRepository(directory: string): ParsingContext['gitRepository'] {
    try {
      const { existsSync } = require('fs');
      const { join } = require('path');

      const isRepo = existsSync(join(directory, '.git'));
      if (!isRepo) {
        return { isRepo: false };
      }

      // This would normally use git commands to get branch info
      return {
        isRepo: true,
        currentBranch: 'main', // Placeholder
        hasChanges: false // Placeholder
      };
    } catch {
      return { isRepo: false };
    }
  }

  private requiresApproval(command: Command, preferences: UserPreferences): boolean {
    if (command.riskLevel === 'critical' || command.riskLevel === 'high') {
      return true;
    }

    if (command.requiresElevation && !preferences.allowElevation) {
      return true;
    }

    if (preferences.confirmDestructiveCommands && command.riskLevel === 'medium') {
      return true;
    }

    return false;
  }

  private async requestApproval(sessionId: string, command: Command): Promise<boolean> {
    // This would typically show a UI dialog or emit an event
    // For now, we'll emit an event and wait for a response
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => resolve(false), 30000); // 30 second timeout

      const approvalHandler = (event: any) => {
        if (event.sessionId === sessionId && event.commandId === command.id) {
          clearTimeout(timeoutId);
          this.removeListener('approval_response', approvalHandler);
          resolve(event.approved);
        }
      };

      this.on('approval_response', approvalHandler);

      this.emit('approval_request', {
        sessionId,
        command,
        timeout: 30000
      });
    });
  }

  private async addToHistory(
    sessionId: string,
    command: Command,
    result: ExecutionResult
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const historyEntry: CommandHistory = {
      id: result.id,
      sessionId,
      command: command.command,
      args: command.args,
      workingDirectory: command.workingDirectory || session.workingDirectory,
      startedAt: new Date(Date.now() - result.duration),
      completedAt: new Date(),
      exitCode: result.exitCode,
      output: result.stdout,
      error: result.stderr,
      duration: result.duration,
      riskLevel: command.riskLevel,
      userApproved: !this.requiresApproval(command, session.preferences),
      success: result.success
    };

    let history = this.commandHistory.get(sessionId) || [];
    history.push(historyEntry);

    // Keep only last 1000 commands
    if (history.length > 1000) {
      history = history.slice(-1000);
    }

    this.commandHistory.set(sessionId, history);
    session.history = history.slice(-50); // Keep last 50 in session object
  }

  // Utility Methods
  getRecentCommands(sessionId: string, limit: number = 10): CommandHistory[] {
    const history = this.commandHistory.get(sessionId) || [];
    return history.slice(-limit);
  }

  getSessionHistory(sessionId: string): CommandHistory[] {
    return this.commandHistory.get(sessionId) || [];
  }

  getSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  getActiveSessions(): TerminalSession[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'active');
  }

  async cancelExecution(sessionId: string): Promise<boolean> {
    const abortController = this.activeExecutions.get(sessionId);
    if (abortController) {
      abortController.abort();
      this.activeExecutions.delete(sessionId);
      return true;
    }
    return false;
  }

  // Command suggestions based on context
  async getCommandSuggestions(sessionId: string, partialQuery: string): Promise<string[]> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const context = this.buildParsingContext(session);
    return this.parser.getCommandSuggestions(partialQuery, context);
  }

  // Export/Import session data
  async exportSession(sessionId: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    const history = this.commandHistory.get(sessionId);

    if (!session) return null;

    return {
      session,
      history,
      exportedAt: new Date()
    };
  }

  // Health check
  getServiceHealth(): {
    healthy: boolean;
    activeSessions: number;
    activeExecutions: number;
    uptime: number;
  } {
    return {
      healthy: true,
      activeSessions: this.sessions.size,
      activeExecutions: this.activeExecutions.size,
      uptime: process.uptime()
    };
  }
}

export default AITerminalService;