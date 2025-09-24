import { EventEmitter } from '../../utils/EventEmitter';
import { codebaseIndexer, IndexedFile, FileRelationship } from '../indexing/CodebaseIndexer';

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  metrics: DependencyMetrics;
  cycles: DependencyCycle[];
  clusters: DependencyCluster[];
  criticalPaths: CriticalPath[];
}

export interface DependencyNode {
  id: string;
  filePath: string;
  name: string;
  type: 'file' | 'module' | 'package';
  language: string;
  size: number;
  complexity: number;
  inDegree: number;
  outDegree: number;
  centrality: number;
  level: number;
  isExternal: boolean;
}

export interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  type: 'import' | 'require' | 'include' | 'reference';
  strength: number;
  line?: number;
  isCircular: boolean;
  isOptional: boolean;
  isDynamic: boolean;
}

export interface DependencyMetrics {
  totalNodes: number;
  totalEdges: number;
  averageInDegree: number;
  averageOutDegree: number;
  maxDepth: number;
  cyclomaticComplexity: number;
  coupling: number;
  cohesion: number;
  instability: number;
  abstractness: number;
}

export interface DependencyCycle {
  id: string;
  nodes: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  suggestedFix: string;
}

export interface DependencyCluster {
  id: string;
  nodes: string[];
  cohesion: number;
  purpose: string;
  isWellFormed: boolean;
}

export interface CriticalPath {
  id: string;
  nodes: string[];
  length: number;
  bottlenecks: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ImpactAnalysis {
  affectedFiles: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  propagationPaths: string[][];
  estimatedEffort: number;
  requiredTests: string[];
  warnings: string[];
}

export class DependencyMapper extends EventEmitter {
  private dependencyGraph: DependencyGraph | null = null;
  private lastAnalysis: Date | null = null;
  private analysisInProgress = false;

  constructor() {
    super();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    codebaseIndexer.on('indexingCompleted', this.handleIndexingCompleted.bind(this));
    codebaseIndexer.on('fileReindexed', this.handleFileChanged.bind(this));
  }

  public async analyzeDependencies(): Promise<DependencyGraph> {
    if (this.analysisInProgress) {
      throw new Error('Dependency analysis already in progress');
    }

    this.analysisInProgress = true;
    this.emit('analysisStarted');

    try {
      const files = codebaseIndexer.getAllFiles();

      // Build nodes
      const nodes = this.buildNodes(files);

      // Build edges
      const edges = this.buildEdges(files, nodes);

      // Calculate metrics
      const metrics = this.calculateMetrics(nodes, edges);

      // Detect cycles
      const cycles = this.detectCycles(nodes, edges);

      // Find clusters
      const clusters = this.findClusters(nodes, edges);

      // Identify critical paths
      const criticalPaths = this.findCriticalPaths(nodes, edges);

      this.dependencyGraph = {
        nodes,
        edges,
        metrics,
        cycles,
        clusters,
        criticalPaths
      };

      this.lastAnalysis = new Date();
      this.emit('analysisCompleted', this.dependencyGraph);

      return this.dependencyGraph;

    } finally {
      this.analysisInProgress = false;
    }
  }

  private buildNodes(files: IndexedFile[]): DependencyNode[] {
    return files.map(file => ({
      id: file.metadata.path,
      filePath: file.metadata.path,
      name: file.metadata.name,
      type: 'file' as const,
      language: file.metadata.language,
      size: file.metadata.size,
      complexity: file.structure.complexity.cyclomaticComplexity,
      inDegree: 0, // Will be calculated later
      outDegree: file.relationships.length,
      centrality: 0, // Will be calculated later
      level: 0, // Will be calculated later
      isExternal: false
    }));
  }

  private buildEdges(files: IndexedFile[], nodes: DependencyNode[]): DependencyEdge[] {
    const edges: DependencyEdge[] = [];
    let edgeId = 0;

    files.forEach(file => {
      file.relationships.forEach(rel => {
        if (nodes.some(n => n.id === rel.targetPath)) {
          edges.push({
            id: `edge_${++edgeId}`,
            source: file.metadata.path,
            target: rel.targetPath,
            type: rel.type as DependencyEdge['type'],
            strength: rel.strength,
            line: rel.line,
            isCircular: false, // Will be calculated later
            isOptional: false,
            isDynamic: false
          });
        }
      });
    });

    // Update in-degrees
    nodes.forEach(node => {
      node.inDegree = edges.filter(edge => edge.target === node.id).length;
    });

    return edges;
  }

  private calculateMetrics(nodes: DependencyNode[], edges: DependencyEdge[]): DependencyMetrics {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;

    const averageInDegree = nodes.reduce((sum, node) => sum + node.inDegree, 0) / totalNodes;
    const averageOutDegree = nodes.reduce((sum, node) => sum + node.outDegree, 0) / totalNodes;

    const maxDepth = this.calculateMaxDepth(nodes, edges);
    const cyclomaticComplexity = nodes.reduce((sum, node) => sum + node.complexity, 0);

    return {
      totalNodes,
      totalEdges,
      averageInDegree,
      averageOutDegree,
      maxDepth,
      cyclomaticComplexity,
      coupling: this.calculateCoupling(nodes, edges),
      cohesion: this.calculateCohesion(nodes, edges),
      instability: this.calculateInstability(nodes),
      abstractness: this.calculateAbstractness(nodes)
    };
  }

  private detectCycles(nodes: DependencyNode[], edges: DependencyEdge[]): DependencyCycle[] {
    const cycles: DependencyCycle[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const adjList = this.buildAdjacencyList(edges);

    const dfs = (nodeId: string, path: string[]): void => {
      if (recursionStack.has(nodeId)) {
        const cycleStart = path.indexOf(nodeId);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart);
          cycles.push({
            id: `cycle_${cycles.length}`,
            nodes: cycle,
            severity: this.calculateCycleSeverity(cycle.length),
            impact: `Circular dependency affects ${cycle.length} files`,
            suggestedFix: 'Consider dependency inversion or refactoring'
          });
        }
        return;
      }

      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const neighbors = adjList.get(nodeId) || [];
      neighbors.forEach(neighbor => dfs(neighbor, [...path]));

      recursionStack.delete(nodeId);
    };

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    });

    // Mark circular edges
    cycles.forEach(cycle => {
      for (let i = 0; i < cycle.nodes.length; i++) {
        const source = cycle.nodes[i];
        const target = cycle.nodes[(i + 1) % cycle.nodes.length];
        const edge = edges.find(e => e.source === source && e.target === target);
        if (edge) {
          edge.isCircular = true;
        }
      }
    });

    return cycles;
  }

  private findClusters(nodes: DependencyNode[], edges: DependencyEdge[]): DependencyCluster[] {
    // Simple clustering based on file paths and strong connections
    const clusters: DependencyCluster[] = [];
    const clustered = new Set<string>();

    // Group by directory structure
    const directoryGroups = new Map<string, string[]>();

    nodes.forEach(node => {
      if (clustered.has(node.id)) return;

      const parts = node.filePath.split('/');
      const directory = parts.slice(0, -1).join('/');

      if (!directoryGroups.has(directory)) {
        directoryGroups.set(directory, []);
      }
      directoryGroups.get(directory)!.push(node.id);
    });

    directoryGroups.forEach((nodeIds, directory) => {
      if (nodeIds.length > 1) {
        const cohesion = this.calculateClusterCohesion(nodeIds, edges);

        clusters.push({
          id: `cluster_${clusters.length}`,
          nodes: nodeIds,
          cohesion,
          purpose: `Files in ${directory}`,
          isWellFormed: cohesion > 0.6
        });

        nodeIds.forEach(nodeId => clustered.add(nodeId));
      }
    });

    return clusters;
  }

  private findCriticalPaths(nodes: DependencyNode[], edges: DependencyEdge[]): CriticalPath[] {
    const paths: CriticalPath[] = [];

    // Find longest paths in the dependency graph
    const adjList = this.buildAdjacencyList(edges);

    nodes.forEach(startNode => {
      if (startNode.inDegree === 0) { // Start from nodes with no dependencies
        const longestPath = this.findLongestPath(startNode.id, adjList, new Set());
        if (longestPath.length > 3) { // Only consider significant paths
          paths.push({
            id: `path_${paths.length}`,
            nodes: longestPath,
            length: longestPath.length,
            bottlenecks: this.identifyBottlenecks(longestPath, nodes),
            riskLevel: this.calculatePathRisk(longestPath.length)
          });
        }
      }
    });

    return paths.sort((a, b) => b.length - a.length).slice(0, 10); // Top 10 longest paths
  }

  public async analyzeImpact(filePath: string, changeType: 'modify' | 'delete' | 'rename'): Promise<ImpactAnalysis> {
    if (!this.dependencyGraph) {
      await this.analyzeDependencies();
    }

    const affectedFiles = new Set<string>();
    const propagationPaths: string[][] = [];

    // Find all files that depend on this file
    const findDependents = (targetPath: string, visited: Set<string>, path: string[]): void => {
      if (visited.has(targetPath)) return;
      visited.add(targetPath);

      const dependentEdges = this.dependencyGraph!.edges.filter(edge => edge.target === targetPath);

      dependentEdges.forEach(edge => {
        affectedFiles.add(edge.source);
        const newPath = [...path, edge.source];
        propagationPaths.push(newPath);

        if (newPath.length < 5) { // Limit recursion depth
          findDependents(edge.source, visited, newPath);
        }
      });
    };

    findDependents(filePath, new Set(), [filePath]);

    const riskLevel = this.calculateChangeRisk(changeType, affectedFiles.size);
    const estimatedEffort = this.estimateChangeEffort(affectedFiles.size, changeType);
    const requiredTests = this.findRequiredTests(Array.from(affectedFiles));

    return {
      affectedFiles: Array.from(affectedFiles),
      riskLevel,
      propagationPaths,
      estimatedEffort,
      requiredTests,
      warnings: this.generateChangeWarnings(changeType, affectedFiles.size)
    };
  }

  // Helper methods
  private buildAdjacencyList(edges: DependencyEdge[]): Map<string, string[]> {
    const adjList = new Map<string, string[]>();

    edges.forEach(edge => {
      if (!adjList.has(edge.source)) {
        adjList.set(edge.source, []);
      }
      adjList.get(edge.source)!.push(edge.target);
    });

    return adjList;
  }

  private calculateMaxDepth(nodes: DependencyNode[], edges: DependencyEdge[]): number {
    const adjList = this.buildAdjacencyList(edges);
    let maxDepth = 0;

    const calculateDepth = (nodeId: string, visited: Set<string>): number => {
      if (visited.has(nodeId)) return 0;
      visited.add(nodeId);

      const neighbors = adjList.get(nodeId) || [];
      let depth = 0;

      neighbors.forEach(neighbor => {
        depth = Math.max(depth, calculateDepth(neighbor, new Set(visited)));
      });

      return depth + 1;
    };

    nodes.forEach(node => {
      if (node.inDegree === 0) {
        const depth = calculateDepth(node.id, new Set());
        maxDepth = Math.max(maxDepth, depth);
      }
    });

    return maxDepth;
  }

  private calculateCoupling(nodes: DependencyNode[], edges: DependencyEdge[]): number {
    // Afferent coupling (Ca) + Efferent coupling (Ce)
    const totalConnections = edges.length;
    const maxPossibleConnections = nodes.length * (nodes.length - 1);
    return maxPossibleConnections > 0 ? totalConnections / maxPossibleConnections : 0;
  }

  private calculateCohesion(nodes: DependencyNode[], edges: DependencyEdge[]): number {
    // Simplified cohesion calculation based on internal vs external connections
    const internalEdges = edges.filter(edge =>
      nodes.some(n => n.id === edge.source) && nodes.some(n => n.id === edge.target)
    );
    return edges.length > 0 ? internalEdges.length / edges.length : 1;
  }

  private calculateInstability(nodes: DependencyNode[]): number {
    // I = Ce / (Ca + Ce), where Ce is efferent coupling and Ca is afferent coupling
    const totalEfferent = nodes.reduce((sum, node) => sum + node.outDegree, 0);
    const totalAfferent = nodes.reduce((sum, node) => sum + node.inDegree, 0);
    const total = totalEfferent + totalAfferent;
    return total > 0 ? totalEfferent / total : 0;
  }

  private calculateAbstractness(nodes: DependencyNode[]): number {
    // Simplified: based on interface/abstract class ratio
    const abstractNodes = nodes.filter(node =>
      node.name.includes('Interface') || node.name.includes('Abstract')
    );
    return nodes.length > 0 ? abstractNodes.length / nodes.length : 0;
  }

  private calculateCycleSeverity(cycleLength: number): DependencyCycle['severity'] {
    if (cycleLength <= 2) return 'low';
    if (cycleLength <= 4) return 'medium';
    if (cycleLength <= 6) return 'high';
    return 'critical';
  }

  private calculateClusterCohesion(nodeIds: string[], edges: DependencyEdge[]): number {
    const internalEdges = edges.filter(edge =>
      nodeIds.includes(edge.source) && nodeIds.includes(edge.target)
    );
    const externalEdges = edges.filter(edge =>
      (nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)) ||
      (!nodeIds.includes(edge.source) && nodeIds.includes(edge.target))
    );

    const totalEdges = internalEdges.length + externalEdges.length;
    return totalEdges > 0 ? internalEdges.length / totalEdges : 0;
  }

  private findLongestPath(startNode: string, adjList: Map<string, string[]>, visited: Set<string>): string[] {
    if (visited.has(startNode)) return [startNode];

    visited.add(startNode);
    const neighbors = adjList.get(startNode) || [];
    let longestPath = [startNode];

    neighbors.forEach(neighbor => {
      const path = this.findLongestPath(neighbor, adjList, new Set(visited));
      if (path.length > longestPath.length - 1) {
        longestPath = [startNode, ...path];
      }
    });

    return longestPath;
  }

  private identifyBottlenecks(path: string[], nodes: DependencyNode[]): string[] {
    return path.filter(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      return node && (node.inDegree > 5 || node.outDegree > 5);
    });
  }

  private calculatePathRisk(pathLength: number): CriticalPath['riskLevel'] {
    if (pathLength <= 3) return 'low';
    if (pathLength <= 6) return 'medium';
    if (pathLength <= 10) return 'high';
    return 'critical';
  }

  private calculateChangeRisk(changeType: 'modify' | 'delete' | 'rename', affectedCount: number): ImpactAnalysis['riskLevel'] {
    let baseRisk = 0;

    switch (changeType) {
      case 'modify': baseRisk = 1; break;
      case 'rename': baseRisk = 2; break;
      case 'delete': baseRisk = 3; break;
    }

    const totalRisk = baseRisk + Math.min(affectedCount / 5, 3);

    if (totalRisk <= 2) return 'low';
    if (totalRisk <= 4) return 'medium';
    if (totalRisk <= 6) return 'high';
    return 'critical';
  }

  private estimateChangeEffort(affectedCount: number, changeType: 'modify' | 'delete' | 'rename'): number {
    const baseEffort = { modify: 1, rename: 2, delete: 3 }[changeType];
    return baseEffort + Math.floor(affectedCount / 2);
  }

  private findRequiredTests(affectedFiles: string[]): string[] {
    const testFiles = codebaseIndexer.getAllFiles()
      .filter(file => /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(file.metadata.path));

    return testFiles
      .filter(testFile =>
        affectedFiles.some(affected =>
          testFile.content.includes(affected) || testFile.metadata.path.includes(affected)
        )
      )
      .map(file => file.metadata.path);
  }

  private generateChangeWarnings(changeType: 'modify' | 'delete' | 'rename', affectedCount: number): string[] {
    const warnings: string[] = [];

    if (changeType === 'delete' && affectedCount > 0) {
      warnings.push('Deleting this file will break dependent files');
    }

    if (affectedCount > 10) {
      warnings.push('High impact change - consider phased rollout');
    }

    if (changeType === 'rename' && affectedCount > 5) {
      warnings.push('Renaming will require updates to multiple import statements');
    }

    return warnings;
  }

  // Event handlers
  private async handleIndexingCompleted(): Promise<void> {
    // Auto-analyze dependencies after indexing
    await this.analyzeDependencies();
  }

  private async handleFileChanged(event: { filePath: string }): Promise<void> {
    // Invalidate analysis if it exists
    if (this.dependencyGraph) {
      this.dependencyGraph = null;
      this.lastAnalysis = null;
      this.emit('analysisInvalidated', { changedFile: event.filePath });
    }
  }

  // Public API methods
  public getDependencyGraph(): DependencyGraph | null {
    return this.dependencyGraph;
  }

  public getLastAnalysisTime(): Date | null {
    return this.lastAnalysis;
  }

  public isAnalysisInProgress(): boolean {
    return this.analysisInProgress;
  }

  public async getFileDependencies(filePath: string): Promise<{
    dependencies: string[];
    dependents: string[];
  }> {
    if (!this.dependencyGraph) {
      await this.analyzeDependencies();
    }

    const dependencies = this.dependencyGraph!.edges
      .filter(edge => edge.source === filePath)
      .map(edge => edge.target);

    const dependents = this.dependencyGraph!.edges
      .filter(edge => edge.target === filePath)
      .map(edge => edge.source);

    return { dependencies, dependents };
  }

  public async findCriticalFiles(): Promise<string[]> {
    if (!this.dependencyGraph) {
      await this.analyzeDependencies();
    }

    return this.dependencyGraph!.nodes
      .filter(node => node.inDegree > 5 || node.outDegree > 5)
      .sort((a, b) => (b.inDegree + b.outDegree) - (a.inDegree + a.outDegree))
      .slice(0, 10)
      .map(node => node.filePath);
  }

  public destroy(): void {
    this.dependencyGraph = null;
    this.lastAnalysis = null;
    this.removeAllListeners();
  }
}

// Singleton instance
export const dependencyMapper = new DependencyMapper();