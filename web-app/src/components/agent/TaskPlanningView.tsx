"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  Square,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Bot,
  Brain,
  Zap,
  Target,
  GitBranch,
  Layers,
  FileText,
  Code,
  TestTube,
  Shield,
  Loader2
} from 'lucide-react';

interface TaskNode {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  progress: number;
  estimatedDuration: number;
  actualDuration?: number;
  priority: Priority;
  assignedAgent?: string;
  dependencies: string[];
  children: TaskNode[];
  metadata: TaskMetadata;
  startedAt?: Date;
  completedAt?: Date;
}

type TaskType =
  | 'analysis'
  | 'implementation'
  | 'testing'
  | 'documentation'
  | 'refactoring'
  | 'debugging'
  | 'optimization'
  | 'security'
  | 'deployment';

type TaskStatus =
  | 'pending'
  | 'ready'
  | 'running'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'paused';

type Priority = 'low' | 'medium' | 'high' | 'critical';

interface TaskMetadata {
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  tags: string[];
  requiredSkills: string[];
}

interface TaskPlan {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'failed';
  rootTasks: TaskNode[];
  totalTasks: number;
  completedTasks: number;
  estimatedDuration: number;
  actualDuration?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

const TASK_TYPE_ICONS = {
  analysis: Brain,
  implementation: Code,
  testing: TestTube,
  documentation: FileText,
  refactoring: GitBranch,
  debugging: AlertCircle,
  optimization: Zap,
  security: Shield,
  deployment: Target
};

const TASK_TYPE_COLORS = {
  analysis: 'bg-purple-100 text-purple-800',
  implementation: 'bg-blue-100 text-blue-800',
  testing: 'bg-green-100 text-green-800',
  documentation: 'bg-yellow-100 text-yellow-800',
  refactoring: 'bg-indigo-100 text-indigo-800',
  debugging: 'bg-red-100 text-red-800',
  optimization: 'bg-orange-100 text-orange-800',
  security: 'bg-red-100 text-red-800',
  deployment: 'bg-teal-100 text-teal-800'
};

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  ready: 'bg-blue-100 text-blue-800',
  running: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  blocked: 'bg-yellow-100 text-yellow-800',
  paused: 'bg-gray-100 text-gray-600'
};

const STATUS_ICONS = {
  pending: Clock,
  ready: Play,
  running: Loader2,
  completed: CheckCircle,
  failed: AlertCircle,
  blocked: AlertCircle,
  paused: Pause
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

interface TaskPlanningViewProps {
  onTaskPlanCreated?: (plan: TaskPlan) => void;
  onTaskExecuted?: (taskId: string) => void;
}

export function TaskPlanningView({ onTaskPlanCreated, onTaskExecuted }: TaskPlanningViewProps) {
  const [taskPlans, setTaskPlans] = useState<TaskPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TaskPlan | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data
  useEffect(() => {
    setTimeout(() => {
      const mockPlan: TaskPlan = {
        id: 'plan-1',
        title: 'Implement User Authentication System',
        description: 'Build a complete authentication system with login, registration, password reset, and session management.',
        status: 'executing',
        totalTasks: 12,
        completedTasks: 7,
        estimatedDuration: 1800000, // 30 minutes
        actualDuration: 1200000, // 20 minutes so far
        createdAt: new Date(Date.now() - 1800000),
        updatedAt: new Date(),
        createdBy: 'user@example.com',
        rootTasks: [
          {
            id: 'task-1',
            title: 'Authentication Analysis',
            description: 'Analyze current auth requirements and design system architecture',
            type: 'analysis',
            status: 'completed',
            progress: 100,
            estimatedDuration: 300000,
            actualDuration: 280000,
            priority: 'high',
            assignedAgent: 'agent-1',
            dependencies: [],
            startedAt: new Date(Date.now() - 1600000),
            completedAt: new Date(Date.now() - 1500000),
            metadata: {
              complexity: 'moderate',
              confidence: 0.95,
              riskLevel: 'low',
              tags: ['auth', 'analysis', 'architecture'],
              requiredSkills: ['system_design', 'security']
            },
            children: [
              {
                id: 'task-1-1',
                title: 'Security Requirements',
                description: 'Define security requirements and compliance needs',
                type: 'security',
                status: 'completed',
                progress: 100,
                estimatedDuration: 120000,
                actualDuration: 110000,
                priority: 'critical',
                assignedAgent: 'agent-security',
                dependencies: [],
                metadata: {
                  complexity: 'complex',
                  confidence: 0.92,
                  riskLevel: 'high',
                  tags: ['security', 'compliance'],
                  requiredSkills: ['security_analysis']
                },
                children: []
              },
              {
                id: 'task-1-2',
                title: 'Database Schema Design',
                description: 'Design user and session tables with proper relationships',
                type: 'analysis',
                status: 'completed',
                progress: 100,
                estimatedDuration: 180000,
                actualDuration: 170000,
                priority: 'high',
                assignedAgent: 'agent-1',
                dependencies: ['task-1-1'],
                metadata: {
                  complexity: 'moderate',
                  confidence: 0.88,
                  riskLevel: 'medium',
                  tags: ['database', 'schema'],
                  requiredSkills: ['database_design']
                },
                children: []
              }
            ]
          },
          {
            id: 'task-2',
            title: 'Backend Implementation',
            description: 'Implement authentication endpoints and middleware',
            type: 'implementation',
            status: 'running',
            progress: 60,
            estimatedDuration: 900000,
            priority: 'high',
            assignedAgent: 'agent-2',
            dependencies: ['task-1'],
            startedAt: new Date(Date.now() - 600000),
            metadata: {
              complexity: 'complex',
              confidence: 0.85,
              riskLevel: 'medium',
              tags: ['backend', 'api', 'auth'],
              requiredSkills: ['backend_development', 'api_design']
            },
            children: [
              {
                id: 'task-2-1',
                title: 'User Registration API',
                description: 'Create user registration endpoint with validation',
                type: 'implementation',
                status: 'completed',
                progress: 100,
                estimatedDuration: 300000,
                actualDuration: 320000,
                priority: 'high',
                assignedAgent: 'agent-2',
                dependencies: [],
                metadata: {
                  complexity: 'moderate',
                  confidence: 0.91,
                  riskLevel: 'low',
                  tags: ['api', 'registration'],
                  requiredSkills: ['api_development']
                },
                children: []
              },
              {
                id: 'task-2-2',
                title: 'Login API',
                description: 'Implement login endpoint with session management',
                type: 'implementation',
                status: 'running',
                progress: 75,
                estimatedDuration: 300000,
                priority: 'high',
                assignedAgent: 'agent-2',
                dependencies: ['task-2-1'],
                metadata: {
                  complexity: 'moderate',
                  confidence: 0.87,
                  riskLevel: 'medium',
                  tags: ['api', 'login', 'sessions'],
                  requiredSkills: ['api_development', 'session_management']
                },
                children: []
              },
              {
                id: 'task-2-3',
                title: 'Password Reset API',
                description: 'Create secure password reset flow with email verification',
                type: 'implementation',
                status: 'ready',
                progress: 0,
                estimatedDuration: 300000,
                priority: 'medium',
                assignedAgent: 'agent-2',
                dependencies: ['task-2-2'],
                metadata: {
                  complexity: 'complex',
                  confidence: 0.82,
                  riskLevel: 'high',
                  tags: ['api', 'password', 'email'],
                  requiredSkills: ['api_development', 'email_services']
                },
                children: []
              }
            ]
          },
          {
            id: 'task-3',
            title: 'Frontend Integration',
            description: 'Build authentication UI components and integration',
            type: 'implementation',
            status: 'pending',
            progress: 0,
            estimatedDuration: 600000,
            priority: 'medium',
            dependencies: ['task-2'],
            metadata: {
              complexity: 'moderate',
              confidence: 0.89,
              riskLevel: 'low',
              tags: ['frontend', 'ui', 'integration'],
              requiredSkills: ['frontend_development', 'ui_design']
            },
            children: []
          }
        ]
      };

      setTaskPlans([mockPlan]);
      setSelectedPlan(mockPlan);
      setLoading(false);
    }, 1000);
  }, []);

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getStatusIcon = (status: TaskStatus) => {
    const Icon = STATUS_ICONS[status];
    return <Icon className={`w-4 h-4 ${status === 'running' ? 'animate-spin' : ''}`} />;
  };

  const getTypeIcon = (type: TaskType) => {
    const Icon = TASK_TYPE_ICONS[type];
    return <Icon className="w-4 h-4" />;
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const calculateProgress = (tasks: TaskNode[]): number => {
    let totalWeight = 0;
    let completedWeight = 0;

    const calculateTaskWeight = (task: TaskNode): number => {
      if (task.children.length === 0) return 1;
      return task.children.reduce((sum, child) => sum + calculateTaskWeight(child), 0);
    };

    tasks.forEach(task => {
      const weight = calculateTaskWeight(task);
      totalWeight += weight;
      if (task.status === 'completed') {
        completedWeight += weight;
      } else if (task.status === 'running') {
        completedWeight += weight * (task.progress / 100);
      }
    });

    return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  };

  const generateTaskPlan = async () => {
    if (!newTaskDescription.trim()) return;

    setIsGeneratingPlan(true);

    // Simulate AI task planning
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock generated plan
    const newPlan: TaskPlan = {
      id: `plan-${Date.now()}`,
      title: newTaskDescription.split(' ').slice(0, 5).join(' '),
      description: newTaskDescription,
      status: 'draft',
      totalTasks: 8,
      completedTasks: 0,
      estimatedDuration: 1200000,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user@example.com',
      rootTasks: []
    };

    setTaskPlans(prev => [...prev, newPlan]);
    setNewTaskDescription('');
    setIsGeneratingPlan(false);
    onTaskPlanCreated?.(newPlan);
  };

  const renderTaskNode = (task: TaskNode, depth: number = 0) => {
    const hasChildren = task.children.length > 0;
    const isExpanded = expandedTasks.has(task.id);

    return (
      <div key={task.id} className={`${depth > 0 ? 'ml-4 border-l border-gray-200 pl-4' : ''}`}>
        <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg group">
          {hasChildren && (
            <button
              onClick={() => toggleTaskExpansion(task.id)}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}

          {!hasChildren && <div className="w-6" />}

          <div className="flex-shrink-0">
            {getStatusIcon(task.status)}
          </div>

          <div className="flex-shrink-0">
            {getTypeIcon(task.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {task.title}
              </h4>
              <div className="flex items-center space-x-2 ml-2">
                <Badge variant="outline" className={PRIORITY_COLORS[task.priority]}>
                  {task.priority}
                </Badge>
                <Badge variant="outline" className={TASK_TYPE_COLORS[task.type]}>
                  {task.type}
                </Badge>
                <Badge variant="outline" className={STATUS_COLORS[task.status]}>
                  {task.status}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-1">
              {task.description}
            </p>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                {task.assignedAgent && (
                  <div className="flex items-center space-x-1">
                    <Bot className="w-3 h-3" />
                    <span>{task.assignedAgent}</span>
                  </div>
                )}
                <span>Est: {formatDuration(task.estimatedDuration)}</span>
                {task.actualDuration && (
                  <span>Actual: {formatDuration(task.actualDuration)}</span>
                )}
                <span>Confidence: {Math.round(task.metadata.confidence * 100)}%</span>
              </div>

              {task.status === 'running' && (
                <div className="flex items-center space-x-2">
                  <Progress value={task.progress} className="w-20" />
                  <span className="text-xs text-gray-500">{task.progress}%</span>
                </div>
              )}
            </div>

            {task.dependencies.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <ArrowRight className="w-3 h-3" />
                  <span>Depends on: {task.dependencies.join(', ')}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={() => onTaskExecuted?.(task.id)}>
              <Play className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-1">
            {task.children.map(child => renderTaskNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading task plans...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Planning</h1>
          <p className="text-muted-foreground">
            Intelligent task decomposition and workflow orchestration
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Brain className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task Plan</DialogTitle>
              <DialogDescription>
                Describe what you want to accomplish, and AI will break it down into actionable tasks.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Describe your task in detail... (e.g., 'Build a user authentication system with login, registration, and password reset functionality')"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                rows={4}
              />
              <Button
                onClick={generateTaskPlan}
                disabled={!newTaskDescription.trim() || isGeneratingPlan}
                className="w-full"
              >
                {isGeneratingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Task Plan
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plan Overview */}
      {selectedPlan && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calculateProgress(selectedPlan.rootTasks)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedPlan.completedTasks} of {selectedPlan.totalTasks} tasks
              </p>
              <Progress value={calculateProgress(selectedPlan.rootTasks)} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className={
                selectedPlan.status === 'executing' ? 'bg-blue-100 text-blue-800' :
                selectedPlan.status === 'completed' ? 'bg-green-100 text-green-800' :
                selectedPlan.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }>
                {selectedPlan.status}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Created {selectedPlan.createdAt.toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(selectedPlan.estimatedDuration)}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedPlan.actualDuration ? `${formatDuration(selectedPlan.actualDuration)} elapsed` : 'estimated'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedPlan.actualDuration ?
                  Math.round((selectedPlan.estimatedDuration / selectedPlan.actualDuration) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                vs estimated time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Task Plans */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Task Plans</CardTitle>
              <CardDescription>Select a plan to view details</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {taskPlans.map(plan => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedPlan?.id === plan.id
                          ? 'bg-blue-50 border-blue-200 border'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{plan.title}</h4>
                        <Badge variant="outline" size="sm">
                          {plan.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {plan.completedTasks}/{plan.totalTasks} tasks • {formatDuration(plan.estimatedDuration)}
                      </p>
                      <Progress value={calculateProgress(plan.rootTasks)} className="mt-2" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedPlan ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedPlan.title}</CardTitle>
                    <CardDescription>{selectedPlan.description}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                    <Button size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Execute
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {selectedPlan.rootTasks.map(task => renderTaskNode(task))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Plan Selected</h3>
                  <p className="text-gray-500">Select a task plan to view its breakdown and progress.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}