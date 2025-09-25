import { EventEmitter } from '../../utils/EventEmitter';
import { codebaseIndexer, IndexedFile, FileRelationship } from '../indexing/CodebaseIndexer';
import { semanticSearch, SearchResult } from '../search/SemanticSearch';
import { aiService } from '../ai/ResponsesAIService';

export interface ContextRequest {
  id: string;
  type: 'task_context' | 'file_context' | 'symbol_context' | 'error_context' | 'change_context';
  query: string;
  focusFile?: string;
  focusSymbol?: string;
  cursorPosition?: { line: number; column: number };
  selectionRange?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  maxFiles?: number;
  maxTokens?: number;
  includeTests?: boolean;
  includeDocumentation?: boolean;
  depth?: number;
  timestamp: Date;
}

export interface ContextResponse {
  id: string;
  request: ContextRequest;
  relevantFiles: RelevantFile[];
  contextSummary: string;
  totalTokens: number;
  processingTime: number;
  confidence: number;
  suggestions: string[];
  relationships: ContextRelationship[];
  metadata: ContextMetadata;
}

export interface RelevantFile {
  file: IndexedFile;
  relevanceScore: number;
  relevanceReason: string;
  includedSections: FileSection[];
  tokenCount: number;
  priority: 'essential' | 'important' | 'supplementary' | 'reference';
}

export interface FileSection {
  type: 'full_file' | 'function' | 'class' | 'interface' | 'imports' | 'exports' | 'selection' | 'surrounding';
  name?: string;
  startLine: number;
  endLine: number;
  content: string;
  tokenCount: number;
  relevanceScore: number;
  reason: string;
}

export interface ContextRelationship {
  type: 'imports' | 'calls' | 'extends' | 'implements' | 'references' | 'tests' | 'documents';
  sourceFile: string;
  targetFile: string;
  strength: number;
  description: string;
  bidirectional: boolean;
}

export interface ContextMetadata {
  languages: string[];
  frameworks: string[];
  patterns: string[];
  complexity: 'low' | 'medium' | 'high' | 'very_high';
  qualityScore: number;
  testCoverage?: number;
  documentationCoverage?: number;
  riskFactors: string[];
  estimatedReadingTime: number;
}

export interface ContextStrategy {
  name: string;
  description: string;
  priority: number;
  conditions: (request: ContextRequest) => boolean;
  execute: (request: ContextRequest) => Promise<RelevantFile[]>;
}

export interface ContextFilter {
  type: 'language' | 'size' | 'complexity' | 'quality' | 'recency' | 'relevance' | 'custom';
  condition: (file: IndexedFile) => boolean;
  weight: number;
}

export interface ContextOptimization {
  tokenBudget: number;
  prioritizeRecent: boolean;
  includeRelatedFiles: boolean;
  maxDepth: number;
  qualityThreshold: number;
  relevanceThreshold: number;
}

export class ContextRetriever extends EventEmitter {
  private strategies: Map<string, ContextStrategy> = new Map();
  private requestCache: Map<string, ContextResponse> = new Map();
  private processingRequests: Map<string, Promise<ContextResponse>> = new Map();

  constructor() {
    super();
    this.initializeStrategies();
  }

  public async retrieveContext(request: ContextRequest): Promise<ContextResponse> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);

    // Check cache first
    const cached = this.requestCache.get(cacheKey);
    if (cached) {
      this.emit('contextRetrieved', { response: cached, fromCache: true });
      return cached;
    }

    // Check if already processing
    const existing = this.processingRequests.get(request.id);
    if (existing) {
      return existing;
    }

    this.emit('contextRetrievalStarted', request);

    const promise = this.executeContextRetrieval(request, startTime);
    this.processingRequests.set(request.id, promise);

    try {
      const response = await promise;
      this.requestCache.set(cacheKey, response);
      this.emit('contextRetrieved', { response, fromCache: false });
      return response;
    } finally {
      this.processingRequests.delete(request.id);
    }
  }

  private async executeContextRetrieval(request: ContextRequest, startTime: number): Promise<ContextResponse> {
    try {
      // Step 1: Apply appropriate strategies
      const relevantFiles = await this.applyStrategies(request);

      // Step 2: Optimize for token budget
      const optimizedFiles = await this.optimizeForTokenBudget(relevantFiles, request);

      // Step 3: Generate context summary
      const contextSummary = await this.generateContextSummary(optimizedFiles, request);

      // Step 4: Extract relationships
      const relationships = this.extractRelationships(optimizedFiles);

      // Step 5: Generate metadata
      const metadata = this.generateMetadata(optimizedFiles);

      // Step 6: Calculate confidence
      const confidence = this.calculateConfidence(optimizedFiles, request);

      // Step 7: Generate suggestions
      const suggestions = await this.generateSuggestions(optimizedFiles, request);

      const response: ContextResponse = {
        id: request.id,
        request,
        relevantFiles: optimizedFiles,
        contextSummary,
        totalTokens: this.calculateTotalTokens(optimizedFiles),
        processingTime: Date.now() - startTime,
        confidence,
        suggestions,
        relationships,
        metadata
      };

      return response;

    } catch (error) {
      this.emit('contextRetrievalFailed', { request, error });
      throw error;
    }
  }

  private async applyStrategies(request: ContextRequest): Promise<RelevantFile[]> {
    const allRelevantFiles: RelevantFile[] = [];
    const applicableStrategies = Array.from(this.strategies.values())
      .filter(strategy => strategy.conditions(request))
      .sort((a, b) => b.priority - a.priority);

    for (const strategy of applicableStrategies) {
      try {
        const files = await strategy.execute(request);
        allRelevantFiles.push(...files);

        this.emit('strategyExecuted', {
          strategyName: strategy.name,
          filesFound: files.length,
          request
        });
      } catch (error) {
        this.emit('strategyFailed', {
          strategyName: strategy.name,
          error,
          request
        });
      }
    }

    // Deduplicate and merge files
    return this.deduplicateAndMergeFiles(allRelevantFiles);
  }

  private initializeStrategies(): void {
    // Strategy 1: Focus File Analysis
    this.strategies.set('focus_file', {
      name: 'Focus File Analysis',
      description: 'Analyze the currently focused file and its immediate dependencies',
      priority: 10,
      conditions: (request) => !!request.focusFile,
      execute: this.executeFocusFileStrategy.bind(this)
    });

    // Strategy 2: Symbol Context
    this.strategies.set('symbol_context', {
      name: 'Symbol Context',
      description: 'Find all files related to a specific symbol',
      priority: 9,
      conditions: (request) => !!request.focusSymbol,
      execute: this.executeSymbolContextStrategy.bind(this)
    });

    // Strategy 3: Semantic Search
    this.strategies.set('semantic_search', {
      name: 'Semantic Search',
      description: 'Use AI-powered semantic search to find relevant files',
      priority: 8,
      conditions: (request) => request.query.length > 0,
      execute: this.executeSemanticSearchStrategy.bind(this)
    });

    // Strategy 4: Dependency Analysis
    this.strategies.set('dependency_analysis', {
      name: 'Dependency Analysis',
      description: 'Follow import/export relationships to build context',
      priority: 7,
      conditions: (request) => true,
      execute: this.executeDependencyAnalysisStrategy.bind(this)
    });

    // Strategy 5: Error Context
    this.strategies.set('error_context', {
      name: 'Error Context',
      description: 'Find files related to error messages or stack traces',
      priority: 9,
      conditions: (request) => request.type === 'error_context',
      execute: this.executeErrorContextStrategy.bind(this)
    });

    // Strategy 6: Test Context
    this.strategies.set('test_context', {
      name: 'Test Context',
      description: 'Include relevant test files and test data',
      priority: 6,
      conditions: (request) => request.includeTests !== false,
      execute: this.executeTestContextStrategy.bind(this)
    });

    // Strategy 7: Documentation Context
    this.strategies.set('documentation_context', {
      name: 'Documentation Context',
      description: 'Include relevant documentation and README files',
      priority: 5,
      conditions: (request) => request.includeDocumentation !== false,
      execute: this.executeDocumentationContextStrategy.bind(this)
    });
  }

  private async executeFocusFileStrategy(request: ContextRequest): Promise<RelevantFile[]> {
    if (!request.focusFile) return [];

    const file = codebaseIndexer.getIndexedFile(request.focusFile);
    if (!file) return [];

    const sections = this.determineRelevantSections(file, request);
    const relevantFile: RelevantFile = {
      file,
      relevanceScore: 1.0,
      relevanceReason: 'Focus file specified in request',
      includedSections: sections,
      tokenCount: this.calculateSectionTokens(sections),
      priority: 'essential'
    };

    return [relevantFile];
  }

  private async executeSymbolContextStrategy(request: ContextRequest): Promise<RelevantFile[]> {
    if (!request.focusSymbol) return [];

    const relevantFiles: RelevantFile[] = [];
    const allFiles = codebaseIndexer.getAllFiles();

    for (const file of allFiles) {
      const symbolMatches = this.findSymbolInFile(file, request.focusSymbol);
      if (symbolMatches.length > 0) {
        const sections = symbolMatches.map(match => ({
          type: match.type,
          name: match.name,
          startLine: match.startLine,
          endLine: match.endLine,
          content: this.extractContent(file.content, match.startLine, match.endLine),
          tokenCount: this.estimateTokens(match.endLine - match.startLine),
          relevanceScore: match.relevance,
          reason: `Contains symbol: ${request.focusSymbol}`
        }));

        relevantFiles.push({
          file,
          relevanceScore: Math.max(...symbolMatches.map(m => m.relevance)),
          relevanceReason: `Contains symbol: ${request.focusSymbol}`,
          includedSections: sections,
          tokenCount: this.calculateSectionTokens(sections),
          priority: 'important'
        });
      }
    }

    return relevantFiles;
  }

  private async executeSemanticSearchStrategy(request: ContextRequest): Promise<RelevantFile[]> {
    const searchResults = await semanticSearch.search(request.query, {
      type: 'semantic',
      limit: request.maxFiles || 20,
      filters: {
        languages: this.inferLanguagesFromContext(request)
      },
      context: {
        currentFile: request.focusFile,
        userIntent: 'understand'
      }
    });

    return searchResults.map(result => ({
      file: result.file,
      relevanceScore: result.relevanceScore,
      relevanceReason: result.explanation,
      includedSections: this.convertSearchMatchesToSections(result.matches, result.file),
      tokenCount: this.calculateSearchResultTokens(result),
      priority: this.determinePriority(result.relevanceScore)
    }));
  }

  private async executeDependencyAnalysisStrategy(request: ContextRequest): Promise<RelevantFile[]> {
    if (!request.focusFile) return [];

    const focusFile = codebaseIndexer.getIndexedFile(request.focusFile);
    if (!focusFile) return [];

    const relevantFiles: RelevantFile[] = [];
    const visited = new Set<string>();
    const maxDepth = request.depth || 2;

    await this.exploreDependencies(focusFile, 0, maxDepth, visited, relevantFiles);
    return relevantFiles;
  }

  private async executeErrorContextStrategy(request: ContextRequest): Promise<RelevantFile[]> {
    // Extract file paths and function names from error messages
    const errorPatterns = this.extractErrorPatterns(request.query);
    const relevantFiles: RelevantFile[] = [];

    for (const pattern of errorPatterns) {
      if (pattern.filePath) {
        const file = codebaseIndexer.getIndexedFile(pattern.filePath);
        if (file) {
          const sections = pattern.lineNumber
            ? [this.createErrorContextSection(file, pattern.lineNumber)]
            : this.determineRelevantSections(file, request);

          relevantFiles.push({
            file,
            relevanceScore: 0.9,
            relevanceReason: 'File mentioned in error trace',
            includedSections: sections,
            tokenCount: this.calculateSectionTokens(sections),
            priority: 'essential'
          });
        }
      }
    }

    return relevantFiles;
  }

  private async executeTestContextStrategy(request: ContextRequest): Promise<RelevantFile[]> {
    const testFiles = codebaseIndexer.getAllFiles()
      .filter(file => this.isTestFile(file.metadata.path));

    const relevantTests: RelevantFile[] = [];

    if (request.focusFile) {
      // Find tests related to the focus file
      const relatedTests = testFiles.filter(testFile =>
        this.isTestRelatedToFile(testFile, request.focusFile!)
      );

      relatedTests.forEach(testFile => {
        relevantTests.push({
          file: testFile,
          relevanceScore: 0.7,
          relevanceReason: 'Test file for focus file',
          includedSections: this.determineRelevantSections(testFile, request),
          tokenCount: this.estimateFileTokens(testFile),
          priority: 'supplementary'
        });
      });
    }

    return relevantTests;
  }

  private async executeDocumentationContextStrategy(request: ContextRequest): Promise<RelevantFile[]> {
    const docFiles = codebaseIndexer.getAllFiles()
      .filter(file => this.isDocumentationFile(file.metadata.path));

    const relevantDocs: RelevantFile[] = [];

    // Find documentation relevant to the query
    for (const docFile of docFiles) {
      const relevanceScore = await this.calculateDocumentationRelevance(docFile, request);
      if (relevanceScore > 0.3) {
        relevantDocs.push({
          file: docFile,
          relevanceScore,
          relevanceReason: 'Relevant documentation file',
          includedSections: this.determineRelevantSections(docFile, request),
          tokenCount: this.estimateFileTokens(docFile),
          priority: 'reference'
        });
      }
    }

    return relevantDocs;
  }

  private async optimizeForTokenBudget(files: RelevantFile[], request: ContextRequest): Promise<RelevantFile[]> {
    const maxTokens = request.maxTokens || 8000;
    let currentTokens = 0;
    const optimizedFiles: RelevantFile[] = [];

    // Sort by relevance and priority
    const sortedFiles = files.sort((a, b) => {
      const priorityWeight = this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority);
      if (priorityWeight !== 0) return priorityWeight;
      return b.relevanceScore - a.relevanceScore;
    });

    for (const file of sortedFiles) {
      if (currentTokens + file.tokenCount <= maxTokens) {
        optimizedFiles.push(file);
        currentTokens += file.tokenCount;
      } else {
        // Try to include partial file content
        const remainingTokens = maxTokens - currentTokens;
        if (remainingTokens > 100) { // Minimum threshold
          const optimizedFile = this.optimizeFileForTokens(file, remainingTokens);
          if (optimizedFile) {
            optimizedFiles.push(optimizedFile);
            currentTokens += optimizedFile.tokenCount;
          }
        }
        break;
      }
    }

    return optimizedFiles;
  }

  private async generateContextSummary(files: RelevantFile[], request: ContextRequest): Promise<string> {
    try {
      const summaryPrompt = `Generate a concise summary of this code context:

Request: ${request.query}
Type: ${request.type}

Files included:
${files.map(f => `- ${f.file.metadata.name} (${f.file.metadata.language}): ${f.relevanceReason}`).join('\n')}

Key elements:
- ${files.reduce((sum, f) => sum + f.file.structure.functions.length, 0)} functions
- ${files.reduce((sum, f) => sum + f.file.structure.classes.length, 0)} classes
- ${files.reduce((sum, f) => sum + f.file.structure.interfaces.length, 0)} interfaces

Provide a 2-3 sentence summary focusing on the main purpose and relationships.`;

      const response = await aiService.complete([{
        role: 'user',
        content: summaryPrompt
      }], {
        model: 'claude-opus-4.1',
        temperature: 0.3,
        maxTokens: 200
      });

      return response.content.trim();

    } catch (error) {
      return `Context includes ${files.length} files related to "${request.query}".`;
    }
  }

  private async generateSuggestions(files: RelevantFile[], request: ContextRequest): Promise<string[]> {
    const suggestions: string[] = [];

    // Add file-specific suggestions
    if (files.length > 0) {
      suggestions.push('Explore file relationships');
      suggestions.push('View code structure');
    }

    // Add type-specific suggestions
    switch (request.type) {
      case 'task_context':
        suggestions.push('Break down into subtasks', 'Identify dependencies');
        break;
      case 'error_context':
        suggestions.push('Check error location', 'Review stack trace');
        break;
      case 'change_context':
        suggestions.push('Preview changes', 'Validate with tests');
        break;
    }

    return suggestions;
  }

  // Helper methods
  private determineRelevantSections(file: IndexedFile, request: ContextRequest): FileSection[] {
    const sections: FileSection[] = [];

    // If there's a selection, prioritize that
    if (request.selectionRange) {
      sections.push({
        type: 'selection',
        startLine: request.selectionRange.start.line,
        endLine: request.selectionRange.end.line,
        content: this.extractContent(
          file.content,
          request.selectionRange.start.line,
          request.selectionRange.end.line
        ),
        tokenCount: this.estimateTokens(
          request.selectionRange.end.line - request.selectionRange.start.line
        ),
        relevanceScore: 1.0,
        reason: 'Selected code'
      });
      return sections;
    }

    // Include essential file sections
    if (file.structure.imports.length > 0) {
      sections.push({
        type: 'imports',
        startLine: 1,
        endLine: Math.max(...file.structure.imports.map(i => i.line)),
        content: this.extractImportsContent(file),
        tokenCount: this.estimateTokens(file.structure.imports.length),
        relevanceScore: 0.8,
        reason: 'File imports'
      });
    }

    // Include key functions and classes
    const keyElements = [
      ...file.structure.functions.slice(0, 3),
      ...file.structure.classes.slice(0, 2)
    ].sort((a, b) => a.startLine - b.startLine);

    keyElements.forEach(element => {
      sections.push({
        type: 'function' in element ? 'function' : 'class',
        name: element.name,
        startLine: element.startLine,
        endLine: element.endLine,
        content: this.extractContent(file.content, element.startLine, element.endLine),
        tokenCount: this.estimateTokens(element.endLine - element.startLine),
        relevanceScore: 0.7,
        reason: `Key ${('function' in element ? 'function' : 'class')}: ${element.name}`
      });
    });

    return sections;
  }

  private findSymbolInFile(file: IndexedFile, symbol: string): Array<{
    type: FileSection['type'];
    name: string;
    startLine: number;
    endLine: number;
    relevance: number;
  }> {
    const matches: Array<{
      type: FileSection['type'];
      name: string;
      startLine: number;
      endLine: number;
      relevance: number;
    }> = [];

    // Check functions
    file.structure.functions.forEach(func => {
      if (func.name.includes(symbol)) {
        matches.push({
          type: 'function',
          name: func.name,
          startLine: func.startLine,
          endLine: func.endLine,
          relevance: func.name === symbol ? 1.0 : 0.8
        });
      }
    });

    // Check classes
    file.structure.classes.forEach(cls => {
      if (cls.name.includes(symbol)) {
        matches.push({
          type: 'class',
          name: cls.name,
          startLine: cls.startLine,
          endLine: cls.endLine,
          relevance: cls.name === symbol ? 1.0 : 0.8
        });
      }
    });

    return matches;
  }

  private async exploreDependencies(
    file: IndexedFile,
    currentDepth: number,
    maxDepth: number,
    visited: Set<string>,
    relevantFiles: RelevantFile[]
  ): Promise<void> {
    if (currentDepth >= maxDepth || visited.has(file.metadata.path)) {
      return;
    }

    visited.add(file.metadata.path);

    for (const relationship of file.relationships) {
      if (relationship.type === 'imports' && relationship.strength > 0.5) {
        const relatedFile = codebaseIndexer.getIndexedFile(relationship.targetPath);
        if (relatedFile) {
          const relevanceScore = Math.max(0, 0.8 - currentDepth * 0.2);

          relevantFiles.push({
            file: relatedFile,
            relevanceScore,
            relevanceReason: `Imported by ${file.metadata.name}`,
            includedSections: this.determineRelevantSections(relatedFile, {
              type: 'file_context',
              query: '',
              id: '',
              timestamp: new Date()
            }),
            tokenCount: this.estimateFileTokens(relatedFile),
            priority: currentDepth === 0 ? 'important' : 'supplementary'
          });

          await this.exploreDependencies(
            relatedFile,
            currentDepth + 1,
            maxDepth,
            visited,
            relevantFiles
          );
        }
      }
    }
  }

  private deduplicateAndMergeFiles(files: RelevantFile[]): RelevantFile[] {
    const fileMap = new Map<string, RelevantFile>();

    files.forEach(file => {
      const existing = fileMap.get(file.file.metadata.path);
      if (existing) {
        // Merge files, keeping the higher relevance score
        if (file.relevanceScore > existing.relevanceScore) {
          fileMap.set(file.file.metadata.path, file);
        }
      } else {
        fileMap.set(file.file.metadata.path, file);
      }
    });

    return Array.from(fileMap.values());
  }

  private extractErrorPatterns(errorMessage: string): Array<{
    filePath?: string;
    lineNumber?: number;
    functionName?: string;
  }> {
    const patterns: Array<{ filePath?: string; lineNumber?: number; functionName?: string }> = [];

    // Extract file paths with line numbers (common in stack traces)
    const filePathPattern = /(?:at\s+)?([^\s]+\.(?:ts|js|tsx|jsx|py|java|cpp|c))(?::(\d+))?/g;
    let match;

    while ((match = filePathPattern.exec(errorMessage)) !== null) {
      patterns.push({
        filePath: match[1],
        lineNumber: match[2] ? parseInt(match[2]) : undefined
      });
    }

    return patterns;
  }

  private extractRelationships(files: RelevantFile[]): ContextRelationship[] {
    const relationships: ContextRelationship[] = [];

    files.forEach(file => {
      file.file.relationships.forEach(rel => {
        if (files.some(f => f.file.metadata.path === rel.targetPath)) {
          relationships.push({
            type: rel.type as ContextRelationship['type'],
            sourceFile: file.file.metadata.path,
            targetFile: rel.targetPath,
            strength: rel.strength,
            description: `${file.file.metadata.name} ${rel.type} ${rel.targetName || 'target'}`,
            bidirectional: rel.bidirectional
          });
        }
      });
    });

    return relationships;
  }

  private generateMetadata(files: RelevantFile[]): ContextMetadata {
    const languages = [...new Set(files.map(f => f.file.metadata.language))];
    const totalComplexity = files.reduce((sum, f) =>
      sum + f.file.structure.complexity.cyclomaticComplexity, 0
    );
    const avgComplexity = totalComplexity / files.length;

    return {
      languages,
      frameworks: this.extractFrameworks(files),
      patterns: this.extractPatterns(files),
      complexity: this.classifyComplexity(avgComplexity),
      qualityScore: this.calculateAverageQuality(files),
      riskFactors: this.identifyRiskFactors(files),
      estimatedReadingTime: this.calculateReadingTime(files)
    };
  }

  private calculateConfidence(files: RelevantFile[], request: ContextRequest): number {
    if (files.length === 0) return 0;

    const avgRelevance = files.reduce((sum, f) => sum + f.relevanceScore, 0) / files.length;
    const completenessBonus = request.focusFile && files.some(f => f.file.metadata.path === request.focusFile) ? 0.2 : 0;

    return Math.min(1.0, avgRelevance + completenessBonus);
  }

  // Utility methods
  private extractContent(content: string, startLine: number, endLine: number): string {
    const lines = content.split('\n');
    return lines.slice(startLine - 1, endLine).join('\n');
  }

  private extractImportsContent(file: IndexedFile): string {
    return file.structure.imports.map(imp =>
      `import ${imp.imports.map(i => i.name).join(', ')} from '${imp.module}'`
    ).join('\n');
  }

  private estimateTokens(lineCount: number): number {
    return Math.ceil(lineCount * 4); // Rough estimate: 4 tokens per line
  }

  private estimateFileTokens(file: IndexedFile): number {
    return Math.ceil(file.metadata.characterCount / 4); // Rough estimate
  }

  private calculateSectionTokens(sections: FileSection[]): number {
    return sections.reduce((sum, section) => sum + section.tokenCount, 0);
  }

  private calculateSearchResultTokens(result: SearchResult): number {
    return result.matches.reduce((sum, match) =>
      sum + this.estimateTokens(match.endLine - match.startLine), 0
    );
  }

  private calculateTotalTokens(files: RelevantFile[]): number {
    return files.reduce((sum, file) => sum + file.tokenCount, 0);
  }

  private convertSearchMatchesToSections(matches: any[], file: IndexedFile): FileSection[] {
    return matches.map(match => ({
      type: match.type || 'content',
      name: match.content.substring(0, 50),
      startLine: match.startLine,
      endLine: match.endLine,
      content: match.content,
      tokenCount: match.tokenCount || this.estimateTokens(match.endLine - match.startLine),
      relevanceScore: match.confidence,
      reason: 'Search match'
    }));
  }

  private determinePriority(relevanceScore: number): RelevantFile['priority'] {
    if (relevanceScore > 0.8) return 'essential';
    if (relevanceScore > 0.6) return 'important';
    if (relevanceScore > 0.4) return 'supplementary';
    return 'reference';
  }

  private getPriorityWeight(priority: RelevantFile['priority']): number {
    const weights = { essential: 0, important: 1, supplementary: 2, reference: 3 };
    return weights[priority];
  }

  private optimizeFileForTokens(file: RelevantFile, maxTokens: number): RelevantFile | null {
    if (file.tokenCount <= maxTokens) return file;

    // Try to include only the most relevant sections
    const sortedSections = file.includedSections.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const optimizedSections: FileSection[] = [];
    let currentTokens = 0;

    for (const section of sortedSections) {
      if (currentTokens + section.tokenCount <= maxTokens) {
        optimizedSections.push(section);
        currentTokens += section.tokenCount;
      }
    }

    if (optimizedSections.length === 0) return null;

    return {
      ...file,
      includedSections: optimizedSections,
      tokenCount: currentTokens,
      relevanceReason: `${file.relevanceReason} (optimized)`
    };
  }

  private isTestFile(filePath: string): boolean {
    return /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(filePath) ||
           filePath.includes('__tests__') ||
           filePath.includes('/test/');
  }

  private isDocumentationFile(filePath: string): boolean {
    return /\.(md|rst|txt)$/.test(filePath) ||
           filePath.toLowerCase().includes('readme') ||
           filePath.toLowerCase().includes('doc');
  }

  private isTestRelatedToFile(testFile: IndexedFile, targetFile: string): boolean {
    const targetBaseName = targetFile.replace(/\.[^/.]+$/, '');
    return testFile.metadata.path.includes(targetBaseName) ||
           testFile.content.includes(targetBaseName);
  }

  private async calculateDocumentationRelevance(docFile: IndexedFile, request: ContextRequest): Promise<number> {
    const query = request.query.toLowerCase();
    const content = docFile.content.toLowerCase();

    // Simple relevance calculation
    const words = query.split(/\s+/);
    let matches = 0;

    words.forEach(word => {
      if (content.includes(word)) {
        matches++;
      }
    });

    return words.length > 0 ? matches / words.length : 0;
  }

  private createErrorContextSection(file: IndexedFile, lineNumber: number): FileSection {
    const contextRadius = 5; // Lines before and after
    const startLine = Math.max(1, lineNumber - contextRadius);
    const endLine = Math.min(file.metadata.lineCount, lineNumber + contextRadius);

    return {
      type: 'surrounding',
      startLine,
      endLine,
      content: this.extractContent(file.content, startLine, endLine),
      tokenCount: this.estimateTokens(endLine - startLine + 1),
      relevanceScore: 1.0,
      reason: `Error context around line ${lineNumber}`
    };
  }

  private inferLanguagesFromContext(request: ContextRequest): string[] {
    if (request.focusFile) {
      const file = codebaseIndexer.getIndexedFile(request.focusFile);
      return file ? [file.metadata.language] : [];
    }
    return [];
  }

  private extractFrameworks(files: RelevantFile[]): string[] {
    const frameworks = new Set<string>();

    files.forEach(file => {
      file.file.structure.imports.forEach(imp => {
        if (imp.module.includes('react')) frameworks.add('React');
        if (imp.module.includes('vue')) frameworks.add('Vue');
        if (imp.module.includes('angular')) frameworks.add('Angular');
        if (imp.module.includes('express')) frameworks.add('Express');
        if (imp.module.includes('next')) frameworks.add('Next.js');
      });
    });

    return Array.from(frameworks);
  }

  private extractPatterns(files: RelevantFile[]): string[] {
    // Identify common patterns across files
    return ['module', 'component', 'service', 'utility'];
  }

  private classifyComplexity(avgComplexity: number): ContextMetadata['complexity'] {
    if (avgComplexity < 5) return 'low';
    if (avgComplexity < 10) return 'medium';
    if (avgComplexity < 20) return 'high';
    return 'very_high';
  }

  private calculateAverageQuality(files: RelevantFile[]): number {
    return files.reduce((sum, f) => sum + f.file.qualityMetrics.maintainabilityScore, 0) / files.length;
  }

  private identifyRiskFactors(files: RelevantFile[]): string[] {
    const risks: string[] = [];

    files.forEach(file => {
      if (file.file.qualityMetrics.securityIssues.length > 0) {
        risks.push('Security issues detected');
      }
      if (file.file.structure.complexity.cyclomaticComplexity > 15) {
        risks.push('High complexity');
      }
    });

    return [...new Set(risks)];
  }

  private calculateReadingTime(files: RelevantFile[]): number {
    const totalTokens = this.calculateTotalTokens(files);
    return Math.ceil(totalTokens / 200); // Assume 200 tokens per minute reading speed
  }

  private generateCacheKey(request: ContextRequest): string {
    return `${request.type}_${request.query}_${request.focusFile || ''}_${JSON.stringify(request.selectionRange || {})}`;
  }

  // Public API methods
  public async getFileContext(filePath: string, options?: {
    includeRelated?: boolean;
    maxFiles?: number;
    depth?: number;
  }): Promise<ContextResponse> {
    const request: ContextRequest = {
      id: this.generateRequestId(),
      type: 'file_context',
      query: `Context for ${filePath}`,
      focusFile: filePath,
      maxFiles: options?.maxFiles || 10,
      depth: options?.depth || 1,
      timestamp: new Date()
    };

    return this.retrieveContext(request);
  }

  public async getSymbolContext(symbol: string, currentFile?: string): Promise<ContextResponse> {
    const request: ContextRequest = {
      id: this.generateRequestId(),
      type: 'symbol_context',
      query: `Context for symbol: ${symbol}`,
      focusSymbol: symbol,
      focusFile: currentFile,
      timestamp: new Date()
    };

    return this.retrieveContext(request);
  }

  public async getTaskContext(
    task: string,
    options?: {
      focusFile?: string;
      maxFiles?: number;
      includeTests?: boolean;
    }
  ): Promise<ContextResponse> {
    const request: ContextRequest = {
      id: this.generateRequestId(),
      type: 'task_context',
      query: task,
      focusFile: options?.focusFile,
      maxFiles: options?.maxFiles || 15,
      includeTests: options?.includeTests,
      timestamp: new Date()
    };

    return this.retrieveContext(request);
  }

  public clearCache(): void {
    this.requestCache.clear();
    this.emit('cacheCleared');
  }

  public getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.requestCache.size,
      hitRate: 0 // Would need to track hits vs misses
    };
  }

  private generateRequestId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public destroy(): void {
    this.requestCache.clear();
    this.processingRequests.clear();
    this.strategies.clear();
    this.removeAllListeners();
  }
}

// Singleton instance
export const contextRetriever = new ContextRetriever();