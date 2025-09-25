"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../web-app/src/components/ui/card';
import { ScrollArea } from '../../../web-app/src/components/ui/scroll-area';
import { Badge } from '../../../web-app/src/components/ui/badge';
import { aiTerminalService } from '../../services/ai/AITerminalService';

export function ExecutionMonitor() {
  const [commands, setCommands] = React.useState(() => aiTerminalService.getCommandHistory(100));

  React.useEffect(() => {
    const onCompleted = () => setCommands(aiTerminalService.getCommandHistory(100));
    const onFailed = () => setCommands(aiTerminalService.getCommandHistory(100));
    const onExecuting = () => setCommands(aiTerminalService.getCommandHistory(100));

    aiTerminalService.on('commandCompleted', onCompleted);
    aiTerminalService.on('commandFailed', onFailed);
    aiTerminalService.on('commandExecuting', onExecuting);

    return () => {
      aiTerminalService.off('commandCompleted', onCompleted);
      aiTerminalService.off('commandFailed', onFailed);
      aiTerminalService.off('commandExecuting', onExecuting);
    };
  }, []);

  const statusColor = (status: string) => (
    status === 'completed' ? 'bg-green-100 text-green-800' :
    status === 'processing' ? 'bg-blue-100 text-blue-800' :
    status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execution Monitor</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {commands.length === 0 && (
              <div className="text-sm text-muted-foreground">No commands yet.</div>
            )}
            {commands.map((cmd) => (
              <div key={cmd.id} className="border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <code className="text-sm break-all">{cmd.command}</code>
                  <Badge variant="outline" className={statusColor(cmd.status)}>
                    {cmd.status}
                  </Badge>
                </div>
                {cmd.result?.output && (
                  <pre className="mt-2 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
{cmd.result.output}
                  </pre>
                )}
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(cmd.timestamp).toLocaleTimeString()} • {cmd.result?.duration ?? 0}ms
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
