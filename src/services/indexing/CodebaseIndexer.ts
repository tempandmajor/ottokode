import { EventEmitter } from '../../utils/EventEmitter';
import { aiService } from '../ai/ResponsesAIService';
import * as fs from 'fs';
import * as path from 'path';

export interface FileMetadata {
  path: string;
  relativePath: string;
  name: string;
  extension: string;
  language: string;
  size: number;
  lastModified: Date;
  created: Date;
  lineCount: number;
  characterCount: number;
  hash: string;
  encoding: string;
}

export interface CodeStructure {
  imports: ImportInfo[];
  exports: ExportInfo[];
  functions: FunctionInfo[];
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
  types: TypeInfo[];
  variables: VariableInfo[];
  constants: ConstantInfo[];
  enums: EnumInfo[];
  comments: CommentInfo[];
  complexity: ComplexityMetrics;
}

export interface ImportInfo {
  module: string;
  imports: Array<{
    name: string;
    alias?: string;
    isDefault?: boolean;
    isNamespace?: boolean;
  }>;
  isTypeOnly: boolean;
  line: number;
  column: number;
}

export interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'constant';
  isDefault: boolean;
  line: number;
  column: number;
  signature?: string;
}

export interface FunctionInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType?: string;
  isAsync: boolean;
  isGenerator: boolean;
  isArrow: boolean;
  isExported: boolean;
  visibility: 'public' | 'private' | 'protected';
  startLine: number;
  endLine: number;
  complexity: number;
  calls: string[];
  usedVariables: string[];
  docstring?: string;
}

export interface ClassInfo {
  name: string;
  extends?: string;
  implements: string[];
  properties: PropertyInfo[];
  methods: MethodInfo[];
  isAbstract: boolean;
  isExported: boolean;
  startLine: number;
  endLine: number;
  docstring?: string;
}

export interface InterfaceInfo {
  name: string;
  extends: string[];
  properties: PropertyInfo[];
  methods: MethodSignature[];
  isExported: boolean;
  startLine: number;
  endLine: number;
  docstring?: string;
}

export interface TypeInfo {
  name: string;
  definition: string;
  isUnion: boolean;
  isIntersection: boolean;
  isGeneric: boolean;
  genericParameters?: string[];
  isExported: boolean;
  line: number;
  usedTypes: string[];
}

export interface VariableInfo {
  name: string;
  type?: string;
  isConst: boolean;
  isLet: boolean;
  scope: 'global' | 'function' | 'block' | 'class';
  line: number;
  isExported: boolean;
  initialValue?: string;
}

export interface ConstantInfo extends VariableInfo {
  value: string;
  type: string;
}

export interface EnumInfo {
  name: string;
  members: Array<{
    name: string;
    value?: string | number;
    line: number;
  }>;
  isExported: boolean;
  startLine: number;
  endLine: number;
}

export interface CommentInfo {
  type: 'single' | 'multi' | 'jsdoc';
  content: string;
  startLine: number;
  endLine: number;
  attachedTo?: {
    type: string;
    name: string;
  };
}

export interface ParameterInfo {
  name: string;
  type?: string;
  isOptional: boolean;
  defaultValue?: string;
  isRest: boolean;
}

export interface PropertyInfo {
  name: string;
  type?: string;
  visibility: 'public' | 'private' | 'protected';
  isStatic: boolean;
  isReadonly: boolean;
  isOptional: boolean;
  line: number;
  defaultValue?: string;
}

export interface MethodInfo extends FunctionInfo {
  visibility: 'public' | 'private' | 'protected';
  isStatic: boolean;
  isAbstract: boolean;
  isOverride: boolean;
}

export interface MethodSignature {
  name: string;
  parameters: ParameterInfo[];
  returnType?: string;
  isOptional: boolean;
}

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  halsteadVolume: number;
  linesOfCode: number;
  maintainabilityIndex: number;
  technicalDebtRatio: number;
  duplicatedLinesRatio: number;
}

export interface IndexedFile {
  metadata: FileMetadata;
  structure: CodeStructure;
  content: string;
  semanticTokens: SemanticToken[];
  relationships: FileRelationship[];
  qualityMetrics: QualityMetrics;
  lastIndexed: Date;
  indexVersion: string;
}

export interface SemanticToken {
  text: string;
  type: 'keyword' | 'identifier' | 'string' | 'number' | 'comment' | 'operator';
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  scope: string;
  context: string;
}

export interface FileRelationship {
  type: 'imports' | 'exports' | 'extends' | 'implements' | 'references' | 'calls';
  targetPath: string;
  targetName?: string;
  strength: number; // 0-1, how strong the relationship is
  line?: number;
  bidirectional: boolean;
}

export interface QualityMetrics {
  testCoverage?: number;
  documentationCoverage: number;
  typeAnnotationCoverage: number;
  codeSmells: CodeSmell[];
  securityIssues: SecurityIssue[];
  performanceIssues: PerformanceIssue[];
  maintainabilityScore: number;
  readabilityScore: number;
}

export interface CodeSmell {
  type: 'long_method' | 'large_class' | 'duplicate_code' | 'long_parameter_list' | 'god_object';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  startLine: number;
  endLine: number;
  suggestion: string;
}

export interface SecurityIssue {
  type: 'xss' | 'sql_injection' | 'hardcoded_secret' | 'unsafe_regex' | 'path_traversal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  line: number;
  cwe?: string;
  solution: string;
}

export interface PerformanceIssue {
  type: 'memory_leak' | 'inefficient_loop' | 'unnecessary_rerender' | 'blocking_operation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  line: number;
  impact: string;
  suggestion: string;
}

export interface IndexingOptions {
  includePatterns: string[];
  excludePatterns: string[];
  maxFileSize: number;
  enableSemanticAnalysis: boolean;
  enableQualityMetrics: boolean;
  enableSecurityScanning: boolean;
  batchSize: number;
  concurrency: number;
  watchFiles: boolean;
  cacheEnabled: boolean;
  cacheDirectory: string;
}

export interface IndexingProgress {
  phase: 'scanning' | 'indexing' | 'analyzing' | 'relating' | 'caching' | 'completed';
  filesScanned: number;
  filesIndexed: number;
  totalFiles: number;
  currentFile?: string;
  percentComplete: number;
  estimatedTimeRemaining?: number;
  errorsEncountered: number;
  warnings: string[];
  startTime: Date;
  elapsedTime: number;
}

export interface IndexingStats {
  totalFiles: number;
  totalLines: number;
  totalSize: number;
  languageBreakdown: Record<string, number>;
  complexityDistribution: Record<string, number>;
  qualityScoreDistribution: Record<string, number>;
  indexingDuration: number;
  lastFullIndex: Date;
  incrementalUpdates: number;
  cacheHitRate: number;
}

export class CodebaseIndexer extends EventEmitter {
  private indexedFiles: Map<string, IndexedFile> = new Map();
  private fileWatchers: Map<string, any> = new Map();
  private indexingQueue: string[] = [];
  private isIndexing = false;
  private options: IndexingOptions;
  private stats: IndexingStats;
  private progress: IndexingProgress;

  constructor(options?: Partial<IndexingOptions>) {
    super();

    this.options = {
      includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.py', '**/*.java', '**/*.cpp', '**/*.c', '**/*.cs'],
      excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**', '**/coverage/**', '**/*.min.js'],
      maxFileSize: 1024 * 1024, // 1MB
      enableSemanticAnalysis: true,
      enableQualityMetrics: true,
      enableSecurityScanning: true,
      batchSize: 10,
      concurrency: 4,
      watchFiles: true,
      cacheEnabled: true,
      cacheDirectory: '.ottokode/cache/indexing',
      ...options
    };

    this.stats = {
      totalFiles: 0,
      totalLines: 0,
      totalSize: 0,
      languageBreakdown: {},
      complexityDistribution: {},
      qualityScoreDistribution: {},
      indexingDuration: 0,
      lastFullIndex: new Date(0),
      incrementalUpdates: 0,
      cacheHitRate: 0
    };

    this.progress = {
      phase: 'scanning',
      filesScanned: 0,
      filesIndexed: 0,
      totalFiles: 0,
      percentComplete: 0,
      errorsEncountered: 0,
      warnings: [],
      startTime: new Date(),
      elapsedTime: 0
    };

    this.initializeCache();
  }

  public async indexCodebase(rootPath: string, options?: Partial<IndexingOptions>): Promise<void> {
    if (this.isIndexing) {
      throw new Error('Indexing is already in progress');
    }

    this.isIndexing = true;
    this.options = { ...this.options, ...options };

    const startTime = Date.now();
    this.progress = {
      phase: 'scanning',
      filesScanned: 0,
      filesIndexed: 0,
      totalFiles: 0,
      percentComplete: 0,
      errorsEncountered: 0,
      warnings: [],
      startTime: new Date(),
      elapsedTime: 0
    };

    this.emit('indexingStarted', { rootPath, options: this.options });

    try {
      // Phase 1: Scan files
      const filePaths = await this.scanFiles(rootPath);
      this.progress.totalFiles = filePaths.length;
      this.progress.phase = 'indexing';

      this.emit('scanCompleted', { fileCount: filePaths.length });

      // Phase 2: Index files in batches
      await this.indexFilesInBatches(filePaths);

      // Phase 3: Analyze relationships
      this.progress.phase = 'analyzing';
      this.emit('progressUpdate', { ...this.progress });
      await this.analyzeRelationships();

      // Phase 4: Cache results
      this.progress.phase = 'caching';
      this.emit('progressUpdate', { ...this.progress });
      await this.cacheResults();

      // Phase 5: Complete
      this.progress.phase = 'completed';
      this.progress.percentComplete = 100;
      this.progress.elapsedTime = Date.now() - startTime;

      this.stats.indexingDuration = this.progress.elapsedTime;
      this.stats.lastFullIndex = new Date();
      this.stats.totalFiles = this.indexedFiles.size;

      this.updateStats();

      this.emit('indexingCompleted', {
        stats: this.stats,
        progress: this.progress,
        duration: this.progress.elapsedTime
      });

      // Setup file watching if enabled
      if (this.options.watchFiles) {
        await this.setupFileWatching(rootPath);
      }

    } catch (error) {
      this.emit('indexingFailed', { error, progress: this.progress });
      throw error;
    } finally {
      this.isIndexing = false;
    }
  }

  private async scanFiles(rootPath: string): Promise<string[]> {
    const filePaths: string[] = [];

    const scanDirectory = async (dirPath: string): Promise<void> => {
      try {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relativePath = path.relative(rootPath, fullPath);

          if (entry.isDirectory()) {
            if (!this.shouldExcludePath(relativePath)) {
              await scanDirectory(fullPath);
            }
          } else if (entry.isFile()) {
            if (this.shouldIncludeFile(relativePath) && !this.shouldExcludePath(relativePath)) {
              const stats = await fs.promises.stat(fullPath);
              if (stats.size <= this.options.maxFileSize) {
                filePaths.push(fullPath);
                this.progress.filesScanned++;

                if (this.progress.filesScanned % 100 === 0) {
                  this.emit('progressUpdate', { ...this.progress });
                }
              }
            }
          }
        }
      } catch (error) {
        this.progress.warnings.push(`Error scanning directory ${dirPath}: ${error}`);
      }
    };

    await scanDirectory(rootPath);
    return filePaths;
  }

  private async indexFilesInBatches(filePaths: string[]): Promise<void> {
    const batches = this.createBatches(filePaths, this.options.batchSize);

    for (let i = 0; i < batches.length; i += this.options.concurrency) {
      const concurrentBatches = batches.slice(i, i + this.options.concurrency);

      await Promise.all(
        concurrentBatches.map(batch => this.indexBatch(batch))
      );

      this.progress.percentComplete = Math.floor((i / batches.length) * 80); // 80% for indexing
      this.emit('progressUpdate', { ...this.progress });
    }
  }

  private async indexBatch(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        this.progress.currentFile = filePath;
        await this.indexFile(filePath);
        this.progress.filesIndexed++;
      } catch (error) {
        this.progress.errorsEncountered++;
        this.progress.warnings.push(`Error indexing ${filePath}: ${error}`);
      }
    }
  }

  private async indexFile(filePath: string): Promise<IndexedFile> {
    // Check cache first
    if (this.options.cacheEnabled) {
      const cached = await this.getCachedFile(filePath);
      if (cached && await this.isCacheValid(cached, filePath)) {
        this.indexedFiles.set(filePath, cached);
        return cached;
      }
    }

    const content = await fs.promises.readFile(filePath, 'utf-8');
    const stats = await fs.promises.stat(filePath);
    const metadata = await this.extractMetadata(filePath, content, stats);

    const indexedFile: IndexedFile = {
      metadata,
      structure: await this.analyzeCodeStructure(content, metadata.language),
      content,
      semanticTokens: await this.extractSemanticTokens(content, metadata.language),
      relationships: [], // Will be populated in analyzeRelationships
      qualityMetrics: this.options.enableQualityMetrics
        ? await this.calculateQualityMetrics(content, metadata.language)
        : this.getEmptyQualityMetrics(),
      lastIndexed: new Date(),
      indexVersion: '1.0.0'
    };

    this.indexedFiles.set(filePath, indexedFile);

    if (this.options.cacheEnabled) {
      await this.cacheFile(filePath, indexedFile);
    }

    this.emit('fileIndexed', { filePath, indexedFile });
    return indexedFile;
  }

  private async extractMetadata(filePath: string, content: string, stats: fs.Stats): Promise<FileMetadata> {
    const ext = path.extname(filePath);
    const name = path.basename(filePath);
    const relativePath = path.relative(process.cwd(), filePath);

    return {
      path: filePath,
      relativePath,
      name,
      extension: ext,
      language: this.detectLanguage(filePath),
      size: stats.size,
      lastModified: stats.mtime,
      created: stats.birthtime,
      lineCount: content.split('\n').length,
      characterCount: content.length,
      hash: await this.calculateHash(content),
      encoding: 'utf-8'
    };
  }

  private async analyzeCodeStructure(content: string, language: string): Promise<CodeStructure> {
    const structure: CodeStructure = {
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      interfaces: [],
      types: [],
      variables: [],
      constants: [],
      enums: [],
      comments: [],
      complexity: {
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        halsteadVolume: 0,
        linesOfCode: 0,
        maintainabilityIndex: 0,
        technicalDebtRatio: 0,
        duplicatedLinesRatio: 0
      }
    };

    if (!this.options.enableSemanticAnalysis) {
      return structure;
    }

    try {
      // Use AI service to analyze code structure
      const analysisPrompt = `Analyze this ${language} code and extract its structure:

${content.substring(0, 5000)}${content.length > 5000 ? '\n... (truncated)' : ''}

Return a JSON object with:
1. imports: Array of import statements with details
2. exports: Array of exported items
3. functions: Array of function definitions
4. classes: Array of class definitions
5. interfaces: Array of interface definitions (TypeScript)
6. types: Array of type definitions
7. variables: Array of variable declarations
8. constants: Array of constant declarations
9. enums: Array of enum definitions
10. comments: Array of comment blocks
11. complexity: Complexity metrics

Focus on extracting accurate structural information.`;

      const response = await aiService.complete([{
        role: 'user',
        content: analysisPrompt
      }], {
        model: 'claude-sonnet-4',
        temperature: 0.1,
        maxTokens: 3000
      });

      const analyzedStructure = JSON.parse(response.content);
      return { ...structure, ...analyzedStructure };

    } catch (error) {
      console.warn(`Error analyzing structure for ${language}:`, error);
      return this.fallbackStructureAnalysis(content, language);
    }
  }

  private fallbackStructureAnalysis(content: string, language: string): CodeStructure {
    const structure: CodeStructure = {
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      interfaces: [],
      types: [],
      variables: [],
      constants: [],
      enums: [],
      comments: [],
      complexity: {
        cyclomaticComplexity: this.calculateCyclomaticComplexity(content),
        cognitiveComplexity: 0,
        halsteadVolume: 0,
        linesOfCode: content.split('\n').filter(line => line.trim()).length,
        maintainabilityIndex: 0,
        technicalDebtRatio: 0,
        duplicatedLinesRatio: 0
      }
    };

    // Basic pattern matching for common structures
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Import statements
      if (trimmed.startsWith('import ')) {
        const importMatch = trimmed.match(/import\s+(.+?)\s+from\s+['"](.+)['"]/);
        if (importMatch) {
          structure.imports.push({
            module: importMatch[2],
            imports: [{ name: importMatch[1] }],
            isTypeOnly: false,
            line: index + 1,
            column: 0
          });
        }
      }

      // Export statements
      if (trimmed.startsWith('export ')) {
        const exportMatch = trimmed.match(/export\s+(?:default\s+)?(function|class|interface|type|const|let|var)\s+(\w+)/);
        if (exportMatch) {
          structure.exports.push({
            name: exportMatch[2],
            type: exportMatch[1] as any,
            isDefault: trimmed.includes('default'),
            line: index + 1,
            column: 0
          });
        }
      }

      // Function declarations
      if (trimmed.includes('function ') || trimmed.match(/^\s*\w+\s*=\s*\(/)) {
        const funcMatch = trimmed.match(/(?:function\s+)?(\w+)\s*\(/);
        if (funcMatch) {
          structure.functions.push({
            name: funcMatch[1],
            parameters: [],
            isAsync: trimmed.includes('async'),
            isGenerator: trimmed.includes('function*'),
            isArrow: trimmed.includes('=>'),
            isExported: trimmed.startsWith('export'),
            visibility: 'public',
            startLine: index + 1,
            endLine: index + 1,
            complexity: 1,
            calls: [],
            usedVariables: []
          });
        }
      }
    });

    return structure;
  }

  private async extractSemanticTokens(content: string, language: string): Promise<SemanticToken[]> {
    const tokens: SemanticToken[] = [];

    if (!this.options.enableSemanticAnalysis) {
      return tokens;
    }

    // Basic tokenization - in production, use a proper language parser
    const lines = content.split('\n');
    const keywords = this.getLanguageKeywords(language);

    lines.forEach((line, lineIndex) => {
      const words = line.match(/\w+/g) || [];
      let columnIndex = 0;

      words.forEach(word => {
        const wordIndex = line.indexOf(word, columnIndex);
        if (wordIndex !== -1) {
          const tokenType = this.classifyToken(word, keywords);

          tokens.push({
            text: word,
            type: tokenType,
            startLine: lineIndex,
            startColumn: wordIndex,
            endLine: lineIndex,
            endColumn: wordIndex + word.length,
            scope: this.determineScopeForToken(lineIndex, wordIndex, content),
            context: line.trim()
          });

          columnIndex = wordIndex + word.length;
        }
      });
    });

    return tokens;
  }

  private async calculateQualityMetrics(content: string, language: string): Promise<QualityMetrics> {
    const metrics: QualityMetrics = {
      documentationCoverage: this.calculateDocumentationCoverage(content),
      typeAnnotationCoverage: this.calculateTypeAnnotationCoverage(content, language),
      codeSmells: await this.detectCodeSmells(content, language),
      securityIssues: this.options.enableSecurityScanning
        ? await this.detectSecurityIssues(content, language)
        : [],
      performanceIssues: await this.detectPerformanceIssues(content, language),
      maintainabilityScore: this.calculateMaintainabilityScore(content),
      readabilityScore: this.calculateReadabilityScore(content)
    };

    return metrics;
  }

  private async analyzeRelationships(): Promise<void> {
    const files = Array.from(this.indexedFiles.values());

    for (const file of files) {
      const relationships: FileRelationship[] = [];

      // Analyze imports
      for (const importInfo of file.structure.imports) {
        const targetPath = this.resolveImportPath(file.metadata.path, importInfo.module);
        if (targetPath && this.indexedFiles.has(targetPath)) {
          relationships.push({
            type: 'imports',
            targetPath,
            targetName: importInfo.imports[0]?.name,
            strength: 0.8,
            line: importInfo.line,
            bidirectional: false
          });
        }
      }

      // Analyze function calls
      for (const func of file.structure.functions) {
        for (const call of func.calls) {
          const targetFile = this.findFileContainingFunction(call);
          if (targetFile) {
            relationships.push({
              type: 'calls',
              targetPath: targetFile.metadata.path,
              targetName: call,
              strength: 0.6,
              line: func.startLine,
              bidirectional: false
            });
          }
        }
      }

      // Analyze inheritance
      for (const classInfo of file.structure.classes) {
        if (classInfo.extends) {
          const targetFile = this.findFileContainingClass(classInfo.extends);
          if (targetFile) {
            relationships.push({
              type: 'extends',
              targetPath: targetFile.metadata.path,
              targetName: classInfo.extends,
              strength: 0.9,
              line: classInfo.startLine,
              bidirectional: false
            });
          }
        }

        for (const implementedInterface of classInfo.implements) {
          const targetFile = this.findFileContainingInterface(implementedInterface);
          if (targetFile) {
            relationships.push({
              type: 'implements',
              targetPath: targetFile.metadata.path,
              targetName: implementedInterface,
              strength: 0.7,
              line: classInfo.startLine,
              bidirectional: false
            });
          }
        }
      }

      file.relationships = relationships;
    }

    this.emit('relationshipsAnalyzed', {
      totalRelationships: files.reduce((sum, f) => sum + f.relationships.length, 0)
    });
  }

  // Helper methods
  private shouldIncludeFile(filePath: string): boolean {
    return this.options.includePatterns.some(pattern =>
      this.matchGlob(filePath, pattern)
    );
  }

  private shouldExcludePath(filePath: string): boolean {
    return this.options.excludePatterns.some(pattern =>
      this.matchGlob(filePath, pattern)
    );
  }

  private matchGlob(path: string, pattern: string): boolean {
    // Simple glob matching - in production, use a proper glob library
    const regex = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*');
    return new RegExp(`^${regex}$`).test(path);
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
      '.swift': 'swift',
      '.kt': 'kotlin'
    };
    return languageMap[ext] || 'text';
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async calculateHash(content: string): Promise<string> {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private calculateCyclomaticComplexity(content: string): number {
    const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||', '?'];
    let complexity = 1; // Base complexity

    for (const keyword of complexityKeywords) {
      const matches = content.match(new RegExp(`\\b${keyword}\\b`, 'g'));
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private getLanguageKeywords(language: string): string[] {
    const keywordMap: Record<string, string[]> = {
      typescript: ['const', 'let', 'var', 'function', 'class', 'interface', 'type', 'import', 'export', 'if', 'else', 'for', 'while', 'return'],
      javascript: ['const', 'let', 'var', 'function', 'class', 'import', 'export', 'if', 'else', 'for', 'while', 'return'],
      python: ['def', 'class', 'import', 'from', 'if', 'else', 'elif', 'for', 'while', 'return', 'try', 'except'],
      java: ['public', 'private', 'protected', 'class', 'interface', 'import', 'if', 'else', 'for', 'while', 'return']
    };
    return keywordMap[language] || [];
  }

  private classifyToken(word: string, keywords: string[]): SemanticToken['type'] {
    if (keywords.includes(word)) return 'keyword';
    if (/^[0-9]+$/.test(word)) return 'number';
    if (/^["']/.test(word)) return 'string';
    if (/^[+\-*/=<>!&|]/.test(word)) return 'operator';
    if (word.startsWith('//') || word.startsWith('/*')) return 'comment';
    return 'identifier';
  }

  private determineScopeForToken(line: number, column: number, content: string): string {
    // Simple scope detection - in production, use a proper AST
    const lines = content.split('\n').slice(0, line + 1);
    const reversedLines = [...lines].reverse();

    for (const lineContent of reversedLines) {
      if (lineContent.includes('function ') || lineContent.includes('class ')) {
        const match = lineContent.match(/(function|class)\s+(\w+)/);
        if (match) {
          return match[2];
        }
      }
    }

    return 'global';
  }

  private calculateDocumentationCoverage(content: string): number {
    const totalFunctions = (content.match(/function\s+\w+/g) || []).length;
    const documentedFunctions = (content.match(/\/\*\*[\s\S]*?\*\/\s*function/g) || []).length;
    return totalFunctions > 0 ? (documentedFunctions / totalFunctions) * 100 : 100;
  }

  private calculateTypeAnnotationCoverage(content: string, language: string): number {
    if (language !== 'typescript') return 0;

    const totalParameters = (content.match(/\(\s*\w+/g) || []).length;
    const typedParameters = (content.match(/\(\s*\w+:\s*\w+/g) || []).length;
    return totalParameters > 0 ? (typedParameters / totalParameters) * 100 : 100;
  }

  private async detectCodeSmells(content: string, language: string): Promise<CodeSmell[]> {
    const smells: CodeSmell[] = [];
    const lines = content.split('\n');

    // Long method detection
    let currentFunction: { name: string; start: number } | null = null;
    lines.forEach((line, index) => {
      if (line.includes('function ')) {
        if (currentFunction && (index - currentFunction.start) > 50) {
          smells.push({
            type: 'long_method',
            severity: 'medium',
            description: `Function ${currentFunction.name} is too long (${index - currentFunction.start} lines)`,
            startLine: currentFunction.start,
            endLine: index,
            suggestion: 'Consider breaking this function into smaller, more focused functions'
          });
        }
        const match = line.match(/function\s+(\w+)/);
        currentFunction = match ? { name: match[1], start: index } : null;
      }
    });

    return smells;
  }

  private async detectSecurityIssues(content: string, language: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Hardcoded secrets detection
      if (/(?:password|secret|key|token)\s*[=:]\s*['"][^'"]+['"]/i.test(line)) {
        issues.push({
          type: 'hardcoded_secret',
          severity: 'high',
          description: 'Potential hardcoded secret detected',
          line: index + 1,
          cwe: 'CWE-798',
          solution: 'Use environment variables or secure configuration management'
        });
      }

      // SQL injection potential
      if (line.includes('SELECT') && line.includes('+')) {
        issues.push({
          type: 'sql_injection',
          severity: 'high',
          description: 'Potential SQL injection vulnerability',
          line: index + 1,
          cwe: 'CWE-89',
          solution: 'Use parameterized queries instead of string concatenation'
        });
      }
    });

    return issues;
  }

  private async detectPerformanceIssues(content: string, language: string): Promise<PerformanceIssue[]> {
    const issues: PerformanceIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Nested loops detection
      if (line.includes('for') && lines[index - 1]?.includes('for')) {
        issues.push({
          type: 'inefficient_loop',
          severity: 'medium',
          description: 'Nested loops detected - potential performance issue',
          line: index + 1,
          impact: 'O(n²) complexity',
          suggestion: 'Consider using more efficient algorithms or data structures'
        });
      }
    });

    return issues;
  }

  private calculateMaintainabilityScore(content: string): number {
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim()).length;
    const complexity = this.calculateCyclomaticComplexity(content);

    // Simple maintainability calculation
    const lengthPenalty = Math.max(0, 100 - (nonEmptyLines / 10));
    const complexityPenalty = Math.max(0, 100 - (complexity * 2));

    return Math.min(100, (lengthPenalty + complexityPenalty) / 2);
  }

  private calculateReadabilityScore(content: string): number {
    const lines = content.split('\n');
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
    const commentRatio = (content.match(/\/\/|\/\*/g) || []).length / lines.length;

    // Simple readability score
    const lengthScore = Math.max(0, 100 - (avgLineLength - 80));
    const commentScore = Math.min(100, commentRatio * 200);

    return (lengthScore + commentScore) / 2;
  }

  private getEmptyQualityMetrics(): QualityMetrics {
    return {
      documentationCoverage: 0,
      typeAnnotationCoverage: 0,
      codeSmells: [],
      securityIssues: [],
      performanceIssues: [],
      maintainabilityScore: 0,
      readabilityScore: 0
    };
  }

  private resolveImportPath(currentFilePath: string, importModule: string): string | null {
    if (importModule.startsWith('.')) {
      // Relative import
      const currentDir = path.dirname(currentFilePath);
      return path.resolve(currentDir, importModule);
    }
    // Could implement node_modules resolution here
    return null;
  }

  private findFileContainingFunction(functionName: string): IndexedFile | null {
    for (const file of this.indexedFiles.values()) {
      if (file.structure.functions.some(f => f.name === functionName)) {
        return file;
      }
    }
    return null;
  }

  private findFileContainingClass(className: string): IndexedFile | null {
    for (const file of this.indexedFiles.values()) {
      if (file.structure.classes.some(c => c.name === className)) {
        return file;
      }
    }
    return null;
  }

  private findFileContainingInterface(interfaceName: string): IndexedFile | null {
    for (const file of this.indexedFiles.values()) {
      if (file.structure.interfaces.some(i => i.name === interfaceName)) {
        return file;
      }
    }
    return null;
  }

  private async setupFileWatching(rootPath: string): Promise<void> {
    // File watching implementation would go here
    // Using fs.watch or a library like chokidar
  }

  private async initializeCache(): Promise<void> {
    if (this.options.cacheEnabled) {
      const cacheDir = path.resolve(this.options.cacheDirectory);
      try {
        await fs.promises.mkdir(cacheDir, { recursive: true });
      } catch (error) {
        console.warn('Failed to create cache directory:', error);
        this.options.cacheEnabled = false;
      }
    }
  }

  private async getCachedFile(filePath: string): Promise<IndexedFile | null> {
    if (!this.options.cacheEnabled) return null;

    try {
      const cacheFile = path.join(this.options.cacheDirectory, `${await this.calculateHash(filePath)}.json`);
      const cached = await fs.promises.readFile(cacheFile, 'utf-8');
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }

  private async isCacheValid(cached: IndexedFile, filePath: string): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(filePath);
      return cached.metadata.lastModified.getTime() >= stats.mtime.getTime();
    } catch {
      return false;
    }
  }

  private async cacheFile(filePath: string, indexedFile: IndexedFile): Promise<void> {
    if (!this.options.cacheEnabled) return;

    try {
      const cacheFile = path.join(this.options.cacheDirectory, `${await this.calculateHash(filePath)}.json`);
      await fs.promises.writeFile(cacheFile, JSON.stringify(indexedFile));
    } catch (error) {
      console.warn(`Failed to cache file ${filePath}:`, error);
    }
  }

  private async cacheResults(): Promise<void> {
    if (!this.options.cacheEnabled) return;

    try {
      const indexFile = path.join(this.options.cacheDirectory, 'index.json');
      const indexData = {
        files: Array.from(this.indexedFiles.keys()),
        stats: this.stats,
        lastUpdated: new Date()
      };
      await fs.promises.writeFile(indexFile, JSON.stringify(indexData));
    } catch (error) {
      console.warn('Failed to cache index:', error);
    }
  }

  private updateStats(): void {
    this.stats.totalFiles = this.indexedFiles.size;
    this.stats.totalLines = Array.from(this.indexedFiles.values())
      .reduce((sum, file) => sum + file.metadata.lineCount, 0);
    this.stats.totalSize = Array.from(this.indexedFiles.values())
      .reduce((sum, file) => sum + file.metadata.size, 0);

    // Language breakdown
    this.stats.languageBreakdown = {};
    for (const file of this.indexedFiles.values()) {
      const lang = file.metadata.language;
      this.stats.languageBreakdown[lang] = (this.stats.languageBreakdown[lang] || 0) + 1;
    }
  }

  // Public API methods
  public getIndexedFile(filePath: string): IndexedFile | undefined {
    return this.indexedFiles.get(filePath);
  }

  public getAllFiles(): IndexedFile[] {
    return Array.from(this.indexedFiles.values());
  }

  public getFilesByLanguage(language: string): IndexedFile[] {
    return Array.from(this.indexedFiles.values())
      .filter(file => file.metadata.language === language);
  }

  public searchByPattern(pattern: string): IndexedFile[] {
    const regex = new RegExp(pattern, 'i');
    return Array.from(this.indexedFiles.values())
      .filter(file =>
        regex.test(file.metadata.path) ||
        regex.test(file.content)
      );
  }

  public getStats(): IndexingStats {
    return { ...this.stats };
  }

  public getProgress(): IndexingProgress {
    return { ...this.progress };
  }

  public isIndexingInProgress(): boolean {
    return this.isIndexing;
  }

  public async reindexFile(filePath: string): Promise<void> {
    if (this.indexedFiles.has(filePath)) {
      await this.indexFile(filePath);
      this.stats.incrementalUpdates++;
      this.emit('fileReindexed', { filePath });
    }
  }

  public clearIndex(): void {
    this.indexedFiles.clear();
    this.fileWatchers.clear();
    this.stats = {
      totalFiles: 0,
      totalLines: 0,
      totalSize: 0,
      languageBreakdown: {},
      complexityDistribution: {},
      qualityScoreDistribution: {},
      indexingDuration: 0,
      lastFullIndex: new Date(0),
      incrementalUpdates: 0,
      cacheHitRate: 0
    };
    this.emit('indexCleared');
  }

  public destroy(): void {
    this.clearIndex();
    this.removeAllListeners();
  }
}

// Singleton instance
export const codebaseIndexer = new CodebaseIndexer();