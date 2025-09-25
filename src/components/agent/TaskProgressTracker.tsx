"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../web-app/src/components/ui/card';
import { ScrollArea } from '../../../web-app/src/components/ui/scroll-area';
import { Badge } from '../../../web-app/src/components/ui/badge';
import { Progress } from '../../../web-app/src/components/ui/progress';
import { agentOrchestrator, Task } from '../../services/agents/AgentOrchestrator';

interface TaskProgressTrackerProps {
  onOpenTask?: (taskId: string) => void;
}

export function TaskProgressTracker({ onOpenTask }: TaskProgressTrackerProps) {
  const [tasks, setTasks] = React.useState<Task[]>([]);

  React.useEffect(() => {
    const refresh = () => {
      try {
        const list = (agentOrchestrator as any).getTasks?.() || [];
        setTasks(list);
      } catch {
        // If orchestrator doesn't expose a getter, rely on events only
      }
    };
    refresh();

    agentOrchestrator.on('taskCreated', refresh);
    agentOrchestrator.on('taskUpdated', refresh);
    agentOrchestrator.on('taskCompleted', refresh);

    return () => {
      agentOrchestrator.off('taskCreated', refresh);
      agentOrchestrator.off('taskUpdated', refresh);
      agentOrchestrator.off('taskCompleted', refresh);
    };
  }, []);

  const statusColor = (status: Task['status']) => (
    status === 'completed' ? 'bg-green-100 text-green-800' :
    status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
    status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
    status === 'failed' ? 'bg-red-100 text-red-800' :
    status === 'cancelled' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'
  );

  const priorityColor = (p: Task['priority']) => (
    p === 'critical' ? 'bg-red-100 text-red-800' :
    p === 'high' ? 'bg-orange-100 text-orange-800' :
    p === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          <div className="space-y-3">
            {tasks.length === 0 && (
              <div className="text-sm text-muted-foreground">No tasks yet. Create a task from the Agent Dashboard.</div>
            )}
            {tasks.map((t) => (
              <button key={t.id} onClick={() => onOpenTask?.(t.id)} className="w-full text-left">
                <div className="border rounded-md p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="font-medium truncate pr-2">{t.description}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={priorityColor(t.priority)}>{t.priority}</Badge>
                      <Badge variant="outline" className={statusColor(t.status)}>{t.status}</Badge>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Progress value={t.progress} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t.type} • {new Date(t.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
