"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface UsageData {
  date: string;
  cost: number;
  tokens: number;
  requests: number;
}

export function UsageChart() {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
  const supabase = createClient();

  const loadUsageData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Get usage data from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('ai_usage_records')
        .select('timestamp, cost, total_tokens')
        .eq('user_id', session.user.id)
        .gte('timestamp', thirtyDaysAgo.toISOString())
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching usage data:', error);
        return;
      }

      // Group data by date
      const groupedData: { [key: string]: { cost: number; tokens: number; requests: number } } = {};
      let total = 0;

      data?.forEach((record: any) => {
        const date = new Date(record.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!groupedData[date]) {
          groupedData[date] = { cost: 0, tokens: 0, requests: 0 };
        }
        groupedData[date].cost += Number(record.cost) || 0;
        groupedData[date].tokens += record.total_tokens || 0;
        groupedData[date].requests += 1;
        total += Number(record.cost) || 0;
      });

      const chartData = Object.entries(groupedData).map(([date, values]) => ({
        date,
        cost: Number(values.cost.toFixed(3)),
        tokens: values.tokens,
        requests: values.requests
      }));

      setUsageData(chartData);
      setTotalSpent(total);
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadUsageData();
  }, [loadUsageData]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Usage Overview
          </CardTitle>
          <CardDescription>
            Your AI usage over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">${totalSpent.toFixed(3)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-bold">
                {usageData.reduce((sum, day) => sum + day.requests, 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Daily Usage
          </CardTitle>
          <CardDescription>
            Daily AI costs and usage patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'cost') return [`$${Number(value).toFixed(3)}`, 'Cost'];
                    if (name === 'requests') return [value, 'Requests'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="cost" fill="hsl(var(--ai-primary))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No usage data available</p>
                <p className="text-sm">Start using AI features to see your usage here</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}