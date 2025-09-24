import { EventEmitter } from 'events';
import { agentWorkflowEngine, AgentWorkflow, WorkflowExecution } from './AgentWorkflowEngine';
import { agentMemorySystem } from './AgentMemorySystem';
import { adaptiveLearningEngine } from './AdaptiveLearningEngine';
import { knowledgePersistenceService } from './KnowledgePersistenceService';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  capabilities: AgentCapability[];
  status: AgentStatus;
  metadata: AgentMetadata;
  configuration: AgentConfiguration;
  performance: AgentPerformance;
  created: Date;
  lastActive: Date;
}

export type AgentType =
  | 'code_analyzer'
  | 'bug_fixer'
  | 'refactor_specialist'
  | 'test_generator'
  | 'documentation_writer'
  | 'performance_optimizer'
  | 'security_auditor'
  | 'dependency_manager'
  | 'workflow_coordinator'
  | 'learning_facilitator';

export interface AgentCapability {
  name: string;
  description: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  confidence: number;
  prerequisites: string[];
}

export type AgentStatus =
  | 'idle'
  | 'busy'
  | 'thinking'
  | 'blocked'
  | 'error'
  | 'disabled'
  | 'learning';

export interface AgentMetadata {
  version: string;
  author: string;
  description: string;
  tags: string[];
  specializations: string[];
  experience: number; // hours of operation
}

export interface AgentConfiguration {
  maxConcurrentTasks: number;
  priority: number;
  timeout: number;
  retryAttempts: number;
  learningEnabled: boolean;
  autonomyLevel: 'manual' | 'assisted' | 'autonomous';
  preferences: AgentPreferences;
}

export interface AgentPreferences {
  preferredLanguages: string[];
  preferredFrameworks: string[];
  workingHours?: { start: string; end: string };
  maxComplexity: 'simple' | 'moderate' | 'complex' | 'expert';
  collaborationStyle: 'independent' | 'collaborative' | 'supportive';
}

export interface AgentPerformance {
  tasksCompleted: number;
  tasksSuccessful: number;
  tasksFailed: number;
  averageCompletionTime: number;
  successRate: number;
  efficiency: number;
  userSatisfaction: number;
  lastEvaluated: Date;
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  description: string;
  input: any;
  output?: any;
  context: TaskContext;
  dependencies: string[];
  assignedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  deadline?: Date;
  estimatedDuration?: number;
  actualDuration?: number;
}

export type TaskType =
  | 'analyze_code'
  | 'fix_bug'
  | 'refactor_code'
  | 'generate_tests'
  | 'write_documentation'
  | 'optimize_performance'
  | 'audit_security'
  | 'manage_dependencies'
  | 'coordinate_workflow'
  | 'facilitate_learning';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';

export type TaskStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface TaskContext {
  userId?: string;
  projectId?: string;
  sessionId: string;
  files: string[];
  codeLanguage: string;
  frameworks: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  userPreferences?: any;
}

export interface AgentCommunication {
  id: string;
  fromAgentId: string;
  toAgentId?: string; // undefined for broadcast
  type: CommunicationType;
  subject: string;
  content: any;
  priority: MessagePriority;
  timestamp: Date;
  read: boolean;
  acknowledged: boolean;
  response?: AgentResponse;
}

export type CommunicationType =
  | 'request_assistance'
  | 'share_knowledge'
  | 'report_progress'
  | 'notify_completion'
  | 'escalate_issue'
  | 'coordinate_action'
  | 'broadcast_update';

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface AgentResponse {
  id: string;
  originalMessageId: string;
  agentId: string;
  type: 'acceptance' | 'rejection' | 'information' | 'delegation';
  content: any;
  timestamp: Date;
}

export interface CoordinationRule {
  id: string;
  name: string;
  condition: RuleCondition;
  action: RuleAction;
  priority: number;
  enabled: boolean;
  statistics: RuleStatistics;
}

export interface RuleCondition {
  type: 'agent_overload' | 'task_dependency' | 'capability_match' | 'performance_threshold';
  parameters: Record<string, any>;
}

export interface RuleAction {
  type: 'redistribute_tasks' | 'request_assistance' | 'escalate' | 'adjust_priority' | 'notify_user';
  parameters: Record<string, any>;
}

export interface RuleStatistics {
  triggered: number;
  successful: number;
  failed: number;
  lastTriggered?: Date;
}

export interface TeamFormation {
  id: string;
  name: string;
  description: string;
  agents: string[];
  leader: string;
  objective: string;
  status: 'forming' | 'active' | 'completed' | 'disbanded';
  performance: TeamPerformance;
  created: Date;
  disbanded?: Date;
}

export interface TeamPerformance {
  tasksCompleted: number;
  averageCompletionTime: number;
  successRate: number;
  synergy: number; // how well agents work together
  efficiency: number;
}

export interface CoordinationMetrics {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  averageTaskTime: number;
  systemEfficiency: number;
  communicationVolume: number;
  coordinationOverhead: number;
}

class AgentCoordinationHub extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, AgentTask> = new Map();
  private communications: Map<string, AgentCommunication> = new Map();
  private coordinationRules: Map<string, CoordinationRule> = new Map();
  private teams: Map<string, TeamFormation> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Initialize default agents
    await this.initializeDefaultAgents();

    // Load coordination rules
    await this.loadCoordinationRules();

    // Start coordination processes
    this.startCoordinationLoop();
    this.startCommunicationProcessor();
    this.startPerformanceMonitor();

    this.isInitialized = true;
    this.emit('initialized');
  }

  private async initializeDefaultAgents(): Promise<void> {
    const defaultAgents: Omit<Agent, 'id' | 'created' | 'lastActive'>[] = [
      {
        name: 'Code Analyzer',
        type: 'code_analyzer',
        capabilities: [
          {
            name: 'syntax_analysis',
            description: 'Analyze code syntax and structure',
            level: 'expert',
            confidence: 0.95,
            prerequisites: []
          },
          {
            name: 'pattern_detection',
            description: 'Detect code patterns and anti-patterns',
            level: 'advanced',
            confidence: 0.85,
            prerequisites: ['syntax_analysis']
          }
        ],
        status: 'idle',
        metadata: {
          version: '1.0.0',
          author: 'system',
          description: 'Specialized in analyzing code structure and patterns',
          tags: ['analysis', 'patterns'],
          specializations: ['javascript', 'typescript', 'python', 'rust'],
          experience: 0
        },
        configuration: {
          maxConcurrentTasks: 3,
          priority: 8,
          timeout: 300000,
          retryAttempts: 2,
          learningEnabled: true,
          autonomyLevel: 'autonomous',
          preferences: {
            preferredLanguages: ['typescript', 'javascript'],
            preferredFrameworks: ['react', 'node.js'],
            maxComplexity: 'expert',
            collaborationStyle: 'collaborative'
          }
        },
        performance: {
          tasksCompleted: 0,
          tasksSuccessful: 0,
          tasksFailed: 0,
          averageCompletionTime: 0,
          successRate: 1.0,
          efficiency: 1.0,
          userSatisfaction: 0.8,
          lastEvaluated: new Date()
        }
      },
      {
        name: 'Bug Fixer',
        type: 'bug_fixer',
        capabilities: [
          {
            name: 'error_detection',
            description: 'Detect and classify errors',
            level: 'expert',
            confidence: 0.9,
            prerequisites: []
          },
          {
            name: 'fix_generation',
            description: 'Generate potential fixes',
            level: 'advanced',
            confidence: 0.8,
            prerequisites: ['error_detection']
          }
        ],
        status: 'idle',
        metadata: {
          version: '1.0.0',
          author: 'system',
          description: 'Specialized in identifying and fixing bugs',
          tags: ['debugging', 'fixes'],
          specializations: ['error_handling', 'runtime_errors', 'logic_bugs'],
          experience: 0
        },
        configuration: {
          maxConcurrentTasks: 2,
          priority: 9,
          timeout: 600000,
          retryAttempts: 3,
          learningEnabled: true,
          autonomyLevel: 'assisted',
          preferences: {
            preferredLanguages: ['javascript', 'typescript', 'python'],
            preferredFrameworks: ['react', 'express', 'fastapi'],
            maxComplexity: 'complex',
            collaborationStyle: 'supportive'
          }
        },
        performance: {
          tasksCompleted: 0,
          tasksSuccessful: 0,
          tasksFailed: 0,
          averageCompletionTime: 0,
          successRate: 1.0,
          efficiency: 1.0,
          userSatisfaction: 0.85,
          lastEvaluated: new Date()
        }
      },
      {
        name: 'Test Generator',
        type: 'test_generator',
        capabilities: [
          {
            name: 'test_case_generation',
            description: 'Generate comprehensive test cases',
            level: 'advanced',
            confidence: 0.85,
            prerequisites: []
          },
          {
            name: 'coverage_analysis',
            description: 'Analyze test coverage',
            level: 'intermediate',
            confidence: 0.75,
            prerequisites: []
          }
        ],
        status: 'idle',
        metadata: {
          version: '1.0.0',
          author: 'system',
          description: 'Specialized in generating automated tests',
          tags: ['testing', 'quality_assurance'],
          specializations: ['unit_tests', 'integration_tests', 'e2e_tests'],
          experience: 0
        },
        configuration: {
          maxConcurrentTasks: 2,
          priority: 7,
          timeout: 400000,
          retryAttempts: 2,
          learningEnabled: true,
          autonomyLevel: 'autonomous',
          preferences: {
            preferredLanguages: ['javascript', 'typescript'],
            preferredFrameworks: ['jest', 'vitest', 'cypress'],
            maxComplexity: 'complex',
            collaborationStyle: 'independent'
          }
        },
        performance: {
          tasksCompleted: 0,
          tasksSuccessful: 0,
          tasksFailed: 0,
          averageCompletionTime: 0,
          successRate: 1.0,
          efficiency: 1.0,
          userSatisfaction: 0.75,
          lastEvaluated: new Date()
        }
      }
    ];

    for (const agentData of defaultAgents) {
      const agentId = await this.registerAgent(agentData);
      this.emit('agentRegistered', { agentId, name: agentData.name });
    }
  }

  private async loadCoordinationRules(): Promise<void> {
    const defaultRules: Omit<CoordinationRule, 'id' | 'statistics'>[] = [
      {
        name: 'Redistribute Overloaded Agent Tasks',
        condition: {
          type: 'agent_overload',
          parameters: { maxTasksThreshold: 5, overloadDuration: 300000 }
        },
        action: {
          type: 'redistribute_tasks',
          parameters: { redistributeCount: 2, preferSimilarCapabilities: true }
        },
        priority: 9,
        enabled: true
      },
      {
        name: 'Request Assistance for Complex Tasks',
        condition: {
          type: 'capability_match',
          parameters: { complexity: 'expert', confidence: 0.6 }
        },
        action: {
          type: 'request_assistance',
          parameters: { assistanceType: 'collaboration', maxAssistants: 2 }
        },
        priority: 8,
        enabled: true
      },
      {
        name: 'Escalate Failed Tasks',
        condition: {
          type: 'performance_threshold',
          parameters: { failureRate: 0.5, timeWindow: 3600000 }
        },
        action: {
          type: 'escalate',
          parameters: { escalationLevel: 'user', includeContext: true }
        },
        priority: 10,
        enabled: true
      }
    ];

    defaultRules.forEach((ruleData, index) => {
      const ruleId = `rule_${index + 1}`;
      const rule: CoordinationRule = {
        id: ruleId,
        ...ruleData,
        statistics: {
          triggered: 0,
          successful: 0,
          failed: 0
        }
      };
      this.coordinationRules.set(ruleId, rule);
    });
  }

  private startCoordinationLoop(): void {
    // Main coordination loop - runs every 30 seconds
    setInterval(async () => {
      await this.performCoordination();
    }, 30000);
  }

  private startCommunicationProcessor(): void {
    // Process communications every 5 seconds
    setInterval(async () => {
      await this.processCommunications();
    }, 5000);
  }

  private startPerformanceMonitor(): void {
    // Monitor performance every 2 minutes
    setInterval(async () => {
      await this.monitorPerformance();
    }, 120000);
  }

  async registerAgent(agentData: Omit<Agent, 'id' | 'created' | 'lastActive'>): Promise<string> {
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const agent: Agent = {
      id: agentId,
      ...agentData,
      created: new Date(),
      lastActive: new Date()
    };

    this.agents.set(agentId, agent);
    this.emit('agentRegistered', { agentId, agent });

    return agentId;
  }

  async assignTask(
    taskData: Omit<AgentTask, 'id' | 'assignedAt'>,
    preferredAgentId?: string
  ): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const task: AgentTask = {
      id: taskId,
      ...taskData,
      assignedAt: new Date()
    };

    // Find best agent for the task
    const bestAgent = preferredAgentId
      ? this.agents.get(preferredAgentId)
      : await this.findBestAgent(task);

    if (!bestAgent) {
      throw new Error('No suitable agent found for task');
    }

    task.agentId = bestAgent.id;
    task.status = 'assigned';

    this.tasks.set(taskId, task);
    bestAgent.status = 'busy';
    bestAgent.lastActive = new Date();

    // Start task execution
    this.executeTask(task);

    this.emit('taskAssigned', { taskId, agentId: bestAgent.id, task });

    return taskId;
  }

  private async findBestAgent(task: AgentTask): Promise<Agent | null> {
    const availableAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === 'idle' || agent.status === 'busy');

    if (availableAgents.length === 0) return null;

    // Score agents based on capability match and availability
    const agentScores = availableAgents.map(agent => ({
      agent,
      score: this.calculateAgentScore(agent, task)
    }));

    // Sort by score and return best match
    agentScores.sort((a, b) => b.score - a.score);

    return agentScores[0].score > 0.5 ? agentScores[0].agent : null;
  }

  private calculateAgentScore(agent: Agent, task: AgentTask): number {
    let score = 0;

    // Check if agent type matches task type
    const typeMatch = this.getTypeCompatibility(agent.type, task.type);
    score += typeMatch * 0.4;

    // Check language preference
    if (agent.configuration.preferences.preferredLanguages.includes(task.context.codeLanguage)) {
      score += 0.2;
    }

    // Check framework preference
    const frameworkMatch = task.context.frameworks.some(framework =>
      agent.configuration.preferences.preferredFrameworks.includes(framework)
    );
    if (frameworkMatch) score += 0.15;

    // Consider agent performance
    score += agent.performance.successRate * 0.15;
    score += agent.performance.efficiency * 0.1;

    // Penalize if agent is overloaded
    const currentTasks = Array.from(this.tasks.values())
      .filter(t => t.agentId === agent.id && ['assigned', 'in_progress'].includes(t.status));

    if (currentTasks.length >= agent.configuration.maxConcurrentTasks) {
      score *= 0.5; // Heavy penalty for overloading
    } else if (currentTasks.length > 0) {
      score *= (1 - currentTasks.length / agent.configuration.maxConcurrentTasks * 0.3);
    }

    return Math.max(0, Math.min(1, score));
  }

  private getTypeCompatibility(agentType: AgentType, taskType: TaskType): number {
    const compatibilityMap: Record<AgentType, Record<TaskType, number>> = {
      code_analyzer: {
        analyze_code: 1.0,
        refactor_code: 0.7,
        optimize_performance: 0.6,
        audit_security: 0.5,
        fix_bug: 0.4,
        generate_tests: 0.3,
        write_documentation: 0.2,
        manage_dependencies: 0.1,
        coordinate_workflow: 0.0,
        facilitate_learning: 0.0
      },
      bug_fixer: {
        fix_bug: 1.0,
        analyze_code: 0.8,
        refactor_code: 0.6,
        generate_tests: 0.5,
        audit_security: 0.4,
        optimize_performance: 0.3,
        write_documentation: 0.2,
        manage_dependencies: 0.1,
        coordinate_workflow: 0.0,
        facilitate_learning: 0.0
      },
      test_generator: {
        generate_tests: 1.0,
        analyze_code: 0.6,
        fix_bug: 0.5,
        refactor_code: 0.4,
        audit_security: 0.3,
        optimize_performance: 0.2,
        write_documentation: 0.2,
        manage_dependencies: 0.1,
        coordinate_workflow: 0.0,
        facilitate_learning: 0.0
      },
      // ... other agent types
      refactor_specialist: {
        refactor_code: 1.0,
        analyze_code: 0.8,
        optimize_performance: 0.7,
        fix_bug: 0.5,
        generate_tests: 0.4,
        audit_security: 0.3,
        write_documentation: 0.2,
        manage_dependencies: 0.1,
        coordinate_workflow: 0.0,
        facilitate_learning: 0.0
      },
      documentation_writer: {
        write_documentation: 1.0,
        analyze_code: 0.6,
        refactor_code: 0.3,
        generate_tests: 0.3,
        fix_bug: 0.2,
        optimize_performance: 0.1,
        audit_security: 0.1,
        manage_dependencies: 0.1,
        coordinate_workflow: 0.0,
        facilitate_learning: 0.0
      },
      performance_optimizer: {
        optimize_performance: 1.0,
        analyze_code: 0.8,
        refactor_code: 0.7,
        audit_security: 0.4,
        fix_bug: 0.4,
        generate_tests: 0.3,
        write_documentation: 0.2,
        manage_dependencies: 0.2,
        coordinate_workflow: 0.0,
        facilitate_learning: 0.0
      },
      security_auditor: {
        audit_security: 1.0,
        analyze_code: 0.8,
        fix_bug: 0.6,
        optimize_performance: 0.4,
        refactor_code: 0.4,
        generate_tests: 0.3,
        write_documentation: 0.2,
        manage_dependencies: 0.3,
        coordinate_workflow: 0.0,
        facilitate_learning: 0.0
      },
      dependency_manager: {
        manage_dependencies: 1.0,
        analyze_code: 0.5,
        audit_security: 0.6,
        fix_bug: 0.3,
        optimize_performance: 0.3,
        refactor_code: 0.2,
        generate_tests: 0.2,
        write_documentation: 0.2,
        coordinate_workflow: 0.1,
        facilitate_learning: 0.0
      },
      workflow_coordinator: {
        coordinate_workflow: 1.0,
        manage_dependencies: 0.4,
        analyze_code: 0.3,
        fix_bug: 0.2,
        refactor_code: 0.2,
        generate_tests: 0.2,
        optimize_performance: 0.2,
        audit_security: 0.2,
        write_documentation: 0.1,
        facilitate_learning: 0.3
      },
      learning_facilitator: {
        facilitate_learning: 1.0,
        analyze_code: 0.4,
        coordinate_workflow: 0.3,
        write_documentation: 0.3,
        fix_bug: 0.2,
        refactor_code: 0.2,
        generate_tests: 0.2,
        optimize_performance: 0.1,
        audit_security: 0.1,
        manage_dependencies: 0.1
      }
    };

    return compatibilityMap[agentType]?.[taskType] || 0;
  }

  private async executeTask(task: AgentTask): Promise<void> {
    const agent = this.agents.get(task.agentId);
    if (!agent) return;

    task.status = 'in_progress';
    task.startedAt = new Date();

    this.emit('taskStarted', { taskId: task.id, agentId: agent.id });

    try {
      // Simulate task execution based on type
      const result = await this.performTaskExecution(task, agent);

      task.output = result;
      task.status = 'completed';
      task.completedAt = new Date();
      task.actualDuration = task.completedAt.getTime() - task.startedAt!.getTime();

      // Update agent performance
      agent.performance.tasksCompleted++;
      agent.performance.tasksSuccessful++;
      agent.performance.averageCompletionTime = this.updateAverage(
        agent.performance.averageCompletionTime,
        task.actualDuration,
        agent.performance.tasksCompleted
      );

      agent.performance.successRate = agent.performance.tasksSuccessful / agent.performance.tasksCompleted;

      // Learn from the task
      if (agent.configuration.learningEnabled) {
        await this.recordTaskLearning(task, agent, 'success');
      }

      // Update agent status
      this.updateAgentStatus(agent);

      this.emit('taskCompleted', { taskId: task.id, agentId: agent.id, result });

    } catch (error) {
      task.status = 'failed';
      task.completedAt = new Date();

      agent.performance.tasksCompleted++;
      agent.performance.tasksFailed++;
      agent.performance.successRate = agent.performance.tasksSuccessful / agent.performance.tasksCompleted;

      if (agent.configuration.learningEnabled) {
        await this.recordTaskLearning(task, agent, 'failure');
      }

      this.updateAgentStatus(agent);

      this.emit('taskFailed', {
        taskId: task.id,
        agentId: agent.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async performTaskExecution(task: AgentTask, agent: Agent): Promise<any> {
    // Simulate different task types
    const executionTime = Math.random() * 5000 + 1000; // 1-6 seconds

    await new Promise(resolve => setTimeout(resolve, executionTime));

    switch (task.type) {
      case 'analyze_code':
        return {
          analysis: 'Code analysis completed',
          issues: Math.floor(Math.random() * 5),
          suggestions: ['Improve variable naming', 'Add error handling']
        };

      case 'fix_bug':
        return {
          fixed: Math.random() > 0.2, // 80% success rate
          changes: ['Added null check', 'Fixed type error'],
          confidence: Math.random() * 0.3 + 0.7
        };

      case 'generate_tests':
        return {
          testsGenerated: Math.floor(Math.random() * 10) + 5,
          coverage: Math.random() * 0.3 + 0.7,
          testTypes: ['unit', 'integration']
        };

      default:
        return { completed: true, message: `${task.type} task completed` };
    }
  }

  private updateAverage(currentAvg: number, newValue: number, count: number): number {
    return ((currentAvg * (count - 1)) + newValue) / count;
  }

  private async recordTaskLearning(
    task: AgentTask,
    agent: Agent,
    outcome: 'success' | 'failure'
  ): Promise<void> {
    await adaptiveLearningEngine.learnFromInteraction(
      {
        taskType: task.type,
        input: task.input,
        output: task.output,
        duration: task.actualDuration,
        agentCapabilities: agent.capabilities
      },
      {
        userId: task.context.userId,
        projectId: task.context.projectId,
        sessionId: task.context.sessionId,
        taskType: task.type,
        codeLanguage: task.context.codeLanguage,
        frameworks: task.context.frameworks,
        fileTypes: [],
        complexity: task.context.complexity,
        timestamp: new Date()
      },
      outcome,
      {
        agentId: agent.id,
        agentType: agent.type,
        confidence: agent.capabilities.find(c => c.name === task.type)?.confidence || 0.5
      }
    );
  }

  private updateAgentStatus(agent: Agent): void {
    const activeTasks = Array.from(this.tasks.values())
      .filter(t => t.agentId === agent.id && ['assigned', 'in_progress'].includes(t.status));

    if (activeTasks.length === 0) {
      agent.status = 'idle';
    } else if (activeTasks.length >= agent.configuration.maxConcurrentTasks) {
      agent.status = 'busy';
    }

    agent.lastActive = new Date();
  }

  private async performCoordination(): Promise<void> {
    // Apply coordination rules
    for (const rule of this.coordinationRules.values()) {
      if (rule.enabled) {
        try {
          const shouldApply = await this.evaluateCoordinationRule(rule);
          if (shouldApply) {
            await this.applyCoordinationRule(rule);
            rule.statistics.triggered++;
            rule.statistics.lastTriggered = new Date();
          }
        } catch (error) {
          rule.statistics.failed++;
        }
      }
    }

    // Check for team formation opportunities
    await this.checkTeamFormation();

    // Monitor task dependencies
    await this.monitorTaskDependencies();
  }

  private async evaluateCoordinationRule(rule: CoordinationRule): Promise<boolean> {
    switch (rule.condition.type) {
      case 'agent_overload':
        return this.checkAgentOverload(rule.condition.parameters);
      case 'performance_threshold':
        return this.checkPerformanceThreshold(rule.condition.parameters);
      case 'capability_match':
        return this.checkCapabilityMatch(rule.condition.parameters);
      default:
        return false;
    }
  }

  private checkAgentOverload(parameters: Record<string, any>): boolean {
    const { maxTasksThreshold, overloadDuration } = parameters;
    const now = Date.now();

    for (const agent of this.agents.values()) {
      const activeTasks = Array.from(this.tasks.values())
        .filter(t => t.agentId === agent.id && ['assigned', 'in_progress'].includes(t.status));

      if (activeTasks.length > maxTasksThreshold) {
        const oldestTask = activeTasks.sort((a, b) => a.assignedAt.getTime() - b.assignedAt.getTime())[0];
        if (now - oldestTask.assignedAt.getTime() > overloadDuration) {
          return true;
        }
      }
    }

    return false;
  }

  private checkPerformanceThreshold(parameters: Record<string, any>): boolean {
    const { failureRate, timeWindow } = parameters;
    const cutoffTime = new Date(Date.now() - timeWindow);

    for (const agent of this.agents.values()) {
      const recentTasks = Array.from(this.tasks.values())
        .filter(t => t.agentId === agent.id && t.completedAt && t.completedAt > cutoffTime);

      if (recentTasks.length > 0) {
        const failedTasks = recentTasks.filter(t => t.status === 'failed');
        const currentFailureRate = failedTasks.length / recentTasks.length;

        if (currentFailureRate > failureRate) {
          return true;
        }
      }
    }

    return false;
  }

  private checkCapabilityMatch(parameters: Record<string, any>): boolean {
    const { complexity, confidence } = parameters;

    const complexTasks = Array.from(this.tasks.values())
      .filter(t => t.status === 'pending' && t.context.complexity === complexity);

    for (const task of complexTasks) {
      const bestAgent = Array.from(this.agents.values())
        .map(agent => ({ agent, score: this.calculateAgentScore(agent, task) }))
        .sort((a, b) => b.score - a.score)[0];

      if (!bestAgent || bestAgent.score < confidence) {
        return true;
      }
    }

    return false;
  }

  private async applyCoordinationRule(rule: CoordinationRule): Promise<void> {
    switch (rule.action.type) {
      case 'redistribute_tasks':
        await this.redistributeTasks(rule.action.parameters);
        break;
      case 'request_assistance':
        await this.requestAssistance(rule.action.parameters);
        break;
      case 'escalate':
        await this.escalateIssue(rule.action.parameters);
        break;
      case 'notify_user':
        await this.notifyUser(rule.action.parameters);
        break;
    }

    rule.statistics.successful++;
  }

  private async redistributeTasks(parameters: Record<string, any>): Promise<void> {
    // Implementation for task redistribution
    this.emit('tasksRedistributed', { parameters });
  }

  private async requestAssistance(parameters: Record<string, any>): Promise<void> {
    // Implementation for assistance requests
    this.emit('assistanceRequested', { parameters });
  }

  private async escalateIssue(parameters: Record<string, any>): Promise<void> {
    // Implementation for issue escalation
    this.emit('issueEscalated', { parameters });
  }

  private async notifyUser(parameters: Record<string, any>): Promise<void> {
    // Implementation for user notifications
    this.emit('userNotified', { parameters });
  }

  private async checkTeamFormation(): Promise<void> {
    // Look for tasks that would benefit from team collaboration
    const complexTasks = Array.from(this.tasks.values())
      .filter(t => t.status === 'pending' && t.context.complexity === 'complex');

    for (const task of complexTasks) {
      const potentialTeam = await this.identifyPotentialTeam(task);
      if (potentialTeam.length > 1) {
        await this.formTeam(task, potentialTeam);
      }
    }
  }

  private async identifyPotentialTeam(task: AgentTask): Promise<Agent[]> {
    // Identify agents that could work together on the task
    return Array.from(this.agents.values())
      .filter(agent => this.calculateAgentScore(agent, task) > 0.3)
      .sort((a, b) => this.calculateAgentScore(b, task) - this.calculateAgentScore(a, task))
      .slice(0, 3); // Maximum team of 3
  }

  private async formTeam(task: AgentTask, agents: Agent[]): Promise<string> {
    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const team: TeamFormation = {
      id: teamId,
      name: `Team for ${task.type}`,
      description: `Collaborative team for task: ${task.description}`,
      agents: agents.map(a => a.id),
      leader: agents[0].id, // Best scoring agent is leader
      objective: task.description,
      status: 'forming',
      performance: {
        tasksCompleted: 0,
        averageCompletionTime: 0,
        successRate: 1.0,
        synergy: 0.5,
        efficiency: 1.0
      },
      created: new Date()
    };

    this.teams.set(teamId, team);
    this.emit('teamFormed', { teamId, task: task.id, agents: team.agents });

    return teamId;
  }

  private async monitorTaskDependencies(): Promise<void> {
    const pendingTasks = Array.from(this.tasks.values())
      .filter(t => t.status === 'pending' || t.status === 'blocked');

    for (const task of pendingTasks) {
      const dependenciesMet = await this.checkTaskDependencies(task);
      if (dependenciesMet && task.status === 'blocked') {
        task.status = 'pending';
        this.emit('taskUnblocked', { taskId: task.id });
      }
    }
  }

  private async checkTaskDependencies(task: AgentTask): Promise<boolean> {
    return task.dependencies.every(depId => {
      const depTask = this.tasks.get(depId);
      return depTask && depTask.status === 'completed';
    });
  }

  private async processCommunications(): Promise<void> {
    const unreadMessages = Array.from(this.communications.values())
      .filter(msg => !msg.read)
      .sort((a, b) => b.priority.localeCompare(a.priority));

    for (const message of unreadMessages) {
      await this.processMessage(message);
    }
  }

  private async processMessage(message: AgentCommunication): Promise<void> {
    message.read = true;

    switch (message.type) {
      case 'request_assistance':
        await this.handleAssistanceRequest(message);
        break;
      case 'share_knowledge':
        await this.handleKnowledgeSharing(message);
        break;
      case 'report_progress':
        await this.handleProgressReport(message);
        break;
      case 'escalate_issue':
        await this.handleEscalation(message);
        break;
    }

    this.emit('messageProcessed', { messageId: message.id, type: message.type });
  }

  private async handleAssistanceRequest(message: AgentCommunication): Promise<void> {
    // Find available agents to assist
    const availableAgents = Array.from(this.agents.values())
      .filter(agent => agent.id !== message.fromAgentId && agent.status === 'idle');

    if (availableAgents.length > 0) {
      const assistant = availableAgents[0];

      const response: AgentResponse = {
        id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalMessageId: message.id,
        agentId: assistant.id,
        type: 'acceptance',
        content: { willing: true, availability: 'immediate' },
        timestamp: new Date()
      };

      message.response = response;
      message.acknowledged = true;
    }
  }

  private async handleKnowledgeSharing(message: AgentCommunication): Promise<void> {
    // Store shared knowledge in memory system
    await agentMemorySystem.storeMemory({
      type: 'pattern',
      content: message.content,
      metadata: {
        created: new Date(),
        updated: new Date(),
        source: `agent_${message.fromAgentId}`,
        context: {
          files: [],
          functions: [],
          variables: [],
          frameworks: [],
          language: 'unknown',
          taskType: 'knowledge_sharing'
        },
        importance: 0.7,
        volatility: 'permanent'
      },
      embeddings: [],
      tags: ['shared_knowledge', 'agent_communication'],
      relationships: [],
      confidence: 0.8
    });
  }

  private async handleProgressReport(message: AgentCommunication): Promise<void> {
    // Update task progress if applicable
    const taskId = message.content.taskId;
    const task = this.tasks.get(taskId);

    if (task && task.agentId === message.fromAgentId) {
      // Update task progress
      this.emit('taskProgressUpdated', { taskId, progress: message.content.progress });
    }
  }

  private async handleEscalation(message: AgentCommunication): Promise<void> {
    // Notify user of escalated issue
    this.emit('issueEscalated', {
      agentId: message.fromAgentId,
      issue: message.content,
      priority: message.priority
    });
  }

  private async monitorPerformance(): Promise<void> {
    // Update agent performance metrics
    for (const agent of this.agents.values()) {
      agent.performance.lastEvaluated = new Date();

      // Calculate efficiency based on recent tasks
      const recentTasks = Array.from(this.tasks.values())
        .filter(t => t.agentId === agent.id && t.completedAt &&
          t.completedAt > new Date(Date.now() - 3600000)); // Last hour

      if (recentTasks.length > 0) {
        const avgActualTime = recentTasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0) / recentTasks.length;
        const avgEstimatedTime = recentTasks.reduce((sum, t) => sum + (t.estimatedDuration || avgActualTime), 0) / recentTasks.length;

        agent.performance.efficiency = Math.min(1, avgEstimatedTime / avgActualTime);
      }

      agent.metadata.experience += 2; // 2 minutes of experience
    }

    // Update system metrics
    const metrics = this.calculateSystemMetrics();
    this.emit('performanceUpdated', { metrics });
  }

  private calculateSystemMetrics(): CoordinationMetrics {
    const totalTasks = this.tasks.size;
    const completedTasks = Array.from(this.tasks.values())
      .filter(t => t.status === 'completed').length;

    const activeTasks = Array.from(this.tasks.values())
      .filter(t => ['assigned', 'in_progress'].includes(t.status));

    const completedTasksWithDuration = Array.from(this.tasks.values())
      .filter(t => t.status === 'completed' && t.actualDuration);

    const averageTaskTime = completedTasksWithDuration.length > 0
      ? completedTasksWithDuration.reduce((sum, t) => sum + (t.actualDuration || 0), 0) / completedTasksWithDuration.length
      : 0;

    const activeAgents = Array.from(this.agents.values())
      .filter(a => a.status !== 'disabled').length;

    return {
      totalAgents: this.agents.size,
      activeAgents,
      totalTasks,
      completedTasks,
      averageTaskTime,
      systemEfficiency: totalTasks > 0 ? completedTasks / totalTasks : 1,
      communicationVolume: this.communications.size,
      coordinationOverhead: 0.1 // Placeholder
    };
  }

  // Public API methods
  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getTasks(filter?: { status?: TaskStatus; agentId?: string }): AgentTask[] {
    let tasks = Array.from(this.tasks.values());

    if (filter?.status) {
      tasks = tasks.filter(t => t.status === filter.status);
    }

    if (filter?.agentId) {
      tasks = tasks.filter(t => t.agentId === filter.agentId);
    }

    return tasks.sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime());
  }

  getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  async sendMessage(
    fromAgentId: string,
    toAgentId: string | undefined,
    type: CommunicationType,
    subject: string,
    content: any,
    priority: MessagePriority = 'normal'
  ): Promise<string> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const message: AgentCommunication = {
      id: messageId,
      fromAgentId,
      toAgentId,
      type,
      subject,
      content,
      priority,
      timestamp: new Date(),
      read: false,
      acknowledged: false
    };

    this.communications.set(messageId, message);
    this.emit('messageSent', { messageId, message });

    return messageId;
  }

  getSystemMetrics(): CoordinationMetrics {
    return this.calculateSystemMetrics();
  }

  getTeams(): TeamFormation[] {
    return Array.from(this.teams.values());
  }

  getCoordinationRules(): CoordinationRule[] {
    return Array.from(this.coordinationRules.values());
  }

  async pauseAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = 'disabled';
      this.emit('agentPaused', { agentId });
    }
  }

  async resumeAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = 'idle';
      this.emit('agentResumed', { agentId });
    }
  }

  async cancelTask(taskId: string, reason?: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task && ['pending', 'assigned', 'in_progress'].includes(task.status)) {
      task.status = 'cancelled';
      task.completedAt = new Date();

      const agent = this.agents.get(task.agentId);
      if (agent) {
        this.updateAgentStatus(agent);
      }

      this.emit('taskCancelled', { taskId, reason });
    }
  }
}

export const agentCoordinationHub = new AgentCoordinationHub();
export default agentCoordinationHub;