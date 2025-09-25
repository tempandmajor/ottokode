"use client";

import React from 'react';
import { Badge } from '../../../web-app/src/components/ui/badge';
import { Button } from '../../../web-app/src/components/ui/button';
import { Card, CardContent } from '../../../web-app/src/components/ui/card';
import { ScrollArea } from '../../../web-app/src/components/ui/scroll-area';
import { aiTerminalService, CommandSuggestion } from '../../services/ai/AITerminalService';

export interface CommandSuggestionsProps {
  partialInput: string;
  directory?: string;
  onPick: (command: string) => void;
}

export function CommandSuggestions({ partialInput, directory, onPick }: CommandSuggestionsProps) {
  const [suggestions, setSuggestions] = React.useState<CommandSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const run = async () => {
      if (!partialInput.trim()) { setSuggestions([]); return; }
      setLoading(true);
      try {
        const res = await aiTerminalService.getCommandSuggestions(partialInput, directory);
        if (active) setSuggestions(res);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [partialInput, directory]);

  const riskColor = (risk: CommandSuggestion['riskLevel']) => (
    risk === 'low' ? 'bg-green-100 text-green-800' :
    risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
    risk === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
  );

  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="h-56">
          <div className="divide-y">
            {loading && (
              <div className="p-3 text-sm text-muted-foreground">Fetching suggestions…</div>
            )}
            {!loading && suggestions.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">No suggestions.</div>
            )}
            {suggestions.map((s, idx) => (
              <div key={idx} className="p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <code className="text-sm break-all pr-3">{s.command}</code>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={riskColor(s.riskLevel)}>{s.riskLevel}</Badge>
                    <Badge variant="outline">{s.category}</Badge>
                    <Badge variant="secondary">{Math.round(s.confidence * 100)}%</Badge>
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{s.description}</div>
                <div className="mt-2">
                  <Button size="sm" onClick={() => onPick(s.command)}>Use</Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
