import { EventEmitter } from '../../utils/EventEmitter';
import { aiService } from '../ai/ResponsesAIService';

export interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: Date;
  content?: string;
  language?: string;
  imports?: string[];
  exports?: string[];
  dependencies?: string[];
  functions?: FunctionInfo[];
  classes?: ClassInfo[];
  interfaces?: InterfaceInfo[];
  variables?: VariableInfo[];
  isEntryPoint?: boolean;
  isTestFile?: boolean;
  isConfigFile?: boolean;
  parent?: string;
  children?: string[];
}

export interface FunctionInfo {
  name: string;
  line: number;
  parameters: ParameterInfo[];
  returnType?: string;
  isExported: boolean;
  isAsync: boolean;
  visibility?: 'public' | 'private' | 'protected';
  description?: string;
}

export interface ClassInfo {
  name: string;
  line: number;
  extends?: string;
  implements?: string[];
  methods: MethodInfo[];
  properties: PropertyInfo[];
  isExported: boolean;
  visibility?: 'public' | 'private' | 'protected';
  description?: string;
}

export interface InterfaceInfo {
  name: string;
  line: number;
  extends?: string[];
  properties: PropertyInfo[];
  methods: MethodInfo[];
  isExported: boolean;
  description?: string;
}

export interface VariableInfo {
  name: string;
  line: number;
  type?: string;
  isExported: boolean;
  isConstant: boolean;
  scope: 'global' | 'function' | 'block';
  description?: string;
}

export interface ParameterInfo {
  name: string;
  type?: string;
  isOptional: boolean;
  defaultValue?: string;
}

export interface PropertyInfo {
  name: string;
  line: number;
  type?: string;
  visibility?: 'public' | 'private' | 'protected';
  isStatic: boolean;
  isReadonly: boolean;
  isOptional: boolean;
  description?: string;
}

export interface MethodInfo {
  name: string;
  line: number;
  parameters: ParameterInfo[];
  returnType?: string;
  visibility?: 'public' | 'private' | 'protected';
  isStatic: boolean;
  isAsync: boolean;
  isAbstract?: boolean;
  description?: string;
}

export interface DependencyGraph {
  nodes: string[];
  edges: DependencyEdge[];
  cycles: string[][];
  entryPoints: string[];
  levels: Map<string, number>;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'import' | 'require' | 'dynamic_import' | 'type_dependency';
  weight: number;
}

export interface ContextRelationship {
  file1: string;
  file2: string;
  relationship: 'imports' | 'imported_by' | 'extends' | 'implements' | 'references' | 'tests';
  strength: number; // 0-1, how closely related
  details?: string;
}

export interface SemanticChunk {
  id: string;
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
  type: 'function' | 'class' | 'interface' | 'block' | 'comment' | 'import';
  name?: string;
  description?: string;
  keywords: string[];
  embedding?: number[];
  relatedChunks?: string[];
}

export interface MultiFileAnalysis {
  totalFiles: number;
  totalLines: number;
  languages: Map<string, number>;
  complexity: 'low' | 'medium' | 'high' | 'very_high';
  architecture: 'monolith' | 'modular' | 'microservices' | 'layered';
  patterns: string[];
  hotspots: string[]; // Files with many dependencies
  risks: AnalysisRisk[];
  suggestions: string[];
  codebaseHealth: number; // 0-100
}

export interface AnalysisRisk {
  type: 'circular_dependency' | 'tight_coupling' | 'large_file' | 'complex_function' | 'unused_code' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  files: string[];
  description: string;
  recommendation: string;
}

export interface ContextQuery {
  query: string;
  files?: string[];
  includeTests?: boolean;
  maxResults?: number;
  semanticSearch?: boolean;
  filters?: ContextFilters;
}

export interface ContextFilters {
  languages?: string[];
  fileTypes?: string[];
  dateRange?: { from: Date; to: Date };
  sizeRange?: { min: number; max: number };
  complexity?: 'low' | 'medium' | 'high';
  hasTests?: boolean;
}

export interface ContextSearchResult {
  file: string;
  chunks: SemanticChunk[];
  relevanceScore: number;
  summary: string;
  relatedFiles: string[];
}

export class MultiFileContextManager extends EventEmitter {
  private fileIndex: Map<string, FileNode> = new Map();
  private dependencyGraph: DependencyGraph;
  private semanticChunks: Map<string, SemanticChunk[]> = new Map();
  private relationships: ContextRelationship[] = [];
  private analysisCache: Map<string, any> = new Map();
  private rootPath: string;
  private indexingInProgress = false;
  private lastIndexTime: Date | null = null;

  constructor(rootPath: string) {
    super();
    this.rootPath = rootPath;
    this.dependencyGraph = {
      nodes: [],
      edges: [],
      cycles: [],
      entryPoints: [],
      levels: new Map()
    };
  }

  // Core indexing functionality
  async indexCodebase(forceReindex: boolean = false): Promise<void> {
    if (this.indexingInProgress) {
      this.emit('indexingStatus', { status: 'already_running' });
      return;
    }

    if (!forceReindex && this.lastIndexTime &&
        (Date.now() - this.lastIndexTime.getTime()) < 5 * 60 * 1000) { // 5 minutes
      this.emit('indexingStatus', { status: 'recent_index_available' });
      return;
    }

    this.indexingInProgress = true;
    this.emit('indexingStarted', { rootPath: this.rootPath });

    try {
      // Step 1: Discover files
      const files = await this.discoverFiles();
      this.emit('indexingProgress', { phase: 'discovery', filesFound: files.length });

      // Step 2: Analyze each file
      const analysisPromises = files.map(file => this.analyzeFile(file));
      const analyzedFiles = await Promise.all(analysisPromises);

      analyzedFiles.forEach(file => {
        if (file) {
          this.fileIndex.set(file.path, file);
        }
      });

      this.emit('indexingProgress', { phase: 'analysis', filesAnalyzed: analyzedFiles.length });

      // Step 3: Build dependency graph
      await this.buildDependencyGraph();
      this.emit('indexingProgress', { phase: 'dependencies', edgesFound: this.dependencyGraph.edges.length });

      // Step 4: Create semantic chunks
      await this.createSemanticChunks();
      this.emit('indexingProgress', { phase: 'chunking', chunksCreated: Array.from(this.semanticChunks.values()).flat().length });

      // Step 5: Analyze relationships
      await this.analyzeRelationships();
      this.emit('indexingProgress', { phase: 'relationships', relationshipsFound: this.relationships.length });

      // Step 6: Generate codebase analysis
      const analysis = await this.generateCodebaseAnalysis();
      this.emit('indexingProgress', { phase: 'analysis_complete', analysis });

      this.lastIndexTime = new Date();
      this.emit('indexingCompleted', {
        totalFiles: this.fileIndex.size,
        totalChunks: Array.from(this.semanticChunks.values()).flat().length,
        analysis
      });

    } catch (error) {
      this.emit('indexingFailed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    } finally {
      this.indexingInProgress = false;
    }
  }

  private async discoverFiles(): Promise<string[]> {
    const fs = require('fs');
    const path = require('path');
    const files: string[] = [];

    const walkDirectory = async (dir: string): Promise<void> => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (this.shouldSkipPath(fullPath)) {
            continue;
          }

          if (entry.isDirectory()) {
            await walkDirectory(fullPath);
          } else if (entry.isFile() && this.isCodeFile(fullPath)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`Error reading directory ${dir}:`, error);
      }
    };

    await walkDirectory(this.rootPath);
    return files;
  }

  private shouldSkipPath(filePath: string): boolean {
    const skipPatterns = [
      /node_modules/,
      /\.git/,
      /\.next/,
      /\.nuxt/,
      /dist/,
      /build/,
      /coverage/,
      /\.cache/,
      /\.vscode/,
      /\.idea/,
      /\.DS_Store/,
      /\.env/,
      /package-lock\.json/,
      /yarn\.lock/,
      /pnpm-lock\.yaml/
    ];

    return skipPatterns.some(pattern => pattern.test(filePath));
  }

  private isCodeFile(filePath: string): boolean {
    const codeExtensions = [
      '.ts', '.tsx', '.js', '.jsx',
      '.py', '.java', '.cpp', '.c', '.h',
      '.cs', '.php', '.rb', '.go', '.rs',
      '.vue', '.svelte',
      '.json', '.yaml', '.yml',
      '.md', '.mdx',
      '.sql', '.graphql'
    ];

    return codeExtensions.some(ext => filePath.endsWith(ext));
  }

  private async analyzeFile(filePath: string): Promise<FileNode | null> {
    try {
      const fs = require('fs');
      const path = require('path');

      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');

      const node: FileNode = {
        path: filePath,
        name: path.basename(filePath),
        type: 'file',
        size: stats.size,
        lastModified: stats.mtime,
        content,
        language: this.detectLanguage(filePath),
        imports: [],
        exports: [],
        dependencies: [],
        functions: [],
        classes: [],
        interfaces: [],
        variables: [],
        isEntryPoint: this.isEntryPoint(filePath),
        isTestFile: this.isTestFile(filePath),
        isConfigFile: this.isConfigFile(filePath)
      };

      // Perform language-specific analysis
      await this.performLanguageSpecificAnalysis(node);

      return node;

    } catch (error) {
      console.warn(`Error analyzing file ${filePath}:`, error);
      return null;
    }
  }

  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();

    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'h': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'vue': 'vue',
      'svelte': 'svelte',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'mdx': 'markdown',
      'sql': 'sql',
      'graphql': 'graphql'
    };

    return languageMap[ext || ''] || 'unknown';
  }

  private isEntryPoint(filePath: string): boolean {
    const entryPatterns = [
      /index\.(ts|tsx|js|jsx)$/,
      /main\.(ts|tsx|js|jsx)$/,
      /app\.(ts|tsx|js|jsx)$/,
      /server\.(ts|tsx|js|jsx)$/
    ];

    return entryPatterns.some(pattern => pattern.test(filePath));
  }

  private isTestFile(filePath: string): boolean {
    const testPatterns = [
      /\.test\./,
      /\.spec\./,
      /__tests__/,
      /_tests_/,
      /test/,
      /tests/
    ];

    return testPatterns.some(pattern => pattern.test(filePath));
  }

  private isConfigFile(filePath: string): boolean {
    const configPatterns = [
      /config\./,
      /\.config\./,
      /\.rc\./,
      /package\.json$/,
      /tsconfig\.json$/,
      /webpack\./,
      /rollup\./,
      /vite\./
    ];

    return configPatterns.some(pattern => pattern.test(filePath));
  }

  private async performLanguageSpecificAnalysis(node: FileNode): Promise<void> {
    if (!node.content || !node.language) return;

    try {
      // Use AI for sophisticated code analysis
      const analysisPrompt = `
Analyze this ${node.language} code and extract structured information.

File: ${node.name}
Content:
\`\`\`${node.language}
${node.content}
\`\`\`

Extract and return JSON with:
{
  "imports": ["import1", "import2"],
  "exports": ["export1", "export2"],
  "functions": [
    {
      "name": "functionName",
      "line": 10,
      "parameters": [{"name": "param1", "type": "string", "isOptional": false}],
      "returnType": "void",
      "isExported": true,
      "isAsync": false,
      "description": "What this function does"
    }
  ],
  "classes": [
    {
      "name": "ClassName",
      "line": 20,
      "extends": "BaseClass",
      "methods": [],
      "properties": [],
      "isExported": true,
      "description": "What this class does"
    }
  ],
  "interfaces": [
    {
      "name": "InterfaceName",
      "line": 30,
      "properties": [],
      "methods": [],
      "isExported": true,
      "description": "What this interface defines"
    }
  ],
  "variables": [
    {
      "name": "variableName",
      "line": 5,
      "type": "string",
      "isExported": false,
      "isConstant": true,
      "scope": "global"
    }
  ]
}

Focus on extracting accurate line numbers and type information.
`;

      const response = await aiService.complete([{
        role: 'user',
        content: analysisPrompt
      }], {
        model: 'gpt-5',
        temperature: 0.1,
        maxTokens: 2000
      });

      const analysis = JSON.parse(response.content);

      // Update node with extracted information
      node.imports = analysis.imports || [];
      node.exports = analysis.exports || [];
      node.functions = analysis.functions || [];
      node.classes = analysis.classes || [];
      node.interfaces = analysis.interfaces || [];
      node.variables = analysis.variables || [];

    } catch (error) {
      console.warn(`Error in AI analysis for ${node.path}:`, error);
      // Fallback to simple regex-based analysis
      await this.performSimpleAnalysis(node);
    }
  }

  private async performSimpleAnalysis(node: FileNode): Promise<void> {
    if (!node.content) return;

    const lines = node.content.split('\n');

    // Simple regex patterns for basic analysis
    const importRegex = /import\s+.*?from\s+['"`]([^'"`]+)['"`]/g;
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    const classRegex = /(?:export\s+)?class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;

    // Extract imports
    let match;
    while ((match = importRegex.exec(node.content)) !== null) {
      node.imports!.push(match[1]);
    }

    // Extract exports
    while ((match = exportRegex.exec(node.content)) !== null) {
      node.exports!.push(match[1]);
    }

    // Extract functions
    lines.forEach((line, index) => {
      const funcMatch = line.match(functionRegex);
      if (funcMatch) {
        node.functions!.push({
          name: funcMatch[1],
          line: index + 1,
          parameters: [],
          isExported: line.includes('export'),
          isAsync: line.includes('async')
        });
      }

      const classMatch = line.match(classRegex);
      if (classMatch) {
        node.classes!.push({
          name: classMatch[1],
          line: index + 1,
          methods: [],
          properties: [],
          isExported: line.includes('export')
        });
      }
    });
  }

  private async buildDependencyGraph(): Promise<void> {
    const nodes: string[] = [];
    const edges: DependencyEdge[] = [];

    // Add all files as nodes
    for (const [path, file] of this.fileIndex) {
      nodes.push(path);

      // Add dependency edges based on imports
      file.imports?.forEach(importPath => {
        const resolvedPath = this.resolveImportPath(importPath, path);
        if (resolvedPath && this.fileIndex.has(resolvedPath)) {
          edges.push({
            from: path,
            to: resolvedPath,
            type: 'import',
            weight: 1
          });
        }
      });
    }

    this.dependencyGraph = {
      nodes,
      edges,
      cycles: this.detectCycles(nodes, edges),
      entryPoints: this.identifyEntryPoints(nodes, edges),
      levels: this.calculateDependencyLevels(nodes, edges)
    };
  }

  private resolveImportPath(importPath: string, fromFile: string): string | null {
    const path = require('path');
    const fs = require('fs');

    // Handle relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const dir = path.dirname(fromFile);
      let resolved = path.resolve(dir, importPath);

      // Try different extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];

      if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
        return resolved;
      }

      for (const ext of extensions) {
        const withExt = resolved + ext;
        if (fs.existsSync(withExt)) {
          return withExt;
        }
      }

      // Try index files
      const indexPath = path.join(resolved, 'index');
      for (const ext of extensions) {
        const indexWithExt = indexPath + ext;
        if (fs.existsSync(indexWithExt)) {
          return indexWithExt;
        }
      }
    }

    // Handle absolute imports within the project
    if (importPath.startsWith('@/') || importPath.startsWith('~/')) {
      const cleanPath = importPath.replace(/^[@~]\//, '');
      const resolved = path.join(this.rootPath, cleanPath);

      const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
      for (const ext of extensions) {
        const withExt = resolved + ext;
        if (fs.existsSync(withExt)) {
          return withExt;
        }
      }
    }

    return null;
  }

  private detectCycles(nodes: string[], edges: DependencyEdge[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const adjacencyList = new Map<string, string[]>();

    // Build adjacency list
    edges.forEach(edge => {
      if (!adjacencyList.has(edge.from)) {
        adjacencyList.set(edge.from, []);
      }
      adjacencyList.get(edge.from)!.push(edge.to);
    });

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          cycles.push([...path.slice(cycleStart), neighbor]);
        } else if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        }
      }

      recursionStack.delete(node);
    };

    for (const node of nodes) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }

  private identifyEntryPoints(nodes: string[], edges: DependencyEdge[]): string[] {
    const hasIncoming = new Set<string>();

    edges.forEach(edge => {
      hasIncoming.add(edge.to);
    });

    return nodes.filter(node => !hasIncoming.has(node));
  }

  private calculateDependencyLevels(nodes: string[], edges: DependencyEdge[]): Map<string, number> {
    const levels = new Map<string, number>();
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize
    nodes.forEach(node => {
      adjacencyList.set(node, []);
      inDegree.set(node, 0);
    });

    // Build adjacency list and calculate in-degrees
    edges.forEach(edge => {
      adjacencyList.get(edge.from)!.push(edge.to);
      inDegree.set(edge.to, inDegree.get(edge.to)! + 1);
    });

    // Topological sort with level calculation
    const queue: string[] = [];

    // Start with nodes that have no dependencies
    nodes.forEach(node => {
      if (inDegree.get(node) === 0) {
        levels.set(node, 0);
        queue.push(node);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLevel = levels.get(current)!;

      const neighbors = adjacencyList.get(current) || [];
      for (const neighbor of neighbors) {
        const newInDegree = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, newInDegree);

        if (newInDegree === 0) {
          levels.set(neighbor, currentLevel + 1);
          queue.push(neighbor);
        }
      }
    }

    return levels;
  }

  private async createSemanticChunks(): Promise<void> {
    this.semanticChunks.clear();

    for (const [path, file] of this.fileIndex) {
      if (!file.content) continue;

      const chunks: SemanticChunk[] = [];
      const lines = file.content.split('\n');

      // Create chunks for functions
      file.functions?.forEach(func => {
        const chunk = this.createFunctionChunk(file, func, lines);
        if (chunk) chunks.push(chunk);
      });

      // Create chunks for classes
      file.classes?.forEach(cls => {
        const chunk = this.createClassChunk(file, cls, lines);
        if (chunk) chunks.push(chunk);
      });

      // Create chunks for interfaces
      file.interfaces?.forEach(iface => {
        const chunk = this.createInterfaceChunk(file, iface, lines);
        if (chunk) chunks.push(chunk);
      });

      // Create import chunk if there are imports
      if (file.imports && file.imports.length > 0) {
        const importChunk = this.createImportChunk(file, lines);
        if (importChunk) chunks.push(importChunk);
      }

      if (chunks.length > 0) {
        this.semanticChunks.set(path, chunks);
      }
    }
  }

  private createFunctionChunk(file: FileNode, func: FunctionInfo, lines: string[]): SemanticChunk | null {
    try {
      const startLine = Math.max(0, func.line - 1);
      let endLine = startLine;

      // Find the end of the function (simple heuristic)
      let braceCount = 0;
      let foundOpenBrace = false;

      for (let i = startLine; i < lines.length; i++) {
        const line = lines[i];

        for (const char of line) {
          if (char === '{') {
            braceCount++;
            foundOpenBrace = true;
          } else if (char === '}') {
            braceCount--;
            if (foundOpenBrace && braceCount === 0) {
              endLine = i;
              break;
            }
          }
        }

        if (foundOpenBrace && braceCount === 0) break;
        if (i - startLine > 200) break; // Prevent runaway
      }

      const content = lines.slice(startLine, endLine + 1).join('\n');

      return {
        id: `${file.path}:function:${func.name}`,
        filePath: file.path,
        content,
        startLine: startLine + 1,
        endLine: endLine + 1,
        type: 'function',
        name: func.name,
        description: func.description,
        keywords: [func.name, file.language || '', 'function'],
        relatedChunks: []
      };
    } catch (error) {
      console.warn(`Error creating function chunk for ${func.name}:`, error);
      return null;
    }
  }

  private createClassChunk(file: FileNode, cls: ClassInfo, lines: string[]): SemanticChunk | null {
    try {
      const startLine = Math.max(0, cls.line - 1);
      let endLine = startLine;

      // Find the end of the class
      let braceCount = 0;
      let foundOpenBrace = false;

      for (let i = startLine; i < lines.length; i++) {
        const line = lines[i];

        for (const char of line) {
          if (char === '{') {
            braceCount++;
            foundOpenBrace = true;
          } else if (char === '}') {
            braceCount--;
            if (foundOpenBrace && braceCount === 0) {
              endLine = i;
              break;
            }
          }
        }

        if (foundOpenBrace && braceCount === 0) break;
        if (i - startLine > 500) break; // Prevent runaway for large classes
      }

      const content = lines.slice(startLine, endLine + 1).join('\n');

      return {
        id: `${file.path}:class:${cls.name}`,
        filePath: file.path,
        content,
        startLine: startLine + 1,
        endLine: endLine + 1,
        type: 'class',
        name: cls.name,
        description: cls.description,
        keywords: [cls.name, file.language || '', 'class'],
        relatedChunks: []
      };
    } catch (error) {
      console.warn(`Error creating class chunk for ${cls.name}:`, error);
      return null;
    }
  }

  private createInterfaceChunk(file: FileNode, iface: InterfaceInfo, lines: string[]): SemanticChunk | null {
    try {
      const startLine = Math.max(0, iface.line - 1);
      let endLine = startLine;

      // Find the end of the interface
      let braceCount = 0;
      let foundOpenBrace = false;

      for (let i = startLine; i < lines.length; i++) {
        const line = lines[i];

        for (const char of line) {
          if (char === '{') {
            braceCount++;
            foundOpenBrace = true;
          } else if (char === '}') {
            braceCount--;
            if (foundOpenBrace && braceCount === 0) {
              endLine = i;
              break;
            }
          }
        }

        if (foundOpenBrace && braceCount === 0) break;
        if (i - startLine > 100) break; // Interfaces are usually smaller
      }

      const content = lines.slice(startLine, endLine + 1).join('\n');

      return {
        id: `${file.path}:interface:${iface.name}`,
        filePath: file.path,
        content,
        startLine: startLine + 1,
        endLine: endLine + 1,
        type: 'interface',
        name: iface.name,
        description: iface.description,
        keywords: [iface.name, file.language || '', 'interface'],
        relatedChunks: []
      };
    } catch (error) {
      console.warn(`Error creating interface chunk for ${iface.name}:`, error);
      return null;
    }
  }

  private createImportChunk(file: FileNode, lines: string[]): SemanticChunk | null {
    try {
      let startLine = 0;
      let endLine = 0;

      // Find import block
      for (let i = 0; i < Math.min(50, lines.length); i++) {
        const line = lines[i];
        if (line.trim().startsWith('import') || line.trim().startsWith('const') && line.includes('require')) {
          if (startLine === 0) startLine = i;
          endLine = i;
        } else if (line.trim() === '' || line.trim().startsWith('//')) {
          continue; // Skip empty lines and comments in import section
        } else if (startLine > 0) {
          break; // End of import block
        }
      }

      if (startLine === endLine && startLine === 0) return null;

      const content = lines.slice(startLine, endLine + 1).join('\n');

      return {
        id: `${file.path}:imports`,
        filePath: file.path,
        content,
        startLine: startLine + 1,
        endLine: endLine + 1,
        type: 'import',
        keywords: ['imports', 'dependencies', file.language || ''],
        relatedChunks: []
      };
    } catch (error) {
      console.warn(`Error creating import chunk:`, error);
      return null;
    }
  }

  private async analyzeRelationships(): Promise<void> {
    this.relationships = [];

    for (const [path, file] of this.fileIndex) {
      // Analyze import relationships
      file.imports?.forEach(importPath => {
        const resolvedPath = this.resolveImportPath(importPath, path);
        if (resolvedPath && this.fileIndex.has(resolvedPath)) {
          this.relationships.push({
            file1: path,
            file2: resolvedPath,
            relationship: 'imports',
            strength: 0.8,
            details: `${file.name} imports from ${this.fileIndex.get(resolvedPath)?.name}`
          });
        }
      });

      // Analyze inheritance relationships
      file.classes?.forEach(cls => {
        if (cls.extends) {
          // Try to find the extended class in other files
          const extendedClass = this.findClassInCodebase(cls.extends);
          if (extendedClass) {
            this.relationships.push({
              file1: path,
              file2: extendedClass.filePath,
              relationship: 'extends',
              strength: 0.9,
              details: `${cls.name} extends ${cls.extends}`
            });
          }
        }
      });

      // Analyze test relationships
      if (file.isTestFile) {
        const testedFile = this.findTestedFile(path);
        if (testedFile) {
          this.relationships.push({
            file1: path,
            file2: testedFile,
            relationship: 'tests',
            strength: 0.7,
            details: `Test file for ${this.fileIndex.get(testedFile)?.name}`
          });
        }
      }
    }
  }

  private findClassInCodebase(className: string): { filePath: string; class: ClassInfo } | null {
    for (const [path, file] of this.fileIndex) {
      const cls = file.classes?.find(c => c.name === className);
      if (cls) {
        return { filePath: path, class: cls };
      }
    }
    return null;
  }

  private findTestedFile(testFilePath: string): string | null {
    const testFileName = require('path').basename(testFilePath);
    const possibleNames = [
      testFileName.replace(/\.test\..*$/, ''),
      testFileName.replace(/\.spec\..*$/, ''),
      testFileName.replace(/Test\..*$/, ''),
      testFileName.replace(/Spec\..*$/, '')
    ];

    for (const [path, file] of this.fileIndex) {
      if (file.isTestFile || path === testFilePath) continue;

      const fileName = require('path').basename(path);
      if (possibleNames.some(name => fileName.startsWith(name))) {
        return path;
      }
    }

    return null;
  }

  private async generateCodebaseAnalysis(): Promise<MultiFileAnalysis> {
    const totalFiles = this.fileIndex.size;
    let totalLines = 0;
    const languages = new Map<string, number>();
    const patterns: string[] = [];
    const hotspots: string[] = [];
    const risks: AnalysisRisk[] = [];

    // Calculate metrics
    for (const [path, file] of this.fileIndex) {
      if (file.content) {
        totalLines += file.content.split('\n').length;
      }

      if (file.language) {
        languages.set(file.language, (languages.get(file.language) || 0) + 1);
      }
    }

    // Identify hotspots (files with many dependencies)
    this.dependencyGraph.edges.forEach(edge => {
      // Count incoming edges
      const incomingCount = this.dependencyGraph.edges.filter(e => e.to === edge.to).length;
      if (incomingCount > 5) {
        if (!hotspots.includes(edge.to)) {
          hotspots.push(edge.to);
        }
      }
    });

    // Identify risks
    if (this.dependencyGraph.cycles.length > 0) {
      risks.push({
        type: 'circular_dependency',
        severity: 'high',
        files: this.dependencyGraph.cycles.flat(),
        description: `Found ${this.dependencyGraph.cycles.length} circular dependencies`,
        recommendation: 'Refactor to remove circular dependencies'
      });
    }

    // Check for large files
    for (const [path, file] of this.fileIndex) {
      if (file.size && file.size > 10000) { // > 10KB
        risks.push({
          type: 'large_file',
          severity: 'medium',
          files: [path],
          description: `File ${file.name} is very large (${file.size} bytes)`,
          recommendation: 'Consider breaking down large files into smaller modules'
        });
      }
    }

    // Determine complexity
    let complexity: 'low' | 'medium' | 'high' | 'very_high' = 'low';
    if (totalFiles > 500) complexity = 'very_high';
    else if (totalFiles > 200) complexity = 'high';
    else if (totalFiles > 50) complexity = 'medium';

    // Determine architecture pattern
    let architecture: 'monolith' | 'modular' | 'microservices' | 'layered' = 'monolith';
    const avgDependencies = this.dependencyGraph.edges.length / totalFiles;
    if (avgDependencies < 2) architecture = 'microservices';
    else if (avgDependencies < 5) architecture = 'modular';
    else if (this.hasLayeredStructure()) architecture = 'layered';

    // Calculate health score
    let healthScore = 100;
    healthScore -= risks.filter(r => r.severity === 'critical').length * 20;
    healthScore -= risks.filter(r => r.severity === 'high').length * 10;
    healthScore -= risks.filter(r => r.severity === 'medium').length * 5;
    healthScore -= risks.filter(r => r.severity === 'low').length * 2;
    healthScore = Math.max(0, healthScore);

    return {
      totalFiles,
      totalLines,
      languages,
      complexity,
      architecture,
      patterns,
      hotspots,
      risks,
      suggestions: this.generateSuggestions(risks, complexity),
      codebaseHealth: healthScore
    };
  }

  private hasLayeredStructure(): boolean {
    const commonLayers = ['controller', 'service', 'repository', 'model', 'view', 'component'];
    const foundLayers = new Set<string>();

    for (const [path] of this.fileIndex) {
      const lowerPath = path.toLowerCase();
      commonLayers.forEach(layer => {
        if (lowerPath.includes(layer)) {
          foundLayers.add(layer);
        }
      });
    }

    return foundLayers.size >= 3;
  }

  private generateSuggestions(risks: AnalysisRisk[], complexity: string): string[] {
    const suggestions: string[] = [];

    if (risks.some(r => r.type === 'circular_dependency')) {
      suggestions.push('Refactor circular dependencies to improve maintainability');
    }

    if (risks.some(r => r.type === 'large_file')) {
      suggestions.push('Break down large files into smaller, focused modules');
    }

    if (complexity === 'very_high') {
      suggestions.push('Consider implementing better modularization strategies');
      suggestions.push('Add comprehensive documentation for complex areas');
    }

    if (this.fileIndex.size > 100) {
      const testFiles = Array.from(this.fileIndex.values()).filter(f => f.isTestFile).length;
      const testCoverage = (testFiles / this.fileIndex.size) * 100;

      if (testCoverage < 30) {
        suggestions.push('Increase test coverage to improve code reliability');
      }
    }

    suggestions.push('Regularly review and update dependencies');
    suggestions.push('Consider implementing automated code quality checks');

    return suggestions;
  }

  // Public API methods
  async searchContext(query: ContextQuery): Promise<ContextSearchResult[]> {
    if (!this.lastIndexTime) {
      throw new Error('Codebase not indexed. Call indexCodebase() first.');
    }

    const results: ContextSearchResult[] = [];

    try {
      // Use AI for semantic search if requested
      if (query.semanticSearch) {
        return await this.performSemanticSearch(query);
      }

      // Simple text-based search
      for (const [path, chunks] of this.semanticChunks) {
        if (query.files && !query.files.includes(path)) continue;

        const matchingChunks = chunks.filter(chunk =>
          chunk.content.toLowerCase().includes(query.query.toLowerCase()) ||
          chunk.keywords.some(keyword =>
            keyword.toLowerCase().includes(query.query.toLowerCase())
          )
        );

        if (matchingChunks.length > 0) {
          const file = this.fileIndex.get(path);
          if (file) {
            results.push({
              file: path,
              chunks: matchingChunks,
              relevanceScore: this.calculateRelevanceScore(matchingChunks, query.query),
              summary: `Found ${matchingChunks.length} relevant code sections`,
              relatedFiles: this.getRelatedFiles(path)
            });
          }
        }
      }

      return results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, query.maxResults || 20);

    } catch (error) {
      console.error('Error searching context:', error);
      return [];
    }
  }

  private async performSemanticSearch(query: ContextQuery): Promise<ContextSearchResult[]> {
    // This would implement semantic search using embeddings
    // For now, fall back to text search
    return this.searchContext({ ...query, semanticSearch: false });
  }

  private calculateRelevanceScore(chunks: SemanticChunk[], query: string): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    chunks.forEach(chunk => {
      // Keyword matches
      chunk.keywords.forEach(keyword => {
        if (keyword.toLowerCase().includes(queryLower)) {
          score += 10;
        }
      });

      // Content matches
      const matches = (chunk.content.toLowerCase().match(new RegExp(queryLower, 'g')) || []).length;
      score += matches * 5;

      // Name matches (higher weight)
      if (chunk.name && chunk.name.toLowerCase().includes(queryLower)) {
        score += 20;
      }
    });

    return score;
  }

  private getRelatedFiles(filePath: string): string[] {
    return this.relationships
      .filter(rel => rel.file1 === filePath || rel.file2 === filePath)
      .map(rel => rel.file1 === filePath ? rel.file2 : rel.file1)
      .slice(0, 5);
  }

  // Getters for various data
  getFileIndex(): Map<string, FileNode> {
    return new Map(this.fileIndex);
  }

  getDependencyGraph(): DependencyGraph {
    return { ...this.dependencyGraph };
  }

  getRelationships(): ContextRelationship[] {
    return [...this.relationships];
  }

  getSemanticChunks(filePath?: string): SemanticChunk[] {
    if (filePath) {
      return this.semanticChunks.get(filePath) || [];
    }
    return Array.from(this.semanticChunks.values()).flat();
  }

  getAnalysisCache(): Map<string, any> {
    return new Map(this.analysisCache);
  }

  isIndexed(): boolean {
    return this.lastIndexTime !== null && this.fileIndex.size > 0;
  }

  getIndexingStatus(): {
    isIndexed: boolean;
    lastIndexTime: Date | null;
    totalFiles: number;
    inProgress: boolean;
  } {
    return {
      isIndexed: this.isIndexed(),
      lastIndexTime: this.lastIndexTime,
      totalFiles: this.fileIndex.size,
      inProgress: this.indexingInProgress
    };
  }

  // Cleanup
  destroy(): void {
    this.fileIndex.clear();
    this.semanticChunks.clear();
    this.relationships = [];
    this.analysisCache.clear();
    this.removeAllListeners();
  }
}

// Export factory function
export function createMultiFileContextManager(rootPath: string): MultiFileContextManager {
  return new MultiFileContextManager(rootPath);
}