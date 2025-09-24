import { EventEmitter } from 'events';

export interface MemoryEntry {
  id: string;
  type: 'interaction' | 'solution' | 'pattern' | 'preference' | 'context' | 'error';
  content: any;
  metadata: MemoryMetadata;
  embeddings?: number[];
  tags: string[];
  relationships: MemoryRelationship[];
  confidence: number;
  accessCount: number;
  lastAccessed: Date;
}

export interface MemoryMetadata {
  created: Date;
  updated: Date;
  source: string;
  context: ContextInfo;
  importance: number;
  volatility: 'permanent' | 'session' | 'temporary';
  userId?: string;
  projectId?: string;
}

export interface ContextInfo {
  files: string[];
  functions: string[];
  variables: string[];
  frameworks: string[];
  language: string;
  taskType: string;
}

export interface MemoryRelationship {
  targetId: string;
  type: 'similar' | 'caused_by' | 'leads_to' | 'part_of' | 'conflicts_with';
  strength: number;
  description?: string;
}

export interface MemoryQuery {
  content?: string;
  type?: string[];
  tags?: string[];
  context?: Partial<ContextInfo>;
  timeRange?: { start: Date; end: Date };
  minConfidence?: number;
  minImportance?: number;
  limit?: number;
  includeRelated?: boolean;
}

export interface MemoryCluster {
  id: string;
  name: string;
  description: string;
  entries: string[];
  centroid: number[];
  coherence: number;
  created: Date;
  updated: Date;
}

export interface LearningPattern {
  id: string;
  name: string;
  description: string;
  pattern: any;
  frequency: number;
  accuracy: number;
  contexts: ContextInfo[];
  examples: string[];
}

export interface MemoryStats {
  totalEntries: number;
  entriesByType: Record<string, number>;
  memoryUsage: number;
  clusters: number;
  patterns: number;
  averageConfidence: number;
  accessFrequency: Record<string, number>;
}

class AgentMemorySystem extends EventEmitter {
  private memories: Map<string, MemoryEntry> = new Map();
  private clusters: Map<string, MemoryCluster> = new Map();
  private patterns: Map<string, LearningPattern> = new Map();
  private isInitialized = false;
  private memoryLimit = 10000; // Maximum number of memories to keep
  private cleanupThreshold = 0.8; // Cleanup when 80% full

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Load memories from persistent storage
    await this.loadPersistedMemories();

    // Initialize clustering system
    await this.initializeClustering();

    // Start background maintenance
    this.startBackgroundMaintenance();

    this.isInitialized = true;
    this.emit('initialized');
  }

  private async loadPersistedMemories(): Promise<void> {
    // Load from IndexedDB or other persistent storage
    // Implementation would restore saved memories
  }

  private async initializeClustering(): Promise<void> {
    // Initialize memory clustering for better organization
    this.clusterMemories();
  }

  private startBackgroundMaintenance(): Promise<void> {
    // Periodic cleanup and optimization
    setInterval(async () => {
      await this.performMaintenance();
    }, 300000); // Every 5 minutes

    return Promise.resolve();
  }

  async storeMemory(entry: Omit<MemoryEntry, 'id' | 'accessCount' | 'lastAccessed'>): Promise<string> {
    const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const memory: MemoryEntry = {
      id: memoryId,
      accessCount: 0,
      lastAccessed: new Date(),
      ...entry
    };

    // Generate embeddings for content if needed
    if (!memory.embeddings && typeof memory.content === 'string') {
      memory.embeddings = await this.generateEmbeddings(memory.content);
    }

    this.memories.set(memoryId, memory);

    // Update clusters
    await this.updateClusters(memory);

    // Check for patterns
    await this.detectPatterns(memory);

    // Cleanup if needed
    if (this.memories.size > this.memoryLimit * this.cleanupThreshold) {
      await this.performCleanup();
    }

    this.emit('memoryStored', { memoryId, memory });

    return memoryId;
  }

  async retrieveMemories(query: MemoryQuery): Promise<MemoryEntry[]> {
    let results: MemoryEntry[] = Array.from(this.memories.values());

    // Filter by type
    if (query.type && query.type.length > 0) {
      results = results.filter(memory => query.type!.includes(memory.type));
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter(memory =>
        query.tags!.some(tag => memory.tags.includes(tag))
      );
    }

    // Filter by context
    if (query.context) {
      results = results.filter(memory => this.matchesContext(memory.metadata.context, query.context!));
    }

    // Filter by time range
    if (query.timeRange) {
      results = results.filter(memory =>
        memory.metadata.created >= query.timeRange!.start &&
        memory.metadata.created <= query.timeRange!.end
      );
    }

    // Filter by confidence
    if (query.minConfidence !== undefined) {
      results = results.filter(memory => memory.confidence >= query.minConfidence!);
    }

    // Filter by importance
    if (query.minImportance !== undefined) {
      results = results.filter(memory => memory.metadata.importance >= query.minImportance!);
    }

    // Semantic search if content query provided
    if (query.content) {
      const queryEmbeddings = await this.generateEmbeddings(query.content);
      results = results
        .map(memory => ({
          memory,
          similarity: memory.embeddings
            ? this.calculateSimilarity(queryEmbeddings, memory.embeddings)
            : 0
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .map(result => result.memory);
    } else {
      // Sort by relevance (access count, recency, importance)
      results.sort((a, b) => {
        const scoreA = this.calculateRelevanceScore(a);
        const scoreB = this.calculateRelevanceScore(b);
        return scoreB - scoreA;
      });
    }

    // Apply limit
    if (query.limit && query.limit > 0) {
      results = results.slice(0, query.limit);
    }

    // Include related memories if requested
    if (query.includeRelated) {
      const relatedMemories = await this.getRelatedMemories(results);
      results = [...results, ...relatedMemories];
    }

    // Update access counts
    results.forEach(memory => {
      memory.accessCount++;
      memory.lastAccessed = new Date();
    });

    this.emit('memoriesRetrieved', { query, count: results.length });

    return results;
  }

  private matchesContext(memoryContext: ContextInfo, queryContext: Partial<ContextInfo>): boolean {
    if (queryContext.language && memoryContext.language !== queryContext.language) {
      return false;
    }

    if (queryContext.taskType && memoryContext.taskType !== queryContext.taskType) {
      return false;
    }

    if (queryContext.frameworks && queryContext.frameworks.length > 0) {
      const hasCommonFramework = queryContext.frameworks.some(framework =>
        memoryContext.frameworks.includes(framework)
      );
      if (!hasCommonFramework) return false;
    }

    if (queryContext.files && queryContext.files.length > 0) {
      const hasCommonFile = queryContext.files.some(file =>
        memoryContext.files.includes(file)
      );
      if (!hasCommonFile) return false;
    }

    return true;
  }

  private calculateRelevanceScore(memory: MemoryEntry): number {
    const now = Date.now();
    const age = now - memory.metadata.created.getTime();
    const recency = Math.exp(-age / (7 * 24 * 60 * 60 * 1000)); // 7-day decay

    const lastAccessAge = now - memory.lastAccessed.getTime();
    const accessRecency = Math.exp(-lastAccessAge / (24 * 60 * 60 * 1000)); // 1-day decay

    return (
      memory.metadata.importance * 0.3 +
      memory.confidence * 0.2 +
      recency * 0.2 +
      Math.log(memory.accessCount + 1) * 0.15 +
      accessRecency * 0.15
    );
  }

  private async getRelatedMemories(memories: MemoryEntry[]): Promise<MemoryEntry[]> {
    const relatedIds = new Set<string>();

    memories.forEach(memory => {
      memory.relationships.forEach(rel => {
        if (rel.strength > 0.6) { // High relationship strength
          relatedIds.add(rel.targetId);
        }
      });
    });

    const relatedMemories: MemoryEntry[] = [];
    relatedIds.forEach(id => {
      const memory = this.memories.get(id);
      if (memory && !memories.includes(memory)) {
        relatedMemories.push(memory);
      }
    });

    return relatedMemories;
  }

  async createRelationship(
    sourceId: string,
    targetId: string,
    type: MemoryRelationship['type'],
    strength: number,
    description?: string
  ): Promise<void> {
    const sourceMemory = this.memories.get(sourceId);
    const targetMemory = this.memories.get(targetId);

    if (!sourceMemory || !targetMemory) {
      throw new Error('Source or target memory not found');
    }

    const relationship: MemoryRelationship = {
      targetId,
      type,
      strength,
      description
    };

    sourceMemory.relationships.push(relationship);

    // Create reciprocal relationship
    const reciprocalType = this.getReciprocalRelationType(type);
    if (reciprocalType) {
      const reciprocalRelationship: MemoryRelationship = {
        targetId: sourceId,
        type: reciprocalType,
        strength,
        description
      };
      targetMemory.relationships.push(reciprocalRelationship);
    }

    this.emit('relationshipCreated', { sourceId, targetId, type, strength });
  }

  private getReciprocalRelationType(type: MemoryRelationship['type']): MemoryRelationship['type'] | null {
    switch (type) {
      case 'similar':
        return 'similar';
      case 'caused_by':
        return 'leads_to';
      case 'leads_to':
        return 'caused_by';
      case 'part_of':
        return null; // Parent relationship would be different
      case 'conflicts_with':
        return 'conflicts_with';
      default:
        return null;
    }
  }

  private async generateEmbeddings(content: string): Promise<number[]> {
    // This would integrate with an embedding service or local model
    // For now, return mock embeddings
    const words = content.toLowerCase().split(/\s+/);
    const embedding = new Array(512).fill(0);

    // Simple word hashing to mock embeddings
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      embedding[hash % 512] += 1;
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
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private calculateSimilarity(embeddings1: number[], embeddings2: number[]): number {
    if (embeddings1.length !== embeddings2.length) return 0;

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embeddings1.length; i++) {
      dotProduct += embeddings1[i] * embeddings2[i];
      magnitude1 += embeddings1[i] * embeddings1[i];
      magnitude2 += embeddings2[i] * embeddings2[i];
    }

    return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
  }

  private async updateClusters(memory: MemoryEntry): Promise<void> {
    // Simple clustering based on embeddings and context
    if (!memory.embeddings) return;

    let bestCluster: MemoryCluster | null = null;
    let bestSimilarity = 0;

    for (const cluster of this.clusters.values()) {
      const similarity = this.calculateSimilarity(memory.embeddings, cluster.centroid);
      if (similarity > bestSimilarity && similarity > 0.7) { // Similarity threshold
        bestSimilarity = similarity;
        bestCluster = cluster;
      }
    }

    if (bestCluster) {
      bestCluster.entries.push(memory.id);
      bestCluster.updated = new Date();
    } else {
      // Create new cluster
      const clusterId = `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newCluster: MemoryCluster = {
        id: clusterId,
        name: `Cluster ${this.clusters.size + 1}`,
        description: `Auto-generated cluster for ${memory.type} memories`,
        entries: [memory.id],
        centroid: [...memory.embeddings],
        coherence: 1.0,
        created: new Date(),
        updated: new Date()
      };
      this.clusters.set(clusterId, newCluster);
    }
  }

  private async detectPatterns(memory: MemoryEntry): Promise<void> {
    // Pattern detection logic
    // This would analyze sequences of interactions or solutions
    // to identify recurring patterns

    if (memory.type === 'solution') {
      const similarSolutions = await this.retrieveMemories({
        type: ['solution'],
        context: memory.metadata.context,
        limit: 10
      });

      if (similarSolutions.length >= 3) {
        // Analyze for common patterns
        await this.analyzeForPatterns(similarSolutions);
      }
    }
  }

  private async analyzeForPatterns(memories: MemoryEntry[]): Promise<void> {
    // Analyze memories for common patterns
    // This is a simplified implementation
    const contexts = memories.map(m => m.metadata.context);
    const commonFrameworks = this.findCommonElements(contexts.map(c => c.frameworks));
    const commonTaskTypes = this.findCommonElements(contexts.map(c => c.taskType));

    if (commonFrameworks.length > 0 || commonTaskTypes.length > 0) {
      const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const pattern: LearningPattern = {
        id: patternId,
        name: `Pattern for ${commonTaskTypes[0] || 'general'} tasks`,
        description: `Common pattern involving ${commonFrameworks.join(', ')}`,
        pattern: {
          frameworks: commonFrameworks,
          taskTypes: commonTaskTypes,
          frequency: memories.length
        },
        frequency: memories.length,
        accuracy: 0.8, // Would be calculated based on success rate
        contexts,
        examples: memories.map(m => m.id).slice(0, 5)
      };

      this.patterns.set(patternId, pattern);
      this.emit('patternDetected', { patternId, pattern });
    }
  }

  private findCommonElements(arrays: any[][]): any[] {
    if (arrays.length === 0) return [];

    return arrays[0].filter(element =>
      arrays.every(array => array.includes(element))
    );
  }

  private async clusterMemories(): Promise<void> {
    // Perform K-means clustering on existing memories
    // This is a simplified implementation
    const memoriesWithEmbeddings = Array.from(this.memories.values())
      .filter(memory => memory.embeddings);

    if (memoriesWithEmbeddings.length < 5) return; // Need minimum memories

    // Simple clustering by type and context similarity
    const typeGroups = new Map<string, MemoryEntry[]>();
    memoriesWithEmbeddings.forEach(memory => {
      if (!typeGroups.has(memory.type)) {
        typeGroups.set(memory.type, []);
      }
      typeGroups.get(memory.type)!.push(memory);
    });

    for (const [type, memories] of typeGroups) {
      if (memories.length >= 3) {
        const clusterId = `cluster_${type}_${Date.now()}`;
        const centroid = this.calculateCentroid(memories.map(m => m.embeddings!));

        const cluster: MemoryCluster = {
          id: clusterId,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Cluster`,
          description: `Cluster of ${type} memories`,
          entries: memories.map(m => m.id),
          centroid,
          coherence: this.calculateCoherence(memories.map(m => m.embeddings!)),
          created: new Date(),
          updated: new Date()
        };

        this.clusters.set(clusterId, cluster);
      }
    }
  }

  private calculateCentroid(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return [];

    const dimensions = embeddings[0].length;
    const centroid = new Array(dimensions).fill(0);

    embeddings.forEach(embedding => {
      embedding.forEach((value, index) => {
        centroid[index] += value;
      });
    });

    return centroid.map(value => value / embeddings.length);
  }

  private calculateCoherence(embeddings: number[][]): number {
    if (embeddings.length < 2) return 1.0;

    const centroid = this.calculateCentroid(embeddings);
    const similarities = embeddings.map(embedding =>
      this.calculateSimilarity(embedding, centroid)
    );

    return similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
  }

  private async performMaintenance(): Promise<void> {
    // Clean up low-importance, old memories
    await this.performCleanup();

    // Recalculate clusters
    await this.reclusterMemories();

    // Update memory statistics
    this.updateStatistics();

    this.emit('maintenanceCompleted');
  }

  private async performCleanup(): Promise<void> {
    if (this.memories.size <= this.memoryLimit * this.cleanupThreshold) return;

    const memories = Array.from(this.memories.values());
    memories.sort((a, b) => {
      // Keep permanent memories
      if (a.metadata.volatility === 'permanent' && b.metadata.volatility !== 'permanent') return -1;
      if (b.metadata.volatility === 'permanent' && a.metadata.volatility !== 'permanent') return 1;

      // Sort by relevance score
      return this.calculateRelevanceScore(b) - this.calculateRelevanceScore(a);
    });

    const keepCount = Math.floor(this.memoryLimit * 0.7); // Keep 70%
    const memoriesToRemove = memories.slice(keepCount);

    memoriesToRemove.forEach(memory => {
      this.memories.delete(memory.id);
    });

    this.emit('memoryCleanup', { removed: memoriesToRemove.length, remaining: this.memories.size });
  }

  private async reclusterMemories(): Promise<void> {
    // Clear existing clusters and recalculate
    this.clusters.clear();
    await this.clusterMemories();
  }

  private updateStatistics(): void {
    // Update internal statistics for monitoring
    const stats: MemoryStats = {
      totalEntries: this.memories.size,
      entriesByType: {},
      memoryUsage: 0, // Would calculate actual memory usage
      clusters: this.clusters.size,
      patterns: this.patterns.size,
      averageConfidence: 0,
      accessFrequency: {}
    };

    // Calculate stats
    Array.from(this.memories.values()).forEach(memory => {
      stats.entriesByType[memory.type] = (stats.entriesByType[memory.type] || 0) + 1;
      stats.averageConfidence += memory.confidence;
    });

    stats.averageConfidence /= this.memories.size || 1;

    this.emit('statisticsUpdated', stats);
  }

  getStats(): MemoryStats {
    const memories = Array.from(this.memories.values());
    const entriesByType: Record<string, number> = {};
    let totalConfidence = 0;

    memories.forEach(memory => {
      entriesByType[memory.type] = (entriesByType[memory.type] || 0) + 1;
      totalConfidence += memory.confidence;
    });

    return {
      totalEntries: memories.length,
      entriesByType,
      memoryUsage: 0, // Would calculate actual usage
      clusters: this.clusters.size,
      patterns: this.patterns.size,
      averageConfidence: totalConfidence / memories.length || 0,
      accessFrequency: {}
    };
  }

  getClusters(): MemoryCluster[] {
    return Array.from(this.clusters.values());
  }

  getPatterns(): LearningPattern[] {
    return Array.from(this.patterns.values());
  }

  async forgetMemory(memoryId: string): Promise<void> {
    const memory = this.memories.get(memoryId);
    if (!memory) return;

    // Remove from clusters
    for (const cluster of this.clusters.values()) {
      const index = cluster.entries.indexOf(memoryId);
      if (index !== -1) {
        cluster.entries.splice(index, 1);
      }
    }

    // Remove relationships
    for (const otherMemory of this.memories.values()) {
      otherMemory.relationships = otherMemory.relationships.filter(rel => rel.targetId !== memoryId);
    }

    this.memories.delete(memoryId);
    this.emit('memoryForgotten', { memoryId });
  }

  async clearMemories(criteria?: { type?: string; olderThan?: Date; volatility?: string }): Promise<number> {
    let cleared = 0;
    const memoriesToRemove: string[] = [];

    for (const [id, memory] of this.memories) {
      let shouldRemove = true;

      if (criteria?.type && memory.type !== criteria.type) {
        shouldRemove = false;
      }

      if (criteria?.olderThan && memory.metadata.created > criteria.olderThan) {
        shouldRemove = false;
      }

      if (criteria?.volatility && memory.metadata.volatility !== criteria.volatility) {
        shouldRemove = false;
      }

      if (shouldRemove) {
        memoriesToRemove.push(id);
      }
    }

    for (const id of memoriesToRemove) {
      await this.forgetMemory(id);
      cleared++;
    }

    return cleared;
  }
}

export const agentMemorySystem = new AgentMemorySystem();
export default agentMemorySystem;