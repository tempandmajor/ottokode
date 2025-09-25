import { EventEmitter } from '../../utils/EventEmitter';

export interface Memory {
  id: string;
  type: 'short_term' | 'long_term' | 'episodic' | 'semantic' | 'procedural';
  content: any;
  metadata: {
    timestamp: Date;
    importance: number; // 1-10 scale
    accessCount: number;
    lastAccessed: Date;
    tags: string[];
    source: string;
    confidence: number; // 0-1 scale
    context: Record<string, any>;
  };
  embedding?: number[]; // Vector embedding for semantic search
  expiresAt?: Date;
  associatedMemories: string[]; // Links to related memories
}

export interface UserProfile {
  id: string;
  preferences: {
    codeStyle: Record<string, any>;
    preferredLanguages: string[];
    workingHours: { start: string; end: string; timezone: string };
    communicationStyle: 'concise' | 'detailed' | 'adaptive';
    errorHandling: 'strict' | 'permissive' | 'guided';
    feedbackFrequency: 'minimal' | 'moderate' | 'frequent';
  };
  patterns: {
    commonTasks: Task[];
    frequentFiles: string[];
    codePatterns: CodePattern[];
    workflowPreferences: WorkflowPreference[];
  };
  learningProgress: {
    skillLevel: Record<string, number>; // skill -> proficiency (0-1)
    improvementAreas: string[];
    achievements: Achievement[];
  };
  context: {
    currentProject: string;
    recentSessions: Session[];
    activeGoals: Goal[];
  };
}

export interface Task {
  id: string;
  description: string;
  frequency: number;
  lastPerformed: Date;
  averageTime: number;
  successRate: number;
  commonErrors: string[];
}

export interface CodePattern {
  id: string;
  pattern: string;
  context: string[];
  frequency: number;
  effectiveness: number;
  lastUsed: Date;
}

export interface WorkflowPreference {
  id: string;
  scenario: string;
  preferredAgents: string[];
  stepOrder: string[];
  customizations: Record<string, any>;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: Date;
  category: 'productivity' | 'quality' | 'learning' | 'collaboration';
}

export interface Session {
  id: string;
  startTime: Date;
  endTime?: Date;
  activities: Activity[];
  productivity: number;
  satisfaction?: number;
}

export interface Activity {
  id: string;
  type: 'coding' | 'debugging' | 'reviewing' | 'planning' | 'learning';
  startTime: Date;
  endTime: Date;
  details: Record<string, any>;
  outcome: 'success' | 'failure' | 'partial' | 'abandoned';
}

export interface Goal {
  id: string;
  description: string;
  category: 'skill' | 'project' | 'productivity' | 'quality';
  priority: 'low' | 'medium' | 'high';
  targetDate: Date;
  progress: number; // 0-1 scale
  milestones: Milestone[];
  createdAt: Date;
}

export interface Milestone {
  id: string;
  description: string;
  targetDate: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface ContextualMemory {
  userId: string;
  projectId: string;
  sessionId: string;
  taskId: string;
  agentId: string;
  timestamp: Date;
  content: Record<string, any>;
}

export interface LearningInsight {
  id: string;
  type: 'pattern' | 'preference' | 'improvement' | 'anomaly';
  description: string;
  confidence: number;
  evidence: Evidence[];
  actionable: boolean;
  recommendations: string[];
  createdAt: Date;
}

export interface Evidence {
  type: 'behavioral' | 'performance' | 'feedback' | 'outcome';
  data: Record<string, any>;
  weight: number;
  timestamp: Date;
}

class MemorySystemService extends EventEmitter {
  private memories = new Map<string, Memory>();
  private userProfiles = new Map<string, UserProfile>();
  private contextualMemories: ContextualMemory[] = [];
  private insights: LearningInsight[] = [];

  private maxShortTermMemories = 100;
  private maxLongTermMemories = 10000;
  private cleanupInterval: NodeJS.Timer;

  constructor() {
    super();
    this.startCleanupProcess();
  }

  // Memory Management
  async store(memory: Omit<Memory, 'id' | 'metadata'>, metadata: Partial<Memory['metadata']>): Promise<string> {
    const id = this.generateMemoryId();

    const fullMemory: Memory = {
      id,
      ...memory,
      metadata: {
        timestamp: new Date(),
        importance: 5,
        accessCount: 0,
        lastAccessed: new Date(),
        tags: [],
        source: 'system',
        confidence: 1.0,
        context: {},
        ...metadata
      },
      associatedMemories: []
    };

    // Generate embedding for semantic search
    if (typeof memory.content === 'string') {
      fullMemory.embedding = await this.generateEmbedding(memory.content);
    }

    this.memories.set(id, fullMemory);

    // Manage memory capacity
    await this.manageMemoryCapacity(memory.type);

    // Find and link related memories
    await this.linkRelatedMemories(fullMemory);

    this.emit('memory:stored', fullMemory);
    return id;
  }

  async retrieve(query: string, options?: {
    type?: Memory['type'][];
    limit?: number;
    minImportance?: number;
    tags?: string[];
    timeRange?: { start: Date; end: Date };
  }): Promise<Memory[]> {
    const {
      type,
      limit = 10,
      minImportance = 1,
      tags,
      timeRange
    } = options || {};

    let candidates = Array.from(this.memories.values());

    // Filter by type
    if (type && type.length > 0) {
      candidates = candidates.filter(m => type.includes(m.type));
    }

    // Filter by importance
    candidates = candidates.filter(m => m.metadata.importance >= minImportance);

    // Filter by tags
    if (tags && tags.length > 0) {
      candidates = candidates.filter(m =>
        tags.some(tag => m.metadata.tags.includes(tag))
      );
    }

    // Filter by time range
    if (timeRange) {
      candidates = candidates.filter(m =>
        m.metadata.timestamp >= timeRange.start &&
        m.metadata.timestamp <= timeRange.end
      );
    }

    // Semantic search using embeddings
    const queryEmbedding = await this.generateEmbedding(query);
    const scoredMemories = candidates
      .filter(m => m.embedding)
      .map(memory => ({
        memory,
        score: this.calculateSimilarity(queryEmbedding, memory.embedding!)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.memory);

    // Update access metadata
    scoredMemories.forEach(memory => {
      memory.metadata.accessCount++;
      memory.metadata.lastAccessed = new Date();
      memory.metadata.importance = Math.min(10, memory.metadata.importance + 0.1);
    });

    this.emit('memory:retrieved', { query, results: scoredMemories });
    return scoredMemories;
  }

  async update(id: string, updates: Partial<Memory>): Promise<boolean> {
    const memory = this.memories.get(id);
    if (!memory) return false;

    const updatedMemory = { ...memory, ...updates };
    updatedMemory.metadata.lastAccessed = new Date();

    this.memories.set(id, updatedMemory);
    this.emit('memory:updated', updatedMemory);
    return true;
  }

  async forget(id: string): Promise<boolean> {
    const memory = this.memories.get(id);
    if (!memory) return false;

    // Remove associations
    memory.associatedMemories.forEach(associatedId => {
      const associated = this.memories.get(associatedId);
      if (associated) {
        associated.associatedMemories = associated.associatedMemories.filter(
          memId => memId !== id
        );
      }
    });

    this.memories.delete(id);
    this.emit('memory:forgotten', { id, memory });
    return true;
  }

  // User Profile Management
  async createUserProfile(userId: string, initialProfile?: Partial<UserProfile>): Promise<UserProfile> {
    const profile: UserProfile = {
      id: userId,
      preferences: {
        codeStyle: {},
        preferredLanguages: ['typescript', 'javascript'],
        workingHours: { start: '09:00', end: '17:00', timezone: 'UTC' },
        communicationStyle: 'adaptive',
        errorHandling: 'guided',
        feedbackFrequency: 'moderate'
      },
      patterns: {
        commonTasks: [],
        frequentFiles: [],
        codePatterns: [],
        workflowPreferences: []
      },
      learningProgress: {
        skillLevel: {},
        improvementAreas: [],
        achievements: []
      },
      context: {
        currentProject: '',
        recentSessions: [],
        activeGoals: []
      },
      ...initialProfile
    };

    this.userProfiles.set(userId, profile);
    this.emit('profile:created', profile);
    return profile;
  }

  getUserProfile(userId: string): UserProfile | undefined {
    return this.userProfiles.get(userId);
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    const profile = this.userProfiles.get(userId);
    if (!profile) return false;

    const updatedProfile = { ...profile, ...updates };
    this.userProfiles.set(userId, updatedProfile);
    this.emit('profile:updated', updatedProfile);
    return true;
  }

  // Learning and Adaptation
  async learnFromInteraction(interaction: {
    userId: string;
    type: 'success' | 'failure' | 'preference' | 'feedback';
    context: Record<string, any>;
    outcome: Record<string, any>;
    timestamp: Date;
  }): Promise<void> {
    const { userId, type, context, outcome, timestamp } = interaction;

    // Store the interaction as a memory
    await this.store({
      type: 'episodic',
      content: {
        interactionType: type,
        context,
        outcome,
        userId
      }
    }, {
      importance: this.calculateImportance(type, outcome),
      tags: ['interaction', type, userId],
      source: 'learning_system',
      timestamp
    });

    // Update user profile based on learning
    await this.updateUserProfileFromInteraction(userId, interaction);

    // Generate insights
    await this.generateInsights(userId, interaction);

    this.emit('learning:interaction', interaction);
  }

  private async updateUserProfileFromInteraction(
    userId: string,
    interaction: any
  ): Promise<void> {
    const profile = this.userProfiles.get(userId);
    if (!profile) return;

    switch (interaction.type) {
      case 'success':
        this.updateSuccessPattern(profile, interaction);
        break;
      case 'failure':
        this.updateFailurePattern(profile, interaction);
        break;
      case 'preference':
        this.updatePreferences(profile, interaction);
        break;
      case 'feedback':
        this.updateFromFeedback(profile, interaction);
        break;
    }

    this.userProfiles.set(userId, profile);
  }

  private updateSuccessPattern(profile: UserProfile, interaction: any): void {
    const { context, outcome } = interaction;

    // Update skill levels
    if (context.skill) {
      const currentLevel = profile.learningProgress.skillLevel[context.skill] || 0;
      profile.learningProgress.skillLevel[context.skill] = Math.min(1, currentLevel + 0.05);
    }

    // Track successful patterns
    if (context.codePattern) {
      const existingPattern = profile.patterns.codePatterns.find(
        p => p.pattern === context.codePattern
      );

      if (existingPattern) {
        existingPattern.frequency++;
        existingPattern.effectiveness = Math.min(1, existingPattern.effectiveness + 0.1);
        existingPattern.lastUsed = interaction.timestamp;
      } else {
        profile.patterns.codePatterns.push({
          id: this.generateId(),
          pattern: context.codePattern,
          context: context.codeContext || [],
          frequency: 1,
          effectiveness: 0.8,
          lastUsed: interaction.timestamp
        });
      }
    }

    // Update task success
    if (context.taskType) {
      const existingTask = profile.patterns.commonTasks.find(
        t => t.description === context.taskType
      );

      if (existingTask) {
        existingTask.frequency++;
        existingTask.successRate = Math.min(1, existingTask.successRate + 0.1);
        existingTask.lastPerformed = interaction.timestamp;
        existingTask.averageTime = (existingTask.averageTime + (outcome.duration || 0)) / 2;
      } else {
        profile.patterns.commonTasks.push({
          id: this.generateId(),
          description: context.taskType,
          frequency: 1,
          lastPerformed: interaction.timestamp,
          averageTime: outcome.duration || 0,
          successRate: 1,
          commonErrors: []
        });
      }
    }
  }

  private updateFailurePattern(profile: UserProfile, interaction: any): void {
    const { context, outcome } = interaction;

    // Update skill levels (decrease slightly)
    if (context.skill) {
      const currentLevel = profile.learningProgress.skillLevel[context.skill] || 0;
      profile.learningProgress.skillLevel[context.skill] = Math.max(0, currentLevel - 0.02);
    }

    // Track common errors
    if (context.taskType && outcome.error) {
      const existingTask = profile.patterns.commonTasks.find(
        t => t.description === context.taskType
      );

      if (existingTask) {
        if (!existingTask.commonErrors.includes(outcome.error)) {
          existingTask.commonErrors.push(outcome.error);
        }
        existingTask.successRate = Math.max(0, existingTask.successRate - 0.1);
      }
    }

    // Add to improvement areas
    if (context.skill && !profile.learningProgress.improvementAreas.includes(context.skill)) {
      profile.learningProgress.improvementAreas.push(context.skill);
    }
  }

  private updatePreferences(profile: UserProfile, interaction: any): void {
    const { context } = interaction;

    if (context.codeStyle) {
      Object.assign(profile.preferences.codeStyle, context.codeStyle);
    }

    if (context.language && !profile.preferences.preferredLanguages.includes(context.language)) {
      profile.preferences.preferredLanguages.push(context.language);
    }

    if (context.communicationStyle) {
      profile.preferences.communicationStyle = context.communicationStyle;
    }
  }

  private updateFromFeedback(profile: UserProfile, interaction: any): void {
    const { outcome } = interaction;

    if (outcome.satisfaction) {
      // Adjust communication style based on satisfaction
      if (outcome.satisfaction < 0.3) {
        profile.preferences.communicationStyle = 'detailed';
      } else if (outcome.satisfaction > 0.8) {
        profile.preferences.communicationStyle = 'concise';
      }
    }

    if (outcome.feedbackType === 'too_verbose') {
      profile.preferences.feedbackFrequency = 'minimal';
    } else if (outcome.feedbackType === 'need_more_info') {
      profile.preferences.feedbackFrequency = 'frequent';
    }
  }

  private async generateInsights(userId: string, interaction: any): Promise<void> {
    const recentInteractions = await this.retrieve(`user:${userId} interaction`, {
      type: ['episodic'],
      limit: 50,
      timeRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        end: new Date()
      }
    });

    // Pattern detection
    const patterns = this.detectPatterns(recentInteractions);

    // Anomaly detection
    const anomalies = this.detectAnomalies(recentInteractions);

    // Performance trends
    const trends = this.analyzeTrends(recentInteractions);

    // Generate actionable insights
    const newInsights: LearningInsight[] = [];

    patterns.forEach(pattern => {
      newInsights.push({
        id: this.generateId(),
        type: 'pattern',
        description: pattern.description,
        confidence: pattern.confidence,
        evidence: pattern.evidence,
        actionable: true,
        recommendations: pattern.recommendations,
        createdAt: new Date()
      });
    });

    anomalies.forEach(anomaly => {
      newInsights.push({
        id: this.generateId(),
        type: 'anomaly',
        description: anomaly.description,
        confidence: anomaly.confidence,
        evidence: anomaly.evidence,
        actionable: anomaly.actionable,
        recommendations: anomaly.recommendations,
        createdAt: new Date()
      });
    });

    this.insights.push(...newInsights);

    // Keep only recent insights
    this.insights = this.insights.filter(
      insight => insight.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    if (newInsights.length > 0) {
      this.emit('insights:generated', { userId, insights: newInsights });
    }
  }

  private detectPatterns(memories: Memory[]): any[] {
    // Implement pattern detection logic
    return [];
  }

  private detectAnomalies(memories: Memory[]): any[] {
    // Implement anomaly detection logic
    return [];
  }

  private analyzeTrends(memories: Memory[]): any[] {
    // Implement trend analysis logic
    return [];
  }

  // Contextual Memory
  async storeContextualMemory(memory: Omit<ContextualMemory, 'timestamp'>): Promise<void> {
    const contextualMemory: ContextualMemory = {
      ...memory,
      timestamp: new Date()
    };

    this.contextualMemories.push(contextualMemory);

    // Keep only recent contextual memories
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    this.contextualMemories = this.contextualMemories.filter(
      cm => cm.timestamp > new Date(Date.now() - maxAge)
    );

    this.emit('contextual_memory:stored', contextualMemory);
  }

  getContextualMemories(filters: {
    userId?: string;
    projectId?: string;
    sessionId?: string;
    taskId?: string;
    agentId?: string;
    timeRange?: { start: Date; end: Date };
  }): ContextualMemory[] {
    let results = this.contextualMemories;

    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'timeRange') {
        results = results.filter(cm => (cm as any)[key] === value);
      }
    });

    if (filters.timeRange) {
      results = results.filter(cm =>
        cm.timestamp >= filters.timeRange!.start &&
        cm.timestamp <= filters.timeRange!.end
      );
    }

    return results;
  }

  // Insights and Analytics
  getInsights(userId?: string, type?: LearningInsight['type']): LearningInsight[] {
    let results = this.insights;

    if (userId) {
      results = results.filter(insight =>
        insight.evidence.some(e => e.data.userId === userId)
      );
    }

    if (type) {
      results = results.filter(insight => insight.type === type);
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  // Utility Methods
  private async generateEmbedding(text: string): Promise<number[]> {
    // In a real implementation, this would use an embedding model
    // For now, return a mock embedding
    const words = text.toLowerCase().split(' ');
    const embedding = new Array(384).fill(0);

    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      embedding[hash % 384] += 1;
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  private calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) return 0;

    const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
    return Math.max(0, dotProduct); // Cosine similarity (already normalized)
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private calculateImportance(type: string, outcome: any): number {
    switch (type) {
      case 'success':
        return outcome.impact ? Math.min(10, 5 + outcome.impact * 2) : 6;
      case 'failure':
        return outcome.severity ? Math.min(10, 7 + outcome.severity) : 8;
      case 'preference':
        return 4;
      case 'feedback':
        return outcome.satisfaction ? Math.min(10, 3 + outcome.satisfaction * 4) : 5;
      default:
        return 5;
    }
  }

  private async manageMemoryCapacity(type: Memory['type']): Promise<void> {
    const memories = Array.from(this.memories.values()).filter(m => m.type === type);
    const maxCapacity = type === 'short_term' ? this.maxShortTermMemories : this.maxLongTermMemories;

    if (memories.length > maxCapacity) {
      // Remove least important, least accessed memories
      const toRemove = memories
        .sort((a, b) => {
          const importanceScore = b.metadata.importance - a.metadata.importance;
          const accessScore = b.metadata.accessCount - a.metadata.accessCount;
          const recencyScore = b.metadata.lastAccessed.getTime() - a.metadata.lastAccessed.getTime();

          return importanceScore || accessScore || recencyScore;
        })
        .slice(maxCapacity);

      for (const memory of toRemove) {
        await this.forget(memory.id);
      }
    }
  }

  private async linkRelatedMemories(memory: Memory): Promise<void> {
    if (!memory.embedding) return;

    const allMemories = Array.from(this.memories.values()).filter(m =>
      m.id !== memory.id && m.embedding
    );

    const related = allMemories
      .map(m => ({
        memory: m,
        similarity: this.calculateSimilarity(memory.embedding!, m.embedding!)
      }))
      .filter(item => item.similarity > 0.7) // High similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5) // Top 5 related memories
      .map(item => item.memory.id);

    memory.associatedMemories = related;

    // Update reverse associations
    related.forEach(relatedId => {
      const relatedMemory = this.memories.get(relatedId);
      if (relatedMemory && !relatedMemory.associatedMemories.includes(memory.id)) {
        relatedMemory.associatedMemories.push(memory.id);
      }
    });
  }

  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(async () => {
      const now = new Date();

      // Remove expired memories
      const expiredMemories = Array.from(this.memories.values())
        .filter(m => m.expiresAt && m.expiresAt < now);

      for (const memory of expiredMemories) {
        await this.forget(memory.id);
      }

      // Clean old contextual memories
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      this.contextualMemories = this.contextualMemories.filter(
        cm => cm.timestamp > new Date(now.getTime() - maxAge)
      );

      // Clean old insights
      const maxInsightAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      this.insights = this.insights.filter(
        insight => insight.createdAt > new Date(now.getTime() - maxInsightAge)
      );

    }, 60 * 60 * 1000); // Run every hour
  }

  private generateMemoryId(): string {
    return `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API
  getMemoryStats(): {
    totalMemories: number;
    memoryTypes: Record<Memory['type'], number>;
    averageImportance: number;
    totalUserProfiles: number;
    totalInsights: number;
  } {
    const memories = Array.from(this.memories.values());
    const memoryTypes = memories.reduce((acc, memory) => {
      acc[memory.type] = (acc[memory.type] || 0) + 1;
      return acc;
    }, {} as Record<Memory['type'], number>);

    const averageImportance = memories.length > 0
      ? memories.reduce((sum, m) => sum + m.metadata.importance, 0) / memories.length
      : 0;

    return {
      totalMemories: memories.length,
      memoryTypes,
      averageImportance,
      totalUserProfiles: this.userProfiles.size,
      totalInsights: this.insights.length
    };
  }

  // Cleanup
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.memories.clear();
    this.userProfiles.clear();
    this.contextualMemories = [];
    this.insights = [];
    this.removeAllListeners();
  }
}

export const memorySystem = new MemorySystemService();