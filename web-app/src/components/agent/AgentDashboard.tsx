"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  Bot,
  Brain,
  Clock,
  FileText,
  Layers,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

// Import our agent types from the backend
interface Agent {
  id: string;
  name: string;
  type: AgentType;
  capabilities: AgentCapability[];
  status: AgentStatus;
  metadata: AgentMetadata;
  configuration: AgentConfiguration;
  performance: AgentPerformance;
  created: Date;
  lastActive: Date;
}

type AgentType =
  | 'code_analyzer'
  | 'bug_fixer'
  | 'refactor_specialist'
  | 'test_generator'
  | 'documentation_writer'
  | 'performance_optimizer'
  | 'security_auditor'
  | 'dependency_manager'
  | 'workflow_coordinator'
  | 'learning_facilitator';

interface AgentCapability {
  name: string;
  description: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  confidence: number;
  prerequisites: string[];
}

type AgentStatus =
  | 'idle'
  | 'busy'
  | 'thinking'
  | 'blocked'
  | 'error'
  | 'disabled'
  | 'learning';

interface AgentMetadata {
  version: string;
  description: string;
  tags: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AgentConfiguration {
  maxConcurrentTasks: number;
  priority: number;
  timeout: number;
  retryAttempts: number;
  dependencies: string[];
  resources: ResourceRequirements;
}

interface ResourceRequirements {
  memory: number;
  cpu: number;
  storage: number;
  network: boolean;
}

interface AgentPerformance {
  tasksCompleted: number;
  successRate: number;
  averageResponseTime: number;
  errorRate: number;
  lastEvaluated: Date;
  metrics: PerformanceMetrics;
}

interface PerformanceMetrics {
  accuracy: number;
  efficiency: number;
  reliability: number;
  adaptability: number;
}

interface Task {
  id: string;
  agentId: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration: number;
  actualDuration?: number;
  result?: any;
  error?: string;
}

const AGENT_TYPE_ICONS = {
  code_analyzer: FileText,
  bug_fixer: AlertCircle,
  refactor_specialist: RotateCcw,
  test_generator: CheckCircle,
  documentation_writer: FileText,
  performance_optimizer: Zap,
  security_auditor: XCircle,
  dependency_manager: Layers,
  workflow_coordinator: Bot,
  learning_facilitator: Brain
};

const AGENT_TYPE_COLORS = {
  code_analyzer: 'bg-blue-100 text-blue-800',
  bug_fixer: 'bg-red-100 text-red-800',
  refactor_specialist: 'bg-green-100 text-green-800',
  test_generator: 'bg-purple-100 text-purple-800',
  documentation_writer: 'bg-yellow-100 text-yellow-800',
  performance_optimizer: 'bg-orange-100 text-orange-800',
  security_auditor: 'bg-red-100 text-red-800',
  dependency_manager: 'bg-indigo-100 text-indigo-800',
  workflow_coordinator: 'bg-teal-100 text-teal-800',
  learning_facilitator: 'bg-pink-100 text-pink-800'
};

const STATUS_COLORS = {
  idle: 'bg-gray-100 text-gray-800',
  busy: 'bg-blue-100 text-blue-800',
  thinking: 'bg-purple-100 text-purple-800',
  blocked: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  disabled: 'bg-gray-100 text-gray-500',
  learning: 'bg-green-100 text-green-800'
};

const STATUS_ICONS = {
  idle: Clock,
  busy: Loader2,
  thinking: Brain,
  blocked: AlertCircle,
  error: XCircle,
  disabled: Pause,
  learning: Brain
};

export function AgentDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data for now - this would connect to our agent service
  useEffect(() => {
    // Simulate loading agent data
    setTimeout(() => {
      setAgents([
        {
          id: 'agent-1',
          name: 'Code Analyzer Prime',
          type: 'code_analyzer',
          status: 'busy',
          capabilities: [
            {
              name: 'Static Analysis',
              description: 'Deep code structure analysis',
              level: 'expert',
              confidence: 0.95,
              prerequisites: []
            },
            {
              name: 'Pattern Recognition',
              description: 'Identify code patterns and anti-patterns',
              level: 'advanced',
              confidence: 0.88,
              prerequisites: ['Static Analysis']
            }
          ],
          metadata: {
            version: '2.1.0',
            description: 'Advanced code analysis and pattern recognition',
            tags: ['analysis', 'patterns', 'quality'],
            author: 'Ottokode AI',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-03-01')
          },
          configuration: {
            maxConcurrentTasks: 3,
            priority: 8,
            timeout: 30000,
            retryAttempts: 2,
            dependencies: [],
            resources: {
              memory: 512,
              cpu: 2,
              storage: 100,
              network: true
            }
          },
          performance: {
            tasksCompleted: 1247,
            successRate: 0.94,
            averageResponseTime: 2340,
            errorRate: 0.06,
            lastEvaluated: new Date(),
            metrics: {
              accuracy: 0.94,
              efficiency: 0.87,
              reliability: 0.96,
              adaptability: 0.82
            }
          },
          created: new Date('2024-01-15'),
          lastActive: new Date()
        },
        {
          id: 'agent-2',
          name: 'Bug Hunter',
          type: 'bug_fixer',
          status: 'thinking',
          capabilities: [
            {
              name: 'Error Detection',
              description: 'Identify runtime and logical errors',
              level: 'expert',
              confidence: 0.92,
              prerequisites: []
            }
          ],
          metadata: {
            version: '1.8.3',
            description: 'Specialized in finding and fixing bugs',
            tags: ['debugging', 'fixes', 'errors'],
            author: 'Ottokode AI',
            createdAt: new Date('2024-02-01'),
            updatedAt: new Date('2024-03-10')
          },
          configuration: {
            maxConcurrentTasks: 5,
            priority: 9,
            timeout: 45000,
            retryAttempts: 3,
            dependencies: ['agent-1'],
            resources: {
              memory: 256,
              cpu: 1,
              storage: 50,
              network: true
            }
          },
          performance: {
            tasksCompleted: 892,
            successRate: 0.89,
            averageResponseTime: 3200,
            errorRate: 0.11,
            lastEvaluated: new Date(),
            metrics: {
              accuracy: 0.89,
              efficiency: 0.83,
              reliability: 0.91,
              adaptability: 0.87
            }
          },
          created: new Date('2024-02-01'),
          lastActive: new Date()
        },
        {
          id: 'agent-3',
          name: 'Test Master',
          type: 'test_generator',
          status: 'idle',
          capabilities: [
            {
              name: 'Unit Test Generation',
              description: 'Generate comprehensive unit tests',
              level: 'advanced',
              confidence: 0.91,
              prerequisites: []
            }
          ],
          metadata: {
            version: '1.5.2',
            description: 'Automated test generation and validation',
            tags: ['testing', 'automation', 'validation'],
            author: 'Ottokode AI',
            createdAt: new Date('2024-01-20'),
            updatedAt: new Date('2024-02-28')
          },
          configuration: {
            maxConcurrentTasks: 2,
            priority: 7,
            timeout: 60000,
            retryAttempts: 1,
            dependencies: ['agent-1'],
            resources: {
              memory: 384,
              cpu: 1,
              storage: 75,
              network: false
            }
          },
          performance: {
            tasksCompleted: 456,
            successRate: 0.96,
            averageResponseTime: 4100,
            errorRate: 0.04,
            lastEvaluated: new Date(),
            metrics: {
              accuracy: 0.96,
              efficiency: 0.78,
              reliability: 0.98,
              adaptability: 0.75
            }
          },
          created: new Date('2024-01-20'),
          lastActive: new Date(Date.now() - 1800000) // 30 minutes ago
        }
      ]);

      setActiveTasks([
        {
          id: 'task-1',
          agentId: 'agent-1',
          description: 'Analyzing React component performance patterns',
          status: 'running',
          priority: 'high',
          progress: 65,
          startedAt: new Date(Date.now() - 120000),
          estimatedDuration: 180000
        },
        {
          id: 'task-2',
          agentId: 'agent-2',
          description: 'Investigating TypeScript type errors in auth module',
          status: 'running',
          priority: 'urgent',
          progress: 23,
          startedAt: new Date(Date.now() - 60000),
          estimatedDuration: 300000
        },
        {
          id: 'task-3',
          agentId: 'agent-1',
          description: 'Code quality assessment for recent changes',
          status: 'pending',
          priority: 'medium',
          progress: 0,
          estimatedDuration: 240000
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status: AgentStatus) => {
    const Icon = STATUS_ICONS[status];
    return <Icon className={`w-4 h-4 ${status === 'busy' || status === 'thinking' ? 'animate-spin' : ''}`} />;
  };

  const getTypeIcon = (type: AgentType) => {
    const Icon = AGENT_TYPE_ICONS[type];
    return <Icon className="w-5 h-5" />;
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getRunningTasks = (agentId: string) => {
    return activeTasks.filter(task => task.agentId === agentId && task.status === 'running');
  };

  const getTotalTasks = (agentId: string) => {
    return activeTasks.filter(task => task.agentId === agentId).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading agents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and monitor your AI agent workforce
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
          <Button size="sm">
            <Play className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.filter(a => a.status !== 'disabled').length}</div>
            <p className="text-xs text-muted-foreground">
              {agents.filter(a => a.status === 'busy').length} busy, {agents.filter(a => a.status === 'idle').length} idle
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTasks.filter(t => t.status === 'running').length}</div>
            <p className="text-xs text-muted-foreground">
              {activeTasks.filter(t => t.status === 'pending').length} queued
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(agents.reduce((acc, agent) => acc + agent.performance.successRate, 0) / agents.length * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(agents.reduce((acc, agent) => acc + agent.performance.averageResponseTime, 0) / agents.length)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="tasks">Active Tasks</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card key={agent.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedAgent(agent)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(agent.type)}
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(agent.status)}
                      <Badge variant="secondary" className={STATUS_COLORS[agent.status]}>
                        {agent.status}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    <Badge variant="outline" className={AGENT_TYPE_COLORS[agent.type]}>
                      {agent.type.replace('_', ' ')}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tasks</span>
                      <span>{getTotalTasks(agent.id)} total, {getRunningTasks(agent.id).length} active</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span>{Math.round(agent.performance.successRate * 100)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Response Time</span>
                      <span>{formatDuration(agent.performance.averageResponseTime)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Active</span>
                      <span>{formatDuration(Date.now() - agent.lastActive.getTime())} ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Tasks</CardTitle>
              <CardDescription>Currently running and queued tasks across all agents</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {activeTasks.map((task) => {
                    const agent = agents.find(a => a.id === task.agentId);
                    return (
                      <div key={task.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          {agent && getTypeIcon(agent.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground truncate">
                              {task.description}
                            </p>
                            <Badge variant="outline" className={
                              task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Agent: {agent?.name} • {task.status}
                          </p>
                          {task.status === 'running' && (
                            <div className="mt-2 space-y-1">
                              <Progress value={task.progress} className="w-full" />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{task.progress}% complete</span>
                                <span>
                                  {task.startedAt && formatDuration(Date.now() - task.startedAt.getTime())} elapsed
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {agents.map((agent) => (
              <Card key={`perf-${agent.id}`}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(agent.type)}
                    <CardTitle className="text-base">{agent.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Accuracy</span>
                        <span>{Math.round(agent.performance.metrics.accuracy * 100)}%</span>
                      </div>
                      <Progress value={agent.performance.metrics.accuracy * 100} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Efficiency</span>
                        <span>{Math.round(agent.performance.metrics.efficiency * 100)}%</span>
                      </div>
                      <Progress value={agent.performance.metrics.efficiency * 100} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Reliability</span>
                        <span>{Math.round(agent.performance.metrics.reliability * 100)}%</span>
                      </div>
                      <Progress value={agent.performance.metrics.reliability * 100} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Adaptability</span>
                        <span>{Math.round(agent.performance.metrics.adaptability * 100)}%</span>
                      </div>
                      <Progress value={agent.performance.metrics.adaptability * 100} />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tasks Completed</p>
                        <p className="font-medium">{agent.performance.tasksCompleted.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Error Rate</p>
                        <p className="font-medium">{Math.round(agent.performance.errorRate * 100)}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}