import { supabase } from '../../lib/supabase';
import { authService } from '../auth/AuthService';
import { EventEmitter } from '../../utils/EventEmitter';

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  category: string;
  data?: any;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

export interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: Date;
}

export interface ErrorData {
  message: string;
  stack?: string;
  component?: string;
  userId?: string;
  metadata?: any;
}

class MonitoringService extends EventEmitter {
  private sessionId: string;
  private logs: LogEntry[] = [];
  private metrics: MetricData[] = [];
  private performanceObserver?: PerformanceObserver;
  private errorBoundary = new Map<string, number>();

  // Buffer settings
  private readonly MAX_LOG_BUFFER = 100;
  private readonly MAX_METRIC_BUFFER = 50;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds

  constructor() {
    super();
    this.sessionId = this.generateSessionId();
    this.setupPerformanceMonitoring();
    this.setupErrorHandling();
    this.startPeriodicFlush();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public log(level: LogEntry['level'], message: string, category: string, data?: any): void {
    const authState = authService.getAuthState();

    const logEntry: LogEntry = {
      level,
      message,
      category,
      data: this.sanitizeData(data),
      timestamp: new Date(),
      userId: authState.user?.id,
      sessionId: this.sessionId
    };

    this.logs.push(logEntry);

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      const logMethod = level === 'error' ? console.error :
                      level === 'warn' ? console.warn :
                      level === 'debug' ? console.debug :
                      console.log;

      logMethod(`[${category}] ${message}`, data || '');
    }

    // Auto-flush on errors
    if (level === 'error') {
      this.flushLogs();
    }

    // Prevent buffer overflow
    if (this.logs.length > this.MAX_LOG_BUFFER) {
      this.flushLogs();
    }

    this.emit('logEntry', logEntry);
  }

  public metric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      tags,
      timestamp: new Date()
    };

    this.metrics.push(metric);

    // Prevent buffer overflow
    if (this.metrics.length > this.MAX_METRIC_BUFFER) {
      this.flushMetrics();
    }

    this.emit('metric', metric);
  }

  public error(error: Error | string, component?: string, metadata?: any): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;

    const errorData: ErrorData = {
      message: errorMessage,
      stack,
      component,
      userId: authService.getAuthState().user?.id,
      metadata: this.sanitizeData(metadata)
    };

    // Increment error count for this component
    const errorKey = `${component || 'unknown'}:${errorMessage}`;
    this.errorBoundary.set(errorKey, (this.errorBoundary.get(errorKey) || 0) + 1);

    this.log('error', errorMessage, component || 'error', {
      stack,
      metadata,
      count: this.errorBoundary.get(errorKey)
    });

    this.emit('error', errorData);
  }

  public startPerformanceTrace(name: string): string {
    const traceId = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    performance.mark(`${traceId}-start`);

    return traceId;
  }

  public endPerformanceTrace(traceId: string, metadata?: any): void {
    const endMark = `${traceId}-end`;
    performance.mark(endMark);

    try {
      const startMark = `${traceId}-start`;
      performance.measure(traceId, startMark, endMark);

      const measure = performance.getEntriesByName(traceId)[0];
      if (measure) {
        this.metric('performance_trace', measure.duration, {
          trace_name: traceId.split('-')[0],
          ...metadata
        });
      }

      // Clean up marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(traceId);
    } catch (error) {
      this.error(`Failed to end performance trace: ${error}`, 'monitoring');
    }
  }

  public trackUserAction(action: string, details?: any): void {
    this.log('info', `User action: ${action}`, 'user_action', details);
    this.metric('user_action', 1, { action });
  }

  public trackAPICall(endpoint: string, duration: number, success: boolean, statusCode?: number): void {
    this.metric('api_call_duration', duration, {
      endpoint,
      success: success.toString(),
      status_code: statusCode?.toString()
    });

    this.log('info', `API call to ${endpoint}`, 'api', {
      duration,
      success,
      statusCode
    });
  }

  private setupPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.metric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart);
              this.metric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
            }

            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              this.metric('resource_load_time', resourceEntry.responseEnd - resourceEntry.startTime, {
                resource_type: resourceEntry.initiatorType,
                resource_name: resourceEntry.name.split('/').pop() || 'unknown'
              });
            }

            if (entry.entryType === 'largest-contentful-paint') {
              this.metric('largest_contentful_paint', entry.startTime);
            }

            if (entry.entryType === 'first-input') {
              const fidEntry = entry as PerformanceEventTiming;
              this.metric('first_input_delay', fidEntry.processingStart - fidEntry.startTime);
            }
          }
        });

        this.performanceObserver.observe({
          entryTypes: ['navigation', 'resource', 'largest-contentful-paint', 'first-input']
        });
      } catch (error) {
        this.error(`Failed to setup performance monitoring: ${error}`, 'monitoring');
      }
    }

    // Monitor memory usage if available
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metric('memory_used_js_heap', memory.usedJSHeapSize);
        this.metric('memory_total_js_heap', memory.totalJSHeapSize);
        this.metric('memory_js_heap_limit', memory.jsHeapSizeLimit);
      }, 30000); // Every 30 seconds
    }
  }

  private setupErrorHandling(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.error(event.error || event.message, 'global', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error(`Unhandled promise rejection: ${event.reason}`, 'promise', {
        reason: event.reason
      });
    });

    // Console error interception
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.log('error', args.join(' '), 'console');
      originalConsoleError.apply(console, args);
    };
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flushLogs();
      this.flushMetrics();
    }, this.FLUSH_INTERVAL);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushLogs();
      this.flushMetrics();
    });
  }

  private async flushLogs(): Promise<void> {
    if (this.logs.length === 0) return;

    const logsToFlush = [...this.logs];
    this.logs = [];

    try {
      const { error } = await supabase
        .from('application_logs')
        .insert(logsToFlush.map(log => ({
          session_id: log.sessionId,
          user_id: log.userId,
          level: log.level,
          message: log.message,
          category: log.category,
          data: log.data,
          timestamp: log.timestamp.toISOString()
        })));

      if (error) {
        console.error('Failed to flush logs to database:', error);
        // Put logs back in buffer
        this.logs.unshift(...logsToFlush);
      }
    } catch (error) {
      console.error('Error flushing logs:', error);
      this.logs.unshift(...logsToFlush);
    }
  }

  private async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    const metricsToFlush = [...this.metrics];
    this.metrics = [];

    try {
      const authState = authService.getAuthState();

      const { error } = await supabase
        .from('application_metrics')
        .insert(metricsToFlush.map(metric => ({
          session_id: this.sessionId,
          user_id: authState.user?.id,
          metric_name: metric.name,
          metric_value: metric.value,
          tags: metric.tags,
          timestamp: metric.timestamp.toISOString()
        })));

      if (error) {
        console.error('Failed to flush metrics to database:', error);
        this.metrics.unshift(...metricsToFlush);
      }
    } catch (error) {
      console.error('Error flushing metrics:', error);
      this.metrics.unshift(...metricsToFlush);
    }
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    // Remove sensitive fields
    const sensitiveFields = ['password', 'apiKey', 'token', 'secret', 'key'];

    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        // Don't log long strings that might contain sensitive data
        return obj.length > 1000 ? `${obj.substring(0, 100)}... [truncated ${obj.length} chars]` : obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            sanitized[key] = '[REDACTED]';
          } else {
            sanitized[key] = sanitize(value);
          }
        }
        return sanitized;
      }

      return obj;
    };

    return sanitize(data);
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getErrorCounts(): Map<string, number> {
    return new Map(this.errorBoundary);
  }

  public clearErrorCounts(): void {
    this.errorBoundary.clear();
  }

  public destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    // Final flush
    this.flushLogs();
    this.flushMetrics();
  }
}

export const monitoringService = new MonitoringService();