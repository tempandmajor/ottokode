import { supabaseUsageTracker, UsageRecord, UsageMetrics, CostAlert } from './SupabaseUsageTracker';
import { authService } from '../auth/AuthService';
import { AIUsageStats, ProviderStats, ModelStats, DailyUsage } from '../../types/ai';
import { EventEmitter } from '../../utils/EventEmitter';

export interface EnhancedUsageRecord extends Omit<UsageRecord, 'timestamp'> {
  id?: string;
  timestamp: Date;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  requestType: 'chat' | 'completion' | 'streaming' | 'function_call';
  requestDuration: number;
  success: boolean;
  errorCode?: string;
}

export class SupabaseCostTracker extends EventEmitter {
  private budgetLimits = {
    daily: 10.00,   // $10 per day
    monthly: 200.00, // $200 per month
    perRequest: 1.00 // $1 per request
  };

  constructor() {
    super();
    this.loadBudgetLimits();

    // Listen for usage tracking events
    supabaseUsageTracker.on('usageRecorded', (record) => {
      this.emit('usageRecorded', record);
    });

    supabaseUsageTracker.on('alertCreated', (alert) => {
      this.emit('alertCreated', alert);
    });
  }

  // Record a new usage event
  async recordUsage(record: Omit<EnhancedUsageRecord, 'id' | 'timestamp'>): Promise<void> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated) {
      console.warn('Cannot record usage: user not authenticated');
      return;
    }

    try {
      const usageRecord: Omit<UsageRecord, 'user_id'> = {
        timestamp: new Date(),
        provider: record.provider,
        model: record.model,
        prompt_tokens: record.promptTokens,
        completion_tokens: record.completionTokens,
        total_tokens: record.totalTokens,
        cost: record.cost,
        request_type: record.requestType,
        request_duration: record.requestDuration,
        success: record.success,
        error_code: record.errorCode
      };

      await supabaseUsageTracker.recordUsage(usageRecord);
    } catch (error) {
      console.error('Failed to record usage:', error);
      throw error;
    }
  }

  // Get comprehensive usage statistics
  async getUsageStats(timeRange?: { start: Date; end: Date }): Promise<AIUsageStats> {
    try {
      let period: 'hour' | 'day' | 'week' | 'month' | 'year' = 'month';

      if (timeRange) {
        const diffDays = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) period = 'day';
        else if (diffDays <= 7) period = 'week';
        else if (diffDays <= 30) period = 'month';
        else period = 'year';
      }

      const metrics = await supabaseUsageTracker.getUsageMetrics(period);

      return {
        totalRequests: metrics.totalRequests,
        totalTokens: metrics.totalTokens,
        totalCost: metrics.totalCost,
        byProvider: this.convertToProviderStats(metrics.providerBreakdown),
        byModel: this.convertToModelStats(metrics.modelBreakdown),
        dailyUsage: await this.getDailyUsage(timeRange)
      };
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      throw error;
    }
  }

  // Get current month's spending
  async getCurrentMonthSpending(): Promise<number> {
    try {
      const metrics = await supabaseUsageTracker.getUsageMetrics('month');
      return metrics.totalCost;
    } catch (error) {
      console.error('Failed to get monthly spending:', error);
      return 0;
    }
  }

  // Get today's spending
  async getTodaySpending(): Promise<number> {
    try {
      const metrics = await supabaseUsageTracker.getUsageMetrics('day');
      return metrics.totalCost;
    } catch (error) {
      console.error('Failed to get daily spending:', error);
      return 0;
    }
  }

  // Get usage by provider for a time period
  async getProviderUsage(provider: string, days: number = 30): Promise<ProviderStats> {
    try {
      let period: 'day' | 'week' | 'month' | 'year' = 'month';
      if (days <= 7) period = 'week';
      else if (days <= 30) period = 'month';
      else period = 'year';

      const metrics = await supabaseUsageTracker.getUsageMetrics(period, provider);

      return {
        requests: metrics.totalRequests,
        tokens: metrics.totalTokens,
        cost: metrics.totalCost,
        avgLatency: metrics.averageRequestDuration
      };
    } catch (error) {
      console.error('Failed to get provider usage:', error);
      return { requests: 0, tokens: 0, cost: 0, avgLatency: 0 };
    }
  }

  // Get cost projections
  async getCostProjections(): Promise<{
    dailyProjection: number;
    monthlyProjection: number;
    budgetAlerts: CostAlert[];
  }> {
    try {
      const weeklyMetrics = await supabaseUsageTracker.getUsageMetrics('week');
      const dailyAverage = weeklyMetrics.totalCost / 7;

      const alerts = await supabaseUsageTracker.getCostAlerts(false);

      return {
        dailyProjection: dailyAverage,
        monthlyProjection: dailyAverage * 30,
        budgetAlerts: alerts
      };
    } catch (error) {
      console.error('Failed to get cost projections:', error);
      return {
        dailyProjection: 0,
        monthlyProjection: 0,
        budgetAlerts: []
      };
    }
  }

  // Set budget limits
  setBudgetLimits(limits: Partial<typeof this.budgetLimits>): void {
    this.budgetLimits = { ...this.budgetLimits, ...limits };
    this.saveBudgetLimits();
  }

  // Get budget status
  async getBudgetStatus(): Promise<{
    daily: { used: number; limit: number; percentage: number };
    monthly: { used: number; limit: number; percentage: number };
  }> {
    try {
      const [dailyUsed, monthlyUsed] = await Promise.all([
        this.getTodaySpending(),
        this.getCurrentMonthSpending()
      ]);

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
    } catch (error) {
      console.error('Failed to get budget status:', error);
      return {
        daily: { used: 0, limit: this.budgetLimits.daily, percentage: 0 },
        monthly: { used: 0, limit: this.budgetLimits.monthly, percentage: 0 }
      };
    }
  }

  // Export usage data for analysis
  async exportUsageData(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const records = await supabaseUsageTracker.getUsageHistory('month', 10000);

      if (format === 'csv') {
        const headers = [
          'timestamp', 'provider', 'model', 'request_type',
          'prompt_tokens', 'completion_tokens', 'total_tokens',
          'cost', 'request_duration', 'success', 'error_code'
        ];

        const rows = records.map(r => [
          r.timestamp.toISOString(),
          r.provider,
          r.model,
          r.request_type,
          r.prompt_tokens.toString(),
          r.completion_tokens.toString(),
          r.total_tokens.toString(),
          r.cost.toFixed(4),
          r.request_duration.toString(),
          r.success.toString(),
          r.error_code || ''
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
      }

      const usageStats = await this.getUsageStats();
      const budgetStatus = await this.getBudgetStatus();

      return JSON.stringify({
        exportDate: new Date().toISOString(),
        totalRecords: records.length,
        usageStats,
        budgetStatus,
        records
      }, null, 2);
    } catch (error) {
      console.error('Failed to export usage data:', error);
      throw error;
    }
  }

  // Get alerts
  async getActiveAlerts(): Promise<CostAlert[]> {
    try {
      return await supabaseUsageTracker.getCostAlerts(false);
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      return [];
    }
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      await supabaseUsageTracker.acknowledgeAlert(alertId);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      throw error;
    }
  }

  // Get usage history
  async getUsageHistory(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<EnhancedUsageRecord[]> {
    try {
      const records = await supabaseUsageTracker.getUsageHistory(timeRange);

      return records.map(record => ({
        id: record.id,
        timestamp: record.timestamp,
        provider: record.provider,
        model: record.model,
        promptTokens: record.prompt_tokens,
        completionTokens: record.completion_tokens,
        totalTokens: record.total_tokens,
        cost: record.cost,
        requestType: record.request_type,
        requestDuration: record.request_duration,
        success: record.success,
        errorCode: record.error_code
      }));
    } catch (error) {
      console.error('Failed to get usage history:', error);
      return [];
    }
  }

  // Private helper methods
  private convertToProviderStats(breakdown: Record<string, any>): Record<string, ProviderStats> {
    const stats: Record<string, ProviderStats> = {};

    for (const [provider, data] of Object.entries(breakdown)) {
      stats[provider] = {
        requests: data.requests,
        tokens: data.tokens,
        cost: data.cost,
        avgLatency: 0 // Would need to calculate from raw data
      };
    }

    return stats;
  }

  private convertToModelStats(breakdown: Record<string, any>): Record<string, ModelStats> {
    const stats: Record<string, ModelStats> = {};

    for (const [model, data] of Object.entries(breakdown)) {
      stats[model] = {
        requests: data.requests,
        tokens: data.tokens,
        cost: data.cost,
        avgTokensPerRequest: data.tokens / data.requests || 0
      };
    }

    return stats;
  }

  private async getDailyUsage(timeRange?: { start: Date; end: Date }): Promise<DailyUsage[]> {
    try {
      // This would require a more complex query to group by day
      // For now, returning empty array - would need to implement aggregation
      return [];
    } catch (error) {
      console.error('Failed to get daily usage:', error);
      return [];
    }
  }

  private saveBudgetLimits(): void {
    try {
      localStorage.setItem('supabase-budget-limits', JSON.stringify(this.budgetLimits));
    } catch (error) {
      console.warn('Failed to save budget limits:', error);
    }
  }

  private loadBudgetLimits(): void {
    try {
      const data = localStorage.getItem('supabase-budget-limits');
      if (data) {
        const parsed = JSON.parse(data);
        this.budgetLimits = { ...this.budgetLimits, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load budget limits:', error);
    }
  }

  // Getters
  getBudgetLimits() {
    return { ...this.budgetLimits };
  }
}

// Global enhanced cost tracker instance
export const supabaseCostTracker = new SupabaseCostTracker();