import { EventEmitter } from '../../utils/EventEmitter';
import { agentOrchestrator, Agent, Task, TaskResult } from './AgentOrchestrator';
import { taskPlanner, TaskPlan } from './TaskPlanner';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'task' | 'condition' | 'loop' | 'parallel' | 'agent_call' | 'human_input' | 'wait';
  config: WorkflowStepConfig;
  dependencies: string[];
  outputs: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export interface WorkflowStepConfig {
  // For task type
  taskType?: string;
  taskDescription?: string;
  requiredCapabilities?: string[];

  // For condition type
  condition?: string; // JavaScript expression
  trueNext?: string;
  falseNext?: string;

  // For loop type
  loopCondition?: string;
  loopBody?: string[];
  maxIterations?: number;

  // For parallel type
  parallelSteps?: string[];
  waitForAll?: boolean;

  // For agent_call type
  agentType?: string;
  agentMethod?: string;
  agentParams?: Record<string, any>;

  // For human_input type
  inputPrompt?: string;
  inputType?: 'text' | 'choice' | 'file' | 'confirmation';
  choices?: string[];

  // For wait type
  waitDuration?: number; // milliseconds
  waitCondition?: string;

  // Common config
  timeout?: number;
  retryCount?: number;
  onError?: 'fail' | 'skip' | 'retry';
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
  steps: WorkflowStep[];
  variables: Record<string, any>;
  configuration: {
    timeout: number;
    maxRetries: number;
    parallelism: number;
    errorHandling: 'fail_fast' | 'continue' | 'collect_errors';
  };
  triggers: WorkflowTrigger[];
  schedule?: WorkflowSchedule;
  status: 'draft' | 'active' | 'paused' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  executionHistory: WorkflowExecution[];
}

export interface WorkflowTrigger {
  id: string;
  type: 'manual' | 'event' | 'webhook' | 'schedule' | 'file_change' | 'git_event';
  config: {
    eventType?: string;
    eventPattern?: Record<string, any>;
    webhookUrl?: string;
    filePatterns?: string[];
    gitBranch?: string;
    gitEvent?: 'push' | 'pull_request' | 'merge';
  };
  enabled: boolean;
}

export interface WorkflowSchedule {
  type: 'interval' | 'cron' | 'once';
  expression: string; // cron expression or interval
  timezone?: string;
  enabled: boolean;
  nextRun?: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  trigger: {
    type: string;
    source: string;
    data?: Record<string, any>;
  };
  stepExecutions: StepExecution[];
  outputs: Record<string, any>;
  errors: WorkflowError[];
  context: Record<string, any>;
}

export interface StepExecution {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  logs: LogEntry[];
  error?: string;
  retryCount: number;
}

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, any>;
}

export interface WorkflowError {
  stepId: string;
  message: string;
  stack?: string;
  timestamp: Date;
  recoverable: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'executionHistory'>;
  popularity: number;
  rating: number;
  downloads: number;
}

class WorkflowEngineService extends EventEmitter {
  private workflows = new Map<string, Workflow>();
  private executions = new Map<string, WorkflowExecution>();
  private templates = new Map<string, WorkflowTemplate>();
  private activeExecutions = new Set<string>();

  constructor() {
    super();
    this.initializeDefaultTemplates();
  }

  // Workflow Management
  async createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'executionHistory'>): Promise<Workflow> {
    const id = this.generateId('workflow');
    const now = new Date();

    const newWorkflow: Workflow = {
      ...workflow,
      id,
      createdAt: now,
      updatedAt: now,
      executionHistory: []
    };

    await this.validateWorkflow(newWorkflow);
    this.workflows.set(id, newWorkflow);

    this.emit('workflow:created', newWorkflow);
    return newWorkflow;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }

    const updated = {
      ...workflow,
      ...updates,
      updatedAt: new Date()
    };

    await this.validateWorkflow(updated);
    this.workflows.set(id, updated);

    this.emit('workflow:updated', updated);
    return updated;
  }

  deleteWorkflow(id: string): boolean {
    const workflow = this.workflows.get(id);
    if (!workflow) return false;

    // Cancel any running executions
    workflow.executionHistory
      .filter(exec => exec.status === 'running')
      .forEach(exec => this.cancelExecution(exec.id));

    this.workflows.delete(id);
    this.emit('workflow:deleted', { id, workflow });
    return true;
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  // Workflow Execution
  async executeWorkflow(
    workflowId: string,
    trigger: WorkflowExecution['trigger'],
    context: Record<string, any> = {}
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (workflow.status !== 'active') {
      throw new Error(`Workflow ${workflowId} is not active (status: ${workflow.status})`);
    }

    const executionId = this.generateId('execution');
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'running',
      startTime: new Date(),
      trigger,
      stepExecutions: workflow.steps.map(step => ({
        stepId: step.id,
        status: 'pending',
        inputs: {},
        outputs: {},
        logs: [],
        retryCount: 0
      })),
      outputs: {},
      errors: [],
      context
    };

    this.executions.set(executionId, execution);
    this.activeExecutions.add(executionId);
    workflow.executionHistory.push(execution);

    this.emit('execution:started', execution);

    // Execute workflow asynchronously
    this.executeWorkflowSteps(execution, workflow).catch(error => {
      this.handleExecutionError(execution, error);
    });

    return execution;
  }

  private async executeWorkflowSteps(execution: WorkflowExecution, workflow: Workflow): Promise<void> {
    try {
      const stepMap = new Map(workflow.steps.map(step => [step.id, step]));
      const completed = new Set<string>();
      const running = new Set<string>();

      // Find initial steps (no dependencies)
      let nextSteps = workflow.steps.filter(step =>
        step.dependencies.length === 0 || step.dependencies.every(dep => completed.has(dep))
      );

      while (nextSteps.length > 0 || running.size > 0) {
        // Start new steps that are ready
        const toStart = nextSteps.slice(0, workflow.configuration.parallelism - running.size);

        for (const step of toStart) {
          running.add(step.id);
          this.executeStep(execution, step, workflow).then(() => {
            running.delete(step.id);
            completed.add(step.id);

            // Find next steps that are now ready
            const newlyReady = workflow.steps.filter(s =>
              !completed.has(s.id) &&
              !running.has(s.id) &&
              s.dependencies.every(dep => completed.has(dep))
            );

            nextSteps.push(...newlyReady);
          }).catch(error => {
            running.delete(step.id);
            this.handleStepError(execution, step, error);
          });
        }

        nextSteps = nextSteps.slice(toStart.length);

        // Wait a bit before checking again
        if (nextSteps.length === 0 && running.size > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // All steps completed
      execution.status = 'completed';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

      this.activeExecutions.delete(execution.id);
      this.emit('execution:completed', execution);

    } catch (error) {
      this.handleExecutionError(execution, error);
    }
  }

  private async executeStep(
    execution: WorkflowExecution,
    step: WorkflowStep,
    workflow: Workflow
  ): Promise<void> {
    const stepExecution = execution.stepExecutions.find(se => se.stepId === step.id);
    if (!stepExecution) return;

    stepExecution.status = 'running';
    stepExecution.startTime = new Date();
    stepExecution.inputs = this.resolveStepInputs(step, execution);

    this.addLog(stepExecution, 'info', `Starting step: ${step.name}`);
    this.emit('step:started', { execution, step, stepExecution });

    try {
      const result = await this.executeStepByType(step, stepExecution, execution, workflow);

      stepExecution.outputs = result.outputs || {};
      stepExecution.status = 'completed';
      stepExecution.endTime = new Date();
      stepExecution.duration = stepExecution.endTime.getTime() - (stepExecution.startTime?.getTime() || 0);

      this.addLog(stepExecution, 'info', `Step completed successfully`);
      this.emit('step:completed', { execution, step, stepExecution });

    } catch (error) {
      stepExecution.error = error instanceof Error ? error.message : String(error);
      stepExecution.status = 'failed';
      stepExecution.endTime = new Date();
      stepExecution.duration = stepExecution.endTime.getTime() - (stepExecution.startTime?.getTime() || 0);

      this.addLog(stepExecution, 'error', `Step failed: ${stepExecution.error}`);

      if (step.config.onError === 'retry' && stepExecution.retryCount < (step.config.retryCount || 0)) {
        stepExecution.retryCount++;
        this.addLog(stepExecution, 'info', `Retrying step (attempt ${stepExecution.retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return this.executeStep(execution, step, workflow);
      }

      if (step.config.onError === 'skip') {
        stepExecution.status = 'skipped';
        this.addLog(stepExecution, 'warn', `Step skipped due to error`);
        return;
      }

      throw error;
    }
  }

  private async executeStepByType(
    step: WorkflowStep,
    stepExecution: StepExecution,
    execution: WorkflowExecution,
    workflow: Workflow
  ): Promise<{ outputs?: Record<string, any> }> {
    switch (step.type) {
      case 'task':
        return this.executeTaskStep(step, stepExecution, execution);

      case 'condition':
        return this.executeConditionStep(step, stepExecution, execution);

      case 'loop':
        return this.executeLoopStep(step, stepExecution, execution, workflow);

      case 'parallel':
        return this.executeParallelStep(step, stepExecution, execution, workflow);

      case 'agent_call':
        return this.executeAgentCallStep(step, stepExecution, execution);

      case 'human_input':
        return this.executeHumanInputStep(step, stepExecution, execution);

      case 'wait':
        return this.executeWaitStep(step, stepExecution, execution);

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeTaskStep(
    step: WorkflowStep,
    stepExecution: StepExecution,
    execution: WorkflowExecution
  ): Promise<{ outputs: Record<string, any> }> {
    const { taskType, taskDescription, requiredCapabilities } = step.config;

    if (!taskDescription) {
      throw new Error('Task step requires taskDescription');
    }

    // Create task through orchestrator
    const taskId = await agentOrchestrator.createTask({
      type: taskType as any || 'code_generation',
      description: taskDescription,
      context: {
        workflowExecutionId: execution.id,
        stepId: step.id,
        ...execution.context
      },
      priority: 'medium',
      requiredCapabilities: requiredCapabilities || []
    });

    const result = await agentOrchestrator.executeTask(taskId);

    if (!result.success) {
      throw new Error(`Task failed: ${result.errors?.join(', ') || 'Unknown error'}`);
    }

    return {
      outputs: {
        taskResult: result.data,
        taskId,
        modifiedFiles: result.modifiedFiles || [],
        duration: result.executionTime || 0
      }
    };
  }

  private async executeConditionStep(
    step: WorkflowStep,
    stepExecution: StepExecution,
    execution: WorkflowExecution
  ): Promise<{ outputs: Record<string, any> }> {
    const { condition } = step.config;

    if (!condition) {
      throw new Error('Condition step requires condition expression');
    }

    // Simple JavaScript expression evaluation
    // In production, use a safer expression evaluator
    const context = {
      ...execution.context,
      ...stepExecution.inputs,
      previousOutputs: this.getPreviousOutputs(step, execution)
    };

    try {
      const func = new Function(...Object.keys(context), `return ${condition}`);
      const result = func(...Object.values(context));

      return {
        outputs: {
          conditionResult: Boolean(result),
          nextStep: result ? step.config.trueNext : step.config.falseNext
        }
      };
    } catch (error) {
      throw new Error(`Condition evaluation failed: ${error}`);
    }
  }

  private async executeLoopStep(
    step: WorkflowStep,
    stepExecution: StepExecution,
    execution: WorkflowExecution,
    workflow: Workflow
  ): Promise<{ outputs: Record<string, any> }> {
    const { loopCondition, loopBody, maxIterations = 10 } = step.config;

    if (!loopCondition || !loopBody) {
      throw new Error('Loop step requires loopCondition and loopBody');
    }

    const results = [];
    let iterations = 0;

    while (iterations < maxIterations) {
      // Evaluate loop condition
      const context = {
        ...execution.context,
        ...stepExecution.inputs,
        iteration: iterations,
        previousResults: results
      };

      const func = new Function(...Object.keys(context), `return ${loopCondition}`);
      const shouldContinue = func(...Object.values(context));

      if (!shouldContinue) break;

      // Execute loop body steps
      const bodyResults = [];
      for (const bodyStepId of loopBody) {
        const bodyStep = workflow.steps.find(s => s.id === bodyStepId);
        if (!bodyStep) continue;

        const bodyResult = await this.executeStepByType(bodyStep, stepExecution, execution, workflow);
        bodyResults.push(bodyResult);
      }

      results.push(bodyResults);
      iterations++;
    }

    return {
      outputs: {
        iterations,
        results,
        completed: iterations < maxIterations
      }
    };
  }

  private async executeParallelStep(
    step: WorkflowStep,
    stepExecution: StepExecution,
    execution: WorkflowExecution,
    workflow: Workflow
  ): Promise<{ outputs: Record<string, any> }> {
    const { parallelSteps, waitForAll = true } = step.config;

    if (!parallelSteps || parallelSteps.length === 0) {
      throw new Error('Parallel step requires parallelSteps array');
    }

    const stepPromises = parallelSteps.map(async (parallelStepId) => {
      const parallelStep = workflow.steps.find(s => s.id === parallelStepId);
      if (!parallelStep) {
        throw new Error(`Parallel step not found: ${parallelStepId}`);
      }

      try {
        return await this.executeStepByType(parallelStep, stepExecution, execution, workflow);
      } catch (error) {
        if (waitForAll) {
          throw error;
        }
        return { error: error instanceof Error ? error.message : String(error) };
      }
    });

    const results = await Promise.all(stepPromises);

    return {
      outputs: {
        parallelResults: results,
        successCount: results.filter(r => !r.error).length,
        errorCount: results.filter(r => r.error).length
      }
    };
  }

  private async executeAgentCallStep(
    step: WorkflowStep,
    stepExecution: StepExecution,
    execution: WorkflowExecution
  ): Promise<{ outputs: Record<string, any> }> {
    const { agentType, agentMethod, agentParams = {} } = step.config;

    if (!agentType) {
      throw new Error('Agent call step requires agentType');
    }

    // Get agent from orchestrator
    const agents = agentOrchestrator.getActiveAgents();
    const agent = agents.find(a => a.type === agentType);

    if (!agent) {
      throw new Error(`Agent type not found: ${agentType}`);
    }

    // Call agent method
    const method = agentMethod || 'execute';
    const agentInstance = agent.instance as any;

    if (typeof agentInstance[method] !== 'function') {
      throw new Error(`Agent method not found: ${agentType}.${method}`);
    }

    const result = await agentInstance[method]({
      ...agentParams,
      context: execution.context,
      stepInputs: stepExecution.inputs
    });

    return {
      outputs: {
        agentResult: result,
        agentType,
        agentMethod
      }
    };
  }

  private async executeHumanInputStep(
    step: WorkflowStep,
    stepExecution: StepExecution,
    execution: WorkflowExecution
  ): Promise<{ outputs: Record<string, any> }> {
    const { inputPrompt, inputType = 'text', choices } = step.config;

    if (!inputPrompt) {
      throw new Error('Human input step requires inputPrompt');
    }

    // Emit event for human input request
    this.emit('human_input:required', {
      executionId: execution.id,
      stepId: step.id,
      prompt: inputPrompt,
      type: inputType,
      choices
    });

    // Wait for human input (this would be handled by UI)
    const inputResult = await this.waitForHumanInput(execution.id, step.id);

    return {
      outputs: {
        userInput: inputResult.value,
        inputType,
        timestamp: new Date()
      }
    };
  }

  private async executeWaitStep(
    step: WorkflowStep,
    stepExecution: StepExecution,
    execution: WorkflowExecution
  ): Promise<{ outputs: Record<string, any> }> {
    const { waitDuration, waitCondition } = step.config;

    if (waitDuration) {
      await new Promise(resolve => setTimeout(resolve, waitDuration));
    } else if (waitCondition) {
      // Wait for condition to be true
      let elapsed = 0;
      const checkInterval = 1000; // 1 second
      const maxWait = step.config.timeout || 300000; // 5 minutes

      while (elapsed < maxWait) {
        const context = {
          ...execution.context,
          ...stepExecution.inputs,
          elapsed
        };

        const func = new Function(...Object.keys(context), `return ${waitCondition}`);
        const conditionMet = func(...Object.values(context));

        if (conditionMet) break;

        await new Promise(resolve => setTimeout(resolve, checkInterval));
        elapsed += checkInterval;
      }

      if (elapsed >= maxWait) {
        throw new Error('Wait condition timeout');
      }
    }

    return {
      outputs: {
        waitCompleted: true,
        waitDuration: waitDuration,
        actualWaitTime: Date.now() - (stepExecution.startTime?.getTime() || Date.now())
      }
    };
  }

  private resolveStepInputs(step: WorkflowStep, execution: WorkflowExecution): Record<string, any> {
    const inputs: Record<string, any> = { ...execution.context };

    // Add outputs from dependency steps
    for (const depId of step.dependencies) {
      const depExecution = execution.stepExecutions.find(se => se.stepId === depId);
      if (depExecution && depExecution.outputs) {
        inputs[`${depId}_output`] = depExecution.outputs;
      }
    }

    return inputs;
  }

  private getPreviousOutputs(step: WorkflowStep, execution: WorkflowExecution): Record<string, any> {
    const outputs: Record<string, any> = {};

    for (const depId of step.dependencies) {
      const depExecution = execution.stepExecutions.find(se => se.stepId === depId);
      if (depExecution && depExecution.outputs) {
        outputs[depId] = depExecution.outputs;
      }
    }

    return outputs;
  }

  private addLog(stepExecution: StepExecution, level: LogEntry['level'], message: string, data?: Record<string, any>): void {
    stepExecution.logs.push({
      timestamp: new Date(),
      level,
      message,
      data
    });
  }

  private async waitForHumanInput(executionId: string, stepId: string): Promise<{ value: any }> {
    // This would be implemented with actual UI interaction
    // For now, return a placeholder
    return new Promise((resolve) => {
      // In real implementation, this would wait for UI input
      setTimeout(() => {
        resolve({ value: 'mock_user_input' });
      }, 1000);
    });
  }

  private handleExecutionError(execution: WorkflowExecution, error: any): void {
    execution.status = 'failed';
    execution.endTime = new Date();
    execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
    execution.errors.push({
      stepId: 'workflow',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date(),
      recoverable: false
    });

    this.activeExecutions.delete(execution.id);
    this.emit('execution:failed', execution);
  }

  private handleStepError(execution: WorkflowExecution, step: WorkflowStep, error: any): void {
    execution.errors.push({
      stepId: step.id,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date(),
      recoverable: step.config.onError !== 'fail'
    });

    if (step.config.onError === 'fail') {
      this.handleExecutionError(execution, error);
    }
  }

  // Execution Management
  getExecution(id: string): WorkflowExecution | undefined {
    return this.executions.get(id);
  }

  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions).map(id => this.executions.get(id)!).filter(Boolean);
  }

  async cancelExecution(id: string): Promise<boolean> {
    const execution = this.executions.get(id);
    if (!execution || execution.status !== 'running') {
      return false;
    }

    execution.status = 'cancelled';
    execution.endTime = new Date();
    execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

    this.activeExecutions.delete(id);
    this.emit('execution:cancelled', execution);
    return true;
  }

  // Validation
  private async validateWorkflow(workflow: Workflow): Promise<void> {
    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepId: string): boolean => {
      if (recursionStack.has(stepId)) return true;
      if (visited.has(stepId)) return false;

      visited.add(stepId);
      recursionStack.add(stepId);

      const step = workflow.steps.find(s => s.id === stepId);
      if (step) {
        for (const dep of step.dependencies) {
          if (hasCycle(dep)) return true;
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    for (const step of workflow.steps) {
      if (hasCycle(step.id)) {
        throw new Error(`Circular dependency detected in workflow: ${workflow.id}`);
      }
    }

    // Validate step references
    const stepIds = new Set(workflow.steps.map(s => s.id));
    for (const step of workflow.steps) {
      for (const dep of step.dependencies) {
        if (!stepIds.has(dep)) {
          throw new Error(`Invalid dependency reference: ${dep} in step ${step.id}`);
        }
      }
    }

    // Validate step configurations
    for (const step of workflow.steps) {
      await this.validateStepConfig(step);
    }
  }

  private async validateStepConfig(step: WorkflowStep): Promise<void> {
    switch (step.type) {
      case 'task':
        if (!step.config.taskDescription) {
          throw new Error(`Task step ${step.id} requires taskDescription`);
        }
        break;

      case 'condition':
        if (!step.config.condition) {
          throw new Error(`Condition step ${step.id} requires condition expression`);
        }
        break;

      case 'loop':
        if (!step.config.loopCondition || !step.config.loopBody) {
          throw new Error(`Loop step ${step.id} requires loopCondition and loopBody`);
        }
        break;

      case 'parallel':
        if (!step.config.parallelSteps || step.config.parallelSteps.length === 0) {
          throw new Error(`Parallel step ${step.id} requires parallelSteps array`);
        }
        break;

      case 'agent_call':
        if (!step.config.agentType) {
          throw new Error(`Agent call step ${step.id} requires agentType`);
        }
        break;

      case 'human_input':
        if (!step.config.inputPrompt) {
          throw new Error(`Human input step ${step.id} requires inputPrompt`);
        }
        break;

      case 'wait':
        if (!step.config.waitDuration && !step.config.waitCondition) {
          throw new Error(`Wait step ${step.id} requires waitDuration or waitCondition`);
        }
        break;
    }
  }

  // Templates
  private initializeDefaultTemplates(): void {
    const templates: WorkflowTemplate[] = [
      {
        id: 'code-review-workflow',
        name: 'Code Review Workflow',
        description: 'Automated code review and feedback workflow',
        category: 'Development',
        popularity: 95,
        rating: 4.8,
        downloads: 1500,
        template: {
          name: 'Code Review Workflow',
          description: 'Automated code review and feedback workflow',
          version: '1.0.0',
          author: 'Ottokode',
          tags: ['code-review', 'automation', 'quality'],
          steps: [
            {
              id: 'analyze-code',
              name: 'Analyze Code Quality',
              description: 'Run static analysis on the code',
              type: 'agent_call',
              config: {
                agentType: 'code_reviewer',
                agentMethod: 'analyzeCode',
                agentParams: { includeStyle: true, includeSecurity: true }
              },
              dependencies: [],
              outputs: {},
              status: 'pending'
            },
            {
              id: 'generate-feedback',
              name: 'Generate Feedback',
              description: 'Generate detailed feedback based on analysis',
              type: 'task',
              config: {
                taskType: 'code_review',
                taskDescription: 'Generate comprehensive code review feedback'
              },
              dependencies: ['analyze-code'],
              outputs: {},
              status: 'pending'
            }
          ],
          variables: {},
          configuration: {
            timeout: 300000,
            maxRetries: 3,
            parallelism: 2,
            errorHandling: 'continue'
          },
          triggers: [],
          status: 'draft'
        }
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  getTemplate(id: string): WorkflowTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  async createWorkflowFromTemplate(templateId: string, customizations?: Partial<Workflow>): Promise<Workflow> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const workflow = {
      ...template.template,
      ...customizations
    };

    return this.createWorkflow(workflow);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  destroy(): void {
    this.workflows.clear();
    this.executions.clear();
    this.templates.clear();
    this.activeExecutions.clear();
    this.removeAllListeners();
  }
}

export const workflowEngine = new WorkflowEngineService();