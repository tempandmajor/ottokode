"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertCircle,
  Bot,
  Brain,
  CheckCircle,
  Clock,
  Cpu,
  Eye,
  EyeOff,
  HardDrive,
  Loader2,
  MemoryStick,
  Network,
  Pause,
  Play,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown,
  Wifi,
  Zap,
  XCircle
} from 'lucide-react';

interface AgentStatus {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'busy' | 'thinking' | 'blocked' | 'error' | 'disabled' | 'learning';
  health: 'healthy' | 'warning' | 'critical';
  currentTask?: {
    id: string;
    description: string;
    progress: number;
    startedAt: Date;
    estimatedCompletion: Date;
  };
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkActivity: number;
    tasksPerMinute: number;
    errorRate: number;
    responseTime: number;
    uptime: number;
  };
  recentActivity: ActivityEvent[];
  alerts: Alert[];
  configuration: {
    maxConcurrentTasks: number;
    priority: number;
    timeout: number;
    retryAttempts: number;
  };
}

interface ActivityEvent {
  id: string;
  timestamp: Date;
  type: 'task_started' | 'task_completed' | 'task_failed' | 'error' | 'warning' | 'info';
  description: string;
  metadata?: any;
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  details?: string;
}

interface SystemMetrics {
  timestamp: Date;
  overall: {
    activeAgents: number;
    totalTasks: number;
    averageResponseTime: number;
    systemLoad: number;
    errorRate: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkBandwidth: number;
  };
}

const STATUS_COLORS = {
  idle: 'bg-gray-100 text-gray-800',
  busy: 'bg-blue-100 text-blue-800',
  thinking: 'bg-purple-100 text-purple-800',
  blocked: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  disabled: 'bg-gray-100 text-gray-500',
  learning: 'bg-green-100 text-green-800'
};

const HEALTH_COLORS = {
  healthy: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  critical: 'bg-red-100 text-red-800'
};

const STATUS_ICONS = {
  idle: Clock,
  busy: Loader2,
  thinking: Brain,
  blocked: AlertCircle,
  error: XCircle,
  disabled: Pause,
  learning: TrendingUp
};

const ALERT_COLORS = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  critical: 'bg-red-100 text-red-800'
};

export function AgentStatusMonitor() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentStatus | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [showInactive, setShowInactive] = useState(false);

  // Simulate real-time data updates
  useEffect(() => {
    const generateMockData = () => {
      const mockAgents: AgentStatus[] = [
        {
          id: 'agent-1',
          name: 'Code Analyzer Prime',
          type: 'code_analyzer',
          status: 'busy',
          health: 'healthy',
          currentTask: {
            id: 'task-123',
            description: 'Analyzing React component performance patterns',
            progress: 67,
            startedAt: new Date(Date.now() - 120000),
            estimatedCompletion: new Date(Date.now() + 60000)
          },
          metrics: {
            cpuUsage: 45,
            memoryUsage: 78,
            diskUsage: 23,
            networkActivity: 12,
            tasksPerMinute: 2.3,
            errorRate: 0.05,
            responseTime: 2340,
            uptime: 86400000 // 24 hours
          },
          recentActivity: [
            {
              id: 'act-1',
              timestamp: new Date(Date.now() - 30000),
              type: 'task_started',
              description: 'Started analyzing performance patterns'
            },
            {
              id: 'act-2',
              timestamp: new Date(Date.now() - 180000),
              type: 'task_completed',
              description: 'Completed code quality assessment'
            }
          ],
          alerts: [],
          configuration: {
            maxConcurrentTasks: 3,
            priority: 8,
            timeout: 30000,
            retryAttempts: 2
          }
        },
        {
          id: 'agent-2',
          name: 'Bug Hunter',
          type: 'bug_fixer',
          status: 'thinking',
          health: 'healthy',
          currentTask: {
            id: 'task-124',
            description: 'Investigating TypeScript type errors',
            progress: 23,
            startedAt: new Date(Date.now() - 60000),
            estimatedCompletion: new Date(Date.now() + 240000)
          },
          metrics: {
            cpuUsage: 32,
            memoryUsage: 56,
            diskUsage: 18,
            networkActivity: 8,
            tasksPerMinute: 1.8,
            errorRate: 0.08,
            responseTime: 3200,
            uptime: 72000000 // 20 hours
          },
          recentActivity: [
            {
              id: 'act-3',
              timestamp: new Date(Date.now() - 60000),
              type: 'task_started',
              description: 'Started investigating type errors'
            }
          ],
          alerts: [
            {
              id: 'alert-1',
              severity: 'warning',
              message: 'Response time above average',
              timestamp: new Date(Date.now() - 300000),
              acknowledged: false,
              details: 'Agent response time is 15% higher than usual'
            }
          ],
          configuration: {
            maxConcurrentTasks: 5,
            priority: 9,
            timeout: 45000,
            retryAttempts: 3
          }
        },
        {
          id: 'agent-3',
          name: 'Test Master',
          type: 'test_generator',
          status: 'idle',
          health: 'healthy',
          metrics: {
            cpuUsage: 5,
            memoryUsage: 34,
            diskUsage: 12,
            networkActivity: 2,
            tasksPerMinute: 0,
            errorRate: 0.02,
            responseTime: 1800,
            uptime: 3600000 // 1 hour
          },
          recentActivity: [
            {
              id: 'act-4',
              timestamp: new Date(Date.now() - 1800000),
              type: 'task_completed',
              description: 'Generated unit tests for auth module'
            }
          ],
          alerts: [],
          configuration: {
            maxConcurrentTasks: 2,
            priority: 7,
            timeout: 60000,
            retryAttempts: 1
          }
        },
        {
          id: 'agent-4',
          name: 'Security Auditor',
          type: 'security_auditor',
          status: 'error',
          health: 'critical',
          metrics: {
            cpuUsage: 0,
            memoryUsage: 45,
            diskUsage: 67,
            networkActivity: 0,
            tasksPerMinute: 0,
            errorRate: 1.0,
            responseTime: 0,
            uptime: 1800000 // 30 minutes
          },
          recentActivity: [
            {
              id: 'act-5',
              timestamp: new Date(Date.now() - 300000),
              type: 'error',
              description: 'Agent crashed during security scan'
            }
          ],
          alerts: [
            {
              id: 'alert-2',
              severity: 'critical',
              message: 'Agent has crashed and requires attention',
              timestamp: new Date(Date.now() - 300000),
              acknowledged: false,
              details: 'Security Auditor encountered an unrecoverable error'
            }
          ],
          configuration: {
            maxConcurrentTasks: 1,
            priority: 10,
            timeout: 120000,
            retryAttempts: 5
          }
        }
      ];

      const mockSystemMetrics: SystemMetrics = {
        timestamp: new Date(),
        overall: {
          activeAgents: mockAgents.filter(a => a.status !== 'idle' && a.status !== 'disabled' && a.status !== 'error').length,
          totalTasks: 3,
          averageResponseTime: 2440,
          systemLoad: 0.65,
          errorRate: 0.15
        },
        resources: {
          cpuUsage: 28,
          memoryUsage: 53,
          diskUsage: 30,
          networkBandwidth: 7.5
        }
      };

      setAgents(mockAgents);
      setSystemMetrics(mockSystemMetrics);
    };

    generateMockData();

    if (autoRefresh) {
      const interval = setInterval(generateMockData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  useEffect(() => {
    if (selectedAgent) {
      const updated = agents.find(a => a.id === selectedAgent.id);
      if (updated) {
        setSelectedAgent(updated);
      }
    }
  }, [agents, selectedAgent]);

  const getStatusIcon = (status: AgentStatus['status']) => {
    const Icon = STATUS_ICONS[status];
    return <Icon className={`w-4 h-4 ${status === 'busy' || status === 'thinking' ? 'animate-spin' : ''}`} />;
  };

  const formatUptime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  const getHealthColor = (health: AgentStatus['health']) => HEALTH_COLORS[health];

  const acknowledgeAlert = (alertId: string) => {
    setAgents(prev => prev.map(agent => ({
      ...agent,
      alerts: agent.alerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    })));
  };

  const restartAgent = (agentId: string) => {
    setAgents(prev => prev.map(agent =>
      agent.id === agentId ? {
        ...agent,
        status: 'idle',
        health: 'healthy',
        alerts: agent.alerts.map(alert => ({ ...alert, acknowledged: true }))
      } : agent
    ));
  };

  const filteredAgents = showInactive ? agents : agents.filter(a => a.status !== 'idle' && a.status !== 'disabled');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agent Status Monitor</h2>
          <p className="text-muted-foreground">Real-time monitoring of agent health and performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showInactive ? 'Hide Inactive' : 'Show All'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* System Overview */}
      {systemMetrics && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Active Agents</p>
                  <p className="text-2xl font-bold">{systemMetrics.overall.activeAgents}</p>
                </div>
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {agents.length - systemMetrics.overall.activeAgents} inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">System Load</p>
                  <p className="text-2xl font-bold">{Math.round(systemMetrics.overall.systemLoad * 100)}%</p>
                </div>
                <Cpu className="h-8 w-8 text-muted-foreground" />
              </div>
              <Progress value={systemMetrics.overall.systemLoad * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Memory Usage</p>
                  <p className="text-2xl font-bold">{systemMetrics.resources.memoryUsage}%</p>
                </div>
                <MemoryStick className="h-8 w-8 text-muted-foreground" />
              </div>
              <Progress value={systemMetrics.resources.memoryUsage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Response Time</p>
                  <p className="text-2xl font-bold">{systemMetrics.overall.averageResponseTime}ms</p>
                </div>
                <Zap className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Average across all agents</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Error Rate</p>
                  <p className="text-2xl font-bold">{Math.round(systemMetrics.overall.errorRate * 100)}%</p>
                </div>
                <AlertCircle className={`h-8 w-8 ${systemMetrics.overall.errorRate > 0.1 ? 'text-red-500' : 'text-muted-foreground'}`} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Agent List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Agents ({filteredAgents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {filteredAgents.map((agent) => (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                        selectedAgent?.id === agent.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(agent.status)}
                          <span className="font-medium text-sm">{agent.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Badge variant="outline" className={getHealthColor(agent.health)}>
                            {agent.health}
                          </Badge>
                          {agent.alerts.filter(a => !a.acknowledged).length > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {agent.alerts.filter(a => !a.acknowledged).length}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>CPU: {agent.metrics.cpuUsage}%</span>
                          <span>Memory: {agent.metrics.memoryUsage}%</span>
                        </div>
                        {agent.currentTask && (
                          <div className="space-y-1">
                            <Progress value={agent.currentTask.progress} className="h-1" />
                            <p className="text-xs text-muted-foreground truncate">
                              {agent.currentTask.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Agent Details */}
        <div className="lg:col-span-2">
          {selectedAgent ? (
            <Tabs defaultValue="overview" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(selectedAgent.status)}
                  <h3 className="text-xl font-semibold">{selectedAgent.name}</h3>
                  <Badge variant="outline" className={STATUS_COLORS[selectedAgent.status]}>
                    {selectedAgent.status}
                  </Badge>
                  <Badge variant="outline" className={getHealthColor(selectedAgent.health)}>
                    {selectedAgent.health}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedAgent.status === 'error' && (
                    <Button size="sm" onClick={() => restartAgent(selectedAgent.id)}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Restart
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="alerts">
                  Alerts {selectedAgent.alerts.filter(a => !a.acknowledged).length > 0 && (
                    <Badge variant="destructive" className="ml-1 text-xs">
                      {selectedAgent.alerts.filter(a => !a.acknowledged).length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {selectedAgent.currentTask && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Current Task</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm">{selectedAgent.currentTask.description}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{selectedAgent.currentTask.progress}%</span>
                          </div>
                          <Progress value={selectedAgent.currentTask.progress} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Started</p>
                            <p>{formatDuration(Date.now() - selectedAgent.currentTask.startedAt.getTime())} ago</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">ETA</p>
                            <p>{formatDuration(selectedAgent.currentTask.estimatedCompletion.getTime() - Date.now())}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Max Tasks</p>
                        <p>{selectedAgent.configuration.maxConcurrentTasks}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Priority</p>
                        <p>{selectedAgent.configuration.priority}/10</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Timeout</p>
                        <p>{formatDuration(selectedAgent.configuration.timeout)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Retry Attempts</p>
                        <p>{selectedAgent.configuration.retryAttempts}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>CPU Usage</span>
                          <span>{selectedAgent.metrics.cpuUsage}%</span>
                        </div>
                        <Progress value={selectedAgent.metrics.cpuUsage} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Memory Usage</span>
                          <span>{selectedAgent.metrics.memoryUsage}%</span>
                        </div>
                        <Progress value={selectedAgent.metrics.memoryUsage} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Disk Usage</span>
                          <span>{selectedAgent.metrics.diskUsage}%</span>
                        </div>
                        <Progress value={selectedAgent.metrics.diskUsage} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Network Activity</span>
                          <span>{selectedAgent.metrics.networkActivity} MB/s</span>
                        </div>
                        <Progress value={Math.min(selectedAgent.metrics.networkActivity * 10, 100)} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{selectedAgent.metrics.tasksPerMinute.toFixed(1)}</p>
                        <p className="text-sm text-muted-foreground">Tasks/min</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{selectedAgent.metrics.responseTime}ms</p>
                        <p className="text-sm text-muted-foreground">Response Time</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{formatUptime(selectedAgent.metrics.uptime)}</p>
                        <p className="text-sm text-muted-foreground">Uptime</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {selectedAgent.recentActivity.map((event) => (
                          <div key={event.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              event.type === 'task_completed' ? 'bg-green-500' :
                              event.type === 'task_failed' || event.type === 'error' ? 'bg-red-500' :
                              event.type === 'warning' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{event.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDuration(Date.now() - event.timestamp.getTime())} ago
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                <div className="space-y-3">
                  {selectedAgent.alerts.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No Alerts</h3>
                        <p className="text-muted-foreground">This agent is operating normally.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    selectedAgent.alerts.map((alert) => (
                      <Card key={alert.id} className={`${alert.acknowledged ? 'opacity-60' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <AlertCircle className={`w-5 h-5 mt-0.5 ${
                                alert.severity === 'critical' || alert.severity === 'error' ? 'text-red-500' :
                                alert.severity === 'warning' ? 'text-yellow-500' :
                                'text-blue-500'
                              }`} />
                              <div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className={ALERT_COLORS[alert.severity]}>
                                    {alert.severity}
                                  </Badge>
                                  <span className="text-sm font-medium">{alert.message}</span>
                                </div>
                                {alert.details && (
                                  <p className="text-sm text-muted-foreground mt-1">{alert.details}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                  {formatDuration(Date.now() - alert.timestamp.getTime())} ago
                                </p>
                              </div>
                            </div>
                            {!alert.acknowledged && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => acknowledgeAlert(alert.id)}
                              >
                                Acknowledge
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Agent</h3>
                <p className="text-gray-500">Choose an agent from the list to view detailed status and metrics.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}