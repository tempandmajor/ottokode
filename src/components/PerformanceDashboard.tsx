import React, { useState, useEffect } from 'react';
import { performanceMonitor, PerformanceMetrics } from '../services/performance/PerformanceMonitor';
import './PerformanceDashboard.css';

interface PerformanceDashboardProps {
  onClose: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ onClose }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    // Initial load
    setMetrics(performanceMonitor.getMetrics());
    setSummary(performanceMonitor.getPerformanceSummary());

    // Subscribe to updates
    const unsubscribe = performanceMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
      setSummary(performanceMonitor.getPerformanceSummary());
    });

    return unsubscribe;
  }, []);

  const exportMetrics = () => {
    const exportData = performanceMonitor.exportMetrics();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearMetrics = () => {
    performanceMonitor.clearMetrics();
    setMetrics(performanceMonitor.getMetrics());
    setSummary(performanceMonitor.getPerformanceSummary());
  };

  if (!metrics || !summary) {
    return (
      <div className="performance-dashboard">
        <div className="performance-dashboard-header">
          <h2>Performance Dashboard</h2>
          <button onClick={onClose} className="performance-dashboard-close">×</button>
        </div>
        <div className="performance-dashboard-loading">Loading metrics...</div>
      </div>
    );
  }

  return (
    <div className="performance-dashboard">
      <div className="performance-dashboard-header">
        <h2>Performance Dashboard</h2>
        <button onClick={onClose} className="performance-dashboard-close">×</button>
      </div>

      <div className="performance-dashboard-controls">
        <button onClick={exportMetrics} className="performance-export-btn">
          Export Metrics
        </button>
        <button onClick={clearMetrics} className="performance-clear-btn">
          Clear Metrics
        </button>
      </div>

      {/* Performance Status */}
      <div className="performance-status">
        <h3>Performance Status</h3>
        <div className={`performance-indicator ${summary.isPerformanceGood ? 'good' : 'warning'}`}>
          {summary.isPerformanceGood ? '🟢 Good' : '🟡 Needs Attention'}
        </div>
      </div>

      {/* Memory Usage */}
      <div className="performance-section">
        <h3>Memory Usage</h3>
        <div className="memory-usage-card">
          <div className="memory-bar">
            <div
              className="memory-fill"
              style={{
                width: `${metrics.memoryUsage.percentage}%`,
                backgroundColor: metrics.memoryUsage.percentage > 80 ? '#e74c3c' :
                                metrics.memoryUsage.percentage > 60 ? '#f39c12' : '#27ae60'
              }}
            />
          </div>
          <div className="memory-text">
            {metrics.memoryUsage.used}MB / {metrics.memoryUsage.total}MB ({metrics.memoryUsage.percentage}%)
          </div>
        </div>
      </div>

      {/* Load Times */}
      <div className="performance-section">
        <h3>Load Times</h3>
        <div className="performance-metrics-grid">
          <div className="metric-card">
            <h4>Bundle Load</h4>
            <div className="metric-value">{Math.round(metrics.bundleLoadTime)}ms</div>
          </div>
          <div className="metric-card">
            <h4>Editor Load</h4>
            <div className="metric-value">
              {metrics.editorLoadTime ? `${Math.round(metrics.editorLoadTime)}ms` : 'Not loaded'}
            </div>
          </div>
          <div className="metric-card">
            <h4>Avg Component Render</h4>
            <div className="metric-value">{summary.avgComponentRenderTime.toFixed(2)}ms</div>
          </div>
        </div>
      </div>

      {/* Component Render Times */}
      {Object.keys(metrics.componentRenderTime).length > 0 && (
        <div className="performance-section">
          <h3>Component Render Times</h3>
          <div className="component-metrics">
            {Object.entries(metrics.componentRenderTime).map(([component, time]) => (
              <div key={component} className="component-metric">
                <span className="component-name">{component}</span>
                <span className={`component-time ${time > 16.67 ? 'slow' : 'good'}`}>
                  {time.toFixed(2)}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Request Latency */}
      {Object.keys(metrics.aiRequestLatency).length > 0 && (
        <div className="performance-section">
          <h3>AI Request Latency</h3>
          <div className="ai-latency-metrics">
            {Object.entries(summary.aiLatencyAvg).map(([provider, avgLatency]) => {
              const latency = avgLatency as number;
              return (
                <div key={provider} className="ai-metric">
                  <span className="provider-name">{provider}</span>
                  <div className="latency-info">
                    <span className={`latency-value ${latency > 5000 ? 'slow' : latency > 2000 ? 'medium' : 'good'}`}>
                      {Math.round(latency)}ms avg
                    </span>
                    <span className="request-count">
                      ({metrics.aiRequestLatency[provider].length} requests)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="performance-section">
        <h3>Recommendations</h3>
        <div className="recommendations">
          {summary.recommendations.map((recommendation: string, index: number) => (
            <div key={index} className="recommendation">
              {recommendation.includes('🚀') ? '✅' : '💡'} {recommendation}
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <div className="performance-footer">
        <small>Last updated: {metrics.lastUpdated.toLocaleString()}</small>
      </div>
    </div>
  );
};