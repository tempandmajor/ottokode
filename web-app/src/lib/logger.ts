/**
 * Production-safe logging utility
 * Logs to console in development, can be extended for production logging services
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel
  }

  private formatMessage(level: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel[level as keyof typeof LogLevel])) return

    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] ${level}:`

    if (data !== undefined) {
      console[level.toLowerCase() as 'log' | 'warn' | 'error'](prefix, message, data)
    } else {
      console[level.toLowerCase() as 'log' | 'warn' | 'error'](prefix, message)
    }
  }

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      this.formatMessage('DEBUG', message, data)
    }
  }

  info(message: string, data?: any): void {
    this.formatMessage('INFO', message, data)
  }

  warn(message: string, data?: any): void {
    this.formatMessage('WARN', message, data)
  }

  error(message: string, error?: any): void {
    this.formatMessage('ERROR', message, error)

    // In production, you could send to error tracking service
    if (!this.isDevelopment && typeof window !== 'undefined') {
      // Example: Sentry.captureException(error)
    }
  }

  // Special method for AI-related logs with emoji prefix
  ai(message: string, data?: any): void {
    this.debug(`🤖 ${message}`, data)
  }

  // Performance timing utility
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label)
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label)
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Convenience exports
export const { debug, info, warn, error, ai } = logger