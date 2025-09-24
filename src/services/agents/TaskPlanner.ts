import { EventEmitter } from '../../utils/EventEmitter';
import { Task, TaskPlan, TaskStep, TaskDependency, RiskLevel, ApprovalPoint, Agent } from './AgentOrchestrator';
import { aiService } from '../ai/ResponsesAIService';

export interface TaskPlanningOptions {
  maxSteps?: number;
  maxParallelTasks?: number;
  riskThreshold?: RiskLevel;
  requireApprovalFor?: string[];
  timeoutMinutes?: number;
  autoOptimize?: boolean;
}

export interface TaskDecompositionRequest {
  originalTask: Task;
  availableAgents: Agent[];
  options?: TaskPlanningOptions;
}

export interface TaskOptimizationSuggestion {
  type: 'parallel_execution' | 'agent_reassignment' | 'dependency_reduction' | 'risk_mitigation';
  description: string;
  impact: 'low' | 'medium' | 'high';
  estimatedSavings: number; // in milliseconds
  requiredChanges: string[];
}

export class TaskPlanner extends EventEmitter {
  private plans: Map<string, TaskPlan> = new Map();
  private planningHistory: TaskPlan[] = [];
  private defaultOptions: TaskPlanningOptions = {
    maxSteps: 20,
    maxParallelTasks: 5,
    riskThreshold: 'medium',
    requireApprovalFor: ['multi_file_operation', 'critical'],
    timeoutMinutes: 30,
    autoOptimize: true
  };

  constructor() {
    super();
  }

  async createTaskPlan(request: TaskDecompositionRequest): Promise<TaskPlan> {
    const { originalTask, availableAgents, options } = request;
    const planningOptions = { ...this.defaultOptions, ...options };

    this.emit('planningStarted', { taskId: originalTask.id });

    try {
      // Step 1: Analyze task complexity and requirements
      const complexity = await this.analyzeTaskComplexity(originalTask);

      // Step 2: Decompose task into steps
      const steps = await this.decomposeTask(originalTask, availableAgents, complexity);

      // Step 3: Identify dependencies between steps
      const dependencies = await this.identifyDependencies(steps, originalTask);

      // Step 4: Assess risks and approval points
      const riskAssessment = await this.assessRisk(steps, originalTask);
      const approvalPoints = await this.identifyApprovalPoints(steps, riskAssessment, planningOptions);

      // Step 5: Estimate total duration
      const estimatedTotalDuration = this.calculateTotalDuration(steps, dependencies);

      // Step 6: Validate plan constraints
      this.validatePlanConstraints(steps, dependencies, planningOptions);

      const plan: TaskPlan = {
        id: this.generatePlanId(),
        originalTask,
        steps,
        estimatedTotalDuration,
        dependencies,
        riskAssessment,
        requiredApprovals: approvalPoints
      };

      // Step 7: Optimize plan if enabled
      if (planningOptions.autoOptimize) {
        await this.optimizePlan(plan, availableAgents);
      }

      this.plans.set(plan.id, plan);
      this.planningHistory.push(plan);

      this.emit('planCreated', { plan });
      return plan;

    } catch (error) {
      this.emit('planningFailed', {
        taskId: originalTask.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async analyzeTaskComplexity(task: Task): Promise<{
    level: 'simple' | 'moderate' | 'complex' | 'advanced';
    factors: string[];
    estimatedSteps: number;
  }> {
    const complexityFactors: string[] = [];
    let estimatedSteps = 1;

    // Analyze task type complexity
    switch (task.type) {
      case 'code_generation':
        estimatedSteps = 2;
        complexityFactors.push('code_generation');
        break;
      case 'multi_file_operation':
        estimatedSteps = 4;
        complexityFactors.push('multi_file_changes');
        break;
      case 'bug_fix':
        estimatedSteps = 3;
        complexityFactors.push('debugging_required');
        break;
      case 'code_review':
        estimatedSteps = 2;
        complexityFactors.push('analysis_intensive');
        break;
    }

    // Analyze context complexity
    if (task.context.files && task.context.files.length > 5) {
      estimatedSteps += 2;
      complexityFactors.push('many_files');
    }

    if (task.context.framework) {
      estimatedSteps += 1;
      complexityFactors.push('framework_specific');
    }

    if (task.dependencies && task.dependencies.length > 0) {
      estimatedSteps += task.dependencies.length;
      complexityFactors.push('has_dependencies');
    }

    // Use AI to analyze description complexity
    try {
      const aiAnalysis = await aiService.complete([{
        role: 'system',
        content: `Analyze the complexity of this software development task. Respond with JSON: {"complexity": "simple|moderate|complex|advanced", "factors": ["factor1", "factor2"], "estimatedSteps": number}`
      }, {
        role: 'user',
        content: `Task: ${task.description}\nType: ${task.type}\nContext: ${JSON.stringify(task.context)}`
      }], {
        model: 'gpt-5',
        temperature: 0.1,
        maxTokens: 200
      });

      const analysis = JSON.parse(aiAnalysis.content);
      return {
        level: analysis.complexity,
        factors: [...complexityFactors, ...analysis.factors],
        estimatedSteps: Math.max(estimatedSteps, analysis.estimatedSteps)
      };
    } catch {
      // Fallback to rule-based analysis
      let level: 'simple' | 'moderate' | 'complex' | 'advanced' = 'simple';
      if (estimatedSteps > 10) level = 'advanced';
      else if (estimatedSteps > 6) level = 'complex';
      else if (estimatedSteps > 3) level = 'moderate';

      return { level, factors: complexityFactors, estimatedSteps };
    }
  }

  private async decomposeTask(
    task: Task,
    availableAgents: Agent[],
    complexity: { level: string; factors: string[]; estimatedSteps: number }
  ): Promise<TaskStep[]> {
    const steps: TaskStep[] = [];

    // Use AI to decompose complex tasks
    try {
      const agentTypes = availableAgents.map(a => a.type).join(', ');

      const decompositionPrompt = `
Decompose this software development task into specific, actionable steps.

Task: ${task.description}
Type: ${task.type}
Priority: ${task.priority}
Context: ${JSON.stringify(task.context)}
Available Agent Types: ${agentTypes}
Complexity: ${complexity.level} (${complexity.factors.join(', ')})

Create a step-by-step plan. Each step should:
1. Be specific and actionable
2. Specify which agent type should handle it
3. Include estimated duration in seconds
4. List required outputs
5. Identify dependencies on other steps

Respond with JSON array of steps:
[
  {
    "id": "step_1",
    "description": "Specific action description",
    "agentType": "agent_type",
    "estimatedDuration": 30000,
    "dependencies": [],
    "outputs": ["output1", "output2"]
  }
]
`;

      const response = await aiService.complete([{
        role: 'user',
        content: decompositionPrompt
      }], {
        model: 'gpt-5',
        temperature: 0.2,
        maxTokens: 2000
      });

      const aiSteps = JSON.parse(response.content);
      steps.push(...aiSteps);

    } catch (error) {
      // Fallback to template-based decomposition
      steps.push(...this.createTemplateSteps(task, availableAgents));
    }

    // Validate and clean up steps
    return this.validateSteps(steps, task);
  }

  private createTemplateSteps(task: Task, availableAgents: Agent[]): TaskStep[] {
    const steps: TaskStep[] = [];

    switch (task.type) {
      case 'code_generation':
        steps.push({
          id: 'analyze_requirements',
          description: 'Analyze requirements and plan code structure',
          agentType: 'code_generator',
          estimatedDuration: 15000,
          dependencies: [],
          outputs: ['requirements_analysis', 'code_structure']
        });

        steps.push({
          id: 'generate_code',
          description: 'Generate the requested code',
          agentType: 'code_generator',
          estimatedDuration: 30000,
          dependencies: ['analyze_requirements'],
          outputs: ['generated_code']
        });

        if (availableAgents.some(a => a.type === 'code_reviewer')) {
          steps.push({
            id: 'review_code',
            description: 'Review generated code for quality and best practices',
            agentType: 'code_reviewer',
            estimatedDuration: 20000,
            dependencies: ['generate_code'],
            outputs: ['review_results', 'improvement_suggestions']
          });
        }
        break;

      case 'multi_file_operation':
        steps.push({
          id: 'analyze_files',
          description: 'Analyze all files and their relationships',
          agentType: 'multi_file_specialist',
          estimatedDuration: 45000,
          dependencies: [],
          outputs: ['file_analysis', 'dependency_map']
        });

        steps.push({
          id: 'plan_changes',
          description: 'Plan coordinated changes across files',
          agentType: 'multi_file_specialist',
          estimatedDuration: 30000,
          dependencies: ['analyze_files'],
          outputs: ['change_plan']
        });

        steps.push({
          id: 'execute_changes',
          description: 'Execute planned changes across multiple files',
          agentType: 'multi_file_specialist',
          estimatedDuration: 60000,
          dependencies: ['plan_changes'],
          outputs: ['modified_files']
        });

        steps.push({
          id: 'validate_changes',
          description: 'Validate changes work correctly together',
          agentType: 'multi_file_specialist',
          estimatedDuration: 30000,
          dependencies: ['execute_changes'],
          outputs: ['validation_results']
        });
        break;

      case 'bug_fix':
        steps.push({
          id: 'reproduce_bug',
          description: 'Analyze and reproduce the reported bug',
          agentType: 'bug_hunter',
          estimatedDuration: 30000,
          dependencies: [],
          outputs: ['bug_reproduction', 'root_cause_analysis']
        });

        steps.push({
          id: 'fix_bug',
          description: 'Implement fix for the identified bug',
          agentType: 'bug_hunter',
          estimatedDuration: 45000,
          dependencies: ['reproduce_bug'],
          outputs: ['bug_fix_code']
        });

        steps.push({
          id: 'test_fix',
          description: 'Test the bug fix to ensure it works correctly',
          agentType: 'tester',
          estimatedDuration: 25000,
          dependencies: ['fix_bug'],
          outputs: ['test_results']
        });
        break;

      default:
        steps.push({
          id: 'execute_task',
          description: task.description,
          agentType: 'code_generator',
          estimatedDuration: 30000,
          dependencies: [],
          outputs: ['task_result']
        });
    }

    return steps;
  }

  private validateSteps(steps: TaskStep[], task: Task): TaskStep[] {
    const validSteps = steps.filter(step => {
      // Ensure all required fields are present
      if (!step.id || !step.description || !step.agentType) {
        return false;
      }

      // Ensure estimated duration is reasonable
      if (!step.estimatedDuration || step.estimatedDuration < 1000 || step.estimatedDuration > 600000) {
        step.estimatedDuration = 30000; // Default to 30 seconds
      }

      // Ensure outputs array exists
      if (!step.outputs || !Array.isArray(step.outputs)) {
        step.outputs = ['step_result'];
      }

      // Ensure dependencies array exists
      if (!step.dependencies || !Array.isArray(step.dependencies)) {
        step.dependencies = [];
      }

      return true;
    });

    // Ensure step IDs are unique
    const stepIds = new Set();
    validSteps.forEach((step, index) => {
      if (stepIds.has(step.id)) {
        step.id = `${step.id}_${index}`;
      }
      stepIds.add(step.id);
    });

    return validSteps;
  }

  private async identifyDependencies(steps: TaskStep[], task: Task): Promise<TaskDependency[]> {
    const dependencies: TaskDependency[] = [];

    // Add explicit dependencies from step definitions
    steps.forEach(step => {
      step.dependencies.forEach(depId => {
        if (steps.some(s => s.id === depId)) {
          dependencies.push({
            fromStep: depId,
            toStep: step.id,
            type: 'completion'
          });
        }
      });
    });

    // Identify implicit dependencies based on outputs/inputs
    for (let i = 0; i < steps.length; i++) {
      for (let j = i + 1; j < steps.length; j++) {
        const step1 = steps[i];
        const step2 = steps[j];

        // Check if step2 might need outputs from step1
        const hasCommonOutputInput = step1.outputs.some(output =>
          step2.description.toLowerCase().includes(output.toLowerCase().replace('_', ' '))
        );

        if (hasCommonOutputInput) {
          const existingDep = dependencies.find(d =>
            d.fromStep === step1.id && d.toStep === step2.id
          );

          if (!existingDep) {
            dependencies.push({
              fromStep: step1.id,
              toStep: step2.id,
              type: 'data'
            });
          }
        }
      }
    }

    return dependencies;
  }

  private async assessRisk(steps: TaskStep[], task: Task): Promise<RiskLevel> {
    let riskScore = 0;

    // Base risk by task type
    const taskTypeRisk = {
      'code_generation': 1,
      'code_review': 0,
      'bug_fix': 2,
      'optimization': 1,
      'documentation': 0,
      'testing': 1,
      'multi_file_operation': 3
    };

    riskScore += taskTypeRisk[task.type] || 1;

    // Risk by number of steps
    if (steps.length > 10) riskScore += 2;
    else if (steps.length > 5) riskScore += 1;

    // Risk by number of files
    const fileCount = task.context.files?.length || 0;
    if (fileCount > 20) riskScore += 3;
    else if (fileCount > 10) riskScore += 2;
    else if (fileCount > 5) riskScore += 1;

    // Risk by complexity of dependencies
    const multiFileSteps = steps.filter(s => s.agentType === 'multi_file_specialist').length;
    if (multiFileSteps > 2) riskScore += 2;

    // Convert score to risk level
    if (riskScore >= 8) return 'critical';
    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  private async identifyApprovalPoints(
    steps: TaskStep[],
    riskLevel: RiskLevel,
    options: TaskPlanningOptions
  ): Promise<ApprovalPoint[]> {
    const approvalPoints: ApprovalPoint[] = [];

    // Require approval for high-risk operations
    if (riskLevel === 'critical' || riskLevel === 'high') {
      steps.forEach(step => {
        if (step.agentType === 'multi_file_specialist' ||
            step.description.toLowerCase().includes('delete') ||
            step.description.toLowerCase().includes('remove')) {
          approvalPoints.push({
            stepId: step.id,
            reason: `High-risk operation: ${step.description}`,
            riskLevel
          });
        }
      });
    }

    // Require approval for specified task types
    if (options.requireApprovalFor) {
      options.requireApprovalFor.forEach(requirement => {
        if (requirement === 'multi_file_operation') {
          steps.filter(s => s.agentType === 'multi_file_specialist').forEach(step => {
            if (!approvalPoints.some(ap => ap.stepId === step.id)) {
              approvalPoints.push({
                stepId: step.id,
                reason: 'Multi-file operation requires approval',
                riskLevel: 'medium'
              });
            }
          });
        }
      });
    }

    return approvalPoints;
  }

  private calculateTotalDuration(steps: TaskStep[], dependencies: TaskDependency[]): number {
    // Create dependency graph
    const graph = new Map<string, string[]>();
    steps.forEach(step => {
      graph.set(step.id, []);
    });

    dependencies.forEach(dep => {
      const dependents = graph.get(dep.fromStep) || [];
      dependents.push(dep.toStep);
      graph.set(dep.fromStep, dependents);
    });

    // Calculate critical path
    const stepDurations = new Map<string, number>();
    steps.forEach(step => {
      stepDurations.set(step.id, step.estimatedDuration);
    });

    // Use topological sort to find longest path
    const visited = new Set<string>();
    const pathLengths = new Map<string, number>();

    const calculatePath = (stepId: string): number => {
      if (visited.has(stepId)) {
        return pathLengths.get(stepId) || 0;
      }

      visited.add(stepId);
      const stepDuration = stepDurations.get(stepId) || 0;

      const dependents = graph.get(stepId) || [];
      let maxDependentPath = 0;

      dependents.forEach(dependent => {
        maxDependentPath = Math.max(maxDependentPath, calculatePath(dependent));
      });

      const totalPath = stepDuration + maxDependentPath;
      pathLengths.set(stepId, totalPath);
      return totalPath;
    };

    let maxDuration = 0;
    steps.forEach(step => {
      maxDuration = Math.max(maxDuration, calculatePath(step.id));
    });

    return maxDuration;
  }

  private validatePlanConstraints(
    steps: TaskStep[],
    dependencies: TaskDependency[],
    options: TaskPlanningOptions
  ): void {
    // Check maximum steps constraint
    if (options.maxSteps && steps.length > options.maxSteps) {
      throw new Error(`Plan exceeds maximum allowed steps: ${steps.length} > ${options.maxSteps}`);
    }

    // Check for circular dependencies
    this.detectCircularDependencies(steps, dependencies);

    // Check for orphaned steps
    const reachableSteps = new Set<string>();
    const findReachable = (stepId: string) => {
      if (reachableSteps.has(stepId)) return;
      reachableSteps.add(stepId);

      dependencies
        .filter(dep => dep.fromStep === stepId)
        .forEach(dep => findReachable(dep.toStep));
    };

    // Start from steps with no dependencies
    const independentSteps = steps.filter(step =>
      !dependencies.some(dep => dep.toStep === step.id)
    );

    independentSteps.forEach(step => findReachable(step.id));

    const orphanedSteps = steps.filter(step => !reachableSteps.has(step.id));
    if (orphanedSteps.length > 0 && independentSteps.length > 0) {
      console.warn(`Warning: Found orphaned steps: ${orphanedSteps.map(s => s.id).join(', ')}`);
    }
  }

  private detectCircularDependencies(steps: TaskStep[], dependencies: TaskDependency[]): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepId: string): boolean => {
      visited.add(stepId);
      recursionStack.add(stepId);

      const dependents = dependencies
        .filter(dep => dep.fromStep === stepId)
        .map(dep => dep.toStep);

      for (const dependent of dependents) {
        if (!visited.has(dependent)) {
          if (hasCycle(dependent)) return true;
        } else if (recursionStack.has(dependent)) {
          return true;
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    for (const step of steps) {
      if (!visited.has(step.id)) {
        if (hasCycle(step.id)) {
          throw new Error(`Circular dependency detected involving step: ${step.id}`);
        }
      }
    }
  }

  private async optimizePlan(plan: TaskPlan, availableAgents: Agent[]): Promise<void> {
    const suggestions = await this.generateOptimizationSuggestions(plan, availableAgents);

    // Apply high-impact, low-risk optimizations automatically
    const autoApplyable = suggestions.filter(s =>
      s.impact === 'high' &&
      (s.type === 'parallel_execution' || s.type === 'dependency_reduction')
    );

    for (const suggestion of autoApplyable) {
      await this.applyOptimization(plan, suggestion);
    }

    if (suggestions.length > 0) {
      this.emit('optimizationSuggestions', { planId: plan.id, suggestions });
    }
  }

  private async generateOptimizationSuggestions(
    plan: TaskPlan,
    availableAgents: Agent[]
  ): Promise<TaskOptimizationSuggestion[]> {
    const suggestions: TaskOptimizationSuggestion[] = [];

    // Check for parallelization opportunities
    const parallelizableSteps = this.findParallelizableSteps(plan.steps, plan.dependencies);
    if (parallelizableSteps.length > 1) {
      const estimatedSavings = parallelizableSteps.reduce((sum, step) =>
        sum + step.estimatedDuration, 0) * 0.6; // Assume 60% time savings

      suggestions.push({
        type: 'parallel_execution',
        description: `Execute ${parallelizableSteps.length} steps in parallel`,
        impact: 'high',
        estimatedSavings,
        requiredChanges: [`Parallelize steps: ${parallelizableSteps.map(s => s.id).join(', ')}`]
      });
    }

    // Check for better agent assignments
    const agentCapabilities = new Map<string, string[]>();
    availableAgents.forEach(agent => {
      agentCapabilities.set(agent.type, agent.capabilities);
    });

    plan.steps.forEach(step => {
      const currentCapabilities = agentCapabilities.get(step.agentType) || [];
      const betterAgent = availableAgents.find(agent =>
        agent.type !== step.agentType &&
        agent.capabilities.length > currentCapabilities.length &&
        agent.capabilities.some(cap =>
          step.description.toLowerCase().includes(cap.toLowerCase().replace('_', ' '))
        )
      );

      if (betterAgent) {
        suggestions.push({
          type: 'agent_reassignment',
          description: `Reassign step "${step.id}" to ${betterAgent.type} for better performance`,
          impact: 'medium',
          estimatedSavings: step.estimatedDuration * 0.2,
          requiredChanges: [`Change agent for step ${step.id} from ${step.agentType} to ${betterAgent.type}`]
        });
      }
    });

    return suggestions;
  }

  private findParallelizableSteps(steps: TaskStep[], dependencies: TaskDependency[]): TaskStep[] {
    // Find steps that have no dependencies and could run in parallel
    const independentSteps = steps.filter(step =>
      !dependencies.some(dep => dep.toStep === step.id)
    );

    return independentSteps.filter(step => step.estimatedDuration > 15000); // Only parallelize longer steps
  }

  private async applyOptimization(
    plan: TaskPlan,
    suggestion: TaskOptimizationSuggestion
  ): Promise<void> {
    // Implementation would modify the plan based on the optimization suggestion
    // For now, just log the optimization
    console.log(`Applied optimization: ${suggestion.description}`);
    this.emit('optimizationApplied', { planId: plan.id, suggestion });
  }

  // Public API Methods
  getPlan(planId: string): TaskPlan | undefined {
    return this.plans.get(planId);
  }

  getAllPlans(): TaskPlan[] {
    return Array.from(this.plans.values());
  }

  getPlanningHistory(): TaskPlan[] {
    return [...this.planningHistory];
  }

  async updatePlan(planId: string, updates: Partial<TaskPlan>): Promise<boolean> {
    const plan = this.plans.get(planId);
    if (!plan) return false;

    Object.assign(plan, updates);
    this.emit('planUpdated', { planId, plan });
    return true;
  }

  deletePlan(planId: string): boolean {
    return this.plans.delete(planId);
  }

  private generatePlanId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Utility methods for external use
  validatePlanExecution(planId: string): { valid: boolean; issues: string[] } {
    const plan = this.plans.get(planId);
    if (!plan) {
      return { valid: false, issues: ['Plan not found'] };
    }

    const issues: string[] = [];

    // Check for circular dependencies
    try {
      this.detectCircularDependencies(plan.steps, plan.dependencies);
    } catch (error) {
      issues.push(error instanceof Error ? error.message : String(error));
    }

    // Check for missing dependencies
    plan.dependencies.forEach(dep => {
      const fromExists = plan.steps.some(s => s.id === dep.fromStep);
      const toExists = plan.steps.some(s => s.id === dep.toStep);

      if (!fromExists) issues.push(`Missing step for dependency: ${dep.fromStep}`);
      if (!toExists) issues.push(`Missing step for dependency: ${dep.toStep}`);
    });

    return { valid: issues.length === 0, issues };
  }

  getExecutionOrder(planId: string): string[] | null {
    const plan = this.plans.get(planId);
    if (!plan) return null;

    // Topological sort to get execution order
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();

    // Initialize
    plan.steps.forEach(step => {
      inDegree.set(step.id, 0);
      graph.set(step.id, []);
    });

    // Build graph and calculate in-degrees
    plan.dependencies.forEach(dep => {
      const dependents = graph.get(dep.fromStep) || [];
      dependents.push(dep.toStep);
      graph.set(dep.fromStep, dependents);

      inDegree.set(dep.toStep, (inDegree.get(dep.toStep) || 0) + 1);
    });

    // Topological sort
    const queue: string[] = [];
    const result: string[] = [];

    // Find all steps with no incoming edges
    inDegree.forEach((degree, stepId) => {
      if (degree === 0) {
        queue.push(stepId);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      // Process all dependents
      const dependents = graph.get(current) || [];
      dependents.forEach(dependent => {
        const newInDegree = (inDegree.get(dependent) || 0) - 1;
        inDegree.set(dependent, newInDegree);

        if (newInDegree === 0) {
          queue.push(dependent);
        }
      });
    }

    // Check if all steps were processed (no cycles)
    if (result.length !== plan.steps.length) {
      return null; // Cycle detected
    }

    return result;
  }

  // Cleanup
  destroy(): void {
    this.plans.clear();
    this.planningHistory = [];
    this.removeAllListeners();
  }
}

// Singleton instance
export const taskPlanner = new TaskPlanner();