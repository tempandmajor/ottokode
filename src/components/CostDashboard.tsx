import React, { useState, useEffect } from 'react';
import { costTracker, CostAlert } from '../services/ai/CostTracker';
import { AIUsageStats } from '../types/ai';
import './CostDashboard.css';

interface CostDashboardProps {
  onClose: () => void;
}

export const CostDashboard: React.FC<CostDashboardProps> = ({ onClose }) => {
  const [usageStats, setUsageStats] = useState<AIUsageStats | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<any>(null);
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [projections, setProjections] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  useEffect(() => {
    refreshData();
  }, [timeRange]);

  const refreshData = () => {
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    const stats = costTracker.getUsageStats({ start: startDate, end: endDate });
    const budget = costTracker.getBudgetStatus();
    const activeAlerts = costTracker.getActiveAlerts();
    const proj = costTracker.getCostProjections();

    setUsageStats(stats);
    setBudgetStatus(budget);
    setAlerts(activeAlerts);
    setProjections(proj);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const exportData = (format: 'json' | 'csv') => {
    const data = costTracker.exportUsageData(format);
    const blob = new Blob([data], {
      type: format === 'json' ? 'application/json' : 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-usage-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  if (!usageStats || !budgetStatus || !projections) {
    return (
      <div className="cost-dashboard">
        <div className="cost-dashboard-header">
          <h2>AI Usage & Cost Dashboard</h2>
          <button onClick={onClose} className="cost-dashboard-close">×</button>
        </div>
        <div className="cost-dashboard-loading">Loading...</div>
      </div>
    );
  }

  const providers = Object.keys(usageStats.byProvider);

  return (
    <div className="cost-dashboard">
      <div className="cost-dashboard-header">
        <h2>AI Usage & Cost Dashboard</h2>
        <button onClick={onClose} className="cost-dashboard-close">×</button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="cost-alerts">
          <h3>Budget Alerts</h3>
          {alerts.map(alert => (
            <div key={alert.id} className={`cost-alert cost-alert-${alert.type}`}>
              <div className="cost-alert-content">
                <strong>{alert.type.replace('_', ' ').toUpperCase()}</strong>
                <p>{alert.message}</p>
                <small>{alert.timestamp.toLocaleString()}</small>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="cost-alert-dismiss"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="cost-dashboard-controls">
        <div className="cost-time-range">
          <label>Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        <div className="cost-provider-filter">
          <label>Provider:</label>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
          >
            <option value="all">All Providers</option>
            {providers.map(provider => (
              <option key={provider} value={provider}>{provider}</option>
            ))}
          </select>
        </div>

        <div className="cost-export-buttons">
          <button onClick={() => exportData('json')}>Export JSON</button>
          <button onClick={() => exportData('csv')}>Export CSV</button>
        </div>
      </div>

      {/* Budget Status */}
      <div className="cost-budget-status">
        <h3>Budget Status</h3>
        <div className="cost-budget-cards">
          <div className="cost-budget-card">
            <h4>Daily Budget</h4>
            <div className="cost-budget-bar">
              <div
                className="cost-budget-fill"
                style={{
                  width: `${Math.min(budgetStatus.daily.percentage, 100)}%`,
                  backgroundColor: budgetStatus.daily.percentage > 90 ? '#e74c3c' :
                                  budgetStatus.daily.percentage > 70 ? '#f39c12' : '#27ae60'
                }}
              />
            </div>
            <div className="cost-budget-text">
              {formatCurrency(budgetStatus.daily.used)} / {formatCurrency(budgetStatus.daily.limit)}
              <span className="cost-budget-percentage">
                ({budgetStatus.daily.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>

          <div className="cost-budget-card">
            <h4>Monthly Budget</h4>
            <div className="cost-budget-bar">
              <div
                className="cost-budget-fill"
                style={{
                  width: `${Math.min(budgetStatus.monthly.percentage, 100)}%`,
                  backgroundColor: budgetStatus.monthly.percentage > 90 ? '#e74c3c' :
                                  budgetStatus.monthly.percentage > 70 ? '#f39c12' : '#27ae60'
                }}
              />
            </div>
            <div className="cost-budget-text">
              {formatCurrency(budgetStatus.monthly.used)} / {formatCurrency(budgetStatus.monthly.limit)}
              <span className="cost-budget-percentage">
                ({budgetStatus.monthly.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="cost-overview">
        <h3>Usage Overview ({timeRange})</h3>
        <div className="cost-overview-cards">
          <div className="cost-overview-card">
            <h4>Total Requests</h4>
            <div className="cost-overview-value">{formatNumber(usageStats.totalRequests)}</div>
          </div>
          <div className="cost-overview-card">
            <h4>Total Tokens</h4>
            <div className="cost-overview-value">{formatNumber(usageStats.totalTokens)}</div>
          </div>
          <div className="cost-overview-card">
            <h4>Total Cost</h4>
            <div className="cost-overview-value">{formatCurrency(usageStats.totalCost)}</div>
          </div>
          <div className="cost-overview-card">
            <h4>Avg Cost/Request</h4>
            <div className="cost-overview-value">
              {formatCurrency(usageStats.totalCost / usageStats.totalRequests || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Projections */}
      <div className="cost-projections">
        <h3>Cost Projections</h3>
        <div className="cost-projections-cards">
          <div className="cost-projection-card">
            <h4>Daily Projection</h4>
            <div className="cost-projection-value">
              {formatCurrency(projections.dailyProjection)}
            </div>
            <small>Based on last 7 days average</small>
          </div>
          <div className="cost-projection-card">
            <h4>Monthly Projection</h4>
            <div className="cost-projection-value">
              {formatCurrency(projections.monthlyProjection)}
            </div>
            <small>Based on current usage pattern</small>
          </div>
        </div>
      </div>

      {/* Provider Breakdown */}
      <div className="cost-provider-breakdown">
        <h3>Provider Breakdown</h3>
        <div className="cost-provider-table">
          <table>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Requests</th>
                <th>Tokens</th>
                <th>Cost</th>
                <th>Avg Latency</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(usageStats.byProvider)
                .filter(([provider]) => selectedProvider === 'all' || provider === selectedProvider)
                .sort(([,a], [,b]) => b.cost - a.cost)
                .map(([provider, stats]) => (
                <tr key={provider}>
                  <td>{provider}</td>
                  <td>{formatNumber(stats.requests)}</td>
                  <td>{formatNumber(stats.tokens)}</td>
                  <td>{formatCurrency(stats.cost)}</td>
                  <td>{stats.avgLatency.toFixed(0)}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Usage Chart */}
      <div className="cost-daily-usage">
        <h3>Daily Usage Trend</h3>
        <div className="cost-chart">
          {usageStats.dailyUsage.slice(-30).map((day, _index) => {
            const maxCost = Math.max(...usageStats.dailyUsage.map(d => d.cost));
            const height = maxCost > 0 ? (day.cost / maxCost) * 100 : 0;

            return (
              <div key={day.date} className="cost-chart-bar">
                <div
                  className="cost-chart-bar-fill"
                  style={{ height: `${height}%` }}
                  title={`${day.date}: ${formatCurrency(day.cost)}`}
                />
                <small className="cost-chart-bar-label">
                  {new Date(day.date).getDate()}
                </small>
              </div>
            );
          })}
        </div>
        <div className="cost-chart-legend">
          <small>Daily cost over the last 30 days</small>
        </div>
      </div>
    </div>
  );
};