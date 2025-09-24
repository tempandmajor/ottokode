'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Clock, CheckCircle, XCircle, ArrowRight, Smartphone, Monitor } from 'lucide-react';

// Types for agent management (Cursor 2025 standard)
interface BackgroundAgent {
  id: string;
  name: string;
  type: 'code-reviewer' | 'feature-builder' | 'bug-fixer' | 'test-generator';
  status: 'idle' | 'running' | 'completed' | 'failed';
  task: string;
  progress: number;
  estimatedCompletion?: Date;
  project: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  lastUpdate: Date;
}

interface TaskAssignment {
  description: string;
  type: 'feature' | 'bugfix' | 'refactor' | 'test';
  priority: 'low' | 'medium' | 'high';
  project: string;
}

// Mock data - in real implementation, this would come from API
const mockAgents: BackgroundAgent[] = [
  {
    id: '1',
    name: 'Feature Builder Pro',
    type: 'feature-builder',
    status: 'running',
    task: 'Implement user authentication system with OAuth integration',
    progress: 75,
    estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000),
    project: 'e-commerce-app',
    priority: 'high',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    lastUpdate: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: '2',
    name: 'Bug Hunter',
    type: 'bug-fixer',
    status: 'completed',
    task: 'Fix memory leak in React component lifecycle',
    progress: 100,
    project: 'dashboard-v2',
    priority: 'medium',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    lastUpdate: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '3',
    name: 'Test Generator AI',
    type: 'test-generator',
    status: 'idle',
    task: 'Generate comprehensive unit tests for API endpoints',
    progress: 0,
    project: 'backend-api',
    priority: 'low',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    lastUpdate: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
];

export function AgentDashboardWeb() {
  const [agents, setAgents] = useState<BackgroundAgent[]>(mockAgents);
  const [newTask, setNewTask] = useState<TaskAssignment>({
    description: '',
    type: 'feature',
    priority: 'medium',
    project: '',
  });
  const [activeTab, setActiveTab] = useState('active');

  // Simulate real-time updates (in production, use WebSocket)
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => {
        if (agent.status === 'running' && agent.progress < 100) {
          return {
            ...agent,
            progress: Math.min(100, agent.progress + Math.random() * 5),
            lastUpdate: new Date(),
          };
        }
        return agent;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleTaskSubmit = async () => {
    if (!newTask.description.trim()) return;

    // In production, this would be an API call
    const mockNewAgent: BackgroundAgent = {
      id: Date.now().toString(),
      name: `AI Agent ${agents.length + 1}`,
      type: newTask.type === 'feature' ? 'feature-builder' : 'bug-fixer',
      status: 'running',
      task: newTask.description,
      progress: 0,
      project: newTask.project || 'default-project',
      priority: newTask.priority,
      createdAt: new Date(),
      lastUpdate: new Date(),
    };

    setAgents(prev => [...prev, mockNewAgent]);
    setNewTask({ description: '', type: 'feature', priority: 'medium', project: '' });
  };

  const handleDesktopHandoff = (agentId: string) => {
    // Cursor 2025 pattern: seamless handoff to desktop IDE
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    // In production, this would synchronize task state with desktop app
    window.open(`ottokode://task/${agentId}`, '_blank');
  };

  const getStatusIcon = (status: BackgroundAgent['status']) => {
    switch (status) {
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Bot className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: BackgroundAgent['status']) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: BackgroundAgent['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Cursor 2025 styling */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Agent Control Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage background coding agents from any device
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {agents.filter(a => a.status === 'running').length} Active
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Smartphone className="w-3 h-3" />
            Mobile Ready
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Active Agents ({agents.filter(a => a.status !== 'completed').length})
          </TabsTrigger>
          <TabsTrigger value="assign" className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            Assign Task
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({agents.filter(a => a.status === 'completed').length})
          </TabsTrigger>
        </TabsList>

        {/* Active Agents Tab */}
        <TabsContent value="active" className="space-y-4">
          {agents.filter(a => a.status !== 'completed').map((agent) => (
            <Card key={agent.id} className="border-l-4" style={{ borderLeftColor: getStatusColor(agent.status) }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(agent.status)}
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Badge variant="secondary" className={getPriorityColor(agent.priority)}>
                          {agent.priority.toUpperCase()}
                        </Badge>
                        <span>•</span>
                        <span>{agent.project}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDesktopHandoff(agent.id)}
                      className="flex items-center gap-1"
                    >
                      <Monitor className="w-3 h-3" />
                      Open in IDE
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{agent.task}</p>

                {agent.status === 'running' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Progress</span>
                      <span>{Math.round(agent.progress)}%</span>
                    </div>
                    <Progress value={agent.progress} className="h-2" />
                    {agent.estimatedCompletion && (
                      <p className="text-xs text-muted-foreground">
                        Est. completion: {agent.estimatedCompletion.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                  <span>Started: {agent.createdAt.toLocaleTimeString()}</span>
                  <span>Last update: {agent.lastUpdate.toLocaleTimeString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}

          {agents.filter(a => a.status !== 'completed').length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Agents</h3>
                <p className="text-muted-foreground">
                  Assign a new task to get started with AI-powered development
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Task Assignment Tab - Cursor 2025 Natural Language Pattern */}
        <TabsContent value="assign" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assign New Task</CardTitle>
              <CardDescription>
                Describe what you want to build or fix. Your agent will start working immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Task Description</label>
                <Textarea
                  placeholder="e.g., Create a user dashboard with charts showing monthly revenue and user growth. Include responsive design and dark mode support."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="min-h-[100px] textarea-enhanced"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Task Type</label>
                  <Select
                    value={newTask.type}
                    onValueChange={(value: any) => setNewTask({ ...newTask, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feature">New Feature</SelectItem>
                      <SelectItem value="bugfix">Bug Fix</SelectItem>
                      <SelectItem value="refactor">Refactor</SelectItem>
                      <SelectItem value="test">Add Tests</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value: any) => setNewTask({ ...newTask, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Select
                    value={newTask.project}
                    onValueChange={(value) => setNewTask({ ...newTask, project: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="e-commerce-app">E-commerce App</SelectItem>
                      <SelectItem value="dashboard-v2">Dashboard v2</SelectItem>
                      <SelectItem value="backend-api">Backend API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleTaskSubmit}
                className="w-full"
                size="lg"
                disabled={!newTask.description.trim()}
              >
                <Bot className="w-4 h-4 mr-2" />
                Start Background Agent
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Tasks Tab */}
        <TabsContent value="completed" className="space-y-4">
          {agents.filter(a => a.status === 'completed').map((agent) => (
            <Card key={agent.id} className="border-l-4 border-l-green-500 opacity-75">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription>{agent.project}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Completed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{agent.task}</p>
                <div className="text-xs text-muted-foreground">
                  Completed: {agent.lastUpdate.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}