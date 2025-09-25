import { Task } from '../planning/TaskDecomposer';

export interface ReasoningContext {
  projectContext: {
    type: string;
    technologies: string[];
    architecture: string;
    scale: 'small' | 'medium' | 'large' | 'enterprise';
  };
  userContext: {
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    preferences: {
      codeStyle: string;
      testingApproach: string;
      deploymentStrategy: string;
    };
    workingHours: {
      timezone: string;
      availability: string[];
    };
  };
  environmentContext: {
    developmentSetup: string[];
    constraints: string[];
    resources: {
      computational: 'low' | 'medium' | 'high';
      time: 'urgent' | 'normal' | 'flexible';
      budget: 'limited' | 'moderate' | 'ample';
    };
  };
  historicalContext: {
    previousDecisions: DecisionRecord[];
    outcomes: OutcomeRecord[];
    patterns: PatternRecord[];
  };
}

export interface DecisionRecord {
  id: string;
  timestamp: Date;
  context: string;
  options: DecisionOption[];
  selectedOption: string;
  reasoning: string;
  outcome?: {
    success: boolean;
    metrics: Record<string, number>;
    feedback: string;
  };
}

export interface DecisionOption {
  id: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  estimatedEffort: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
}

export interface OutcomeRecord {
  decisionId: string;
  actualEffort: number;
  actualDuration: number;
  qualityMetrics: {
    codeQuality: number;
    performance: number;
    maintainability: number;
    testCoverage: number;
  };
  userSatisfaction: number;
  lessonsLearned: string[];
}

export interface PatternRecord {
  id: string;
  pattern: string;
  frequency: number;
  successRate: number;
  contexts: string[];
  recommendations: string[];
}

export interface ReasoningRequest {
  question: string;
  options?: DecisionOption[];
  context: Partial<ReasoningContext>;
  constraints?: string[];
  goals?: string[];
}

export interface ReasoningResult {
  recommendation: DecisionOption;
  reasoning: string;
  confidence: number;
  alternativeOptions: DecisionOption[];
  risksAndMitigations: { risk: string; mitigation: string }[];
  contextualFactors: string[];
  learningPoints: string[];
}

export class ContextualReasoning {
  private context: ReasoningContext;
  private aiModel: any;
  private knowledgeBase: Map<string, any>;

  constructor(initialContext: Partial<ReasoningContext>, aiModel?: any) {
    this.context = this.initializeContext(initialContext);
    this.aiModel = aiModel;
    this.knowledgeBase = new Map();
    this.initializeKnowledgeBase();
  }

  async makeDecision(request: ReasoningRequest): Promise<ReasoningResult> {
    try {
      // Enrich context with current request
      const enrichedContext = await this.enrichContext(request);

      // Generate options if not provided
      const options = request.options || await this.generateOptions(request, enrichedContext);

      // Evaluate each option
      const evaluatedOptions = await this.evaluateOptions(options, enrichedContext);

      // Apply contextual reasoning
      const reasoningResult = await this.applyContextualLogic(
        evaluatedOptions,
        enrichedContext,
        request
      );

      // Learn from the decision
      await this.recordDecision(request, reasoningResult, enrichedContext);

      return reasoningResult;
    } catch (error) {
      console.error('Error in contextual reasoning:', error);
      return this.createFallbackResult(request);
    }
  }

  private initializeContext(partial: Partial<ReasoningContext>): ReasoningContext {
    return {
      projectContext: {
        type: 'web-application',
        technologies: ['typescript', 'react', 'node'],
        architecture: 'monolithic',
        scale: 'medium',
        ...partial.projectContext
      },
      userContext: {
        skillLevel: 'intermediate',
        preferences: {
          codeStyle: 'clean-code',
          testingApproach: 'unit-integration',
          deploymentStrategy: 'ci-cd',
          ...partial.userContext?.preferences
        },
        workingHours: {
          timezone: 'UTC',
          availability: ['09:00-17:00'],
          ...partial.userContext?.workingHours
        },
        ...partial.userContext
      },
      environmentContext: {
        developmentSetup: ['vscode', 'git', 'docker'],
        constraints: [],
        resources: {
          computational: 'medium',
          time: 'normal',
          budget: 'moderate'
        },
        ...partial.environmentContext
      },
      historicalContext: {
        previousDecisions: [],
        outcomes: [],
        patterns: [],
        ...partial.historicalContext
      }
    };
  }

  private initializeKnowledgeBase(): void {
    // Technology-specific best practices
    this.knowledgeBase.set('react-patterns', {
      hooks: { confidence: 0.9, effort: 'low', maintainability: 'high' },
      classComponents: { confidence: 0.6, effort: 'medium', maintainability: 'medium' },
      contextAPI: { confidence: 0.8, effort: 'medium', maintainability: 'high' }
    });

    // Architecture patterns
    this.knowledgeBase.set('architecture-patterns', {
      microservices: { scalability: 'high', complexity: 'high', maintenance: 'complex' },
      monolithic: { scalability: 'medium', complexity: 'medium', maintenance: 'simple' },
      serverless: { scalability: 'high', complexity: 'medium', maintenance: 'medium' }
    });

    // Testing strategies
    this.knowledgeBase.set('testing-strategies', {
      'unit-only': { coverage: 'partial', confidence: 0.6, effort: 'low' },
      'unit-integration': { coverage: 'good', confidence: 0.8, effort: 'medium' },
      'full-pyramid': { coverage: 'comprehensive', confidence: 0.95, effort: 'high' }
    });
  }

  private async enrichContext(request: ReasoningRequest): Promise<ReasoningContext> {
    // Merge request context with existing context
    const enriched = { ...this.context };

    // Add any request-specific context
    if (request.context.projectContext) {
      enriched.projectContext = { ...enriched.projectContext, ...request.context.projectContext };
    }

    if (request.context.userContext) {
      enriched.userContext = { ...enriched.userContext, ...request.context.userContext };
    }

    // Enrich with relevant historical patterns
    const relevantPatterns = await this.findRelevantPatterns(request.question);
    enriched.historicalContext.patterns.push(...relevantPatterns);

    return enriched;
  }

  private async generateOptions(
    request: ReasoningRequest,
    context: ReasoningContext
  ): Promise<DecisionOption[]> {
    try {
      const prompt = this.buildOptionsPrompt(request, context);
      const aiResponse = await this.callAI(prompt);
      const options = this.parseOptionsResponse(aiResponse);

      return options.length > 0 ? options : this.createFallbackOptions(request);
    } catch (error) {
      console.error('Error generating options:', error);
      return this.createFallbackOptions(request);
    }
  }

  private buildOptionsPrompt(request: ReasoningRequest, context: ReasoningContext): string {
    return `
Given the following context, generate 3-5 viable options for the decision:

QUESTION: ${request.question}

PROJECT CONTEXT:
- Type: ${context.projectContext.type}
- Technologies: ${context.projectContext.technologies.join(', ')}
- Scale: ${context.projectContext.scale}

USER CONTEXT:
- Skill Level: ${context.userContext.skillLevel}
- Code Style Preference: ${context.userContext.preferences.codeStyle}

CONSTRAINTS: ${request.constraints?.join(', ') || 'None specified'}
GOALS: ${request.goals?.join(', ') || 'None specified'}

Provide options in JSON format:
[
  {
    "id": "option-1",
    "title": "Option Title",
    "description": "Detailed description",
    "pros": ["Pro 1", "Pro 2"],
    "cons": ["Con 1", "Con 2"],
    "estimatedEffort": hours,
    "riskLevel": "low|medium|high",
    "confidence": 0.0-1.0
  }
]

Focus on practical, implementable solutions that consider the user's skill level and project constraints.
`;
  }

  private async callAI(prompt: string): Promise<string> {
    if (!this.aiModel) {
      return this.generateMockAIResponse();
    }

    try {
      // In production, this would call the actual AI service
      return this.generateMockAIResponse();
    } catch (error) {
      throw new Error(`AI call failed: ${error}`);
    }
  }

  private generateMockAIResponse(): string {
    return JSON.stringify([
      {
        id: "option-1",
        title: "Incremental Implementation",
        description: "Implement the feature incrementally with regular checkpoints",
        pros: ["Lower risk", "Regular feedback", "Easier to debug"],
        cons: ["Takes longer", "May require rework"],
        estimatedEffort: 20,
        riskLevel: "low",
        confidence: 0.8
      },
      {
        id: "option-2",
        title: "Full Implementation",
        description: "Complete implementation in one go",
        pros: ["Faster completion", "Cohesive design"],
        cons: ["Higher risk", "Harder to debug"],
        estimatedEffort: 15,
        riskLevel: "medium",
        confidence: 0.6
      },
      {
        id: "option-3",
        title: "MVP + Iterations",
        description: "Build minimal viable product then iterate",
        pros: ["Quick feedback", "User-driven development"],
        cons: ["May miss edge cases", "Requires user engagement"],
        estimatedEffort: 12,
        riskLevel: "medium",
        confidence: 0.7
      }
    ]);
  }

  private parseOptionsResponse(response: string): DecisionOption[] {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse AI options response:', error);
      return [];
    }
  }

  private createFallbackOptions(request: ReasoningRequest): DecisionOption[] {
    return [
      {
        id: 'conservative',
        title: 'Conservative Approach',
        description: 'Take the safest, most proven path',
        pros: ['Low risk', 'Well-tested approach', 'Predictable outcomes'],
        cons: ['May be slower', 'Less innovative'],
        estimatedEffort: 20,
        riskLevel: 'low',
        confidence: 0.8
      },
      {
        id: 'balanced',
        title: 'Balanced Approach',
        description: 'Balance innovation with stability',
        pros: ['Reasonable risk', 'Modern practices', 'Good performance'],
        cons: ['Moderate complexity', 'Some unknowns'],
        estimatedEffort: 15,
        riskLevel: 'medium',
        confidence: 0.7
      },
      {
        id: 'innovative',
        title: 'Innovative Approach',
        description: 'Use cutting-edge solutions',
        pros: ['High performance', 'Future-proof', 'Learning opportunity'],
        cons: ['Higher risk', 'Steep learning curve', 'Less community support'],
        estimatedEffort: 25,
        riskLevel: 'high',
        confidence: 0.5
      }
    ];
  }

  private async evaluateOptions(
    options: DecisionOption[],
    context: ReasoningContext
  ): Promise<DecisionOption[]> {
    return options.map(option => {
      const evaluation = this.evaluateOption(option, context);
      return {
        ...option,
        confidence: evaluation.confidence,
        estimatedEffort: evaluation.adjustedEffort
      };
    });
  }

  private evaluateOption(option: DecisionOption, context: ReasoningContext): {
    confidence: number;
    adjustedEffort: number;
  } {
    let confidence = option.confidence;
    let adjustedEffort = option.estimatedEffort;

    // Adjust based on user skill level
    const skillMultipliers = {
      beginner: { effort: 1.5, confidence: -0.2 },
      intermediate: { effort: 1.1, confidence: 0 },
      advanced: { effort: 0.9, confidence: 0.1 },
      expert: { effort: 0.7, confidence: 0.2 }
    };

    const skillAdjustment = skillMultipliers[context.userContext.skillLevel];
    adjustedEffort *= skillAdjustment.effort;
    confidence = Math.max(0, Math.min(1, confidence + skillAdjustment.confidence));

    // Adjust based on project scale
    if (context.projectContext.scale === 'enterprise' && option.riskLevel === 'high') {
      confidence -= 0.3;
      adjustedEffort *= 1.3;
    }

    // Adjust based on time constraints
    if (context.environmentContext.resources.time === 'urgent') {
      if (option.riskLevel === 'low') {
        confidence += 0.2;
      } else {
        confidence -= 0.1;
      }
    }

    return {
      confidence: Math.max(0, Math.min(1, confidence)),
      adjustedEffort: Math.round(adjustedEffort)
    };
  }

  private async applyContextualLogic(
    options: DecisionOption[],
    context: ReasoningContext,
    request: ReasoningRequest
  ): Promise<ReasoningResult> {
    // Sort options by a weighted score considering multiple factors
    const scoredOptions = options.map(option => {
      const score = this.calculateOptionScore(option, context, request);
      return { option, score };
    }).sort((a, b) => b.score - a.score);

    const bestOption = scoredOptions[0].option;
    const alternativeOptions = scoredOptions.slice(1).map(item => item.option);

    return {
      recommendation: bestOption,
      reasoning: this.generateReasoning(bestOption, context, request),
      confidence: bestOption.confidence,
      alternativeOptions,
      risksAndMitigations: this.identifyRisksAndMitigations(bestOption, context),
      contextualFactors: this.identifyContextualFactors(context, request),
      learningPoints: this.generateLearningPoints(bestOption, context)
    };
  }

  private calculateOptionScore(
    option: DecisionOption,
    context: ReasoningContext,
    request: ReasoningRequest
  ): number {
    let score = option.confidence * 100;

    // Adjust for effort vs time constraints
    if (context.environmentContext.resources.time === 'urgent') {
      score -= (option.estimatedEffort - 10) * 2; // Penalty for high effort
    }

    // Adjust for risk tolerance based on project scale
    const riskPenalties = { low: 0, medium: -10, high: -25 };
    if (context.projectContext.scale === 'enterprise') {
      score += riskPenalties[option.riskLevel] * 1.5;
    } else {
      score += riskPenalties[option.riskLevel];
    }

    // Bonus for alignment with user preferences
    if (context.userContext.preferences.codeStyle === 'clean-code' &&
        option.description.toLowerCase().includes('clean')) {
      score += 10;
    }

    // Historical success bonus
    const historicalSuccess = this.getHistoricalSuccess(option, context);
    score += historicalSuccess * 20;

    return score;
  }

  private getHistoricalSuccess(option: DecisionOption, context: ReasoningContext): number {
    const relevantOutcomes = context.historicalContext.outcomes.filter(outcome => {
      // Simple matching based on option characteristics
      return outcome.qualityMetrics.codeQuality > 0.7;
    });

    if (relevantOutcomes.length === 0) return 0;

    const averageSuccess = relevantOutcomes.reduce((sum, outcome) =>
      sum + outcome.userSatisfaction, 0) / relevantOutcomes.length;

    return (averageSuccess - 0.5) * 2; // Normalize to -1 to 1 range
  }

  private generateReasoning(
    option: DecisionOption,
    context: ReasoningContext,
    request: ReasoningRequest
  ): string {
    const factors = [
      `Selected "${option.title}" based on ${option.confidence * 100}% confidence rating`,
      `User skill level (${context.userContext.skillLevel}) supports this approach`,
      `Project scale (${context.projectContext.scale}) aligns with option risk level (${option.riskLevel})`,
      `Time constraints (${context.environmentContext.resources.time}) factored into decision`
    ];

    if (option.pros.length > 0) {
      factors.push(`Key advantages: ${option.pros.slice(0, 2).join(', ')}`);
    }

    return factors.join('. ') + '.';
  }

  private identifyRisksAndMitigations(
    option: DecisionOption,
    context: ReasoningContext
  ): { risk: string; mitigation: string }[] {
    const risks: { risk: string; mitigation: string }[] = [];

    // Add risks based on option characteristics
    if (option.riskLevel === 'high') {
      risks.push({
        risk: 'High complexity may lead to implementation challenges',
        mitigation: 'Break down into smaller, manageable tasks with regular checkpoints'
      });
    }

    if (option.estimatedEffort > 20) {
      risks.push({
        risk: 'High effort estimate may lead to timeline delays',
        mitigation: 'Add buffer time and consider parallel development where possible'
      });
    }

    // Add context-specific risks
    if (context.userContext.skillLevel === 'beginner' && option.riskLevel !== 'low') {
      risks.push({
        risk: 'Skill level may not match task complexity',
        mitigation: 'Seek mentorship or additional training before starting'
      });
    }

    return risks;
  }

  private identifyContextualFactors(
    context: ReasoningContext,
    request: ReasoningRequest
  ): string[] {
    const factors = [];

    factors.push(`Project type: ${context.projectContext.type}`);
    factors.push(`User skill level: ${context.userContext.skillLevel}`);
    factors.push(`Time constraint: ${context.environmentContext.resources.time}`);

    if (request.constraints && request.constraints.length > 0) {
      factors.push(`Constraints: ${request.constraints.join(', ')}`);
    }

    if (context.historicalContext.patterns.length > 0) {
      factors.push('Historical patterns considered in decision');
    }

    return factors;
  }

  private generateLearningPoints(
    option: DecisionOption,
    context: ReasoningContext
  ): string[] {
    const learningPoints = [];

    if (context.userContext.skillLevel !== 'expert') {
      learningPoints.push(`This approach will develop skills in: ${option.title.toLowerCase()}`);
    }

    if (option.riskLevel === 'medium' || option.riskLevel === 'high') {
      learningPoints.push('Monitor implementation closely for early risk indicators');
    }

    learningPoints.push('Document decision rationale for future reference');
    learningPoints.push('Track actual vs estimated effort for calibration');

    return learningPoints;
  }

  private async recordDecision(
    request: ReasoningRequest,
    result: ReasoningResult,
    context: ReasoningContext
  ): Promise<void> {
    const decision: DecisionRecord = {
      id: `decision-${Date.now()}`,
      timestamp: new Date(),
      context: request.question,
      options: [result.recommendation, ...result.alternativeOptions],
      selectedOption: result.recommendation.id,
      reasoning: result.reasoning
    };

    // Store decision for future learning
    this.context.historicalContext.previousDecisions.push(decision);

    // Keep only last 100 decisions
    if (this.context.historicalContext.previousDecisions.length > 100) {
      this.context.historicalContext.previousDecisions =
        this.context.historicalContext.previousDecisions.slice(-100);
    }
  }

  private async findRelevantPatterns(question: string): Promise<PatternRecord[]> {
    // Simple keyword-based pattern matching
    // In production, this would use more sophisticated similarity matching
    const keywords = question.toLowerCase().split(' ');

    return this.context.historicalContext.patterns.filter(pattern =>
      keywords.some(keyword => pattern.pattern.toLowerCase().includes(keyword))
    );
  }

  private createFallbackResult(request: ReasoningRequest): ReasoningResult {
    const fallbackOption: DecisionOption = {
      id: 'fallback',
      title: 'Standard Approach',
      description: 'Use established best practices for this type of task',
      pros: ['Well-tested', 'Lower risk', 'Good documentation'],
      cons: ['May not be optimal', 'Less innovative'],
      estimatedEffort: 15,
      riskLevel: 'low',
      confidence: 0.6
    };

    return {
      recommendation: fallbackOption,
      reasoning: 'Selected standard approach due to insufficient context for detailed analysis',
      confidence: 0.6,
      alternativeOptions: [],
      risksAndMitigations: [
        { risk: 'May not be optimal solution', mitigation: 'Review and adjust as more context becomes available' }
      ],
      contextualFactors: ['Limited context available'],
      learningPoints: ['Gather more specific requirements for better recommendations']
    };
  }

  // Public methods for context management
  updateContext(updates: Partial<ReasoningContext>): void {
    this.context = { ...this.context, ...updates };
  }

  getContext(): ReasoningContext {
    return { ...this.context };
  }

  async recordOutcome(decisionId: string, outcome: Partial<OutcomeRecord>): Promise<void> {
    const existingDecision = this.context.historicalContext.previousDecisions
      .find(d => d.id === decisionId);

    if (existingDecision) {
      existingDecision.outcome = {
        success: outcome.actualDuration ? outcome.actualDuration <= (outcome.actualEffort || 0) * 1.2 : true,
        metrics: outcome.qualityMetrics || {},
        feedback: 'No feedback provided',
        ...outcome
      };
    }

    // Store outcome record
    if (outcome.decisionId) {
      this.context.historicalContext.outcomes.push(outcome as OutcomeRecord);
    }
  }

  async analyzePatterns(): Promise<PatternRecord[]> {
    // Analyze historical decisions to identify patterns
    const decisions = this.context.historicalContext.previousDecisions;
    const patterns: Map<string, PatternRecord> = new Map();

    decisions.forEach(decision => {
      const patternKey = `${decision.selectedOption}-${decision.context.substring(0, 20)}`;

      if (patterns.has(patternKey)) {
        const pattern = patterns.get(patternKey)!;
        pattern.frequency++;
        if (decision.outcome?.success) {
          pattern.successRate = (pattern.successRate * (pattern.frequency - 1) + 1) / pattern.frequency;
        }
      } else {
        patterns.set(patternKey, {
          id: patternKey,
          pattern: decision.selectedOption,
          frequency: 1,
          successRate: decision.outcome?.success ? 1 : 0,
          contexts: [decision.context],
          recommendations: []
        });
      }
    });

    return Array.from(patterns.values());
  }
}

export default ContextualReasoning;