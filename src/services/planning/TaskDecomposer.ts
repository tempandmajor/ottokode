import { v4 as uuidv4 } from 'uuid';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'development' | 'testing' | 'deployment' | 'research' | 'review';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  dependencies: string[];
  subTasks: Task[];
  estimatedDuration: number; // minutes
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  skills: string[];
  resources: string[];
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDecompositionRequest {
  description: string;
  context?: {
    projectType: string;
    technologies: string[];
    constraints: string[];
    existingCode?: string;
  };
  maxDepth?: number;
  targetComplexity?: Task['complexity'];
}

export interface TaskDecompositionResult {
  rootTask: Task;
  allTasks: Task[];
  dependencies: { from: string; to: string; type: string }[];
  estimatedTotalDuration: number;
  criticalPath: string[];
  recommendations: string[];
}

export class TaskDecomposer {
  private aiModel: any; // Will be injected

  constructor(aiModel?: any) {
    this.aiModel = aiModel;
  }

  async decomposeTask(request: TaskDecompositionRequest): Promise<TaskDecompositionResult> {
    const rootTask = await this.createRootTask(request);
    const decomposition = await this.performDecomposition(rootTask, request);

    return {
      rootTask: decomposition.rootTask,
      allTasks: decomposition.allTasks,
      dependencies: this.extractDependencies(decomposition.allTasks),
      estimatedTotalDuration: this.calculateTotalDuration(decomposition.allTasks),
      criticalPath: this.findCriticalPath(decomposition.allTasks),
      recommendations: await this.generateRecommendations(decomposition)
    };
  }

  private async createRootTask(request: TaskDecompositionRequest): Promise<Task> {
    const complexity = await this.assessComplexity(request.description, request.context);

    return {
      id: uuidv4(),
      title: this.extractTitle(request.description),
      description: request.description,
      type: this.inferTaskType(request.description, request.context),
      priority: 'high',
      status: 'pending',
      dependencies: [],
      subTasks: [],
      estimatedDuration: await this.estimateDuration(request.description, complexity),
      complexity,
      skills: await this.identifyRequiredSkills(request.description, request.context),
      resources: await this.identifyRequiredResources(request.description, request.context),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async performDecomposition(
    rootTask: Task,
    request: TaskDecompositionRequest,
    currentDepth: number = 0
  ): Promise<{ rootTask: Task; allTasks: Task[] }> {
    const maxDepth = request.maxDepth || 4;
    const allTasks: Task[] = [rootTask];

    if (currentDepth >= maxDepth || rootTask.complexity === 'simple') {
      return { rootTask, allTasks };
    }

    try {
      const subTasks = await this.generateSubTasks(rootTask, request.context);
      rootTask.subTasks = subTasks;

      // Recursively decompose sub-tasks
      for (const subTask of subTasks) {
        const subDecomposition = await this.performDecomposition(
          subTask,
          request,
          currentDepth + 1
        );
        allTasks.push(...subDecomposition.allTasks);
      }

      return { rootTask, allTasks };
    } catch (error) {
      console.error('Error in task decomposition:', error);
      return { rootTask, allTasks };
    }
  }

  private async generateSubTasks(
    parentTask: Task,
    context?: TaskDecompositionRequest['context']
  ): Promise<Task[]> {
    // AI-powered task breakdown
    const prompt = this.buildDecompositionPrompt(parentTask, context);

    try {
      const response = await this.callAI(prompt);
      const subTaskData = this.parseAIResponse(response);

      return subTaskData.map((data: any) => ({
        id: uuidv4(),
        title: data.title,
        description: data.description,
        type: data.type || parentTask.type,
        priority: this.calculateSubTaskPriority(data.importance, parentTask.priority),
        status: 'pending',
        dependencies: data.dependencies || [],
        subTasks: [],
        estimatedDuration: data.estimatedDuration || 30,
        complexity: data.complexity || 'moderate',
        skills: data.skills || parentTask.skills,
        resources: data.resources || [],
        parentId: parentTask.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    } catch (error) {
      console.error('Error generating sub-tasks:', error);
      return this.createFallbackSubTasks(parentTask);
    }
  }

  private buildDecompositionPrompt(
    task: Task,
    context?: TaskDecompositionRequest['context']
  ): string {
    return `
Decompose the following development task into 3-6 manageable sub-tasks:

TASK: ${task.title}
DESCRIPTION: ${task.description}
TYPE: ${task.type}
COMPLEXITY: ${task.complexity}

${context ? `
CONTEXT:
- Project Type: ${context.projectType}
- Technologies: ${context.technologies.join(', ')}
- Constraints: ${context.constraints.join(', ')}
` : ''}

Please provide sub-tasks in JSON format:
[
  {
    "title": "Sub-task title",
    "description": "Detailed description",
    "type": "development|testing|deployment|research|review",
    "importance": "low|medium|high",
    "estimatedDuration": minutes,
    "complexity": "simple|moderate|complex|expert",
    "skills": ["skill1", "skill2"],
    "resources": ["resource1", "resource2"],
    "dependencies": ["dependency1", "dependency2"]
  }
]

Focus on logical, sequential steps that build upon each other.
`;
  }

  private async callAI(prompt: string): Promise<string> {
    if (!this.aiModel) {
      throw new Error('AI model not configured');
    }

    try {
      // Mock AI response for now - in production, this would call actual AI service
      const mockResponse = this.generateMockDecomposition();
      return JSON.stringify(mockResponse);
    } catch (error) {
      throw new Error(`AI call failed: ${error}`);
    }
  }

  private generateMockDecomposition(): any[] {
    return [
      {
        title: "Research and Planning",
        description: "Analyze requirements and create implementation plan",
        type: "research",
        importance: "high",
        estimatedDuration: 60,
        complexity: "moderate",
        skills: ["analysis", "planning"],
        resources: ["documentation", "requirements"],
        dependencies: []
      },
      {
        title: "Core Implementation",
        description: "Implement the main functionality",
        type: "development",
        importance: "high",
        estimatedDuration: 180,
        complexity: "complex",
        skills: ["programming", "architecture"],
        resources: ["IDE", "frameworks"],
        dependencies: ["Research and Planning"]
      },
      {
        title: "Testing and Validation",
        description: "Write tests and validate functionality",
        type: "testing",
        importance: "medium",
        estimatedDuration: 90,
        complexity: "moderate",
        skills: ["testing", "debugging"],
        resources: ["testing-framework"],
        dependencies: ["Core Implementation"]
      }
    ];
  }

  private parseAIResponse(response: string): any[] {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return [];
    }
  }

  private createFallbackSubTasks(parentTask: Task): Task[] {
    const fallbackTasks = [
      {
        title: "Planning and Research",
        description: `Plan and research for: ${parentTask.title}`,
        type: 'research' as const,
        estimatedDuration: 30
      },
      {
        title: "Implementation",
        description: `Implement: ${parentTask.title}`,
        type: 'development' as const,
        estimatedDuration: Math.floor(parentTask.estimatedDuration * 0.7)
      },
      {
        title: "Testing and Validation",
        description: `Test: ${parentTask.title}`,
        type: 'testing' as const,
        estimatedDuration: Math.floor(parentTask.estimatedDuration * 0.3)
      }
    ];

    return fallbackTasks.map((data, index) => ({
      id: uuidv4(),
      title: data.title,
      description: data.description,
      type: data.type,
      priority: parentTask.priority,
      status: 'pending' as const,
      dependencies: index > 0 ? [fallbackTasks[index - 1].title] : [],
      subTasks: [],
      estimatedDuration: data.estimatedDuration,
      complexity: 'moderate' as const,
      skills: parentTask.skills,
      resources: parentTask.resources,
      parentId: parentTask.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  private extractTitle(description: string): string {
    const sentences = description.split(/[.!?]/);
    const firstSentence = sentences[0].trim();
    return firstSentence.length > 60
      ? firstSentence.substring(0, 57) + '...'
      : firstSentence;
  }

  private inferTaskType(
    description: string,
    context?: TaskDecompositionRequest['context']
  ): Task['type'] {
    const lower = description.toLowerCase();

    if (lower.includes('test') || lower.includes('verify')) return 'testing';
    if (lower.includes('deploy') || lower.includes('release')) return 'deployment';
    if (lower.includes('research') || lower.includes('analyze')) return 'research';
    if (lower.includes('review') || lower.includes('audit')) return 'review';

    return 'development';
  }

  private async assessComplexity(
    description: string,
    context?: TaskDecompositionRequest['context']
  ): Promise<Task['complexity']> {
    const factors = {
      length: description.length,
      technologies: context?.technologies?.length || 0,
      constraints: context?.constraints?.length || 0,
      keywords: this.countComplexityKeywords(description)
    };

    const score = factors.length / 100 + factors.technologies * 0.5 +
                 factors.constraints * 0.3 + factors.keywords;

    if (score < 2) return 'simple';
    if (score < 4) return 'moderate';
    if (score < 6) return 'complex';
    return 'expert';
  }

  private countComplexityKeywords(description: string): number {
    const keywords = [
      'integrate', 'optimize', 'scale', 'security', 'performance',
      'architecture', 'framework', 'algorithm', 'database', 'api'
    ];

    return keywords.filter(keyword =>
      description.toLowerCase().includes(keyword)
    ).length;
  }

  private async estimateDuration(
    description: string,
    complexity: Task['complexity']
  ): Promise<number> {
    const baseMinutes = {
      simple: 60,
      moderate: 180,
      complex: 360,
      expert: 720
    };

    const multiplier = Math.max(1, description.length / 100);
    return Math.round(baseMinutes[complexity] * multiplier);
  }

  private async identifyRequiredSkills(
    description: string,
    context?: TaskDecompositionRequest['context']
  ): Promise<string[]> {
    const skills = new Set<string>();

    // Add skills based on technologies
    context?.technologies?.forEach(tech => {
      skills.add(tech.toLowerCase());
    });

    // Add skills based on description keywords
    const skillKeywords = {
      'frontend': ['react', 'vue', 'angular', 'html', 'css', 'javascript'],
      'backend': ['node', 'python', 'java', 'go', 'rust', 'api'],
      'database': ['sql', 'mongodb', 'postgres', 'redis'],
      'devops': ['docker', 'kubernetes', 'aws', 'deploy'],
      'testing': ['test', 'unit', 'integration', 'e2e']
    };

    Object.entries(skillKeywords).forEach(([skill, keywords]) => {
      if (keywords.some(keyword => description.toLowerCase().includes(keyword))) {
        skills.add(skill);
      }
    });

    return Array.from(skills);
  }

  private async identifyRequiredResources(
    description: string,
    context?: TaskDecompositionRequest['context']
  ): Promise<string[]> {
    const resources = new Set<string>();

    resources.add('development-environment');

    if (description.toLowerCase().includes('test')) {
      resources.add('testing-framework');
    }

    if (description.toLowerCase().includes('deploy')) {
      resources.add('deployment-environment');
    }

    context?.technologies?.forEach(tech => {
      resources.add(`${tech.toLowerCase()}-toolchain`);
    });

    return Array.from(resources);
  }

  private calculateSubTaskPriority(
    importance: string,
    parentPriority: Task['priority']
  ): Task['priority'] {
    const priorityMap = {
      'low': { 'low': 'low', 'medium': 'low', 'high': 'medium', 'critical': 'high' },
      'medium': { 'low': 'low', 'medium': 'medium', 'high': 'high', 'critical': 'high' },
      'high': { 'low': 'medium', 'medium': 'high', 'high': 'high', 'critical': 'critical' }
    };

    return priorityMap[importance as keyof typeof priorityMap]?.[parentPriority] as Task['priority'] || 'medium';
  }

  private extractDependencies(tasks: Task[]): { from: string; to: string; type: string }[] {
    const dependencies: { from: string; to: string; type: string }[] = [];

    tasks.forEach(task => {
      task.dependencies.forEach(depName => {
        const dependentTask = tasks.find(t => t.title === depName);
        if (dependentTask) {
          dependencies.push({
            from: dependentTask.id,
            to: task.id,
            type: 'blocks'
          });
        }
      });
    });

    return dependencies;
  }

  private calculateTotalDuration(tasks: Task[]): number {
    // Calculate critical path duration considering dependencies
    return tasks.reduce((total, task) => total + task.estimatedDuration, 0);
  }

  private findCriticalPath(tasks: Task[]): string[] {
    // Simple critical path: tasks with highest combined duration and complexity
    return tasks
      .sort((a, b) => {
        const scoreA = a.estimatedDuration * this.getComplexityMultiplier(a.complexity);
        const scoreB = b.estimatedDuration * this.getComplexityMultiplier(b.complexity);
        return scoreB - scoreA;
      })
      .slice(0, Math.ceil(tasks.length * 0.3))
      .map(task => task.id);
  }

  private getComplexityMultiplier(complexity: Task['complexity']): number {
    const multipliers = { simple: 1, moderate: 1.5, complex: 2, expert: 3 };
    return multipliers[complexity];
  }

  private async generateRecommendations(
    decomposition: { rootTask: Task; allTasks: Task[] }
  ): Promise<string[]> {
    const recommendations: string[] = [];

    const totalDuration = this.calculateTotalDuration(decomposition.allTasks);
    if (totalDuration > 480) { // > 8 hours
      recommendations.push('Consider breaking this into multiple development sessions');
    }

    const complexTasks = decomposition.allTasks.filter(t => t.complexity === 'expert');
    if (complexTasks.length > 0) {
      recommendations.push(`${complexTasks.length} expert-level tasks identified - consider additional planning time`);
    }

    const skills = new Set<string>();
    decomposition.allTasks.forEach(task => task.skills.forEach(skill => skills.add(skill)));
    if (skills.size > 5) {
      recommendations.push('Multiple skill areas required - consider team collaboration');
    }

    return recommendations;
  }

  // Public methods for task management
  async updateTaskStatus(taskId: string, status: Task['status']): Promise<void> {
    // Implementation for updating task status
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    // Implementation for retrieving tasks
    return null;
  }

  async getTasksByParent(parentId: string): Promise<Task[]> {
    // Implementation for retrieving child tasks
    return [];
  }

  async optimizeTaskOrder(tasks: Task[]): Promise<Task[]> {
    // Optimize task execution order based on dependencies and priorities
    return tasks.sort((a, b) => {
      // Sort by priority first, then by dependencies
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];

      if (priorityDiff !== 0) return priorityDiff;

      // Tasks with fewer dependencies come first
      return a.dependencies.length - b.dependencies.length;
    });
  }
}

export default TaskDecomposer;