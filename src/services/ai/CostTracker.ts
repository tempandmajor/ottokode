import { AIUsageStats, ProviderStats, ModelStats, DailyUsage } from '../../types/ai';

export interface UsageRecord {
  id: string;
  timestamp: Date;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  requestType: 'chat' | 'completion' | 'streaming' | 'function_call';
  requestDuration: number; // milliseconds
  success: boolean;
  errorCode?: string;
}

export interface CostAlert {
  id: string;
  type: 'budget_exceeded' | 'unusual_spike' | 'daily_limit' | 'monthly_limit';
  message: string;
  timestamp: Date;
  provider?: string;
  amount: number;
  threshold: number;
}

export class CostTracker {
  private records: UsageRecord[] = [];
  private alerts: CostAlert[] = [];
  private budgetLimits = {
    daily: 10.00,   // $10 per day
    monthly: 200.00, // $200 per month
    perRequest: 1.00 // $1 per request
  };

  // Record a new usage event
  recordUsage(record: Omit<UsageRecord, 'id' | 'timestamp'>): void {
    const fullRecord: UsageRecord = {
      ...record,
      id: this.generateId(),
      timestamp: new Date()
    };

    this.records.push(fullRecord);
    this.checkBudgetAlerts(fullRecord);
    this.saveToStorage();
  }

  // Get comprehensive usage statistics
  getUsageStats(timeRange?: { start: Date; end: Date }): AIUsageStats {
    const filteredRecords = timeRange
      ? this.records.filter(r => r.timestamp >= timeRange.start && r.timestamp <= timeRange.end)
      : this.records;

    const totalRequests = filteredRecords.length;
    const totalTokens = filteredRecords.reduce((sum, r) => sum + r.totalTokens, 0);
    const totalCost = filteredRecords.reduce((sum, r) => sum + r.cost, 0);

    const byProvider = this.calculateProviderStats(filteredRecords);
    const byModel = this.calculateModelStats(filteredRecords);
    const dailyUsage = this.calculateDailyUsage(filteredRecords);

    return {
      totalRequests,
      totalTokens,
      totalCost,
      byProvider,
      byModel,
      dailyUsage
    };
  }

  // Get current month's spending
  getCurrentMonthSpending(): number {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.records
      .filter(r => r.timestamp >= monthStart)
      .reduce((sum, r) => sum + r.cost, 0);
  }

  // Get today's spending
  getTodaySpending(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.records
      .filter(r => r.timestamp >= today)
      .reduce((sum, r) => sum + r.cost, 0);
  }

  // Get usage by provider for a time period
  getProviderUsage(provider: string, days: number = 30): ProviderStats {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const providerRecords = this.records.filter(
      r => r.provider === provider && r.timestamp >= cutoff
    );

    const requests = providerRecords.length;
    const tokens = providerRecords.reduce((sum, r) => sum + r.totalTokens, 0);
    const cost = providerRecords.reduce((sum, r) => sum + r.cost, 0);
    const avgLatency = providerRecords.reduce((sum, r) => sum + r.requestDuration, 0) / requests || 0;

    return { requests, tokens, cost, avgLatency };
  }

  // Get cost projections
  getCostProjections(): {
    dailyProjection: number;
    monthlyProjection: number;
    budgetAlerts: CostAlert[];
  } {
    const last7Days = this.getUsageStats({
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date()
    });

    const dailyAverage = last7Days.totalCost / 7;
    const dailyProjection = dailyAverage;
    const monthlyProjection = dailyAverage * 30;

    return {
      dailyProjection,
      monthlyProjection,
      budgetAlerts: this.getActiveAlerts()
    };
  }

  // Set budget limits
  setBudgetLimits(limits: Partial<typeof this.budgetLimits>): void {
    this.budgetLimits = { ...this.budgetLimits, ...limits };
    this.saveToStorage();
  }

  // Get budget status
  getBudgetStatus(): {
    daily: { used: number; limit: number; percentage: number };
    monthly: { used: number; limit: number; percentage: number };
  } {
    const dailyUsed = this.getTodaySpending();
    const monthlyUsed = this.getCurrentMonthSpending();

    return {
      daily: {
        used: dailyUsed,
        limit: this.budgetLimits.daily,
        percentage: (dailyUsed / this.budgetLimits.daily) * 100
      },
      monthly: {
        used: monthlyUsed,
        limit: this.budgetLimits.monthly,
        percentage: (monthlyUsed / this.budgetLimits.monthly) * 100
      }
    };
  }

  // Export usage data for analysis
  exportUsageData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'timestamp', 'provider', 'model', 'requestType',
        'promptTokens', 'completionTokens', 'totalTokens',
        'cost', 'requestDuration', 'success'
      ];

      const rows = this.records.map(r => [
        r.timestamp.toISOString(),
        r.provider,
        r.model,
        r.requestType,
        r.promptTokens.toString(),
        r.completionTokens.toString(),
        r.totalTokens.toString(),
        r.cost.toFixed(4),
        r.requestDuration.toString(),
        r.success.toString()
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify({
      exportDate: new Date().toISOString(),
      totalRecords: this.records.length,
      usageStats: this.getUsageStats(),
      budgetStatus: this.getBudgetStatus(),
      records: this.records
    }, null, 2);
  }

  // Get alerts
  getActiveAlerts(): CostAlert[] {
    return this.alerts.filter(alert => {
      const hoursSinceAlert = (Date.now() - alert.timestamp.getTime()) / (1000 * 60 * 60);
      return hoursSinceAlert < 24; // Show alerts for 24 hours
    });
  }

  // Clear alerts
  clearAlerts(): void {
    this.alerts = [];
    this.saveToStorage();
  }

  private calculateProviderStats(records: UsageRecord[]): Record<string, ProviderStats> {
    const stats: Record<string, ProviderStats> = {};

    for (const record of records) {
      if (!stats[record.provider]) {
        stats[record.provider] = { requests: 0, tokens: 0, cost: 0, avgLatency: 0 };
      }

      stats[record.provider].requests++;
      stats[record.provider].tokens += record.totalTokens;
      stats[record.provider].cost += record.cost;
      stats[record.provider].avgLatency += record.requestDuration;
    }

    // Calculate averages
    for (const provider in stats) {
      stats[provider].avgLatency /= stats[provider].requests;
    }

    return stats;
  }

  private calculateModelStats(records: UsageRecord[]): Record<string, ModelStats> {
    const stats: Record<string, ModelStats> = {};

    for (const record of records) {
      const modelKey = `${record.provider}:${record.model}`;
      if (!stats[modelKey]) {
        stats[modelKey] = { requests: 0, tokens: 0, cost: 0, avgTokensPerRequest: 0 };
      }

      stats[modelKey].requests++;
      stats[modelKey].tokens += record.totalTokens;
      stats[modelKey].cost += record.cost;
    }

    // Calculate averages
    for (const model in stats) {
      stats[model].avgTokensPerRequest = stats[model].tokens / stats[model].requests;
    }

    return stats;
  }

  private calculateDailyUsage(records: UsageRecord[]): DailyUsage[] {
    const dailyMap = new Map<string, DailyUsage>();

    for (const record of records) {
      const dateKey = record.timestamp.toISOString().split('T')[0];

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { date: dateKey, requests: 0, tokens: 0, cost: 0 });
      }

      const daily = dailyMap.get(dateKey)!;
      daily.requests++;
      daily.tokens += record.totalTokens;
      daily.cost += record.cost;
    }

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  private checkBudgetAlerts(record: UsageRecord): void {
    // Check per-request limit
    if (record.cost > this.budgetLimits.perRequest) {
      this.addAlert({
        type: 'unusual_spike',
        message: `High cost request: $${record.cost.toFixed(4)} for ${record.provider}:${record.model}`,
        provider: record.provider,
        amount: record.cost,
        threshold: this.budgetLimits.perRequest
      });
    }

    // Check daily limit
    const todaySpending = this.getTodaySpending();
    if (todaySpending > this.budgetLimits.daily) {
      this.addAlert({
        type: 'daily_limit',
        message: `Daily budget exceeded: $${todaySpending.toFixed(2)}`,
        amount: todaySpending,
        threshold: this.budgetLimits.daily
      });
    }

    // Check monthly limit
    const monthlySpending = this.getCurrentMonthSpending();
    if (monthlySpending > this.budgetLimits.monthly) {
      this.addAlert({
        type: 'monthly_limit',
        message: `Monthly budget exceeded: $${monthlySpending.toFixed(2)}`,
        amount: monthlySpending,
        threshold: this.budgetLimits.monthly
      });
    }
  }

  private addAlert(alert: Omit<CostAlert, 'id' | 'timestamp'>): void {
    // Don't add duplicate alerts
    const exists = this.alerts.some(a =>
      a.type === alert.type &&
      a.provider === alert.provider &&
      (Date.now() - a.timestamp.getTime()) < 60000 // Within last minute
    );

    if (!exists) {
      this.alerts.push({
        ...alert,
        id: this.generateId(),
        timestamp: new Date()
      });
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('ai-cost-tracker', JSON.stringify({
        records: this.records.slice(-1000), // Keep last 1000 records
        alerts: this.alerts.slice(-50), // Keep last 50 alerts
        budgetLimits: this.budgetLimits
      }));
    } catch (error) {
      console.warn('Failed to save cost tracking data:', error);
    }
  }

  // Load from storage
  loadFromStorage(): void {
    try {
      const data = localStorage.getItem('ai-cost-tracker');
      if (data) {
        const parsed = JSON.parse(data);
        this.records = parsed.records?.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp)
        })) || [];
        this.alerts = parsed.alerts?.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        })) || [];
        this.budgetLimits = { ...this.budgetLimits, ...parsed.budgetLimits };
      }
    } catch (error) {
      console.warn('Failed to load cost tracking data:', error);
    }
  }
}

// Global cost tracker instance
export const costTracker = new CostTracker();

// Initialize from storage
costTracker.loadFromStorage();