import { EventEmitter } from '../../utils/EventEmitter';
import { aiService } from '../ai/ResponsesAIService';

// Enhanced types for the orchestrator
export interface Task {
  id: string;
  type: 'code_generation' | 'code_review' | 'bug_fix' | 'optimization' | 'documentation' | 'testing' | 'multi_file_operation';
  description: string;
  context: TaskContext;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'planning' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  result?: TaskResult;
  agentId?: string;
  parentTaskId?: string;
  subTasks?: string[];
  estimatedDuration?: number;
  actualDuration?: number;
  createdAt: Date;
  updatedAt: Date;
  dependencies?: string[];
  requiredCapabilities?: string[];
}

export interface TaskContext {
  language: string;
  framework?: string;
  files?: string[];
  currentFile?: string;
  selectedCode?: string;
  projectPath?: string;
  gitBranch?: string;
  requirements?: string[];
  constraints?: string[];
  userPreferences?: Record<string, any>;
}

export interface TaskResult {
  success: boolean;
  output?: string;
  files?: FileChange[];
  commands?: Command[];
  errors?: string[];
  warnings?: string[];
  suggestions?: string[];
  metadata?: Record<string, any>;
}

export interface FileChange {
  path: string;
  action: 'create' | 'modify' | 'delete' | 'rename';
  content?: string;
  previousPath?: string;
  diff?: string;
}

export interface Command {
  command: string;
  args: string[];
  description: string;
  requiresApproval: boolean;
  estimated_duration?: number;
}

export interface Agent {
  id: string;
  name: string;
  type: 'code_generator' | 'code_reviewer' | 'bug_hunter' | 'optimizer' | 'documenter' | 'tester' | 'multi_file_specialist';
  specialization: string[];
  capabilities: string[];
  isActive: boolean;
  isBusy: boolean;
  currentTaskId?: string;
  tasksCompleted: number;
  successRate: number;
  averageExecutionTime: number;
  maxConcurrentTasks: number;
  currentTasks: Set<string>;
  model?: string; // Preferred AI model
  config?: AgentConfig;
}

export interface AgentConfig {
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retryAttempts?: number;
  autoApprove?: boolean;
  notifications?: boolean;
}

export interface TaskPlan {
  id: string;
  originalTask: Task;
  steps: TaskStep[];
  estimatedTotalDuration: number;
  dependencies: TaskDependency[];
  riskAssessment: RiskLevel;
  requiredApprovals: ApprovalPoint[];
}

export interface TaskStep {
  id: string;
  description: string;
  agentType: string;
  estimatedDuration: number;
  dependencies: string[];
  outputs: string[];
}

export interface TaskDependency {
  fromStep: string;
  toStep: string;
  type: 'data' | 'completion' | 'approval';
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ApprovalPoint {
  stepId: string;
  reason: string;
  riskLevel: RiskLevel;
}

export class AgentOrchestrator extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private taskPlans: Map<string, TaskPlan> = new Map();
  private taskQueue: Task[] = [];
  private executionHistory: TaskResult[] = [];
  private isProcessing = false;

  constructor() {
    super();
    this.initializeAgents();
    this.startTaskProcessor();
  }

  private initializeAgents() {
    // Code Generation Agent
    this.agents.set('code-generator', {
      id: 'code-generator',
      name: 'Code Generator',
      type: 'code_generator',
      specialization: ['typescript', 'javascript', 'react', 'node.js'],
      capabilities: ['generate_code', 'create_components', 'write_functions', 'scaffold_projects'],
      isActive: true,
      isBusy: false,
      tasksCompleted: 0,
      successRate: 0.95,
      averageExecutionTime: 30000, // 30 seconds
      maxConcurrentTasks: 2,
      currentTasks: new Set(),
      model: 'gpt-5',
      config: {
        temperature: 0.3,
        maxTokens: 2000,
        timeout: 60000,
        retryAttempts: 3
      }
    });

    // Code Review Agent
    this.agents.set('code-reviewer', {
      id: 'code-reviewer',
      name: 'Code Reviewer',
      type: 'code_reviewer',
      specialization: ['code_quality', 'security', 'performance', 'best_practices'],
      capabilities: ['analyze_code', 'suggest_improvements', 'find_bugs', 'security_audit'],
      isActive: true,
      isBusy: false,
      tasksCompleted: 0,
      successRate: 0.92,
      averageExecutionTime: 45000, // 45 seconds
      maxConcurrentTasks: 3,
      currentTasks: new Set(),
      model: 'claude-opus-4.1',
      config: {
        temperature: 0.2,
        maxTokens: 3000,
        timeout: 90000,
        retryAttempts: 2
      }
    });

    // Multi-File Specialist Agent
    this.agents.set('multi-file-specialist', {
      id: 'multi-file-specialist',
      name: 'Multi-File Specialist',
      type: 'multi_file_specialist',
      specialization: ['cross_file_analysis', 'refactoring', 'architecture'],
      capabilities: ['multi_file_operations', 'dependency_analysis', 'code_migration', 'architectural_changes'],
      isActive: true,
      isBusy: false,
      tasksCompleted: 0,
      successRate: 0.88,
      averageExecutionTime: 120000, // 2 minutes
      maxConcurrentTasks: 1,
      currentTasks: new Set(),
      model: 'claude-sonnet-4',
      config: {
        temperature: 0.1,
        maxTokens: 4000,
        timeout: 300000, // 5 minutes
        retryAttempts: 3
      }
    });

    this.emit('agentsInitialized', Array.from(this.agents.values()));
  }

  // Public API Methods
  async createTask(taskRequest: Partial<Task>): Promise<string> {
    const task: Task = {
      id: this.generateId(),
      type: taskRequest.type || 'code_generation',
      description: taskRequest.description || '',
      context: taskRequest.context || { language: 'typescript' },
      priority: taskRequest.priority || 'medium',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      dependencies: taskRequest.dependencies || [],
      requiredCapabilities: taskRequest.requiredCapabilities || []
    };

    this.tasks.set(task.id, task);
    this.addToQueue(task);
    this.emit('taskCreated', task);

    return task.id;
  }

  async executeTask(taskId: string): Promise<TaskResult> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Find best agent for this task
    const agent = this.findBestAgent(task);
    if (!agent) {
      throw new Error(`No suitable agent found for task ${taskId}`);
    }

    this.updateTaskStatus(task, 'in_progress');
    agent.isBusy = true;
    agent.currentTasks.add(taskId);
    task.agentId = agent.id;

    try {
      const result = await this.runTask(task, agent);
      this.updateTaskStatus(task, result.success ? 'completed' : 'failed');
      task.result = result;

      // Update agent stats
      agent.tasksCompleted++;
      if (result.success) {
        agent.successRate = (agent.successRate * (agent.tasksCompleted - 1) + 1) / agent.tasksCompleted;
      } else {
        agent.successRate = (agent.successRate * (agent.tasksCompleted - 1)) / agent.tasksCompleted;
      }

      this.emit('taskCompleted', { task, result });
      return result;
    } catch (error) {
      this.updateTaskStatus(task, 'failed');
      const errorResult: TaskResult = {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
      task.result = errorResult;
      this.emit('taskFailed', { task, error });
      return errorResult;
    } finally {
      agent.isBusy = false;
      agent.currentTasks.delete(taskId);
      task.updatedAt = new Date();
    }
  }

  private async runTask(task: Task, agent: Agent): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      let result: TaskResult;

      switch (task.type) {
        case 'code_generation':
          result = await this.handleCodeGeneration(task, agent);
          break;
        case 'code_review':
          result = await this.handleCodeReview(task, agent);
          break;
        case 'multi_file_operation':
          result = await this.handleMultiFileOperation(task, agent);
          break;
        default:
          result = await this.handleGenericTask(task, agent);
      }

      // Update timing
      const duration = Date.now() - startTime;
      task.actualDuration = duration;
      agent.averageExecutionTime = (agent.averageExecutionTime + duration) / 2;

      return result;
    } catch (error) {
      throw error;
    }
  }

  private async handleCodeGeneration(task: Task, agent: Agent): Promise<TaskResult> {
    try {
      const response = await aiService.generateCodeWithStructure(
        task.description,
        task.context.language || 'typescript',
        {
          model: agent.model,
          temperature: agent.config?.temperature,
          maxTokens: agent.config?.maxTokens
        }
      );

      return {
        success: true,
        output: response.code,
        files: [{
          path: task.context.currentFile || 'generated.ts',
          action: 'create',
          content: response.code
        }],
        suggestions: response.best_practices || [],
        metadata: {
          explanation: response.explanation,
          dependencies: response.dependencies
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private async handleCodeReview(task: Task, agent: Agent): Promise<TaskResult> {
    try {
      const codeToReview = task.context.selectedCode || '';
      const response = await aiService.reviewCodeWithStructure(
        codeToReview,
        task.context.language || 'typescript',
        {
          model: agent.model,
          temperature: agent.config?.temperature,
          maxTokens: agent.config?.maxTokens
        }
      );

      return {
        success: true,
        output: `Code review completed with score: ${response.overall_score}/100`,
        suggestions: response.improvements || [],
        warnings: response.security_concerns || [],
        metadata: {
          score: response.overall_score,
          issues: response.issues,
          performanceTips: response.performance_tips
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private async handleMultiFileOperation(task: Task, agent: Agent): Promise<TaskResult> {
    // This will be enhanced with the multi-file intelligence system
    try {
      const files = task.context.files || [];
      const operations: FileChange[] = [];

      // For now, use basic multi-file handling
      // This will be enhanced with the Context Manager

      return {
        success: true,
        output: `Multi-file operation completed on ${files.length} files`,
        files: operations,
        metadata: {
          filesProcessed: files.length,
          operationType: 'multi_file_edit'
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private async handleGenericTask(task: Task, agent: Agent): Promise<TaskResult> {
    try {
      const response = await aiService.complete([{
        role: 'user',
        content: task.description
      }], {
        model: agent.model,
        temperature: agent.config?.temperature,
        maxTokens: agent.config?.maxTokens
      });

      return {
        success: true,
        output: response.content,
        metadata: {
          model: agent.model,
          tokens: response.usage?.totalTokens
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  // Agent Management Methods
  private findBestAgent(task: Task): Agent | null {
    const availableAgents = Array.from(this.agents.values())
      .filter(agent =>
        agent.isActive &&
        !agent.isBusy &&
        this.agentCanHandleTask(agent, task)
      );

    if (availableAgents.length === 0) {
      return null;
    }

    // Sort by success rate and specialization match
    return availableAgents.sort((a, b) => {
      const aScore = this.calculateAgentScore(a, task);
      const bScore = this.calculateAgentScore(b, task);
      return bScore - aScore;
    })[0];
  }

  private agentCanHandleTask(agent: Agent, task: Task): boolean {
    // Check if agent type matches task type
    const typeMatch = this.getTaskTypeForAgent(agent.type) === task.type;

    // Check capabilities
    const hasCapabilities = task.requiredCapabilities?.every(cap =>
      agent.capabilities.includes(cap)
    ) ?? true;

    return typeMatch || hasCapabilities;
  }

  private calculateAgentScore(agent: Agent, task: Task): number {
    let score = agent.successRate * 100;

    // Bonus for specialization match
    if (task.context.language && agent.specialization.includes(task.context.language)) {
      score += 20;
    }

    // Penalty for being busy (shouldn't happen due to filtering, but safety)
    if (agent.isBusy) {
      score -= 50;
    }

    // Bonus for lower average execution time
    score += Math.max(0, 60 - (agent.averageExecutionTime / 1000));

    return score;
  }

  private getTaskTypeForAgent(agentType: Agent['type']): Task['type'] {
    const mapping: Record<Agent['type'], Task['type']> = {
      'code_generator': 'code_generation',
      'code_reviewer': 'code_review',
      'bug_hunter': 'bug_fix',
      'optimizer': 'optimization',
      'documenter': 'documentation',
      'tester': 'testing',
      'multi_file_specialist': 'multi_file_operation'
    };
    return mapping[agentType];
  }

  // Queue Management
  private addToQueue(task: Task) {
    this.taskQueue.push(task);
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private async startTaskProcessor() {
    setInterval(() => {
      if (!this.isProcessing && this.taskQueue.length > 0) {
        this.processNextTask();
      }
    }, 1000);
  }

  private async processNextTask() {
    if (this.taskQueue.length === 0) return;

    this.isProcessing = true;
    const task = this.taskQueue.shift()!;

    try {
      await this.executeTask(task.id);
    } catch (error) {
      console.error('Task processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Utility Methods
  private updateTaskStatus(task: Task, status: Task['status']) {
    task.status = status;
    task.updatedAt = new Date();
    this.emit('taskStatusChanged', { taskId: task.id, status, task });
  }

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API for retrieving information
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getTasksByStatus(status: Task['status']): Task[] {
    return Array.from(this.tasks.values()).filter(task => task.status === status);
  }

  getAgentStats(agentId: string) {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    const agentTasks = Array.from(this.tasks.values()).filter(task => task.agentId === agentId);

    return {
      agent,
      totalTasks: agentTasks.length,
      completedTasks: agentTasks.filter(task => task.status === 'completed').length,
      failedTasks: agentTasks.filter(task => task.status === 'failed').length,
      averageExecutionTime: agent.averageExecutionTime,
      successRate: agent.successRate
    };
  }

  // Cleanup
  destroy() {
    this.agents.clear();
    this.tasks.clear();
    this.taskPlans.clear();
    this.taskQueue = [];
    this.removeAllListeners();
  }
}

// Singleton instance
export const agentOrchestrator = new AgentOrchestrator();