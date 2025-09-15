export interface PerformanceMetrics {
  componentRenderTime: Record<string, number>;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  bundleLoadTime: number;
  aiRequestLatency: Record<string, number[]>;
  editorLoadTime: number;
  lastUpdated: Date;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private renderStartTimes: Map<string, number> = new Map();
  private observers: Array<(metrics: PerformanceMetrics) => void> = [];

  constructor() {
    this.metrics = {
      componentRenderTime: {},
      memoryUsage: { used: 0, total: 0, percentage: 0 },
      bundleLoadTime: 0,
      aiRequestLatency: {},
      editorLoadTime: 0,
      lastUpdated: new Date()
    };

    this.startMonitoring();
  }

  private startMonitoring() {
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      this.updateMemoryUsage();
    }, 30000);

    // Monitor performance every 10 seconds
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 10000);

    // Initial measurements
    this.measureBundleLoadTime();
    this.updateMemoryUsage();
  }

  private measureBundleLoadTime() {
    if (typeof window !== 'undefined' && window.performance) {
      const navigationTiming = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationTiming) {
        this.metrics.bundleLoadTime = navigationTiming.loadEventEnd - navigationTiming.fetchStart;
      }
    }
  }

  private updateMemoryUsage() {
    if (typeof window !== 'undefined' && 'memory' in window.performance) {
      const memory = (window.performance as any).memory;
      this.metrics.memoryUsage = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      };
    }
  }

  private collectPerformanceMetrics() {
    if (typeof window !== 'undefined' && window.performance) {
      // Collect navigation timing
      const entries = window.performance.getEntriesByType('measure');
      entries.forEach(entry => {
        if (entry.name.startsWith('component:')) {
          const componentName = entry.name.replace('component:', '');
          this.metrics.componentRenderTime[componentName] = entry.duration;
        }
      });
    }

    this.metrics.lastUpdated = new Date();
    this.notifyObservers();
  }

  // Component render timing
  startComponentRender(componentName: string) {
    this.renderStartTimes.set(componentName, performance.now());
  }

  endComponentRender(componentName: string) {
    const startTime = this.renderStartTimes.get(componentName);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.metrics.componentRenderTime[componentName] = duration;
      this.renderStartTimes.delete(componentName);

      // Mark for performance timeline
      if (typeof window !== 'undefined' && window.performance) {
        performance.mark(`component:${componentName}:end`);
        performance.measure(
          `component:${componentName}`,
          `component:${componentName}:start`,
          `component:${componentName}:end`
        );
      }
    }
  }

  // AI request latency tracking
  recordAIRequestLatency(provider: string, latency: number) {
    if (!this.metrics.aiRequestLatency[provider]) {
      this.metrics.aiRequestLatency[provider] = [];
    }

    this.metrics.aiRequestLatency[provider].push(latency);

    // Keep only last 100 requests per provider
    if (this.metrics.aiRequestLatency[provider].length > 100) {
      this.metrics.aiRequestLatency[provider] = this.metrics.aiRequestLatency[provider].slice(-100);
    }
  }

  // Editor load time tracking
  recordEditorLoadTime(loadTime: number) {
    this.metrics.editorLoadTime = loadTime;
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get performance summary
  getPerformanceSummary() {
    const avgRenderTime = Object.values(this.metrics.componentRenderTime)
      .reduce((acc, time) => acc + time, 0) / Object.keys(this.metrics.componentRenderTime).length || 0;

    const aiLatencyAvg: Record<string, number> = {};
    Object.entries(this.metrics.aiRequestLatency).forEach(([provider, latencies]) => {
      aiLatencyAvg[provider] = latencies.reduce((acc, lat) => acc + lat, 0) / latencies.length;
    });

    return {
      avgComponentRenderTime: Math.round(avgRenderTime * 100) / 100,
      memoryUsage: this.metrics.memoryUsage,
      bundleLoadTime: this.metrics.bundleLoadTime,
      editorLoadTime: this.metrics.editorLoadTime,
      aiLatencyAvg,
      isPerformanceGood: avgRenderTime < 16.67 && this.metrics.memoryUsage.percentage < 80, // 60fps + memory check
      recommendations: this.getRecommendations()
    };
  }

  private getRecommendations(): string[] {
    const recommendations: string[] = [];
    const summary = this.getPerformanceSummary();

    if (summary.avgComponentRenderTime > 16.67) {
      recommendations.push('Consider optimizing component rendering - average render time is above 60fps threshold');
    }

    if (this.metrics.memoryUsage.percentage > 80) {
      recommendations.push('High memory usage detected - consider closing unused tabs or components');
    }

    if (this.metrics.bundleLoadTime > 3000) {
      recommendations.push('Slow bundle load time - consider enabling code splitting');
    }

    if (this.metrics.editorLoadTime > 2000) {
      recommendations.push('Editor loading slowly - Monaco Editor might need optimization');
    }

    Object.entries(this.metrics.aiRequestLatency).forEach(([provider, latencies]) => {
      const avgLatency = latencies.reduce((acc, lat) => acc + lat, 0) / latencies.length;
      if (avgLatency > 5000) {
        recommendations.push(`${provider} AI requests are slow (${Math.round(avgLatency)}ms) - check network or API performance`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! 🚀');
    }

    return recommendations;
  }

  // Performance observer subscription
  subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback);
    };
  }

  private notifyObservers() {
    this.observers.forEach(callback => callback(this.metrics));
  }

  // React hook for component timing
  createPerformanceHook() {
    return (componentName: string) => {
      return {
        onRenderStart: () => {
          this.startComponentRender(componentName);
          if (typeof window !== 'undefined' && window.performance) {
            performance.mark(`component:${componentName}:start`);
          }
        },
        onRenderEnd: () => {
          this.endComponentRender(componentName);
        }
      };
    };
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics = {
      componentRenderTime: {},
      memoryUsage: { used: 0, total: 0, percentage: 0 },
      bundleLoadTime: 0,
      aiRequestLatency: {},
      editorLoadTime: 0,
      lastUpdated: new Date()
    };
  }

  // Export metrics for analysis
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      summary: this.getPerformanceSummary(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();