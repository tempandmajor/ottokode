import { EventEmitter } from 'events';

export interface CommandHistoryEntry {
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
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  userApproved: boolean;
  success: boolean;
  category: string;
  analysis?: HistoryAnalysis;
}

export interface HistoryAnalysis {
  patterns: CommandPattern[];
  trends: CommandTrend[];
  suggestions: IntelligentSuggestion[];
  workflows: WorkflowPattern[];
  insights: HistoryInsight[];
  performance: PerformanceMetrics;
}

export interface CommandPattern {
  id: string;
  name: string;
  commands: string[];
  frequency: number;
  lastUsed: Date;
  successRate: number;
  avgDuration: number;
  context: string[];
  description: string;
}

export interface CommandTrend {
  period: 'hour' | 'day' | 'week' | 'month';
  commandType: string;
  usage: number;
  change: number; // percentage change from previous period
  prediction: number; // predicted usage for next period
}

export interface IntelligentSuggestion {
  type: 'command' | 'workflow' | 'optimization' | 'learning';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  commands?: string[];
  reasoning: string;
  confidence: number;
  actionable: boolean;
  category: string;
}

export interface WorkflowPattern {
  id: string;
  name: string;
  sequence: WorkflowStep[];
  frequency: number;
  successRate: number;
  totalDuration: number;
  triggers: string[];
  context: WorkflowContext;
}

export interface WorkflowStep {
  command: string;
  args: string[];
  expectedDuration: number;
  successRate: number;
  alternatives: string[];
}

export interface WorkflowContext {
  projectType?: string;
  timeOfDay: string[];
  dayOfWeek: string[];
  workingDirectory: string;
  prerequisites: string[];
}

export interface HistoryInsight {
  type: 'productivity' | 'error_pattern' | 'optimization' | 'learning';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  evidence: string[];
  recommendations: string[];
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
}

export interface PerformanceMetrics {
  totalCommands: number;
  successRate: number;
  avgExecutionTime: number;
  errorRate: number;
  mostUsedCommands: Array<{ command: string; count: number }>;
  timeDistribution: Array<{ hour: number; count: number }>;
  productivityScore: number;
  trendsScore: number;
}

export interface LearningData {
  userPreferences: UserPreferences;
  commandAliases: Map<string, string>;
  contextualPatterns: Map<string, CommandPattern[]>;
  errorRecoveryPatterns: Map<string, string[]>;
  optimizationOpportunities: OptimizationOpportunity[];
}

export interface UserPreferences {
  preferredCommands: Map<string, number>; // command -> preference score
  workingHours: Array<{ start: number; end: number }>;
  preferredWorkflows: string[];
  avoidedCommands: string[];
  customAliases: Map<string, string>;
  riskTolerance: 'low' | 'medium' | 'high';
}

export interface OptimizationOpportunity {
  type: 'command_replacement' | 'workflow_shortcut' | 'alias_suggestion' | 'automation';
  description: string;
  currentApproach: string[];
  suggestedApproach: string[];
  estimatedTimeSaving: number; // in milliseconds
  complexity: 'easy' | 'medium' | 'hard';
  confidence: number;
}

export class TerminalHistoryIntelligence extends EventEmitter {
  private history: Map<string, CommandHistoryEntry[]> = new Map();
  private patterns: CommandPattern[] = [];
  private workflows: WorkflowPattern[] = [];
  private learningData: LearningData;
  private analysisCache: Map<string, HistoryAnalysis> = new Map();

  constructor() {
    super();
    this.learningData = this.initializeLearningData();
    this.schedulePeriodicAnalysis();
  }

  private initializeLearningData(): LearningData {
    return {
      userPreferences: {
        preferredCommands: new Map(),
        workingHours: [{ start: 9, end: 17 }],
        preferredWorkflows: [],
        avoidedCommands: [],
        customAliases: new Map(),
        riskTolerance: 'medium'
      },
      commandAliases: new Map(),
      contextualPatterns: new Map(),
      errorRecoveryPatterns: new Map(),
      optimizationOpportunities: []
    };
  }

  private schedulePeriodicAnalysis(): void {
    // Analyze patterns every hour
    setInterval(() => {
      this.analyzePatterns();
    }, 60 * 60 * 1000);

    // Update learning data every 30 minutes
    setInterval(() => {
      this.updateLearningData();
    }, 30 * 60 * 1000);

    // Generate insights daily
    setInterval(() => {
      this.generateInsights();
    }, 24 * 60 * 60 * 1000);
  }

  // Core Methods
  addHistoryEntry(entry: CommandHistoryEntry): void {
    const sessionHistory = this.history.get(entry.sessionId) || [];
    sessionHistory.push(entry);

    // Keep only last 10000 entries per session
    if (sessionHistory.length > 10000) {
      sessionHistory.shift();
    }

    this.history.set(entry.sessionId, sessionHistory);

    // Invalidate cache for this session
    this.analysisCache.delete(entry.sessionId);

    // Emit event for real-time processing
    this.emit('history_entry_added', entry);

    // Update learning data incrementally
    this.updateLearningDataIncremental(entry);
  }

  async analyzeHistory(sessionId?: string): Promise<HistoryAnalysis> {
    const cacheKey = sessionId || 'global';

    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    const entries = sessionId
      ? this.history.get(sessionId) || []
      : this.getAllEntries();

    const analysis: HistoryAnalysis = {
      patterns: await this.identifyPatterns(entries),
      trends: await this.analyzeTrends(entries),
      suggestions: await this.generateSuggestions(entries),
      workflows: await this.identifyWorkflows(entries),
      insights: await this.generateInsights(entries),
      performance: await this.calculatePerformanceMetrics(entries)
    };

    this.analysisCache.set(cacheKey, analysis);
    this.emit('analysis_completed', { sessionId, analysis });

    return analysis;
  }

  async getIntelligentSuggestions(
    context: {
      currentDirectory?: string;
      recentCommands?: string[];
      projectType?: string;
      timeOfDay?: number;
    }
  ): Promise<IntelligentSuggestion[]> {
    const allEntries = this.getAllEntries();
    const contextualEntries = this.filterByContext(allEntries, context);

    const suggestions: IntelligentSuggestion[] = [];

    // Pattern-based suggestions
    const patterns = await this.identifyPatterns(contextualEntries);
    suggestions.push(...this.generatePatternSuggestions(patterns, context));

    // Workflow suggestions
    const workflows = await this.identifyWorkflows(contextualEntries);
    suggestions.push(...this.generateWorkflowSuggestions(workflows, context));

    // Optimization suggestions
    const optimizations = this.identifyOptimizationOpportunities(contextualEntries);
    suggestions.push(...this.generateOptimizationSuggestions(optimizations));

    // Learning suggestions
    suggestions.push(...this.generateLearningSuggestions(contextualEntries, context));

    // Sort by priority and confidence
    return suggestions
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (
          priorityOrder[b.priority] - priorityOrder[a.priority] ||
          b.confidence - a.confidence
        );
      })
      .slice(0, 10); // Return top 10 suggestions
  }

  // Pattern Recognition
  private async identifyPatterns(entries: CommandHistoryEntry[]): Promise<CommandPattern[]> {
    const patterns: Map<string, CommandPattern> = new Map();
    const sequenceLength = 3; // Look for sequences of 3 commands

    // Sliding window pattern detection
    for (let i = 0; i <= entries.length - sequenceLength; i++) {
      const sequence = entries.slice(i, i + sequenceLength);
      const commands = sequence.map(e => `${e.command} ${e.args.join(' ')}`);
      const patternKey = commands.join(' -> ');

      if (patterns.has(patternKey)) {
        const pattern = patterns.get(patternKey)!;
        pattern.frequency++;
        pattern.lastUsed = sequence[sequence.length - 1].startedAt;

        // Update success rate
        const successes = sequence.filter(e => e.success).length;
        pattern.successRate = (pattern.successRate + successes / sequence.length) / 2;

        // Update average duration
        const totalDuration = sequence.reduce((sum, e) => sum + e.duration, 0);
        pattern.avgDuration = (pattern.avgDuration + totalDuration) / 2;
      } else {
        const successes = sequence.filter(e => e.success).length;
        const totalDuration = sequence.reduce((sum, e) => sum + e.duration, 0);
        const context = [...new Set(sequence.map(e => e.workingDirectory))];

        patterns.set(patternKey, {
          id: `pattern-${patterns.size}`,
          name: `Pattern: ${commands[0]} sequence`,
          commands,
          frequency: 1,
          lastUsed: sequence[sequence.length - 1].startedAt,
          successRate: successes / sequence.length,
          avgDuration: totalDuration,
          context,
          description: this.generatePatternDescription(commands)
        });
      }
    }

    return Array.from(patterns.values())
      .filter(p => p.frequency >= 2) // Only patterns that occurred at least twice
      .sort((a, b) => b.frequency - a.frequency);
  }

  private async identifyWorkflows(entries: CommandHistoryEntry[]): Promise<WorkflowPattern[]> {
    const workflows: Map<string, WorkflowPattern> = new Map();
    const workflowLength = 5; // Look for workflows of up to 5 commands

    // Group entries by time proximity (commands within 10 minutes)
    const timeGroups = this.groupByTimeProximity(entries, 10 * 60 * 1000);

    for (const group of timeGroups) {
      if (group.length < 2) continue;

      const commands = group.map(e => `${e.command} ${e.args.join(' ')}`);
      const workflowKey = commands.join(' | ');

      const steps: WorkflowStep[] = group.map((entry, index) => ({
        command: entry.command,
        args: entry.args,
        expectedDuration: entry.duration,
        successRate: entry.success ? 1.0 : 0.0,
        alternatives: this.findCommandAlternatives(entry.command)
      }));

      const triggers = this.identifyWorkflowTriggers(group);
      const context: WorkflowContext = {
        projectType: this.detectProjectType(group[0].workingDirectory),
        timeOfDay: group.map(e => this.getTimeOfDayCategory(e.startedAt)),
        dayOfWeek: group.map(e => this.getDayOfWeek(e.startedAt)),
        workingDirectory: group[0].workingDirectory,
        prerequisites: this.identifyPrerequisites(group)
      };

      if (workflows.has(workflowKey)) {
        const workflow = workflows.get(workflowKey)!;
        workflow.frequency++;

        // Update success rate
        const groupSuccessRate = group.filter(e => e.success).length / group.length;
        workflow.successRate = (workflow.successRate + groupSuccessRate) / 2;

        // Update total duration
        const groupDuration = group.reduce((sum, e) => sum + e.duration, 0);
        workflow.totalDuration = (workflow.totalDuration + groupDuration) / 2;
      } else {
        workflows.set(workflowKey, {
          id: `workflow-${workflows.size}`,
          name: `Workflow: ${commands[0]} flow`,
          sequence: steps,
          frequency: 1,
          successRate: group.filter(e => e.success).length / group.length,
          totalDuration: group.reduce((sum, e) => sum + e.duration, 0),
          triggers,
          context
        });
      }
    }

    return Array.from(workflows.values())
      .filter(w => w.frequency >= 2)
      .sort((a, b) => b.frequency - a.frequency);
  }

  private async analyzeTrends(entries: CommandHistoryEntry[]): Promise<CommandTrend[]> {
    const trends: Map<string, CommandTrend[]> = new Map();
    const periods: Array<'hour' | 'day' | 'week' | 'month'> = ['hour', 'day', 'week', 'month'];

    for (const period of periods) {
      const periodData = this.groupEntriesByPeriod(entries, period);

      for (const [commandType, periodEntries] of periodData) {
        const usage = periodEntries.length;
        const previousPeriodUsage = this.getPreviousPeriodUsage(commandType, period);
        const change = previousPeriodUsage > 0
          ? ((usage - previousPeriodUsage) / previousPeriodUsage) * 100
          : 0;

        const prediction = this.predictUsage(commandType, period, usage, change);

        if (!trends.has(commandType)) {
          trends.set(commandType, []);
        }

        trends.get(commandType)!.push({
          period,
          commandType,
          usage,
          change,
          prediction
        });
      }
    }

    return Array.from(trends.values()).flat();
  }

  // Suggestion Generation
  private generatePatternSuggestions(
    patterns: CommandPattern[],
    context: any
  ): IntelligentSuggestion[] {
    return patterns
      .filter(p => p.successRate > 0.7 && p.frequency > 3)
      .slice(0, 3)
      .map(pattern => ({
        type: 'workflow' as const,
        priority: 'medium' as const,
        title: `Detected Pattern: ${pattern.name}`,
        description: `You often use this sequence: ${pattern.commands.join(' → ')}`,
        commands: pattern.commands,
        reasoning: `This pattern has a ${Math.round(pattern.successRate * 100)}% success rate and you've used it ${pattern.frequency} times`,
        confidence: Math.min(pattern.successRate + (pattern.frequency / 10), 1.0),
        actionable: true,
        category: 'pattern'
      }));
  }

  private generateWorkflowSuggestions(
    workflows: WorkflowPattern[],
    context: any
  ): IntelligentSuggestion[] {
    return workflows
      .filter(w => w.successRate > 0.8 && w.frequency > 2)
      .slice(0, 2)
      .map(workflow => ({
        type: 'workflow' as const,
        priority: 'high' as const,
        title: `Workflow Automation: ${workflow.name}`,
        description: `Create a shortcut for this ${workflow.sequence.length}-step workflow`,
        commands: workflow.sequence.map(s => `${s.command} ${s.args.join(' ')}`),
        reasoning: `This workflow has ${Math.round(workflow.successRate * 100)}% success rate and saves ~${Math.round(workflow.totalDuration / 1000)}s`,
        confidence: workflow.successRate * (Math.min(workflow.frequency / 5, 1)),
        actionable: true,
        category: 'workflow'
      }));
  }

  private generateOptimizationSuggestions(
    opportunities: OptimizationOpportunity[]
  ): IntelligentSuggestion[] {
    return opportunities
      .filter(o => o.estimatedTimeSaving > 1000) // At least 1 second saving
      .slice(0, 3)
      .map(opp => ({
        type: 'optimization' as const,
        priority: opp.estimatedTimeSaving > 10000 ? 'high' : 'medium' as const,
        title: `Optimization: ${opp.type.replace('_', ' ')}`,
        description: opp.description,
        commands: opp.suggestedApproach,
        reasoning: `Could save ~${Math.round(opp.estimatedTimeSaving / 1000)}s per execution`,
        confidence: opp.confidence,
        actionable: opp.complexity !== 'hard',
        category: 'optimization'
      }));
  }

  private generateLearningSuggestions(
    entries: CommandHistoryEntry[],
    context: any
  ): IntelligentSuggestion[] {
    const suggestions: IntelligentSuggestion[] = [];

    // Command learning suggestions
    const errorCommands = entries.filter(e => !e.success);
    const errorPatterns = this.analyzeErrorPatterns(errorCommands);

    if (errorPatterns.length > 0) {
      suggestions.push({
        type: 'learning',
        priority: 'medium',
        title: 'Command Error Analysis',
        description: `You've had issues with: ${errorPatterns.slice(0, 3).join(', ')}`,
        reasoning: 'Learning from past errors can improve success rate',
        confidence: 0.8,
        actionable: true,
        category: 'learning'
      });
    }

    // Underused commands
    const allCommands = entries.map(e => e.command);
    const commandFreq = this.calculateCommandFrequency(allCommands);
    const underusedCommands = this.identifyUnderusedCommands(commandFreq);

    if (underusedCommands.length > 0) {
      suggestions.push({
        type: 'learning',
        priority: 'low',
        title: 'Explore New Commands',
        description: `Consider trying: ${underusedCommands.slice(0, 3).join(', ')}`,
        reasoning: 'These commands might be useful for your workflow',
        confidence: 0.6,
        actionable: true,
        category: 'learning'
      });
    }

    return suggestions;
  }

  // Utility Methods
  private getAllEntries(): CommandHistoryEntry[] {
    return Array.from(this.history.values()).flat();
  }

  private filterByContext(
    entries: CommandHistoryEntry[],
    context: any
  ): CommandHistoryEntry[] {
    return entries.filter(entry => {
      if (context.currentDirectory && !entry.workingDirectory.includes(context.currentDirectory)) {
        return false;
      }
      if (context.projectType && this.detectProjectType(entry.workingDirectory) !== context.projectType) {
        return false;
      }
      return true;
    });
  }

  private groupByTimeProximity(
    entries: CommandHistoryEntry[],
    maxGapMs: number
  ): CommandHistoryEntry[][] {
    const groups: CommandHistoryEntry[][] = [];
    let currentGroup: CommandHistoryEntry[] = [];

    for (const entry of entries.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())) {
      if (currentGroup.length === 0) {
        currentGroup.push(entry);
      } else {
        const lastEntry = currentGroup[currentGroup.length - 1];
        const gap = entry.startedAt.getTime() - (lastEntry.completedAt?.getTime() || lastEntry.startedAt.getTime());

        if (gap <= maxGapMs) {
          currentGroup.push(entry);
        } else {
          if (currentGroup.length > 1) {
            groups.push(currentGroup);
          }
          currentGroup = [entry];
        }
      }
    }

    if (currentGroup.length > 1) {
      groups.push(currentGroup);
    }

    return groups;
  }

  private generatePatternDescription(commands: string[]): string {
    if (commands.length < 2) return commands[0] || 'Unknown pattern';

    const firstCommand = commands[0].split(' ')[0];
    const lastCommand = commands[commands.length - 1].split(' ')[0];

    return `${firstCommand} → ${lastCommand} workflow pattern`;
  }

  private detectProjectType(directory: string): string {
    if (directory.includes('package.json')) return 'node';
    if (directory.includes('Cargo.toml')) return 'rust';
    if (directory.includes('.git')) return 'git';
    return 'general';
  }

  private getTimeOfDayCategory(date: Date): string {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private getDayOfWeek(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  private updateLearningDataIncremental(entry: CommandHistoryEntry): void {
    // Update command preferences
    const currentScore = this.learningData.userPreferences.preferredCommands.get(entry.command) || 0;
    const newScore = entry.success ? currentScore + 1 : Math.max(0, currentScore - 0.5);
    this.learningData.userPreferences.preferredCommands.set(entry.command, newScore);

    // Update avoided commands if failed multiple times
    if (!entry.success) {
      const failCount = this.getCommandFailCount(entry.command);
      if (failCount >= 3 && !this.learningData.userPreferences.avoidedCommands.includes(entry.command)) {
        this.learningData.userPreferences.avoidedCommands.push(entry.command);
      }
    }
  }

  private getCommandFailCount(command: string): number {
    const allEntries = this.getAllEntries();
    return allEntries.filter(e => e.command === command && !e.success).length;
  }

  private identifyOptimizationOpportunities(entries: CommandHistoryEntry[]): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // Identify repetitive command sequences that could be aliased
    const sequences = this.findRepetitiveSequences(entries);
    for (const sequence of sequences) {
      if (sequence.commands.length > 2) {
        opportunities.push({
          type: 'alias_suggestion',
          description: `Create alias for: ${sequence.commands.join(' && ')}`,
          currentApproach: sequence.commands,
          suggestedApproach: [`alias quick_${sequence.commands[0].split(' ')[0]}="${sequence.commands.join(' && ')}"`],
          estimatedTimeSaving: sequence.avgDuration * 0.7, // 70% time saving
          complexity: 'easy',
          confidence: 0.8
        });
      }
    }

    // Identify slow commands that could be optimized
    const slowCommands = entries
      .filter(e => e.duration > 30000) // Commands taking more than 30 seconds
      .reduce((acc, e) => {
        const key = `${e.command} ${e.args.join(' ')}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(e);
        return acc;
      }, {} as Record<string, CommandHistoryEntry[]>);

    for (const [command, cmdEntries] of Object.entries(slowCommands)) {
      if (cmdEntries.length >= 3) { // Command was slow multiple times
        opportunities.push({
          type: 'command_replacement',
          description: `Consider optimizing slow command: ${command}`,
          currentApproach: [command],
          suggestedApproach: [this.suggestCommandOptimization(command)],
          estimatedTimeSaving: cmdEntries.reduce((sum, e) => sum + e.duration, 0) / cmdEntries.length * 0.5,
          complexity: 'medium',
          confidence: 0.7
        });
      }
    }

    return opportunities;
  }

  private findRepetitiveSequences(entries: CommandHistoryEntry[]): Array<{
    commands: string[];
    frequency: number;
    avgDuration: number;
  }> {
    // Implementation would find sequences that appear multiple times
    // This is a simplified version
    return [];
  }

  private suggestCommandOptimization(command: string): string {
    // Simple optimization suggestions
    if (command.includes('find')) return command + ' -type f'; // Add type filter
    if (command.includes('grep')) return command.replace('grep', 'rg'); // Suggest ripgrep
    if (command.includes('ls')) return command + ' --color=auto'; // Add color
    return command; // No optimization suggestion
  }

  private analyzeErrorPatterns(errorEntries: CommandHistoryEntry[]): string[] {
    const errorCounts = new Map<string, number>();

    for (const entry of errorEntries) {
      const command = entry.command;
      errorCounts.set(command, (errorCounts.get(command) || 0) + 1);
    }

    return Array.from(errorCounts.entries())
      .filter(([_, count]) => count >= 2)
      .sort(([_, a], [__, b]) => b - a)
      .map(([command, _]) => command);
  }

  private calculateCommandFrequency(commands: string[]): Map<string, number> {
    const frequency = new Map<string, number>();
    for (const command of commands) {
      frequency.set(command, (frequency.get(command) || 0) + 1);
    }
    return frequency;
  }

  private identifyUnderusedCommands(frequency: Map<string, number>): string[] {
    const commonCommands = ['ls', 'cd', 'git', 'npm', 'code', 'cat', 'grep', 'find'];
    const used = new Set(frequency.keys());
    return commonCommands.filter(cmd => !used.has(cmd));
  }

  // Additional utility methods would be implemented here...
  private findCommandAlternatives(command: string): string[] {
    const alternatives: Record<string, string[]> = {
      'ls': ['dir', 'tree', 'll'],
      'cat': ['less', 'more', 'bat'],
      'grep': ['rg', 'ag', 'ack'],
      'find': ['fd', 'locate']
    };
    return alternatives[command] || [];
  }

  private identifyWorkflowTriggers(group: CommandHistoryEntry[]): string[] {
    // Analyze what typically triggers this workflow
    const triggers: string[] = [];

    if (group[0].command === 'git' && group[0].args.includes('clone')) {
      triggers.push('project_setup');
    }

    if (group.some(e => e.command === 'npm' && e.args.includes('install'))) {
      triggers.push('dependency_management');
    }

    return triggers;
  }

  private identifyPrerequisites(group: CommandHistoryEntry[]): string[] {
    // Analyze what needs to be in place before this workflow
    const prerequisites: string[] = [];

    if (group.some(e => e.command === 'npm')) {
      prerequisites.push('node_installed');
    }

    if (group.some(e => e.command === 'git')) {
      prerequisites.push('git_repository');
    }

    return prerequisites;
  }

  private groupEntriesByPeriod(
    entries: CommandHistoryEntry[],
    period: 'hour' | 'day' | 'week' | 'month'
  ): Map<string, CommandHistoryEntry[]> {
    // Group entries by time period and command type
    const groups = new Map<string, CommandHistoryEntry[]>();

    // Implementation would group entries by the specified time period
    // This is a simplified placeholder

    return groups;
  }

  private getPreviousPeriodUsage(commandType: string, period: string): number {
    // Get usage from previous period for trend calculation
    // This would query historical data
    return 0;
  }

  private predictUsage(commandType: string, period: string, currentUsage: number, change: number): number {
    // Simple linear prediction based on current trend
    return Math.max(0, Math.round(currentUsage * (1 + change / 100)));
  }

  private async generateInsights(entries?: CommandHistoryEntry[]): Promise<HistoryInsight[]> {
    const targetEntries = entries || this.getAllEntries();
    const insights: HistoryInsight[] = [];

    // Analyze productivity patterns
    const productivity = this.analyzeProductivityPatterns(targetEntries);
    insights.push(...productivity);

    // Analyze error patterns
    const errors = this.analyzeErrorInsights(targetEntries);
    insights.push(...errors);

    return insights;
  }

  private analyzeProductivityPatterns(entries: CommandHistoryEntry[]): HistoryInsight[] {
    // Implementation would analyze when user is most productive
    return [];
  }

  private analyzeErrorInsights(entries: CommandHistoryEntry[]): HistoryInsight[] {
    // Implementation would analyze common error patterns
    return [];
  }

  private async calculatePerformanceMetrics(entries: CommandHistoryEntry[]): Promise<PerformanceMetrics> {
    const totalCommands = entries.length;
    const successCount = entries.filter(e => e.success).length;
    const totalDuration = entries.reduce((sum, e) => sum + e.duration, 0);

    const commandCounts = new Map<string, number>();
    entries.forEach(e => {
      commandCounts.set(e.command, (commandCounts.get(e.command) || 0) + 1);
    });

    const mostUsed = Array.from(commandCounts.entries())
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 10)
      .map(([command, count]) => ({ command, count }));

    return {
      totalCommands,
      successRate: totalCommands > 0 ? successCount / totalCommands : 0,
      avgExecutionTime: totalCommands > 0 ? totalDuration / totalCommands : 0,
      errorRate: totalCommands > 0 ? (totalCommands - successCount) / totalCommands : 0,
      mostUsedCommands: mostUsed,
      timeDistribution: [], // Would be implemented to show usage by hour
      productivityScore: this.calculateProductivityScore(entries),
      trendsScore: this.calculateTrendsScore(entries)
    };
  }

  private calculateProductivityScore(entries: CommandHistoryEntry[]): number {
    // Calculate a productivity score based on success rate, command diversity, etc.
    if (entries.length === 0) return 0;

    const successRate = entries.filter(e => e.success).length / entries.length;
    const commandDiversity = new Set(entries.map(e => e.command)).size;
    const avgDuration = entries.reduce((sum, e) => sum + e.duration, 0) / entries.length;

    // Normalize to 0-100 scale
    return Math.min(100, Math.round(
      successRate * 40 + // 40% weight on success
      Math.min(commandDiversity / 10, 1) * 30 + // 30% weight on diversity
      Math.max(0, 1 - avgDuration / 60000) * 30 // 30% weight on speed
    ));
  }

  private calculateTrendsScore(entries: CommandHistoryEntry[]): number {
    // Calculate how well the user is trending (improving over time)
    // This is a simplified implementation
    return 75; // Placeholder
  }

  private analyzePatterns(): void {
    const allEntries = this.getAllEntries();
    this.patterns = [];
    this.identifyPatterns(allEntries).then(patterns => {
      this.patterns = patterns;
      this.emit('patterns_updated', patterns);
    });
  }

  private updateLearningData(): void {
    // Update learning data based on recent activity
    this.emit('learning_data_updated', this.learningData);
  }

  // Public API methods
  getPatterns(): CommandPattern[] {
    return [...this.patterns];
  }

  getWorkflows(): WorkflowPattern[] {
    return [...this.workflows];
  }

  getLearningData(): LearningData {
    return { ...this.learningData };
  }

  exportHistory(sessionId?: string): any {
    if (sessionId) {
      return {
        sessionId,
        entries: this.history.get(sessionId) || [],
        exportedAt: new Date()
      };
    }

    return {
      allSessions: Object.fromEntries(this.history),
      patterns: this.patterns,
      workflows: this.workflows,
      learningData: this.learningData,
      exportedAt: new Date()
    };
  }

  importHistory(data: any): void {
    if (data.allSessions) {
      this.history = new Map(Object.entries(data.allSessions));
      this.patterns = data.patterns || [];
      this.workflows = data.workflows || [];
      this.learningData = { ...this.learningData, ...data.learningData };
    }
  }

  clearHistory(sessionId?: string): void {
    if (sessionId) {
      this.history.delete(sessionId);
    } else {
      this.history.clear();
      this.patterns = [];
      this.workflows = [];
      this.analysisCache.clear();
    }
  }
}

export default TerminalHistoryIntelligence;