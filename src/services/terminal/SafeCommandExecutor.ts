import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface ExecutionRequest {
  command: string;
  args: string[];
  workingDirectory?: string;
  environment?: Record<string, string>;
  timeout?: number;
  abortSignal?: AbortSignal;
  user?: string;
  shell?: string;
  stdio?: 'pipe' | 'inherit' | 'ignore';
}

export interface ExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  signal?: string;
  killed: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  workingDirectory: string;
  environment: Record<string, string>;
  pid?: number;
}

export interface SecurityPolicy {
  allowedCommands?: string[];
  blockedCommands?: string[];
  allowedPaths?: string[];
  blockedPaths?: string[];
  maxExecutionTime?: number;
  maxOutputSize?: number;
  allowNetworkAccess?: boolean;
  allowFileSystemWrite?: boolean;
  allowProcessSpawn?: boolean;
  allowElevation?: boolean;
  restrictedEnvironmentVars?: string[];
}

export interface ExecutionOptions {
  securityPolicy?: SecurityPolicy;
  sandbox?: boolean;
  logExecution?: boolean;
  validateBeforeExecution?: boolean;
}

export type SecurityViolationType =
  | 'blocked_command'
  | 'blocked_path'
  | 'elevation_attempt'
  | 'network_access'
  | 'file_write_attempt'
  | 'timeout_exceeded'
  | 'output_size_exceeded'
  | 'dangerous_pattern'
  | 'restricted_environment';

export interface SecurityViolation {
  type: SecurityViolationType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  details?: any;
}

export class SafeCommandExecutor extends EventEmitter {
  private defaultSecurityPolicy: SecurityPolicy;
  private executionLog: ExecutionRecord[] = [];

  constructor() {
    super();
    this.defaultSecurityPolicy = this.createDefaultSecurityPolicy();
  }

  private createDefaultSecurityPolicy(): SecurityPolicy {
    return {
      // Allow common safe commands
      allowedCommands: [
        'ls', 'cat', 'head', 'tail', 'grep', 'find', 'which', 'echo', 'pwd', 'whoami',
        'git', 'npm', 'node', 'python', 'python3', 'cargo', 'rustc', 'go',
        'mkdir', 'touch', 'cp', 'mv', 'chmod', 'chown',
        'ps', 'top', 'df', 'du', 'free', 'uptime', 'date',
        'curl', 'wget', 'ping', 'nslookup', 'dig'
      ],

      // Block dangerous commands
      blockedCommands: [
        'rm', 'rmdir', 'dd', 'fdisk', 'mkfs', 'format',
        'sudo', 'su', 'passwd', 'chpasswd',
        'iptables', 'ufw', 'firewall-cmd',
        'systemctl', 'service', 'init',
        'crontab', 'at', 'batch',
        'mount', 'umount', 'fsck',
        'reboot', 'shutdown', 'halt', 'poweroff'
      ],

      // Restrict sensitive paths
      blockedPaths: [
        '/etc/passwd', '/etc/shadow', '/etc/sudoers',
        '/boot', '/sys', '/proc',
        '/dev/sd*', '/dev/hd*', '/dev/nvme*',
        '/.ssh', '/root'
      ],

      maxExecutionTime: 300000, // 5 minutes
      maxOutputSize: 10 * 1024 * 1024, // 10MB
      allowNetworkAccess: true,
      allowFileSystemWrite: false,
      allowProcessSpawn: true,
      allowElevation: false,

      restrictedEnvironmentVars: [
        'PATH', 'LD_LIBRARY_PATH', 'PYTHONPATH',
        'HOME', 'USER', 'SUDO_USER'
      ]
    };
  }

  async execute(
    request: ExecutionRequest,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const startTime = new Date();

    try {
      // Security validation
      const violations = await this.validateExecution(request, options);
      if (violations.length > 0) {
        throw new SecurityError('Security policy violations detected', violations);
      }

      // Execute the command
      const result = await this.executeCommand(request, options);

      // Log execution
      if (options.logExecution !== false) {
        this.logExecution(request, result, violations);
      }

      this.emit('execution_completed', {
        request,
        result,
        violations,
        options
      });

      return result;

    } catch (error) {
      const result: ExecutionResult = {
        exitCode: -1,
        stdout: '',
        stderr: (error as Error).message,
        killed: false,
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        workingDirectory: request.workingDirectory || process.cwd(),
        environment: request.environment || {}
      };

      this.emit('execution_failed', {
        request,
        result,
        error,
        options
      });

      throw error;
    }
  }

  private async validateExecution(
    request: ExecutionRequest,
    options: ExecutionOptions
  ): Promise<SecurityViolation[]> {
    const violations: SecurityViolation[] = [];
    const policy = { ...this.defaultSecurityPolicy, ...options.securityPolicy };

    // Validate command
    const commandViolations = this.validateCommand(request.command, policy);
    violations.push(...commandViolations);

    // Validate arguments
    const argViolations = this.validateArguments(request.args, policy);
    violations.push(...argViolations);

    // Validate working directory
    if (request.workingDirectory) {
      const pathViolations = this.validatePath(request.workingDirectory, policy);
      violations.push(...pathViolations);
    }

    // Validate environment variables
    if (request.environment) {
      const envViolations = this.validateEnvironment(request.environment, policy);
      violations.push(...envViolations);
    }

    // Check for dangerous patterns
    const patternViolations = this.checkDangerousPatterns(request, policy);
    violations.push(...patternViolations);

    return violations;
  }

  private validateCommand(command: string, policy: SecurityPolicy): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // Check if command is explicitly blocked
    if (policy.blockedCommands?.includes(command)) {
      violations.push({
        type: 'blocked_command',
        severity: 'high',
        description: `Command '${command}' is explicitly blocked`,
        recommendation: 'Use an alternative command or request permission'
      });
    }

    // Check if only allowed commands are permitted and this isn't one
    if (policy.allowedCommands && !policy.allowedCommands.includes(command)) {
      violations.push({
        type: 'blocked_command',
        severity: 'medium',
        description: `Command '${command}' is not in the allowed list`,
        recommendation: 'Request approval for this command'
      });
    }

    // Check for elevation attempts
    if (['sudo', 'su', 'doas'].includes(command) && !policy.allowElevation) {
      violations.push({
        type: 'elevation_attempt',
        severity: 'critical',
        description: 'Elevation commands are not permitted',
        recommendation: 'Contact administrator for elevated access'
      });
    }

    return violations;
  }

  private validateArguments(args: string[], policy: SecurityPolicy): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    for (const arg of args) {
      // Check for path-based violations
      if (this.isFilePath(arg)) {
        const pathViolations = this.validatePath(arg, policy);
        violations.push(...pathViolations);
      }

      // Check for dangerous argument patterns
      const dangerousPatterns = [
        /--recursive.*\/$/,  // Recursive operations on root
        /--force.*--recursive/,  // Force recursive operations
        /-rf\s*\//, // rm -rf /
        />\s*\/dev\/null.*2>&1/, // Output redirection that might hide errors
        /\|\s*sh$/, // Piping to shell
        /\$\(.*\)/, // Command substitution
        /`.*`/      // Backtick command substitution
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(arg)) {
          violations.push({
            type: 'dangerous_pattern',
            severity: 'high',
            description: `Dangerous pattern detected in argument: ${arg}`,
            recommendation: 'Review and modify the command'
          });
        }
      }
    }

    return violations;
  }

  private validatePath(path: string, policy: SecurityPolicy): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // Check blocked paths
    if (policy.blockedPaths) {
      for (const blockedPath of policy.blockedPaths) {
        if (this.pathMatches(path, blockedPath)) {
          violations.push({
            type: 'blocked_path',
            severity: 'high',
            description: `Access to path '${path}' is blocked`,
            recommendation: 'Use an alternative path or request permission'
          });
        }
      }
    }

    // Check allowed paths
    if (policy.allowedPaths && policy.allowedPaths.length > 0) {
      const isAllowed = policy.allowedPaths.some(allowedPath =>
        this.pathMatches(path, allowedPath)
      );

      if (!isAllowed) {
        violations.push({
          type: 'blocked_path',
          severity: 'medium',
          description: `Path '${path}' is not in the allowed list`,
          recommendation: 'Request approval for this path'
        });
      }
    }

    return violations;
  }

  private validateEnvironment(
    environment: Record<string, string>,
    policy: SecurityPolicy
  ): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    if (policy.restrictedEnvironmentVars) {
      for (const restrictedVar of policy.restrictedEnvironmentVars) {
        if (environment.hasOwnProperty(restrictedVar)) {
          violations.push({
            type: 'restricted_environment',
            severity: 'medium',
            description: `Environment variable '${restrictedVar}' is restricted`,
            recommendation: 'Remove this environment variable or request permission'
          });
        }
      }
    }

    return violations;
  }

  private checkDangerousPatterns(
    request: ExecutionRequest,
    policy: SecurityPolicy
  ): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    const fullCommand = `${request.command} ${request.args.join(' ')}`;

    // Patterns that might indicate malicious activity
    const dangerousPatterns = [
      {
        pattern: /curl.*\|\s*sh/i,
        severity: 'critical' as const,
        description: 'Downloading and executing scripts from the internet'
      },
      {
        pattern: /wget.*\|\s*sh/i,
        severity: 'critical' as const,
        description: 'Downloading and executing scripts from the internet'
      },
      {
        pattern: /rm\s+-rf\s+\//,
        severity: 'critical' as const,
        description: 'Attempting to delete root filesystem'
      },
      {
        pattern: /:\(\)\{\s*:\|\:&\s*\};:/,
        severity: 'critical' as const,
        description: 'Fork bomb pattern detected'
      },
      {
        pattern: /\/dev\/null.*2>&1.*&$/,
        severity: 'medium' as const,
        description: 'Background execution with hidden output'
      },
      {
        pattern: /nc\s+.*-l.*-e/,
        severity: 'critical' as const,
        description: 'Potential reverse shell attempt'
      }
    ];

    for (const { pattern, severity, description } of dangerousPatterns) {
      if (pattern.test(fullCommand)) {
        violations.push({
          type: 'dangerous_pattern',
          severity,
          description,
          recommendation: 'Review command for security implications'
        });
      }
    }

    return violations;
  }

  private async executeCommand(
    request: ExecutionRequest,
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    const startTime = new Date();
    const policy = { ...this.defaultSecurityPolicy, ...options.securityPolicy };

    return new Promise((resolve, reject) => {
      const childProcess = spawn(request.command, request.args, {
        cwd: request.workingDirectory || process.cwd(),
        env: { ...process.env, ...request.environment },
        stdio: request.stdio || 'pipe',
        shell: request.shell || false,
        uid: request.user ? this.getUserId(request.user) : undefined
      });

      let stdout = '';
      let stderr = '';
      let killed = false;

      // Set up timeout
      const timeout = setTimeout(() => {
        killed = true;
        childProcess.kill('SIGTERM');

        // Force kill if SIGTERM doesn't work
        setTimeout(() => {
          if (!childProcess.killed) {
            childProcess.kill('SIGKILL');
          }
        }, 5000);
      }, request.timeout || policy.maxExecutionTime || 300000);

      // Handle abort signal
      if (request.abortSignal) {
        request.abortSignal.addEventListener('abort', () => {
          killed = true;
          childProcess.kill('SIGTERM');
          clearTimeout(timeout);
        });
      }

      // Collect output
      if (childProcess.stdout) {
        childProcess.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();

          // Check output size limit
          if (policy.maxOutputSize && stdout.length > policy.maxOutputSize) {
            killed = true;
            childProcess.kill('SIGTERM');
            reject(new SecurityError('Output size exceeded limit', [{
              type: 'output_size_exceeded',
              severity: 'medium',
              description: 'Command output exceeded maximum allowed size',
              recommendation: 'Use commands that produce less output'
            }]));
          }
        });
      }

      if (childProcess.stderr) {
        childProcess.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
      }

      // Handle process completion
      childProcess.on('close', (code, signal) => {
        clearTimeout(timeout);

        const endTime = new Date();
        const result: ExecutionResult = {
          exitCode: code || 0,
          stdout,
          stderr,
          signal: signal || undefined,
          killed,
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
          workingDirectory: request.workingDirectory || process.cwd(),
          environment: request.environment || {},
          pid: childProcess.pid
        };

        if (killed && request.abortSignal?.aborted) {
          reject(new Error('Command execution was aborted'));
        } else {
          resolve(result);
        }
      });

      // Handle process errors
      childProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // Emit events for monitoring
      this.emit('process_started', {
        request,
        pid: childProcess.pid,
        startTime
      });
    });
  }

  private isFilePath(arg: string): boolean {
    return arg.includes('/') || arg.includes('\\') || arg.startsWith('.');
  }

  private pathMatches(path: string, pattern: string): boolean {
    // Handle glob patterns
    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      return new RegExp(`^${regexPattern}$`).test(path);
    }

    // Handle exact matches and prefixes
    return path === pattern || path.startsWith(pattern + '/');
  }

  private getUserId(username: string): number | undefined {
    try {
      const { execSync } = require('child_process');
      const result = execSync(`id -u ${username}`, { encoding: 'utf8' });
      return parseInt(result.trim());
    } catch {
      return undefined;
    }
  }

  private logExecution(
    request: ExecutionRequest,
    result: ExecutionResult,
    violations: SecurityViolation[]
  ): void {
    const record: ExecutionRecord = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: result.startTime,
      command: request.command,
      args: request.args,
      workingDirectory: result.workingDirectory,
      exitCode: result.exitCode,
      duration: result.duration,
      success: result.exitCode === 0,
      violations: violations,
      outputSize: result.stdout.length + result.stderr.length,
      pid: result.pid
    };

    this.executionLog.push(record);

    // Keep only last 10000 records
    if (this.executionLog.length > 10000) {
      this.executionLog = this.executionLog.slice(-10000);
    }
  }

  // Utility methods
  getExecutionLog(): ExecutionRecord[] {
    return [...this.executionLog];
  }

  clearExecutionLog(): void {
    this.executionLog = [];
  }

  updateSecurityPolicy(policy: Partial<SecurityPolicy>): void {
    this.defaultSecurityPolicy = { ...this.defaultSecurityPolicy, ...policy };
  }

  getSecurityPolicy(): SecurityPolicy {
    return { ...this.defaultSecurityPolicy };
  }
}

export interface ExecutionRecord {
  id: string;
  timestamp: Date;
  command: string;
  args: string[];
  workingDirectory: string;
  exitCode: number;
  duration: number;
  success: boolean;
  violations: SecurityViolation[];
  outputSize: number;
  pid?: number;
}

export class SecurityError extends Error {
  violations: SecurityViolation[];

  constructor(message: string, violations: SecurityViolation[]) {
    super(message);
    this.name = 'SecurityError';
    this.violations = violations;
  }
}

export default SafeCommandExecutor;