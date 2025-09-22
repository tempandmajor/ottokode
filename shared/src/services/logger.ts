/**
 * Centralized Logging Service
 * Replaces console.log statements with environment-aware logging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  context?: string;
  userId?: string;
  sessionId?: string;
  source?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
  remoteEndpoint?: string;
  context?: string;
}

class Logger {
  private config: LoggerConfig;
  private storage: LogEntry[] = [];
  private sessionId: string;
  private context?: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: this.getLogLevelFromEnv(),
      enableConsole: this.isDevelopment(),
      enableRemote: this.isProduction(),
      enableStorage: true,
      maxStorageEntries: 1000,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.context = config.context;

    // Send stored logs on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  private getLogLevelFromEnv(): LogLevel {
    if (typeof process !== 'undefined' && process.env) {
      const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL?.toLowerCase();
      if (envLevel && ['debug', 'info', 'warn', 'error'].includes(envLevel)) {
        return envLevel as LogLevel;
      }
    }
    return this.isProduction() ? 'warn' : 'debug';
  }

  private isDevelopment(): boolean {
    return typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
  }

  private isProduction(): boolean {
    return typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context: this.context,
      sessionId: this.sessionId,
      source: typeof window !== 'undefined' ? 'browser' : 'server'
    };
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const logMethod = entry.level === 'error' ? console.error :
                     entry.level === 'warn' ? console.warn :
                     entry.level === 'debug' ? console.debug :
                     console.log;

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const contextStr = entry.context ? ` [${entry.context}]` : '';

    if (entry.data) {
      logMethod(`${prefix}${contextStr} ${entry.message}`, entry.data);
    } else {
      logMethod(`${prefix}${contextStr} ${entry.message}`);
    }
  }

  private storeEntry(entry: LogEntry): void {
    if (!this.config.enableStorage) return;

    this.storage.push(entry);

    // Keep storage size manageable
    if (this.storage.length > this.config.maxStorageEntries) {
      this.storage = this.storage.slice(-this.config.maxStorageEntries);
    }
  }

  private async sendToRemote(entries: LogEntry[]): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: entries })
      });
    } catch (error) {
      // Fallback to console if remote logging fails
      console.error('Failed to send logs to remote endpoint:', error);
    }
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, data);

    this.writeToConsole(entry);
    this.storeEntry(entry);

    // Send critical errors immediately
    if (level === 'error' && this.config.enableRemote) {
      this.sendToRemote([entry]);
    }
  }

  public debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  public info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  public warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  public error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  public setContext(context: string): void {
    this.context = context;
  }

  public setUserId(userId: string): void {
    this.storage.forEach(entry => {
      if (!entry.userId) entry.userId = userId;
    });
  }

  public async flush(): Promise<void> {
    if (this.storage.length === 0) return;

    const entriesToSend = [...this.storage];
    this.storage = [];

    if (this.config.enableRemote) {
      await this.sendToRemote(entriesToSend);
    }
  }

  public getStoredLogs(): LogEntry[] {
    return [...this.storage];
  }

  public clearStorage(): void {
    this.storage = [];
  }

  public updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create default logger instance
export const logger = new Logger();

// Create context-specific loggers
export const createLogger = (context: string, config: Partial<LoggerConfig> = {}): Logger => {
  return new Logger({ ...config, context });
};

// Utility functions for replacing console statements
export const replaceConsole = (): void => {
  if (typeof console !== 'undefined') {
    const originalConsole = { ...console };

    console.log = (message: any, ...args: any[]) => {
      logger.info(String(message), args.length > 0 ? args : undefined);
    };

    console.info = (message: any, ...args: any[]) => {
      logger.info(String(message), args.length > 0 ? args : undefined);
    };

    console.warn = (message: any, ...args: any[]) => {
      logger.warn(String(message), args.length > 0 ? args : undefined);
    };

    console.error = (message: any, ...args: any[]) => {
      logger.error(String(message), args.length > 0 ? args : undefined);
    };

    console.debug = (message: any, ...args: any[]) => {
      logger.debug(String(message), args.length > 0 ? args : undefined);
    };

    // Store original console for restoration
    (window as any).__originalConsole = originalConsole;
  }
};

export const restoreConsole = (): void => {
  if (typeof window !== 'undefined' && (window as any).__originalConsole) {
    Object.assign(console, (window as any).__originalConsole);
    delete (window as any).__originalConsole;
  }
};

// Default export
export default logger;