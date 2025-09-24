import { EventEmitter } from 'events';
import { agentMemorySystem, MemoryEntry, MemoryQuery } from './AgentMemorySystem';
import { agentWorkflowEngine, WorkflowExecution } from './AgentWorkflowEngine';

export interface LearningModel {
  id: string;
  name: string;
  type: 'classification' | 'prediction' | 'optimization' | 'recommendation';
  version: string;
  parameters: ModelParameters;
  performance: ModelPerformance;
  trainingData: TrainingDataset[];
  created: Date;
  updated: Date;
}

export interface ModelParameters {
  weights: number[];
  biases: number[];
  hyperparameters: Record<string, any>;
  architecture: string;
  inputDimensions: number;
  outputDimensions: number;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  loss: number;
  epochs: number;
  validationAccuracy: number;
  lastEvaluated: Date;
}

export interface TrainingDataset {
  id: string;
  inputs: any[];
  outputs: any[];
  metadata: DatasetMetadata;
  created: Date;
}

export interface DatasetMetadata {
  source: string;
  quality: number;
  size: number;
  features: string[];
  labels: string[];
  preprocessing: string[];
}

export interface LearningTask {
  id: string;
  type: 'pattern_detection' | 'behavior_optimization' | 'preference_learning' | 'error_prediction';
  status: 'pending' | 'training' | 'completed' | 'failed';
  modelId: string;
  dataset: TrainingDataset;
  objective: LearningObjective;
  progress: TrainingProgress;
  created: Date;
  completed?: Date;
}

export interface LearningObjective {
  metric: 'accuracy' | 'efficiency' | 'user_satisfaction' | 'error_rate';
  target: number;
  weight: number;
  constraints: ObjectiveConstraint[];
}

export interface ObjectiveConstraint {
  type: 'min' | 'max' | 'range';
  parameter: string;
  value: number | [number, number];
}

export interface TrainingProgress {
  currentEpoch: number;
  totalEpochs: number;
  currentLoss: number;
  bestLoss: number;
  accuracy: number;
  validationLoss: number;
  learningRate: number;
  timeElapsed: number;
  estimatedTimeRemaining: number;
}

export interface Insight {
  id: string;
  type: 'user_pattern' | 'code_pattern' | 'performance_insight' | 'error_prediction';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestions: ActionSuggestion[];
  evidence: Evidence[];
  created: Date;
  applied: boolean;
}

export interface ActionSuggestion {
  action: string;
  description: string;
  expectedImprovement: number;
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

export interface Evidence {
  type: 'memory' | 'execution' | 'metric' | 'pattern';
  data: any;
  weight: number;
  timestamp: Date;
}

export interface AdaptationRule {
  id: string;
  name: string;
  condition: RuleCondition;
  action: RuleAction;
  priority: number;
  enabled: boolean;
  statistics: RuleStatistics;
  created: Date;
  updated: Date;
}

export interface RuleCondition {
  type: 'pattern_match' | 'threshold' | 'frequency' | 'combination';
  parameters: Record<string, any>;
  expression?: string;
}

export interface RuleAction {
  type: 'modify_behavior' | 'update_preference' | 'trigger_learning' | 'notify_user';
  parameters: Record<string, any>;
  priority: number;
}

export interface RuleStatistics {
  triggered: number;
  successful: number;
  failed: number;
  averageImpact: number;
  lastTriggered?: Date;
}

export interface LearningContext {
  userId?: string;
  projectId?: string;
  sessionId: string;
  taskType: string;
  codeLanguage: string;
  frameworks: string[];
  fileTypes: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  timestamp: Date;
}

class AdaptiveLearningEngine extends EventEmitter {
  private models: Map<string, LearningModel> = new Map();
  private learningTasks: Map<string, LearningTask> = new Map();
  private insights: Map<string, Insight> = new Map();
  private adaptationRules: Map<string, AdaptationRule> = new Map();
  private isInitialized = false;
  private learningRate = 0.001;
  private batchSize = 32;
  private maxEpochs = 100;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Load saved models and rules
    await this.loadPersistedModels();
    await this.loadAdaptationRules();

    // Initialize default models
    await this.initializeDefaultModels();

    // Start continuous learning loop
    this.startContinuousLearning();

    this.isInitialized = true;
    this.emit('initialized');
  }

  private async loadPersistedModels(): Promise<void> {
    // Load from persistent storage
    // Implementation would restore saved models
  }

  private async loadAdaptationRules(): Promise<void> {
    // Load default adaptation rules
    const defaultRules: AdaptationRule[] = [
      {
        id: 'prefer-successful-patterns',
        name: 'Prefer Successful Patterns',
        condition: {
          type: 'threshold',
          parameters: { metric: 'success_rate', threshold: 0.8, occurrences: 5 }
        },
        action: {
          type: 'modify_behavior',
          parameters: { increase_priority: 0.2 },
          priority: 8
        },
        priority: 8,
        enabled: true,
        statistics: { triggered: 0, successful: 0, failed: 0, averageImpact: 0 },
        created: new Date(),
        updated: new Date()
      },
      {
        id: 'avoid-error-patterns',
        name: 'Avoid Error Patterns',
        condition: {
          type: 'threshold',
          parameters: { metric: 'error_rate', threshold: 0.3, occurrences: 3 }
        },
        action: {
          type: 'modify_behavior',
          parameters: { decrease_priority: 0.3 },
          priority: 9
        },
        priority: 9,
        enabled: true,
        statistics: { triggered: 0, successful: 0, failed: 0, averageImpact: 0 },
        created: new Date(),
        updated: new Date()
      }
    ];

    defaultRules.forEach(rule => {
      this.adaptationRules.set(rule.id, rule);
    });
  }

  private async initializeDefaultModels(): Promise<void> {
    // Initialize user preference model
    const preferenceModel: LearningModel = {
      id: 'user-preferences',
      name: 'User Preference Model',
      type: 'classification',
      version: '1.0.0',
      parameters: {
        weights: new Array(128).fill(0).map(() => Math.random() * 0.1 - 0.05),
        biases: new Array(32).fill(0),
        hyperparameters: {
          learningRate: 0.001,
          dropout: 0.2,
          regularization: 0.01
        },
        architecture: 'feedforward',
        inputDimensions: 128,
        outputDimensions: 32
      },
      performance: {
        accuracy: 0.5,
        precision: 0.5,
        recall: 0.5,
        f1Score: 0.5,
        loss: 1.0,
        epochs: 0,
        validationAccuracy: 0.5,
        lastEvaluated: new Date()
      },
      trainingData: [],
      created: new Date(),
      updated: new Date()
    };

    this.models.set('user-preferences', preferenceModel);

    // Initialize code pattern model
    const patternModel: LearningModel = {
      id: 'code-patterns',
      name: 'Code Pattern Recognition Model',
      type: 'classification',
      version: '1.0.0',
      parameters: {
        weights: new Array(256).fill(0).map(() => Math.random() * 0.1 - 0.05),
        biases: new Array(64).fill(0),
        hyperparameters: {
          learningRate: 0.0005,
          dropout: 0.3,
          regularization: 0.02
        },
        architecture: 'cnn',
        inputDimensions: 256,
        outputDimensions: 64
      },
      performance: {
        accuracy: 0.6,
        precision: 0.6,
        recall: 0.6,
        f1Score: 0.6,
        loss: 0.8,
        epochs: 0,
        validationAccuracy: 0.6,
        lastEvaluated: new Date()
      },
      trainingData: [],
      created: new Date(),
      updated: new Date()
    };

    this.models.set('code-patterns', patternModel);
  }

  private startContinuousLearning(): void {
    // Periodic learning from new experiences
    setInterval(async () => {
      await this.performContinuousLearning();
    }, 600000); // Every 10 minutes

    // Real-time adaptation
    setInterval(async () => {
      await this.applyAdaptationRules();
    }, 60000); // Every minute
  }

  async learnFromInteraction(
    interaction: any,
    context: LearningContext,
    outcome: 'success' | 'failure' | 'partial',
    feedback?: any
  ): Promise<void> {
    // Store interaction as training data
    const trainingData: TrainingDataset = {
      id: `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      inputs: [interaction, context],
      outputs: [outcome, feedback],
      metadata: {
        source: 'user_interaction',
        quality: outcome === 'success' ? 0.9 : outcome === 'partial' ? 0.6 : 0.3,
        size: 1,
        features: ['interaction', 'context'],
        labels: ['outcome', 'feedback'],
        preprocessing: ['normalization']
      },
      created: new Date()
    };

    // Add to relevant models
    const models = this.getRelevantModels(context);
    for (const model of models) {
      model.trainingData.push(trainingData);

      // Trigger incremental learning if enough new data
      if (model.trainingData.length >= this.batchSize) {
        await this.scheduleModelTraining(model.id);
      }
    }

    // Store in memory system
    await agentMemorySystem.storeMemory({
      type: 'interaction',
      content: {
        interaction,
        context,
        outcome,
        feedback
      },
      metadata: {
        created: new Date(),
        updated: new Date(),
        source: 'learning_engine',
        context: {
          files: context.fileTypes,
          functions: [],
          variables: [],
          frameworks: context.frameworks,
          language: context.codeLanguage,
          taskType: context.taskType
        },
        importance: outcome === 'success' ? 0.8 : outcome === 'partial' ? 0.5 : 0.7,
        volatility: 'permanent'
      },
      embeddings: await this.generateInteractionEmbeddings(interaction),
      tags: [outcome, context.taskType, context.codeLanguage, ...context.frameworks],
      relationships: [],
      confidence: outcome === 'success' ? 0.9 : outcome === 'partial' ? 0.6 : 0.4
    });

    this.emit('interactionLearned', { context, outcome, modelCount: models.length });
  }

  private getRelevantModels(context: LearningContext): LearningModel[] {
    const relevantModels: LearningModel[] = [];

    // Always include user preference model
    const prefModel = this.models.get('user-preferences');
    if (prefModel) relevantModels.push(prefModel);

    // Include code pattern model for code-related tasks
    if (context.taskType.includes('code') || context.taskType.includes('debug')) {
      const patternModel = this.models.get('code-patterns');
      if (patternModel) relevantModels.push(patternModel);
    }

    return relevantModels;
  }

  private async generateInteractionEmbeddings(interaction: any): Promise<number[]> {
    // Generate embeddings for interaction data
    // This would use a proper embedding model in production
    const str = JSON.stringify(interaction);
    return this.generateSimpleEmbeddings(str, 256);
  }

  private generateSimpleEmbeddings(text: string, dimensions: number): number[] {
    const embedding = new Array(dimensions).fill(0);
    const words = text.toLowerCase().split(/\s+/);

    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      embedding[hash % dimensions] += 1;
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  async analyzeUserPatterns(userId?: string): Promise<Insight[]> {
    // Query memories for user interactions
    const query: MemoryQuery = {
      type: ['interaction'],
      limit: 100
    };

    if (userId) {
      query.context = { ...query.context };
    }

    const memories = await agentMemorySystem.retrieveMemories(query);
    const insights: Insight[] = [];

    // Analyze success patterns
    const successfulInteractions = memories.filter(m => m.content.outcome === 'success');
    if (successfulInteractions.length >= 5) {
      const insight = await this.generatePatternInsight(successfulInteractions, 'success');
      if (insight) insights.push(insight);
    }

    // Analyze failure patterns
    const failedInteractions = memories.filter(m => m.content.outcome === 'failure');
    if (failedInteractions.length >= 3) {
      const insight = await this.generatePatternInsight(failedInteractions, 'failure');
      if (insight) insights.push(insight);
    }

    // Analyze task preferences
    const taskPreferences = this.analyzeTaskPreferences(memories);
    if (taskPreferences) insights.push(taskPreferences);

    // Store insights
    insights.forEach(insight => {
      this.insights.set(insight.id, insight);
    });

    this.emit('insightsGenerated', { count: insights.length, userId });

    return insights;
  }

  private async generatePatternInsight(
    interactions: MemoryEntry[],
    type: 'success' | 'failure'
  ): Promise<Insight | null> {
    if (interactions.length < 3) return null;

    const contexts = interactions.map(i => i.content.context);
    const commonLanguages = this.findCommonValues(contexts.map(c => c.codeLanguage));
    const commonFrameworks = this.findCommonValues(contexts.flatMap(c => c.frameworks));
    const commonTaskTypes = this.findCommonValues(contexts.map(c => c.taskType));

    if (commonLanguages.length === 0 && commonFrameworks.length === 0 && commonTaskTypes.length === 0) {
      return null;
    }

    const insight: Insight = {
      id: `insight_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'user_pattern',
      title: `${type === 'success' ? 'Successful' : 'Problematic'} Pattern Detected`,
      description: this.generatePatternDescription(commonLanguages, commonFrameworks, commonTaskTypes, type),
      confidence: Math.min(0.95, 0.6 + (interactions.length / 20)),
      impact: interactions.length > 10 ? 'high' : interactions.length > 5 ? 'medium' : 'low',
      actionable: true,
      suggestions: this.generatePatternSuggestions(commonLanguages, commonFrameworks, commonTaskTypes, type),
      evidence: interactions.map(i => ({
        type: 'memory' as const,
        data: i.content,
        weight: i.confidence,
        timestamp: i.metadata.created
      })),
      created: new Date(),
      applied: false
    };

    return insight;
  }

  private findCommonValues(values: string[]): string[] {
    const frequency = new Map<string, number>();
    values.forEach(value => {
      if (value) {
        frequency.set(value, (frequency.get(value) || 0) + 1);
      }
    });

    const threshold = Math.max(2, Math.floor(values.length * 0.3));
    return Array.from(frequency.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([value, _]) => value);
  }

  private generatePatternDescription(
    languages: string[],
    frameworks: string[],
    taskTypes: string[],
    type: 'success' | 'failure'
  ): string {
    let description = `Pattern of ${type} interactions detected`;

    if (languages.length > 0) {
      description += ` involving ${languages.join(', ')} programming`;
    }

    if (frameworks.length > 0) {
      description += ` with ${frameworks.join(', ')} frameworks`;
    }

    if (taskTypes.length > 0) {
      description += ` for ${taskTypes.join(', ')} tasks`;
    }

    return description + '.';
  }

  private generatePatternSuggestions(
    languages: string[],
    frameworks: string[],
    taskTypes: string[],
    type: 'success' | 'failure'
  ): ActionSuggestion[] {
    const suggestions: ActionSuggestion[] = [];

    if (type === 'success') {
      suggestions.push({
        action: 'prioritize_pattern',
        description: `Prioritize similar patterns in future interactions`,
        expectedImprovement: 0.2,
        effort: 'low',
        priority: 8
      });

      if (frameworks.length > 0) {
        suggestions.push({
          action: 'suggest_framework',
          description: `Suggest ${frameworks[0]} for similar tasks`,
          expectedImprovement: 0.15,
          effort: 'low',
          priority: 7
        });
      }
    } else {
      suggestions.push({
        action: 'avoid_pattern',
        description: `Provide alternatives to avoid similar failures`,
        expectedImprovement: 0.25,
        effort: 'medium',
        priority: 9
      });

      suggestions.push({
        action: 'additional_validation',
        description: `Add extra validation for similar contexts`,
        expectedImprovement: 0.3,
        effort: 'medium',
        priority: 8
      });
    }

    return suggestions;
  }

  private analyzeTaskPreferences(memories: MemoryEntry[]): Insight | null {
    const contexts = memories.map(m => m.content.context);
    const taskFrequency = new Map<string, number>();
    const taskSuccess = new Map<string, { success: number; total: number }>();

    contexts.forEach((context, index) => {
      const task = context.taskType;
      const outcome = memories[index].content.outcome;

      taskFrequency.set(task, (taskFrequency.get(task) || 0) + 1);

      if (!taskSuccess.has(task)) {
        taskSuccess.set(task, { success: 0, total: 0 });
      }

      const stats = taskSuccess.get(task)!;
      stats.total++;
      if (outcome === 'success') stats.success++;
    });

    const preferredTasks = Array.from(taskFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (preferredTasks.length === 0) return null;

    const insight: Insight = {
      id: `insight_preferences_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'user_pattern',
      title: 'Task Preferences Identified',
      description: `User shows preference for ${preferredTasks.map(([task, _]) => task).join(', ')} tasks`,
      confidence: 0.8,
      impact: 'medium',
      actionable: true,
      suggestions: [
        {
          action: 'optimize_for_preferences',
          description: 'Optimize UI and suggestions for preferred task types',
          expectedImprovement: 0.2,
          effort: 'medium',
          priority: 7
        }
      ],
      evidence: preferredTasks.map(([task, frequency]) => ({
        type: 'metric' as const,
        data: { task, frequency, successRate: (taskSuccess.get(task)!.success / taskSuccess.get(task)!.total) },
        weight: frequency / memories.length,
        timestamp: new Date()
      })),
      created: new Date(),
      applied: false
    };

    return insight;
  }

  private async scheduleModelTraining(modelId: string): Promise<string> {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const learningTask: LearningTask = {
      id: taskId,
      type: 'pattern_detection',
      status: 'pending',
      modelId,
      dataset: {
        id: `dataset_${Date.now()}`,
        inputs: model.trainingData.flatMap(d => d.inputs),
        outputs: model.trainingData.flatMap(d => d.outputs),
        metadata: {
          source: 'accumulated_training_data',
          quality: 0.7,
          size: model.trainingData.length,
          features: ['interaction', 'context'],
          labels: ['outcome', 'feedback'],
          preprocessing: ['normalization', 'encoding']
        },
        created: new Date()
      },
      objective: {
        metric: 'accuracy',
        target: 0.85,
        weight: 1.0,
        constraints: [
          { type: 'min', parameter: 'accuracy', value: 0.6 },
          { type: 'max', parameter: 'epochs', value: this.maxEpochs }
        ]
      },
      progress: {
        currentEpoch: 0,
        totalEpochs: this.maxEpochs,
        currentLoss: 1.0,
        bestLoss: 1.0,
        accuracy: 0.5,
        validationLoss: 1.0,
        learningRate: this.learningRate,
        timeElapsed: 0,
        estimatedTimeRemaining: 0
      },
      created: new Date()
    };

    this.learningTasks.set(taskId, learningTask);
    this.emit('trainingScheduled', { taskId, modelId });

    // Start training asynchronously
    this.trainModel(learningTask);

    return taskId;
  }

  private async trainModel(task: LearningTask): Promise<void> {
    task.status = 'training';
    const model = this.models.get(task.modelId)!;
    const startTime = Date.now();

    this.emit('trainingStarted', { taskId: task.id, modelId: task.modelId });

    try {
      // Simplified training simulation
      for (let epoch = 1; epoch <= task.objective.constraints.find(c => c.parameter === 'epochs')?.value || this.maxEpochs; epoch++) {
        // Simulate training step
        const loss = this.simulateTrainingStep(model, task.dataset);
        const accuracy = Math.min(0.95, 0.5 + (epoch / task.progress.totalEpochs) * 0.4 + Math.random() * 0.1);

        task.progress.currentEpoch = epoch;
        task.progress.currentLoss = loss;
        task.progress.accuracy = accuracy;
        task.progress.timeElapsed = Date.now() - startTime;

        if (loss < task.progress.bestLoss) {
          task.progress.bestLoss = loss;
          // Save model checkpoint
        }

        // Check early stopping
        if (accuracy >= task.objective.target || loss < 0.01) {
          break;
        }

        this.emit('trainingProgress', {
          taskId: task.id,
          epoch,
          loss,
          accuracy
        });

        // Simulate time delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update model performance
      model.performance.accuracy = task.progress.accuracy;
      model.performance.loss = task.progress.bestLoss;
      model.performance.epochs = task.progress.currentEpoch;
      model.performance.lastEvaluated = new Date();
      model.updated = new Date();

      // Clear training data after successful training
      model.trainingData = [];

      task.status = 'completed';
      task.completed = new Date();

      this.emit('trainingCompleted', {
        taskId: task.id,
        modelId: task.modelId,
        performance: model.performance
      });

    } catch (error) {
      task.status = 'failed';
      this.emit('trainingFailed', {
        taskId: task.id,
        modelId: task.modelId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private simulateTrainingStep(model: LearningModel, dataset: TrainingDataset): number {
    // Simplified training simulation
    const initialLoss = 1.0;
    const epochs = model.performance.epochs + 1;
    const convergenceRate = 0.95;

    return initialLoss * Math.pow(convergenceRate, epochs) + Math.random() * 0.1;
  }

  private async performContinuousLearning(): Promise<void> {
    // Look for new experiences to learn from
    const recentMemories = await agentMemorySystem.retrieveMemories({
      type: ['interaction', 'execution', 'error'],
      timeRange: {
        start: new Date(Date.now() - 600000), // Last 10 minutes
        end: new Date()
      },
      limit: 50
    });

    if (recentMemories.length < 5) return;

    // Generate insights from recent experiences
    const insights = await this.generateInsightsFromMemories(recentMemories);

    // Update models if significant patterns found
    if (insights.length > 0) {
      await this.updateModelsFromInsights(insights);
    }

    this.emit('continuousLearningCompleted', {
      memories: recentMemories.length,
      insights: insights.length
    });
  }

  private async generateInsightsFromMemories(memories: MemoryEntry[]): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Analyze for error patterns
    const errorMemories = memories.filter(m => m.type === 'error' || m.content.outcome === 'failure');
    if (errorMemories.length >= 3) {
      const errorInsight = await this.analyzeErrorPatterns(errorMemories);
      if (errorInsight) insights.push(errorInsight);
    }

    // Analyze for performance patterns
    const executionMemories = memories.filter(m => m.type === 'execution');
    if (executionMemories.length >= 5) {
      const performanceInsight = await this.analyzePerformancePatterns(executionMemories);
      if (performanceInsight) insights.push(performanceInsight);
    }

    return insights;
  }

  private async analyzeErrorPatterns(errorMemories: MemoryEntry[]): Promise<Insight | null> {
    // Analyze common error patterns
    const errorTypes = new Map<string, number>();
    const errorContexts = new Map<string, number>();

    errorMemories.forEach(memory => {
      const error = memory.content.error || memory.content.message || 'unknown';
      const context = memory.metadata.context.language || 'unknown';

      errorTypes.set(error, (errorTypes.get(error) || 0) + 1);
      errorContexts.set(context, (errorContexts.get(context) || 0) + 1);
    });

    const mostCommonError = Array.from(errorTypes.entries())
      .sort((a, b) => b[1] - a[1])[0];

    if (!mostCommonError || mostCommonError[1] < 2) return null;

    const insight: Insight = {
      id: `insight_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'error_prediction',
      title: 'Recurring Error Pattern Detected',
      description: `${mostCommonError[0]} error occurring frequently (${mostCommonError[1]} times)`,
      confidence: Math.min(0.9, 0.5 + mostCommonError[1] * 0.1),
      impact: mostCommonError[1] > 5 ? 'high' : mostCommonError[1] > 2 ? 'medium' : 'low',
      actionable: true,
      suggestions: [
        {
          action: 'add_validation',
          description: 'Add proactive validation to prevent this error',
          expectedImprovement: 0.4,
          effort: 'medium',
          priority: 9
        },
        {
          action: 'improve_error_handling',
          description: 'Improve error messages and recovery',
          expectedImprovement: 0.2,
          effort: 'low',
          priority: 7
        }
      ],
      evidence: errorMemories.map(m => ({
        type: 'memory' as const,
        data: m.content,
        weight: m.confidence,
        timestamp: m.metadata.created
      })),
      created: new Date(),
      applied: false
    };

    return insight;
  }

  private async analyzePerformancePatterns(executionMemories: MemoryEntry[]): Promise<Insight | null> {
    // Analyze performance patterns
    const durations = executionMemories
      .map(m => m.content.duration)
      .filter(d => d && d > 0);

    if (durations.length < 3) return null;

    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const maxDuration = Math.max(...durations);

    if (avgDuration < 1000) return null; // Only care about operations > 1s

    const insight: Insight = {
      id: `insight_performance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'performance_insight',
      title: 'Performance Pattern Detected',
      description: `Operations taking average ${Math.round(avgDuration)}ms (max: ${Math.round(maxDuration)}ms)`,
      confidence: 0.8,
      impact: avgDuration > 10000 ? 'high' : avgDuration > 3000 ? 'medium' : 'low',
      actionable: true,
      suggestions: [
        {
          action: 'optimize_operations',
          description: 'Optimize slow operations or add progress indicators',
          expectedImprovement: 0.3,
          effort: 'medium',
          priority: avgDuration > 5000 ? 8 : 6
        }
      ],
      evidence: executionMemories.map(m => ({
        type: 'memory' as const,
        data: m.content,
        weight: m.confidence,
        timestamp: m.metadata.created
      })),
      created: new Date(),
      applied: false
    };

    return insight;
  }

  private async updateModelsFromInsights(insights: Insight[]): Promise<void> {
    for (const insight of insights) {
      // Create training data from insights
      const trainingData: TrainingDataset = {
        id: `insight_training_${insight.id}`,
        inputs: [insight.evidence.map(e => e.data)],
        outputs: [insight.type, insight.confidence],
        metadata: {
          source: 'insight_analysis',
          quality: insight.confidence,
          size: 1,
          features: ['evidence'],
          labels: ['type', 'confidence'],
          preprocessing: ['normalization']
        },
        created: new Date()
      };

      // Add to relevant models
      const relevantModels = Array.from(this.models.values())
        .filter(model => model.type === 'classification' || model.type === 'prediction');

      for (const model of relevantModels) {
        model.trainingData.push(trainingData);
      }
    }
  }

  private async applyAdaptationRules(): Promise<void> {
    const activeRules = Array.from(this.adaptationRules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of activeRules) {
      try {
        const shouldTrigger = await this.evaluateRuleCondition(rule.condition);

        if (shouldTrigger) {
          await this.executeRuleAction(rule);
          rule.statistics.triggered++;
          rule.statistics.lastTriggered = new Date();
        }
      } catch (error) {
        rule.statistics.failed++;
        this.emit('ruleExecutionFailed', {
          ruleId: rule.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private async evaluateRuleCondition(condition: RuleCondition): Promise<boolean> {
    switch (condition.type) {
      case 'threshold':
        return await this.evaluateThresholdCondition(condition);
      case 'pattern_match':
        return await this.evaluatePatternCondition(condition);
      case 'frequency':
        return await this.evaluateFrequencyCondition(condition);
      default:
        return false;
    }
  }

  private async evaluateThresholdCondition(condition: RuleCondition): Promise<boolean> {
    const { metric, threshold, occurrences } = condition.parameters;

    // Query recent memories for the metric
    const memories = await agentMemorySystem.retrieveMemories({
      type: ['interaction', 'execution'],
      limit: 100
    });

    let metricCount = 0;
    let total = 0;

    memories.forEach(memory => {
      total++;
      const value = this.extractMetricValue(memory, metric);
      if (value !== null && value >= threshold) {
        metricCount++;
      }
    });

    return metricCount >= occurrences;
  }

  private extractMetricValue(memory: MemoryEntry, metric: string): number | null {
    switch (metric) {
      case 'success_rate':
        return memory.content.outcome === 'success' ? 1 : 0;
      case 'error_rate':
        return memory.content.outcome === 'failure' ? 1 : 0;
      case 'confidence':
        return memory.confidence;
      default:
        return null;
    }
  }

  private async evaluatePatternCondition(condition: RuleCondition): Promise<boolean> {
    // Implementation for pattern matching conditions
    return false; // Placeholder
  }

  private async evaluateFrequencyCondition(condition: RuleCondition): Promise<boolean> {
    // Implementation for frequency-based conditions
    return false; // Placeholder
  }

  private async executeRuleAction(rule: AdaptationRule): Promise<void> {
    switch (rule.action.type) {
      case 'modify_behavior':
        await this.modifyBehavior(rule.action.parameters);
        break;
      case 'update_preference':
        await this.updatePreference(rule.action.parameters);
        break;
      case 'trigger_learning':
        await this.triggerLearning(rule.action.parameters);
        break;
      case 'notify_user':
        await this.notifyUser(rule.action.parameters);
        break;
    }

    rule.statistics.successful++;
    this.emit('ruleExecuted', { ruleId: rule.id, action: rule.action.type });
  }

  private async modifyBehavior(parameters: Record<string, any>): Promise<void> {
    // Implementation for behavior modification
  }

  private async updatePreference(parameters: Record<string, any>): Promise<void> {
    // Implementation for preference updates
  }

  private async triggerLearning(parameters: Record<string, any>): Promise<void> {
    // Implementation for triggered learning
  }

  private async notifyUser(parameters: Record<string, any>): Promise<void> {
    // Implementation for user notifications
  }

  // Public API methods
  getModel(modelId: string): LearningModel | undefined {
    return this.models.get(modelId);
  }

  getModels(): LearningModel[] {
    return Array.from(this.models.values());
  }

  getInsights(filter?: { type?: string; applied?: boolean }): Insight[] {
    let insights = Array.from(this.insights.values());

    if (filter?.type) {
      insights = insights.filter(insight => insight.type === filter.type);
    }

    if (filter?.applied !== undefined) {
      insights = insights.filter(insight => insight.applied === filter.applied);
    }

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  async applyInsight(insightId: string): Promise<void> {
    const insight = this.insights.get(insightId);
    if (!insight) throw new Error(`Insight ${insightId} not found`);

    // Apply insight suggestions
    for (const suggestion of insight.suggestions) {
      // Implementation would apply the suggestions
      this.emit('suggestionApplied', { insightId, suggestion: suggestion.action });
    }

    insight.applied = true;
    this.emit('insightApplied', { insightId, insight });
  }

  getLearningTasks(): LearningTask[] {
    return Array.from(this.learningTasks.values());
  }

  getAdaptationRules(): AdaptationRule[] {
    return Array.from(this.adaptationRules.values());
  }
}

export const adaptiveLearningEngine = new AdaptiveLearningEngine();
export default adaptiveLearningEngine;