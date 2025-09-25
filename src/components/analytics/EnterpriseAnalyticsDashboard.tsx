import React, { useState, useEffect } from 'react';

interface EnterpriseAnalyticsDashboardProps {
  onClose?: () => void;
}

interface AnalyticsData {
  teamStats: {
    totalDevelopers: number;
    activeProjects: number;
    linesOfCode: number;
    commitActivity: number;
  };
  productivity: {
    dailyCommits: number;
    codeReviews: number;
    bugsFixed: number;
    featuresDelivered: number;
  };
  quality: {
    codeQuality: number;
    testCoverage: number;
    technicalDebt: number;
    securityScore: number;
  };
  performance: {
    buildTime: number;
    deploymentFreq: number;
    leadTime: number;
    recoveryTime: number;
  };
}

const EnterpriseAnalyticsDashboard: React.FC<EnterpriseAnalyticsDashboardProps> = ({ onClose }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    teamStats: {
      totalDevelopers: 12,
      activeProjects: 8,
      linesOfCode: 145230,
      commitActivity: 89
    },
    productivity: {
      dailyCommits: 23,
      codeReviews: 15,
      bugsFixed: 8,
      featuresDelivered: 4
    },
    quality: {
      codeQuality: 92,
      testCoverage: 87,
      technicalDebt: 12,
      securityScore: 96
    },
    performance: {
      buildTime: 3.2,
      deploymentFreq: 14,
      leadTime: 2.1,
      recoveryTime: 0.8
    }
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'productivity' | 'quality' | 'performance'>('overview');

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setAnalyticsData(prev => ({
        ...prev,
        productivity: {
          ...prev.productivity,
          dailyCommits: prev.productivity.dailyCommits + Math.floor(Math.random() * 3),
          codeReviews: prev.productivity.codeReviews + Math.floor(Math.random() * 2)
        }
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#22c55e';
    if (score >= 75) return '#f59e0b';
    if (score >= 60) return '#ef4444';
    return '#dc2626';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="enterprise-analytics-container">
      <div className="analytics-header">
        <div className="header-content">
          <h3>📊 Enterprise Analytics</h3>
          <div className="header-subtitle">Real-time development insights</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="close-button">×</button>
        )}
      </div>

      <div className="analytics-tabs">
        {['overview', 'productivity', 'quality', 'performance'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`analytics-tab ${tab === activeTab ? 'active' : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="analytics-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">👥</div>
                <div className="metric-value">{analyticsData.teamStats.totalDevelopers}</div>
                <div className="metric-label">Active Developers</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">🚀</div>
                <div className="metric-value">{analyticsData.teamStats.activeProjects}</div>
                <div className="metric-label">Active Projects</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">📝</div>
                <div className="metric-value">{formatNumber(analyticsData.teamStats.linesOfCode)}</div>
                <div className="metric-label">Lines of Code</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">📈</div>
                <div className="metric-value">{analyticsData.teamStats.commitActivity}%</div>
                <div className="metric-label">Activity Score</div>
              </div>
            </div>

            <div className="summary-charts">
              <div className="chart-card">
                <h4>Quality Overview</h4>
                <div className="quality-bars">
                  {Object.entries(analyticsData.quality).map(([key, value]) => (
                    <div key={key} className="quality-bar-container">
                      <div className="quality-bar-label">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                      <div className="quality-bar">
                        <div
                          className="quality-bar-fill"
                          style={{
                            width: `${value}%`,
                            backgroundColor: getScoreColor(value)
                          }}
                        />
                        <span className="quality-bar-value">{value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <h4>Today's Activity</h4>
                <div className="activity-list">
                  <div className="activity-item">
                    <span className="activity-icon">📝</span>
                    <span className="activity-text">{analyticsData.productivity.dailyCommits} commits pushed</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">👀</span>
                    <span className="activity-text">{analyticsData.productivity.codeReviews} code reviews</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">🐛</span>
                    <span className="activity-text">{analyticsData.productivity.bugsFixed} bugs fixed</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">✨</span>
                    <span className="activity-text">{analyticsData.productivity.featuresDelivered} features delivered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'productivity' && (
          <div className="productivity-section">
            <div className="productivity-metrics">
              <div className="large-metric-card">
                <div className="large-metric-value">{analyticsData.productivity.dailyCommits}</div>
                <div className="large-metric-label">Commits Today</div>
                <div className="metric-trend">↑ 15% from yesterday</div>
              </div>
              <div className="large-metric-card">
                <div className="large-metric-value">{analyticsData.productivity.codeReviews}</div>
                <div className="large-metric-label">Code Reviews</div>
                <div className="metric-trend">↑ 8% from yesterday</div>
              </div>
            </div>

            <div className="productivity-insights">
              <h4>🎯 Productivity Insights</h4>
              <div className="insight-list">
                <div className="insight-item">
                  <span className="insight-icon">⚡</span>
                  <span>Peak coding hours: 9-11 AM and 2-4 PM</span>
                </div>
                <div className="insight-item">
                  <span className="insight-icon">🎯</span>
                  <span>Average feature completion: 2.3 days</span>
                </div>
                <div className="insight-item">
                  <span className="insight-icon">🔥</span>
                  <span>Most active developer: Sarah Chen (28 commits)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quality' && (
          <div className="quality-section">
            <div className="quality-scores">
              {Object.entries(analyticsData.quality).map(([key, value]) => (
                <div key={key} className="quality-score-card">
                  <div className="quality-score-circle">
                    <svg width="80" height="80">
                      <circle cx="40" cy="40" r="30" fill="none" stroke="#333" strokeWidth="6"/>
                      <circle
                        cx="40"
                        cy="40"
                        r="30"
                        fill="none"
                        stroke={getScoreColor(value)}
                        strokeWidth="6"
                        strokeDasharray={`${value * 1.88} 188`}
                        transform="rotate(-90 40 40)"
                      />
                    </svg>
                    <div className="quality-score-text">
                      <div className="quality-score-value">{value}%</div>
                    </div>
                  </div>
                  <div className="quality-score-label">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </div>
                </div>
              ))}
            </div>

            <div className="quality-recommendations">
              <h4>💡 Quality Recommendations</h4>
              <div className="recommendation-list">
                <div className="recommendation-item">
                  <span className="recommendation-priority high">High</span>
                  <span>Increase test coverage in user authentication module</span>
                </div>
                <div className="recommendation-item">
                  <span className="recommendation-priority medium">Medium</span>
                  <span>Refactor payment processing service for better maintainability</span>
                </div>
                <div className="recommendation-item">
                  <span className="recommendation-priority low">Low</span>
                  <span>Update documentation for API endpoints</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="performance-section">
            <div className="performance-metrics">
              <div className="performance-metric">
                <div className="performance-label">Build Time</div>
                <div className="performance-value">{analyticsData.performance.buildTime}min</div>
                <div className="performance-trend good">↓ 12% improvement</div>
              </div>
              <div className="performance-metric">
                <div className="performance-label">Deployment Frequency</div>
                <div className="performance-value">{analyticsData.performance.deploymentFreq}/week</div>
                <div className="performance-trend good">↑ 23% increase</div>
              </div>
              <div className="performance-metric">
                <div className="performance-label">Lead Time</div>
                <div className="performance-value">{analyticsData.performance.leadTime} days</div>
                <div className="performance-trend good">↓ 18% faster</div>
              </div>
              <div className="performance-metric">
                <div className="performance-label">Recovery Time</div>
                <div className="performance-value">{analyticsData.performance.recoveryTime}h</div>
                <div className="performance-trend good">↓ 35% faster</div>
              </div>
            </div>

            <div className="performance-insights">
              <h4>🚀 Performance Insights</h4>
              <div className="insight-list">
                <div className="insight-item">
                  <span className="insight-icon">⚡</span>
                  <span>CI/CD pipeline optimizations saved 2.3 hours daily</span>
                </div>
                <div className="insight-item">
                  <span className="insight-icon">📦</span>
                  <span>Bundle size reduced by 15% this month</span>
                </div>
                <div className="insight-item">
                  <span className="insight-icon">🎯</span>
                  <span>Zero-downtime deployments: 98% success rate</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .enterprise-analytics-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #1a1a1a;
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #333;
          background: #252526;
        }

        .header-content h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .header-subtitle {
          font-size: 12px;
          color: #888;
          margin-top: 2px;
        }

        .close-button {
          background: none;
          border: none;
          color: #888;
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
        }

        .close-button:hover {
          color: #fff;
        }

        .analytics-tabs {
          display: flex;
          background: #2d2d30;
          border-bottom: 1px solid #333;
        }

        .analytics-tab {
          padding: 12px 20px;
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          border-right: 1px solid #333;
          font-weight: 500;
        }

        .analytics-tab:hover {
          background: #3a3a3a;
          color: #fff;
        }

        .analytics-tab.active {
          background: #1a1a1a;
          color: #4CAF50;
          border-bottom: 2px solid #4CAF50;
        }

        .analytics-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .metric-card {
          background: #2a2a2a;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #333;
        }

        .metric-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 28px;
          font-weight: bold;
          color: #4CAF50;
          margin-bottom: 4px;
        }

        .metric-label {
          font-size: 12px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .summary-charts {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .chart-card {
          background: #2a2a2a;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #333;
        }

        .chart-card h4 {
          margin: 0 0 16px 0;
          color: #fff;
          font-size: 16px;
        }

        .quality-bars {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .quality-bar-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .quality-bar-label {
          font-size: 12px;
          color: #ccc;
        }

        .quality-bar {
          position: relative;
          background: #333;
          height: 20px;
          border-radius: 10px;
          overflow: hidden;
        }

        .quality-bar-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        .quality-bar-value {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 11px;
          font-weight: bold;
          color: #fff;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: #333;
          border-radius: 4px;
        }

        .activity-icon {
          font-size: 16px;
        }

        .activity-text {
          font-size: 14px;
          color: #ccc;
        }

        .productivity-metrics {
          display: flex;
          gap: 20px;
          margin-bottom: 24px;
        }

        .large-metric-card {
          background: #2a2a2a;
          padding: 24px;
          border-radius: 8px;
          border: 1px solid #333;
          text-align: center;
          flex: 1;
        }

        .large-metric-value {
          font-size: 48px;
          font-weight: bold;
          color: #4CAF50;
          margin-bottom: 8px;
        }

        .large-metric-label {
          font-size: 16px;
          color: #ccc;
          margin-bottom: 4px;
        }

        .metric-trend {
          font-size: 12px;
          color: #22c55e;
        }

        .productivity-insights, .quality-recommendations, .performance-insights {
          background: #2a2a2a;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #333;
        }

        .productivity-insights h4, .quality-recommendations h4, .performance-insights h4 {
          margin: 0 0 16px 0;
          color: #fff;
          font-size: 16px;
        }

        .insight-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .insight-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          color: #ccc;
        }

        .insight-icon {
          font-size: 16px;
        }

        .quality-scores {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .quality-score-card {
          background: #2a2a2a;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #333;
          text-align: center;
        }

        .quality-score-circle {
          position: relative;
          display: inline-block;
          margin-bottom: 12px;
        }

        .quality-score-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .quality-score-value {
          font-size: 18px;
          font-weight: bold;
          color: #fff;
        }

        .quality-score-label {
          font-size: 12px;
          color: #888;
          text-transform: uppercase;
        }

        .recommendation-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .recommendation-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #333;
          border-radius: 4px;
        }

        .recommendation-priority {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .recommendation-priority.high {
          background: #ef4444;
          color: white;
        }

        .recommendation-priority.medium {
          background: #f59e0b;
          color: white;
        }

        .recommendation-priority.low {
          background: #22c55e;
          color: white;
        }

        .performance-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .performance-metric {
          background: #2a2a2a;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #333;
          text-align: center;
        }

        .performance-label {
          font-size: 12px;
          color: #888;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .performance-value {
          font-size: 32px;
          font-weight: bold;
          color: #4CAF50;
          margin-bottom: 4px;
        }

        .performance-trend {
          font-size: 12px;
        }

        .performance-trend.good {
          color: #22c55e;
        }

        .performance-trend.bad {
          color: #ef4444;
        }
      `}</style>
    </div>
  );
};

export default EnterpriseAnalyticsDashboard;