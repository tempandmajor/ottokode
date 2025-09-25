import { EventEmitter } from '../../utils/EventEmitter';
import { aiService } from '../ai/ResponsesAIService';
import { codebaseIndexer, IndexedFile, FileMetadata, CodeStructure } from '../indexing/CodebaseIndexer';

export interface SearchQuery {
  id: string;
  query: string;
  type: 'semantic' | 'exact' | 'fuzzy' | 'regex' | 'natural_language';
  filters: SearchFilters;
  context: SearchContext;
  timestamp: Date;
  userId?: string;
}

export interface SearchFilters {
  languages?: string[];
  fileTypes?: string[];
  pathPatterns?: string[];
  excludePatterns?: string[];
  modifiedAfter?: Date;
  modifiedBefore?: Date;
  sizeRange?: { min: number; max: number };
  complexity?: { min: number; max: number };
  hasTests?: boolean;
  hasDocumentation?: boolean;
  qualityScore?: { min: number; max: number };
}

export interface SearchContext {
  currentFile?: string;
  selectedText?: string;
  cursorPosition?: { line: number; column: number };
  openFiles?: string[];
  recentFiles?: string[];
  workingDirectory?: string;
  gitBranch?: string;
  projectType?: string;
  userIntent?: 'understand' | 'modify' | 'debug' | 'test' | 'document' | 'refactor';
}

export interface SearchResult {
  id: string;
  file: IndexedFile;
  relevanceScore: number;
  matchType: 'exact' | 'semantic' | 'fuzzy' | 'contextual';
  matches: SearchMatch[];
  explanation: string;
  suggestedActions: string[];
  relatedResults: string[];
}

export interface SearchMatch {
  type: 'content' | 'function' | 'class' | 'interface' | 'variable' | 'comment' | 'import';
  content: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  confidence: number;
  context: string;
  highlighted: string;
}

export interface SemanticVector {
  id: string;
  filePath: string;
  chunkId: string;
  content: string;
  vector: number[];
  metadata: {
    type: 'function' | 'class' | 'interface' | 'comment' | 'documentation' | 'code_block';
    name?: string;
    language: string;
    startLine: number;
    endLine: number;
    complexity?: number;
    keywords: string[];
    description?: string;
  };
  lastUpdated: Date;
}

export interface SearchSuggestion {
  query: string;
  description: string;
  confidence: number;
  category: 'completion' | 'correction' | 'related' | 'popular' | 'contextual';
  examples?: string[];
}

export interface SearchAnalytics {
  totalSearches: number;
  averageResponseTime: number;
  popularQueries: Array<{ query: string; count: number }>;
  successRate: number;
  queryTypes: Record<SearchQuery['type'], number>;
  languageDistribution: Record<string, number>;
  userIntentDistribution: Record<string, number>;
  cacheHitRate: number;
}

export interface EmbeddingOptions {
  model: 'ada-002' | 'claude-embed' | 'local-embed';
  chunkSize: number;
  chunkOverlap: number;
  batchSize: number;
  dimensions: number;
  normalize: boolean;
}

export class SemanticSearch extends EventEmitter {
  private vectorDatabase: Map<string, SemanticVector> = new Map();
  private queryCache: Map<string, SearchResult[]> = new Map();
  private searchHistory: SearchQuery[] = [];
  private analytics: SearchAnalytics;
  private embeddingOptions: EmbeddingOptions;
  private isIndexingVectors = false;

  constructor(options?: Partial<EmbeddingOptions>) {
    super();

    this.embeddingOptions = {
      model: 'ada-002',
      chunkSize: 500,
      chunkOverlap: 50,
      batchSize: 10,
      dimensions: 1536,
      normalize: true,
      ...options
    };

    this.analytics = {
      totalSearches: 0,
      averageResponseTime: 0,
      popularQueries: [],
      successRate: 0,
      queryTypes: {
        semantic: 0,
        exact: 0,
        fuzzy: 0,
        regex: 0,
        natural_language: 0
      },
      languageDistribution: {},
      userIntentDistribution: {},
      cacheHitRate: 0
    };

    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    // Listen to codebase indexer events
    codebaseIndexer.on('fileIndexed', this.handleFileIndexed.bind(this));
    codebaseIndexer.on('fileReindexed', this.handleFileReindexed.bind(this));
    codebaseIndexer.on('indexingCompleted', this.handleIndexingCompleted.bind(this));
    codebaseIndexer.on('indexCleared', this.handleIndexCleared.bind(this));
  }

  public async search(
    query: string,
    options?: {
      type?: SearchQuery['type'];
      filters?: Partial<SearchFilters>;
      context?: Partial<SearchContext>;
      limit?: number;
      offset?: number;
    }
  ): Promise<SearchResult[]> {
    const startTime = Date.now();

    const searchQuery: SearchQuery = {
      id: this.generateQueryId(),
      query: query.trim(),
      type: options?.type || 'semantic',
      filters: {
        languages: [],
        fileTypes: [],
        pathPatterns: [],
        excludePatterns: [],
        ...options?.filters
      },
      context: {
        userIntent: 'understand',
        ...options?.context
      },
      timestamp: new Date()
    };

    this.searchHistory.unshift(searchQuery);
    this.analytics.totalSearches++;
    this.analytics.queryTypes[searchQuery.type]++;

    this.emit('searchStarted', searchQuery);

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(searchQuery);
      const cached = this.queryCache.get(cacheKey);
      if (cached) {
        this.analytics.cacheHitRate++;
        this.emit('searchCompleted', { query: searchQuery, results: cached, fromCache: true });
        return cached;
      }

      let results: SearchResult[] = [];

      switch (searchQuery.type) {
        case 'semantic':
          results = await this.performSemanticSearch(searchQuery, options?.limit || 20);
          break;
        case 'exact':
          results = await this.performExactSearch(searchQuery, options?.limit || 20);
          break;
        case 'fuzzy':
          results = await this.performFuzzySearch(searchQuery, options?.limit || 20);
          break;
        case 'regex':
          results = await this.performRegexSearch(searchQuery, options?.limit || 20);
          break;
        case 'natural_language':
          results = await this.performNaturalLanguageSearch(searchQuery, options?.limit || 20);
          break;
      }

      // Apply filters
      results = this.applyFilters(results, searchQuery.filters);

      // Sort by relevance
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Apply pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || 20;
      results = results.slice(offset, offset + limit);

      // Cache results
      this.queryCache.set(cacheKey, results);

      // Update analytics
      const duration = Date.now() - startTime;
      this.updateAnalytics(searchQuery, results, duration);

      this.emit('searchCompleted', { query: searchQuery, results, duration });
      return results;

    } catch (error) {
      this.emit('searchFailed', { query: searchQuery, error });
      throw error;
    }
  }

  private async performSemanticSearch(query: SearchQuery, limit: number): Promise<SearchResult[]> {
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query.query);

    // Find similar vectors
    const similarities = this.calculateSimilarities(queryEmbedding);

    // Group by file and create results
    const fileGroups = this.groupSimilaritiesByFile(similarities);
    const results: SearchResult[] = [];

    for (const [filePath, matches] of fileGroups.entries()) {
      const indexedFile = codebaseIndexer.getIndexedFile(filePath);
      if (!indexedFile) continue;

      const relevanceScore = this.calculateFileRelevanceScore(matches, query);
      const searchMatches = this.createSearchMatches(matches, indexedFile);
      const explanation = await this.generateExplanation(query, indexedFile, matches);

      results.push({
        id: this.generateResultId(),
        file: indexedFile,
        relevanceScore,
        matchType: 'semantic',
        matches: searchMatches,
        explanation,
        suggestedActions: this.generateSuggestedActions(query, indexedFile),
        relatedResults: []
      });
    }

    return results.slice(0, limit);
  }

  private async performExactSearch(query: SearchQuery, limit: number): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const files = codebaseIndexer.getAllFiles();
    const searchTerm = query.query.toLowerCase();

    for (const file of files) {
      const content = file.content.toLowerCase();
      const matches: SearchMatch[] = [];

      let index = 0;
      while ((index = content.indexOf(searchTerm, index)) !== -1) {
        const lines = file.content.substring(0, index).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length;

        matches.push({
          type: 'content',
          content: this.extractMatchContext(file.content, index, searchTerm.length),
          startLine: line,
          endLine: line,
          startColumn: column,
          endColumn: column + searchTerm.length,
          confidence: 1.0,
          context: this.getLineContext(file.content, line),
          highlighted: this.highlightMatch(file.content, index, searchTerm.length)
        });

        index += searchTerm.length;
      }

      if (matches.length > 0) {
        results.push({
          id: this.generateResultId(),
          file,
          relevanceScore: this.calculateExactMatchScore(matches, query),
          matchType: 'exact',
          matches,
          explanation: `Found ${matches.length} exact matches for "${query.query}"`,
          suggestedActions: this.generateSuggestedActions(query, file),
          relatedResults: []
        });
      }
    }

    return results.slice(0, limit);
  }

  private async performFuzzySearch(query: SearchQuery, limit: number): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const files = codebaseIndexer.getAllFiles();
    const searchTerm = query.query.toLowerCase();

    for (const file of files) {
      const matches: SearchMatch[] = [];

      // Search in various code structures
      const structures = [
        ...file.structure.functions.map(f => ({ type: 'function', name: f.name, line: f.startLine })),
        ...file.structure.classes.map(c => ({ type: 'class', name: c.name, line: c.startLine })),
        ...file.structure.interfaces.map(i => ({ type: 'interface', name: i.name, line: i.startLine })),
        ...file.structure.variables.map(v => ({ type: 'variable', name: v.name, line: v.line }))
      ];

      for (const structure of structures) {
        const similarity = this.calculateStringSimilarity(searchTerm, structure.name.toLowerCase());
        if (similarity > 0.6) { // Threshold for fuzzy matching
          matches.push({
            type: structure.type as SearchMatch['type'],
            content: structure.name,
            startLine: structure.line,
            endLine: structure.line,
            startColumn: 0,
            endColumn: structure.name.length,
            confidence: similarity,
            context: this.getLineContext(file.content, structure.line),
            highlighted: structure.name
          });
        }
      }

      if (matches.length > 0) {
        results.push({
          id: this.generateResultId(),
          file,
          relevanceScore: this.calculateFuzzyMatchScore(matches, query),
          matchType: 'fuzzy',
          matches,
          explanation: `Found ${matches.length} fuzzy matches for "${query.query}"`,
          suggestedActions: this.generateSuggestedActions(query, file),
          relatedResults: []
        });
      }
    }

    return results.slice(0, limit);
  }

  private async performRegexSearch(query: SearchQuery, limit: number): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const files = codebaseIndexer.getAllFiles();

    try {
      const regex = new RegExp(query.query, 'gi');

      for (const file of files) {
        const matches: SearchMatch[] = [];
        let match;

        while ((match = regex.exec(file.content)) !== null) {
          const lines = file.content.substring(0, match.index).split('\n');
          const line = lines.length;
          const column = lines[lines.length - 1].length;

          matches.push({
            type: 'content',
            content: match[0],
            startLine: line,
            endLine: line,
            startColumn: column,
            endColumn: column + match[0].length,
            confidence: 1.0,
            context: this.getLineContext(file.content, line),
            highlighted: this.highlightMatch(file.content, match.index, match[0].length)
          });
        }

        if (matches.length > 0) {
          results.push({
            id: this.generateResultId(),
            file,
            relevanceScore: this.calculateRegexMatchScore(matches, query),
            matchType: 'exact',
            matches,
            explanation: `Found ${matches.length} regex matches for "${query.query}"`,
            suggestedActions: this.generateSuggestedActions(query, file),
            relatedResults: []
          });
        }
      }
    } catch (error) {
      throw new Error(`Invalid regex pattern: ${query.query}`);
    }

    return results.slice(0, limit);
  }

  private async performNaturalLanguageSearch(query: SearchQuery, limit: number): Promise<SearchResult[]> {
    try {
      // Use AI to interpret the natural language query
      const interpretationPrompt = `Interpret this natural language code search query and provide structured search parameters:

Query: "${query.query}"
Context: ${JSON.stringify(query.context)}

Respond with JSON containing:
{
  "intent": "find_function|find_class|find_usage|understand_code|debug_issue|find_pattern",
  "keywords": ["keyword1", "keyword2"],
  "codeElements": ["function_names", "class_names", "variable_names"],
  "semanticQuery": "refined search query for semantic search",
  "filters": {
    "languages": ["language_if_specified"],
    "complexity": "low|medium|high if relevant"
  }
}`;

      const response = await aiService.complete([{
        role: 'user',
        content: interpretationPrompt
      }], {
        model: 'claude-opus-4.1',
        temperature: 0.1,
        maxTokens: 500
      });

      const interpretation = JSON.parse(response.content);

      // Perform semantic search with the refined query
      const semanticQuery: SearchQuery = {
        ...query,
        query: interpretation.semanticQuery || query.query,
        type: 'semantic',
        context: {
          ...query.context,
          userIntent: interpretation.intent
        },
        filters: {
          ...query.filters,
          ...interpretation.filters
        }
      };

      const semanticResults = await this.performSemanticSearch(semanticQuery, limit);

      // Enhance results with natural language explanations
      for (const result of semanticResults) {
        result.explanation = await this.generateNaturalLanguageExplanation(
          query.query,
          result.file,
          interpretation
        );
      }

      return semanticResults;

    } catch (error) {
      console.warn('Natural language search failed, falling back to semantic search:', error);
      return this.performSemanticSearch(query, limit);
    }
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    try {
      // In a real implementation, this would call an embedding API
      // For now, we'll use a simplified approach with AI service
      const embeddingPrompt = `Generate a semantic embedding vector for this text (return 10 normalized values between -1 and 1):

Text: ${text.substring(0, 500)}

Return only a JSON array of 10 numbers.`;

      const response = await aiService.complete([{
        role: 'user',
        content: embeddingPrompt
      }], {
        model: 'claude-opus-4.1',
        temperature: 0,
        maxTokens: 100
      });

      const embedding = JSON.parse(response.content);
      return this.normalizeVector(embedding);

    } catch (error) {
      console.warn('Embedding generation failed:', error);
      // Return a random vector as fallback
      return Array.from({ length: 10 }, () => Math.random() * 2 - 1);
    }
  }

  public async indexVectors(): Promise<void> {
    if (this.isIndexingVectors) {
      throw new Error('Vector indexing is already in progress');
    }

    this.isIndexingVectors = true;
    this.emit('vectorIndexingStarted');

    try {
      const files = codebaseIndexer.getAllFiles();
      const totalChunks = files.reduce((sum, file) =>
        sum + this.calculateChunksForFile(file.content), 0
      );

      let processedChunks = 0;

      for (const file of files) {
        const chunks = this.createChunks(file.content, file.metadata);

        for (const chunk of chunks) {
          try {
            const embedding = await this.generateEmbedding(chunk.content);
            const vector: SemanticVector = {
              id: `${file.metadata.path}_${chunk.id}`,
              filePath: file.metadata.path,
              chunkId: chunk.id,
              content: chunk.content,
              vector: embedding,
              metadata: {
                ...chunk.metadata,
                language: file.metadata.language,
                keywords: this.extractKeywords(chunk.content),
                description: chunk.metadata.description
              },
              lastUpdated: new Date()
            };

            this.vectorDatabase.set(vector.id, vector);
            processedChunks++;

            if (processedChunks % 10 === 0) {
              this.emit('vectorIndexingProgress', {
                processed: processedChunks,
                total: totalChunks,
                percentComplete: (processedChunks / totalChunks) * 100
              });
            }
          } catch (error) {
            console.warn(`Error creating vector for chunk ${chunk.id}:`, error);
          }
        }
      }

      this.emit('vectorIndexingCompleted', {
        totalVectors: this.vectorDatabase.size,
        processingTime: Date.now()
      });

    } finally {
      this.isIndexingVectors = false;
    }
  }

  public async getSuggestions(partialQuery: string, context?: Partial<SearchContext>): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    // Query completion suggestions
    const completions = this.generateQueryCompletions(partialQuery);
    suggestions.push(...completions);

    // Popular queries
    const popular = this.getPopularQueriesLike(partialQuery);
    suggestions.push(...popular);

    // Contextual suggestions
    if (context) {
      const contextual = this.generateContextualSuggestions(partialQuery, context);
      suggestions.push(...contextual);
    }

    // Recent queries
    const recent = this.getRecentQueriesLike(partialQuery);
    suggestions.push(...recent);

    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  // Helper methods
  private calculateSimilarities(queryEmbedding: number[]): Array<{ vectorId: string; similarity: number }> {
    const similarities: Array<{ vectorId: string; similarity: number }> = [];

    for (const [vectorId, vector] of this.vectorDatabase) {
      const similarity = this.cosineSimilarity(queryEmbedding, vector.vector);
      if (similarity > 0.3) { // Threshold for relevance
        similarities.push({ vectorId, similarity });
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Levenshtein distance similarity
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;

    const distance = this.levenshteinDistance(str1, str2);
    return 1 - distance / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  private createChunks(content: string, metadata: FileMetadata): Array<{
    id: string;
    content: string;
    metadata: {
      type: SemanticVector['metadata']['type'];
      name?: string;
      startLine: number;
      endLine: number;
      complexity?: number;
      description?: string;
    };
  }> {
    const chunks: any[] = [];
    const lines = content.split('\n');
    const chunkSize = this.embeddingOptions.chunkSize;
    const overlap = this.embeddingOptions.chunkOverlap;

    // Create sliding window chunks
    for (let i = 0; i < lines.length; i += chunkSize - overlap) {
      const chunkLines = lines.slice(i, i + chunkSize);
      const chunkContent = chunkLines.join('\n');

      if (chunkContent.trim()) {
        chunks.push({
          id: `chunk_${i}`,
          content: chunkContent,
          metadata: {
            type: 'code_block' as const,
            startLine: i + 1,
            endLine: Math.min(i + chunkSize, lines.length),
            description: this.generateChunkDescription(chunkContent)
          }
        });
      }
    }

    return chunks;
  }

  private calculateChunksForFile(content: string): number {
    const lines = content.split('\n').length;
    const chunkSize = this.embeddingOptions.chunkSize;
    const overlap = this.embeddingOptions.chunkOverlap;
    return Math.ceil(lines / (chunkSize - overlap));
  }

  private generateChunkDescription(content: string): string {
    // Extract first function or class name, or use first meaningful line
    const firstLine = content.split('\n').find(line => line.trim() && !line.trim().startsWith('//'));
    return firstLine ? firstLine.substring(0, 50) + '...' : 'Code block';
  }

  private extractKeywords(content: string): string[] {
    // Extract meaningful keywords from content
    const words = content.match(/\w+/g) || [];
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must']);

    return [...new Set(words
      .filter(word => word.length > 2 && !commonWords.has(word.toLowerCase()))
      .slice(0, 10)
    )];
  }

  private applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    return results.filter(result => {
      const file = result.file;

      if (filters.languages && filters.languages.length > 0) {
        if (!filters.languages.includes(file.metadata.language)) return false;
      }

      if (filters.pathPatterns && filters.pathPatterns.length > 0) {
        if (!filters.pathPatterns.some(pattern => file.metadata.path.includes(pattern))) return false;
      }

      if (filters.excludePatterns && filters.excludePatterns.length > 0) {
        if (filters.excludePatterns.some(pattern => file.metadata.path.includes(pattern))) return false;
      }

      if (filters.modifiedAfter) {
        if (file.metadata.lastModified < filters.modifiedAfter) return false;
      }

      if (filters.modifiedBefore) {
        if (file.metadata.lastModified > filters.modifiedBefore) return false;
      }

      if (filters.sizeRange) {
        if (file.metadata.size < filters.sizeRange.min || file.metadata.size > filters.sizeRange.max) return false;
      }

      return true;
    });
  }

  // Event handlers
  private async handleFileIndexed(event: { filePath: string; indexedFile: IndexedFile }): Promise<void> {
    // Re-index vectors for this file
    await this.reindexFileVectors(event.filePath, event.indexedFile);
  }

  private async handleFileReindexed(event: { filePath: string }): Promise<void> {
    const indexedFile = codebaseIndexer.getIndexedFile(event.filePath);
    if (indexedFile) {
      await this.reindexFileVectors(event.filePath, indexedFile);
    }
  }

  private async handleIndexingCompleted(): Promise<void> {
    // Start vector indexing after codebase indexing is complete
    if (!this.isIndexingVectors) {
      await this.indexVectors();
    }
  }

  private handleIndexCleared(): void {
    this.vectorDatabase.clear();
    this.queryCache.clear();
    this.emit('searchIndexCleared');
  }

  private async reindexFileVectors(filePath: string, file: IndexedFile): Promise<void> {
    // Remove existing vectors for this file
    const vectorsToRemove = Array.from(this.vectorDatabase.keys())
      .filter(id => id.startsWith(filePath));

    vectorsToRemove.forEach(id => this.vectorDatabase.delete(id));

    // Create new vectors
    const chunks = this.createChunks(file.content, file.metadata);
    for (const chunk of chunks) {
      try {
        const embedding = await this.generateEmbedding(chunk.content);
        const vector: SemanticVector = {
          id: `${filePath}_${chunk.id}`,
          filePath,
          chunkId: chunk.id,
          content: chunk.content,
          vector: embedding,
          metadata: {
            ...chunk.metadata,
            language: file.metadata.language,
            keywords: this.extractKeywords(chunk.content)
          },
          lastUpdated: new Date()
        };

        this.vectorDatabase.set(vector.id, vector);
      } catch (error) {
        console.warn(`Error reindexing vector for ${filePath}:`, error);
      }
    }
  }

  // Utility methods for generating IDs, cache keys, etc.
  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResultId(): string {
    return `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(query: SearchQuery): string {
    return `${query.type}_${query.query}_${JSON.stringify(query.filters)}`;
  }

  private groupSimilaritiesByFile(similarities: Array<{ vectorId: string; similarity: number }>): Map<string, Array<{ vectorId: string; similarity: number }>> {
    const groups = new Map();

    similarities.forEach(sim => {
      const vector = this.vectorDatabase.get(sim.vectorId);
      if (vector) {
        if (!groups.has(vector.filePath)) {
          groups.set(vector.filePath, []);
        }
        groups.get(vector.filePath).push(sim);
      }
    });

    return groups;
  }

  private calculateFileRelevanceScore(matches: Array<{ similarity: number }>, query: SearchQuery): number {
    const avgSimilarity = matches.reduce((sum, match) => sum + match.similarity, 0) / matches.length;
    const matchCount = matches.length;

    // Weight by both similarity and match count
    return avgSimilarity * 0.7 + Math.min(matchCount / 10, 0.3);
  }

  private createSearchMatches(similarities: Array<{ vectorId: string; similarity: number }>, file: IndexedFile): SearchMatch[] {
    return similarities.map(sim => {
      const vector = this.vectorDatabase.get(sim.vectorId);
      if (!vector) {
        return {
          type: 'content',
          content: '',
          startLine: 0,
          endLine: 0,
          startColumn: 0,
          endColumn: 0,
          confidence: 0,
          context: '',
          highlighted: ''
        };
      }

      return {
        type: 'content',
        content: vector.content.substring(0, 200) + '...',
        startLine: vector.metadata.startLine,
        endLine: vector.metadata.endLine,
        startColumn: 0,
        endColumn: vector.content.length,
        confidence: sim.similarity,
        context: vector.content,
        highlighted: vector.content
      };
    });
  }

  private async generateExplanation(query: SearchQuery, file: IndexedFile, matches: any[]): Promise<string> {
    return `Found ${matches.length} semantic matches in ${file.metadata.name}. The file contains relevant code patterns related to "${query.query}".`;
  }

  private async generateNaturalLanguageExplanation(originalQuery: string, file: IndexedFile, interpretation: any): Promise<string> {
    try {
      const prompt = `Explain why this file is relevant to the user's search query:

Original Query: "${originalQuery}"
Interpreted Intent: ${interpretation.intent}
File: ${file.metadata.name} (${file.metadata.language})
File Structure: ${JSON.stringify({
  functions: file.structure.functions.slice(0, 3).map(f => f.name),
  classes: file.structure.classes.slice(0, 3).map(c => c.name),
  imports: file.structure.imports.slice(0, 3).map(i => i.module)
})}

Provide a clear, helpful explanation in 1-2 sentences.`;

      const response = await aiService.complete([{
        role: 'user',
        content: prompt
      }], {
        model: 'claude-opus-4.1',
        temperature: 0.3,
        maxTokens: 150
      });

      return response.content.trim();
    } catch (error) {
      return `This file contains code relevant to your search for "${originalQuery}".`;
    }
  }

  private generateSuggestedActions(query: SearchQuery, file: IndexedFile): string[] {
    const actions = ['View file', 'Copy path'];

    if (query.context?.userIntent === 'modify') {
      actions.push('Edit file', 'Add to workspace');
    } else if (query.context?.userIntent === 'understand') {
      actions.push('Show structure', 'Find references');
    }

    return actions;
  }

  private calculateExactMatchScore(matches: SearchMatch[], query: SearchQuery): number {
    return Math.min(1.0, matches.length / 5) * 0.9; // Slight penalty vs semantic
  }

  private calculateFuzzyMatchScore(matches: SearchMatch[], query: SearchQuery): number {
    const avgConfidence = matches.reduce((sum, match) => sum + match.confidence, 0) / matches.length;
    return avgConfidence * 0.8; // Penalty for fuzzy matching
  }

  private calculateRegexMatchScore(matches: SearchMatch[], query: SearchQuery): number {
    return Math.min(1.0, matches.length / 10) * 0.95;
  }

  private extractMatchContext(content: string, index: number, length: number): string {
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + length + 50);
    return content.substring(start, end);
  }

  private getLineContext(content: string, lineNumber: number): string {
    const lines = content.split('\n');
    if (lineNumber > 0 && lineNumber <= lines.length) {
      return lines[lineNumber - 1];
    }
    return '';
  }

  private highlightMatch(content: string, index: number, length: number): string {
    const before = content.substring(0, index);
    const match = content.substring(index, index + length);
    const after = content.substring(index + length);
    return `${before}<mark>${match}</mark>${after}`;
  }

  private generateQueryCompletions(partial: string): SearchSuggestion[] {
    // Simple completion logic - in production, use more sophisticated completion
    const common = ['function', 'class', 'interface', 'type', 'import', 'export', 'async', 'await'];
    return common
      .filter(word => word.startsWith(partial.toLowerCase()))
      .map(word => ({
        query: word,
        description: `Search for ${word}`,
        confidence: 0.8,
        category: 'completion' as const
      }));
  }

  private getPopularQueriesLike(partial: string): SearchSuggestion[] {
    return this.analytics.popularQueries
      .filter(pq => pq.query.includes(partial.toLowerCase()))
      .slice(0, 3)
      .map(pq => ({
        query: pq.query,
        description: `Popular search (${pq.count} times)`,
        confidence: 0.6,
        category: 'popular' as const
      }));
  }

  private generateContextualSuggestions(partial: string, context: Partial<SearchContext>): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];

    if (context.currentFile) {
      const file = codebaseIndexer.getIndexedFile(context.currentFile);
      if (file) {
        // Suggest functions/classes from current file
        const elements = [
          ...file.structure.functions.map(f => f.name),
          ...file.structure.classes.map(c => c.name)
        ];

        elements.forEach(element => {
          if (element.toLowerCase().includes(partial.toLowerCase())) {
            suggestions.push({
              query: element,
              description: `From current file: ${element}`,
              confidence: 0.7,
              category: 'contextual'
            });
          }
        });
      }
    }

    return suggestions;
  }

  private getRecentQueriesLike(partial: string): SearchSuggestion[] {
    return this.searchHistory
      .slice(0, 10)
      .filter(q => q.query.toLowerCase().includes(partial.toLowerCase()))
      .map(q => ({
        query: q.query,
        description: 'Recent search',
        confidence: 0.5,
        category: 'recent' as const
      }));
  }

  private updateAnalytics(query: SearchQuery, results: SearchResult[], duration: number): void {
    this.analytics.averageResponseTime =
      (this.analytics.averageResponseTime * (this.analytics.totalSearches - 1) + duration) /
      this.analytics.totalSearches;

    if (results.length > 0) {
      this.analytics.successRate =
        (this.analytics.successRate * (this.analytics.totalSearches - 1) + 1) /
        this.analytics.totalSearches;
    }

    // Update popular queries
    const existing = this.analytics.popularQueries.find(pq => pq.query === query.query);
    if (existing) {
      existing.count++;
    } else {
      this.analytics.popularQueries.push({ query: query.query, count: 1 });
    }

    // Sort and limit popular queries
    this.analytics.popularQueries.sort((a, b) => b.count - a.count);
    this.analytics.popularQueries = this.analytics.popularQueries.slice(0, 50);
  }

  // Public API methods
  public getAnalytics(): SearchAnalytics {
    return { ...this.analytics };
  }

  public clearCache(): void {
    this.queryCache.clear();
    this.emit('cacheCleared');
  }

  public getVectorCount(): number {
    return this.vectorDatabase.size;
  }

  public isVectorIndexingInProgress(): boolean {
    return this.isIndexingVectors;
  }

  public destroy(): void {
    this.vectorDatabase.clear();
    this.queryCache.clear();
    this.searchHistory = [];
    this.removeAllListeners();
  }
}

// Singleton instance
export const semanticSearch = new SemanticSearch();