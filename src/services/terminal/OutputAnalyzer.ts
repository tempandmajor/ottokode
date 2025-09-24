import { EventEmitter } from 'events';

export interface AnalysisRequest {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  category?: string;
  expectedOutput?: string;
  workingDirectory?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface OutputAnalysis {
  summary: string;
  errorDetected: boolean;
  warningsDetected: boolean;
  successIndicators: string[];
  failureIndicators: string[];
  extractedData?: ExtractedData;
  recommendations?: string[];
  followUpCommands?: FollowUpCommand[];
  severity: 'info' | 'warning' | 'error' | 'success';
  confidence: number;
  keyFindings: string[];
  performanceMetrics?: PerformanceMetrics;
}

export interface ExtractedData {
  filesPaths?: string[];
  urls?: string[];
  versions?: string[];
  dependencies?: string[];
  processes?: ProcessInfo[];
  gitInfo?: GitInfo;
  networkInfo?: NetworkInfo;
  systemInfo?: SystemInfo;
  errorCodes?: ErrorCode[];
}

export interface ProcessInfo {
  pid: number;
  name: string;
  status: string;
  cpu?: number;
  memory?: number;
}

export interface GitInfo {
  branch: string;
  commit?: string;
  status?: string;
  remotes?: string[];
  changes?: number;
}

export interface NetworkInfo {
  ports?: number[];
  ips?: string[];
  domains?: string[];
  protocols?: string[];
}

export interface SystemInfo {
  os?: string;
  architecture?: string;
  memory?: string;
  diskSpace?: string;
  uptime?: string;
}

export interface ErrorCode {
  code: string;
  message: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
}

export interface FollowUpCommand {
  command: string;
  args: string[];
  description: string;
  reason: string;
  category: string;
  riskLevel: 'safe' | 'low' | 'medium' | 'high';
}

export interface PerformanceMetrics {
  executionTime: number;
  outputSize: number;
  linesOfOutput: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface PatternMatcher {
  pattern: RegExp;
  analyzer: (match: RegExpMatchArray, output: string) => Partial<OutputAnalysis>;
  priority: number;
  description: string;
}

export class OutputAnalyzer extends EventEmitter {
  private patternMatchers: PatternMatcher[] = [];
  private analysisHistory: Map<string, OutputAnalysis[]> = new Map();

  constructor() {
    super();
    this.initializePatternMatchers();
  }

  private initializePatternMatchers(): void {
    this.patternMatchers = [
      // Git operations
      {
        pattern: /git clone .* '(.+)'/,
        priority: 10,
        description: 'Git repository cloned successfully',
        analyzer: (match, output) => ({
          summary: `Successfully cloned repository to ${match[1]}`,
          successIndicators: ['Repository cloned', 'Clone completed'],
          extractedData: {
            filesPaths: [match[1]]
          },
          followUpCommands: [
            {
              command: 'cd',
              args: [match[1]],
              description: 'Navigate to cloned repository',
              reason: 'Typically you want to work inside the cloned repository',
              category: 'navigation',
              riskLevel: 'safe'
            },
            {
              command: 'ls',
              args: ['-la'],
              description: 'List repository contents',
              reason: 'See what files were cloned',
              category: 'exploration',
              riskLevel: 'safe'
            }
          ]
        })
      },

      // Package manager operations
      {
        pattern: /added (\d+) packages?.* in ([\d.]+s)/,
        priority: 9,
        description: 'NPM packages installed',
        analyzer: (match, output) => ({
          summary: `Installed ${match[1]} package(s) in ${match[2]}`,
          successIndicators: [`${match[1]} packages added`],
          performanceMetrics: {
            executionTime: parseFloat(match[2].replace('s', '')) * 1000,
            outputSize: output.length,
            linesOfOutput: output.split('\n').length
          },
          followUpCommands: [
            {
              command: 'npm',
              args: ['run', 'build'],
              description: 'Build the project',
              reason: 'After installing dependencies, you might want to build',
              category: 'development',
              riskLevel: 'low'
            },
            {
              command: 'npm',
              args: ['audit'],
              description: 'Check for vulnerabilities',
              reason: 'Ensure installed packages are secure',
              category: 'security',
              riskLevel: 'safe'
            }
          ]
        })
      },

      // File operations
      {
        pattern: /^(.+?):(\d+):(.*)$/m,
        priority: 8,
        description: 'Grep search results',
        analyzer: (match, output) => {
          const matches = output.match(/^(.+?):(\d+):(.*)$/gm) || [];
          const files = [...new Set(matches.map(m => m.split(':')[0]))];

          return {
            summary: `Found ${matches.length} matches in ${files.length} file(s)`,
            successIndicators: [`${matches.length} matches found`],
            extractedData: {
              filesPaths: files
            },
            followUpCommands: files.slice(0, 3).map(file => ({
              command: 'code',
              args: [file],
              description: `Open ${file} in editor`,
              reason: 'View the file with matches',
              category: 'development',
              riskLevel: 'safe'
            }))
          };
        }
      },

      // Process information
      {
        pattern: /^\s*(\d+)\s+(.+?)\s+(\d+\.\d+)\s+(\d+\.\d+)/m,
        priority: 7,
        description: 'Process list output',
        analyzer: (match, output) => {
          const processes: ProcessInfo[] = [];
          const processMatches = output.match(/^\s*(\d+)\s+(.+?)\s+(\d+\.\d+)\s+(\d+\.\d+)/gm);

          if (processMatches) {
            processMatches.forEach(pm => {
              const parts = pm.trim().split(/\s+/);
              if (parts.length >= 4) {
                processes.push({
                  pid: parseInt(parts[0]),
                  name: parts[1],
                  cpu: parseFloat(parts[2]),
                  memory: parseFloat(parts[3]),
                  status: 'running'
                });
              }
            });
          }

          return {
            summary: `Found ${processes.length} running processes`,
            extractedData: { processes },
            keyFindings: processes
              .filter(p => p.cpu > 50)
              .map(p => `High CPU usage: ${p.name} (${p.cpu}%)`)
          };
        }
      },

      // Network information
      {
        pattern: /listening on ([^:]+):(\d+)/i,
        priority: 7,
        description: 'Service listening on port',
        analyzer: (match, output) => ({
          summary: `Service listening on ${match[1]}:${match[2]}`,
          successIndicators: ['Server started', 'Service listening'],
          extractedData: {
            networkInfo: {
              ips: [match[1]],
              ports: [parseInt(match[2])]
            }
          },
          followUpCommands: [
            {
              command: 'curl',
              args: [`http://${match[1]}:${match[2]}`],
              description: 'Test the service',
              reason: 'Verify the service is responding',
              category: 'network',
              riskLevel: 'safe'
            }
          ]
        })
      },

      // Build operations
      {
        pattern: /Build successful|✓ Built in ([\d.]+)s/i,
        priority: 8,
        description: 'Build completed successfully',
        analyzer: (match, output) => {
          const timeMatch = output.match(/Built in ([\d.]+)s/);
          const buildTime = timeMatch ? parseFloat(timeMatch[1]) * 1000 : null;

          return {
            summary: 'Build completed successfully',
            successIndicators: ['Build successful', 'Compilation complete'],
            performanceMetrics: buildTime ? {
              executionTime: buildTime,
              outputSize: output.length,
              linesOfOutput: output.split('\n').length
            } : undefined,
            followUpCommands: [
              {
                command: 'npm',
                args: ['test'],
                description: 'Run tests',
                reason: 'After successful build, run tests to verify functionality',
                category: 'testing',
                riskLevel: 'safe'
              },
              {
                command: 'npm',
                args: ['start'],
                description: 'Start the application',
                reason: 'Launch the built application',
                category: 'development',
                riskLevel: 'low'
              }
            ]
          };
        }
      },

      // Error patterns
      {
        pattern: /error|failed|exception|fatal/i,
        priority: 10,
        description: 'Error detected in output',
        analyzer: (match, output) => {
          const errorLines = output.split('\n').filter(line =>
            /error|failed|exception|fatal/i.test(line)
          );

          const errorCodes: ErrorCode[] = [];
          errorLines.forEach(line => {
            const codeMatch = line.match(/error\s+(\w+\d*)/i);
            if (codeMatch) {
              errorCodes.push({
                code: codeMatch[1],
                message: line.trim(),
                type: 'runtime_error',
                severity: line.includes('fatal') ? 'high' : 'medium'
              });
            }
          });

          return {
            summary: `Detected ${errorLines.length} error(s)`,
            errorDetected: true,
            failureIndicators: errorLines.slice(0, 3),
            extractedData: { errorCodes },
            severity: 'error',
            recommendations: [
              'Review the error messages above',
              'Check logs for more detailed information',
              'Verify all dependencies are installed',
              'Ensure proper file permissions'
            ]
          };
        }
      },

      // Warning patterns
      {
        pattern: /warning|warn|deprecated/i,
        priority: 6,
        description: 'Warnings detected',
        analyzer: (match, output) => {
          const warningLines = output.split('\n').filter(line =>
            /warning|warn|deprecated/i.test(line)
          );

          return {
            summary: `Found ${warningLines.length} warning(s)`,
            warningsDetected: true,
            severity: 'warning',
            keyFindings: warningLines.slice(0, 5),
            recommendations: [
              'Review warnings to prevent future issues',
              'Update deprecated dependencies',
              'Consider fixing warnings before deployment'
            ]
          };
        }
      }
    ];

    // Sort by priority (higher first)
    this.patternMatchers.sort((a, b) => b.priority - a.priority);
  }

  async analyze(request: AnalysisRequest): Promise<OutputAnalysis> {
    try {
      const startAnalysis = Date.now();

      // Initialize base analysis
      let analysis: OutputAnalysis = {
        summary: 'Command completed',
        errorDetected: false,
        warningsDetected: false,
        successIndicators: [],
        failureIndicators: [],
        recommendations: [],
        followUpCommands: [],
        severity: request.exitCode === 0 ? 'success' : 'error',
        confidence: 0.5,
        keyFindings: [],
        performanceMetrics: {
          executionTime: request.endTime && request.startTime
            ? request.endTime.getTime() - request.startTime.getTime()
            : 0,
          outputSize: (request.stdout + request.stderr).length,
          linesOfOutput: (request.stdout + request.stderr).split('\n').length
        }
      };

      // Combine stdout and stderr for analysis
      const fullOutput = `${request.stdout}\n${request.stderr}`.trim();

      if (!fullOutput) {
        analysis.summary = 'Command completed with no output';
        analysis.confidence = 0.8;
        return analysis;
      }

      // Apply pattern matchers
      let bestMatch: Partial<OutputAnalysis> | null = null;
      let highestPriority = -1;

      for (const matcher of this.patternMatchers) {
        const match = fullOutput.match(matcher.pattern);
        if (match && matcher.priority > highestPriority) {
          try {
            bestMatch = matcher.analyzer(match, fullOutput);
            highestPriority = matcher.priority;
          } catch (error) {
            console.warn(`Pattern matcher failed: ${matcher.description}`, error);
          }
        }
      }

      // Merge pattern matcher results
      if (bestMatch) {
        analysis = { ...analysis, ...bestMatch };
        analysis.confidence = 0.9;
      }

      // Enhanced analysis based on command category
      if (request.category) {
        const categoryAnalysis = this.analyzeByCatagory(request, fullOutput);
        analysis = { ...analysis, ...categoryAnalysis };
      }

      // Exit code analysis
      if (request.exitCode !== 0) {
        analysis.errorDetected = true;
        analysis.severity = 'error';
        if (!analysis.failureIndicators.length) {
          analysis.failureIndicators.push(`Command failed with exit code ${request.exitCode}`);
        }

        // Add generic error recommendations
        analysis.recommendations = [
          ...(analysis.recommendations || []),
          'Check command syntax and arguments',
          'Verify file permissions and paths',
          'Review error output above'
        ];
      }

      // Generate intelligent summary if not already set
      if (analysis.summary === 'Command completed' && fullOutput.length > 0) {
        analysis.summary = this.generateSmartSummary(request, fullOutput);
      }

      // Store analysis in history
      this.storeAnalysis(request.command, analysis);

      const analysisTime = Date.now() - startAnalysis;
      if (analysis.performanceMetrics) {
        analysis.performanceMetrics.memoryUsage = process.memoryUsage().heapUsed;
      }

      this.emit('analysis_completed', { request, analysis, analysisTime });

      return analysis;

    } catch (error) {
      console.error('Output analysis failed:', error);
      return this.createErrorAnalysis(request, error as Error);
    }
  }

  private analyzeByCatagory(request: AnalysisRequest, output: string): Partial<OutputAnalysis> {
    switch (request.category) {
      case 'git':
        return this.analyzeGitOutput(output);
      case 'package_management':
        return this.analyzePackageManagement(output);
      case 'development':
        return this.analyzeDevelopmentOutput(output);
      case 'file_management':
        return this.analyzeFileManagement(output);
      default:
        return {};
    }
  }

  private analyzeGitOutput(output: string): Partial<OutputAnalysis> {
    const gitInfo: GitInfo = {
      branch: 'unknown'
    };

    // Extract branch info
    const branchMatch = output.match(/On branch (.+)/);
    if (branchMatch) {
      gitInfo.branch = branchMatch[1];
    }

    // Extract commit info
    const commitMatch = output.match(/commit ([a-f0-9]{7,})/);
    if (commitMatch) {
      gitInfo.commit = commitMatch[1];
    }

    // Check for uncommitted changes
    if (output.includes('Changes not staged') || output.includes('Changes to be committed')) {
      gitInfo.changes = (output.match(/modified:|new file:|deleted:/g) || []).length;
    }

    const followUpCommands: FollowUpCommand[] = [];

    if (output.includes('nothing to commit')) {
      followUpCommands.push({
        command: 'git',
        args: ['pull'],
        description: 'Pull latest changes',
        reason: 'Stay up to date with remote repository',
        category: 'git',
        riskLevel: 'low'
      });
    }

    if (gitInfo.changes && gitInfo.changes > 0) {
      followUpCommands.push({
        command: 'git',
        args: ['add', '.'],
        description: 'Stage all changes',
        reason: 'Prepare changes for commit',
        category: 'git',
        riskLevel: 'medium'
      });
    }

    return {
      extractedData: { gitInfo },
      followUpCommands
    };
  }

  private analyzePackageManagement(output: string): Partial<OutputAnalysis> {
    const recommendations: string[] = [];
    const successIndicators: string[] = [];

    if (output.includes('vulnerabilities')) {
      const vulnMatch = output.match(/(\d+) vulnerabilities/);
      if (vulnMatch) {
        recommendations.push(`Found ${vulnMatch[1]} vulnerabilities - run security audit`);
      }
    }

    if (output.includes('packages installed')) {
      successIndicators.push('Package installation completed');
      recommendations.push('Consider running tests to verify installation');
    }

    return {
      recommendations,
      successIndicators
    };
  }

  private analyzeDevelopmentOutput(output: string): Partial<OutputAnalysis> {
    const keyFindings: string[] = [];
    const followUpCommands: FollowUpCommand[] = [];

    // Check for compilation errors
    if (output.includes('compilation error') || output.includes('syntax error')) {
      keyFindings.push('Compilation errors detected');
    }

    // Check for test results
    const testMatch = output.match(/(\d+) passing|(\d+) failing/g);
    if (testMatch) {
      keyFindings.push(`Test results: ${testMatch.join(', ')}`);
    }

    // Build success indicators
    if (output.includes('Build completed') || output.includes('Compilation successful')) {
      followUpCommands.push({
        command: 'npm',
        args: ['run', 'test'],
        description: 'Run test suite',
        reason: 'Verify build quality with tests',
        category: 'testing',
        riskLevel: 'safe'
      });
    }

    return {
      keyFindings,
      followUpCommands
    };
  }

  private analyzeFileManagement(output: string): Partial<OutputAnalysis> {
    const extractedData: ExtractedData = {};

    // Extract file paths from ls output
    const fileMatches = output.match(/^[drwx-]{10}\s+\d+\s+\w+\s+\w+\s+\d+\s+\w+\s+\d+\s+\d+:\d+\s+(.+)$/gm);
    if (fileMatches) {
      extractedData.filesPaths = fileMatches.map(match =>
        match.split(/\s+/).pop() || ''
      );
    }

    return {
      extractedData,
      summary: `Listed ${extractedData.filesPaths?.length || 0} items`
    };
  }

  private generateSmartSummary(request: AnalysisRequest, output: string): string {
    const outputLength = output.length;
    const lineCount = output.split('\n').length;

    if (request.exitCode !== 0) {
      return `Command failed with exit code ${request.exitCode}`;
    }

    if (outputLength === 0) {
      return 'Command completed successfully with no output';
    }

    if (lineCount === 1) {
      return output.length > 100 ? `${output.substring(0, 97)}...` : output;
    }

    return `Command completed successfully (${lineCount} lines, ${outputLength} characters)`;
  }

  private storeAnalysis(command: string, analysis: OutputAnalysis): void {
    const commandKey = command.split(' ')[0]; // Use base command as key
    let history = this.analysisHistory.get(commandKey) || [];

    history.push(analysis);

    // Keep only last 50 analyses per command
    if (history.length > 50) {
      history = history.slice(-50);
    }

    this.analysisHistory.set(commandKey, history);
  }

  private createErrorAnalysis(request: AnalysisRequest, error: Error): OutputAnalysis {
    return {
      summary: `Analysis failed: ${error.message}`,
      errorDetected: true,
      warningsDetected: false,
      successIndicators: [],
      failureIndicators: ['Analysis error occurred'],
      severity: 'error',
      confidence: 0,
      keyFindings: ['Output analysis could not be completed'],
      recommendations: [
        'Try running the command again',
        'Check system resources',
        'Report this issue if it persists'
      ],
      performanceMetrics: {
        executionTime: 0,
        outputSize: (request.stdout + request.stderr).length,
        linesOfOutput: (request.stdout + request.stderr).split('\n').length
      }
    };
  }

  // Utility methods
  getAnalysisHistory(command?: string): OutputAnalysis[] {
    if (command) {
      return this.analysisHistory.get(command) || [];
    }

    return Array.from(this.analysisHistory.values()).flat();
  }

  clearAnalysisHistory(command?: string): void {
    if (command) {
      this.analysisHistory.delete(command);
    } else {
      this.analysisHistory.clear();
    }
  }

  getAnalysisStats(): {
    totalAnalyses: number;
    commandsCovered: number;
    averageConfidence: number;
    errorRate: number;
  } {
    const allAnalyses = this.getAnalysisHistory();

    return {
      totalAnalyses: allAnalyses.length,
      commandsCovered: this.analysisHistory.size,
      averageConfidence: allAnalyses.length > 0
        ? allAnalyses.reduce((sum, a) => sum + a.confidence, 0) / allAnalyses.length
        : 0,
      errorRate: allAnalyses.length > 0
        ? allAnalyses.filter(a => a.errorDetected).length / allAnalyses.length
        : 0
    };
  }

  // Add custom pattern matcher
  addPatternMatcher(matcher: PatternMatcher): void {
    this.patternMatchers.push(matcher);
    this.patternMatchers.sort((a, b) => b.priority - a.priority);
  }

  // Remove pattern matcher
  removePatternMatcher(description: string): boolean {
    const index = this.patternMatchers.findIndex(m => m.description === description);
    if (index >= 0) {
      this.patternMatchers.splice(index, 1);
      return true;
    }
    return false;
  }
}

export default OutputAnalyzer;