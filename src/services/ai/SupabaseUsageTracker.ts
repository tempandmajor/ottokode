import { supabase } from '../../lib/supabase';
import { authService } from '../auth/AuthService';
import { EventEmitter } from '../../utils/EventEmitter';

export interface UsageRecord {
  id?: string;
  user_id?: string;
  timestamp: Date;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost: number;
  request_type: 'chat' | 'completion' | 'streaming' | 'function_call';
  request_duration: number;
  success: boolean;
  error_code?: string;
}

export interface UsageMetrics {
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
  averageTokensPerRequest: number;
  averageCostPerRequest: number;
  averageRequestDuration: number;
  providerBreakdown: Record<string, {
    cost: number;
    tokens: number;
    requests: number;
  }>;
  modelBreakdown: Record<string, {
    cost: number;
    tokens: number;
    requests: number;
  }>;
  successRate: number;
}

export interface CostAlert {
  id?: string;
  user_id?: string;
  alert_type: 'budget_exceeded' | 'unusual_spike' | 'daily_limit' | 'monthly_limit';
  message: string;
  provider?: string;
  amount: number;
  threshold: number;
  created_at?: Date;
  acknowledged_at?: Date;
}

class SupabaseUsageTracker extends EventEmitter {
  private readonly COST_THRESHOLDS = {
    daily: 50,
    monthly: 1000,
    spike_percentage: 150 // 150% increase from average
  };

  async recordUsage(record: Omit<UsageRecord, 'user_id'>): Promise<void> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      console.warn('Cannot record usage: user not authenticated');
      return;
    }

    try {
      const { error } = await supabase
        .from('ai_usage_records')
        .insert({
          user_id: authState.user.id,
          timestamp: record.timestamp.toISOString(),
          provider: record.provider,
          model: record.model,
          prompt_tokens: record.prompt_tokens,
          completion_tokens: record.completion_tokens,
          total_tokens: record.total_tokens,
          cost: record.cost,
          request_type: record.request_type,
          request_duration: record.request_duration,
          success: record.success,
          error_code: record.error_code
        });

      if (error) {
        throw error;
      }

      this.emit('usageRecorded', record);

      // Check for cost alerts
      await this.checkCostAlerts(record);

    } catch (error) {
      console.error('Failed to record usage:', error);
      throw error;
    }
  }

  async getUsageMetrics(
    timeRange: 'hour' | 'day' | 'week' | 'month' | 'year' = 'day',
    provider?: string
  ): Promise<UsageMetrics> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error('User not authenticated');
    }

    const now = new Date();
    const startDate = this.getStartDate(now, timeRange);

    try {
      let query = supabase
        .from('ai_usage_records')
        .select('*')
        .eq('user_id', authState.user.id)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', now.toISOString());

      if (provider) {
        query = query.eq('provider', provider);
      }

      const { data: records, error } = await query;

      if (error) {
        throw error;
      }

      return this.calculateMetrics(records || []);
    } catch (error) {
      console.error('Failed to get usage metrics:', error);
      throw error;
    }
  }

  async getUsageHistory(
    timeRange: 'day' | 'week' | 'month' = 'week',
    limit: number = 1000
  ): Promise<UsageRecord[]> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error('User not authenticated');
    }

    const now = new Date();
    const startDate = this.getStartDate(now, timeRange);

    try {
      const { data: records, error } = await supabase
        .from('ai_usage_records')
        .select('*')
        .eq('user_id', authState.user.id)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', now.toISOString())
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (records || []).map(record => ({
        ...record,
        timestamp: new Date(record.timestamp)
      }));
    } catch (error) {
      console.error('Failed to get usage history:', error);
      throw error;
    }
  }

  async getCostAlerts(acknowledged: boolean = false): Promise<CostAlert[]> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error('User not authenticated');
    }

    try {
      let query = supabase
        .from('cost_alerts')
        .select('*')
        .eq('user_id', authState.user.id)
        .order('created_at', { ascending: false });

      if (acknowledged) {
        query = query.not('acknowledged_at', 'is', null);
      } else {
        query = query.is('acknowledged_at', null);
      }

      const { data: alerts, error } = await query;

      if (error) {
        throw error;
      }

      return (alerts || []).map(alert => ({
        ...alert,
        created_at: alert.created_at ? new Date(alert.created_at) : undefined,
        acknowledged_at: alert.acknowledged_at ? new Date(alert.acknowledged_at) : undefined
      }));
    } catch (error) {
      console.error('Failed to get cost alerts:', error);
      throw error;
    }
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('cost_alerts')
        .update({ acknowledged_at: new Date().toISOString() })
        .eq('id', alertId)
        .eq('user_id', authState.user.id);

      if (error) {
        throw error;
      }

      this.emit('alertAcknowledged', alertId);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      throw error;
    }
  }

  private async checkCostAlerts(record: UsageRecord): Promise<void> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      return;
    }

    // Check daily spending
    const todayMetrics = await this.getUsageMetrics('day');
    if (todayMetrics.totalCost > this.COST_THRESHOLDS.daily) {
      await this.createAlert({
        alert_type: 'daily_limit',
        message: `Daily spending limit exceeded: $${todayMetrics.totalCost.toFixed(2)}`,
        provider: record.provider,
        amount: todayMetrics.totalCost,
        threshold: this.COST_THRESHOLDS.daily
      });
    }

    // Check monthly spending
    const monthlyMetrics = await this.getUsageMetrics('month');
    if (monthlyMetrics.totalCost > this.COST_THRESHOLDS.monthly) {
      await this.createAlert({
        alert_type: 'monthly_limit',
        message: `Monthly spending limit exceeded: $${monthlyMetrics.totalCost.toFixed(2)}`,
        provider: record.provider,
        amount: monthlyMetrics.totalCost,
        threshold: this.COST_THRESHOLDS.monthly
      });
    }

    // Check for unusual spending spikes
    const hourlyMetrics = await this.getUsageMetrics('hour');
    const averageHourlyCost = todayMetrics.totalCost / 24;
    const spikeThreshold = averageHourlyCost * (this.COST_THRESHOLDS.spike_percentage / 100);

    if (hourlyMetrics.totalCost > spikeThreshold && averageHourlyCost > 0) {
      await this.createAlert({
        alert_type: 'unusual_spike',
        message: `Unusual spending spike detected: $${hourlyMetrics.totalCost.toFixed(2)} in the last hour`,
        provider: record.provider,
        amount: hourlyMetrics.totalCost,
        threshold: spikeThreshold
      });
    }
  }

  private async createAlert(alert: Omit<CostAlert, 'user_id' | 'id'>): Promise<void> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cost_alerts')
        .insert({
          user_id: authState.user.id,
          ...alert
        });

      if (error) {
        throw error;
      }

      this.emit('alertCreated', alert);
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  }

  private getStartDate(now: Date, timeRange: string): Date {
    const start = new Date(now);

    switch (timeRange) {
      case 'hour':
        start.setHours(start.getHours() - 1);
        break;
      case 'day':
        start.setDate(start.getDate() - 1);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return start;
  }

  private calculateMetrics(records: any[]): UsageMetrics {
    if (records.length === 0) {
      return {
        totalCost: 0,
        totalTokens: 0,
        totalRequests: 0,
        averageTokensPerRequest: 0,
        averageCostPerRequest: 0,
        averageRequestDuration: 0,
        providerBreakdown: {},
        modelBreakdown: {},
        successRate: 0
      };
    }

    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
    const totalTokens = records.reduce((sum, r) => sum + r.total_tokens, 0);
    const totalRequests = records.length;
    const successfulRequests = records.filter(r => r.success).length;
    const totalDuration = records.reduce((sum, r) => sum + r.request_duration, 0);

    // Provider breakdown
    const providerBreakdown: Record<string, any> = {};
    records.forEach(record => {
      if (!providerBreakdown[record.provider]) {
        providerBreakdown[record.provider] = { cost: 0, tokens: 0, requests: 0 };
      }
      providerBreakdown[record.provider].cost += record.cost;
      providerBreakdown[record.provider].tokens += record.total_tokens;
      providerBreakdown[record.provider].requests += 1;
    });

    // Model breakdown
    const modelBreakdown: Record<string, any> = {};
    records.forEach(record => {
      if (!modelBreakdown[record.model]) {
        modelBreakdown[record.model] = { cost: 0, tokens: 0, requests: 0 };
      }
      modelBreakdown[record.model].cost += record.cost;
      modelBreakdown[record.model].tokens += record.total_tokens;
      modelBreakdown[record.model].requests += 1;
    });

    return {
      totalCost,
      totalTokens,
      totalRequests,
      averageTokensPerRequest: totalTokens / totalRequests,
      averageCostPerRequest: totalCost / totalRequests,
      averageRequestDuration: totalDuration / totalRequests,
      providerBreakdown,
      modelBreakdown,
      successRate: (successfulRequests / totalRequests) * 100
    };
  }
}

export const supabaseUsageTracker = new SupabaseUsageTracker();