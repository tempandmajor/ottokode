import { useEffect, useMemo, useState, useCallback } from 'react';
import { aiTerminalService, CommandSuggestion, TerminalCommand } from '../services/ai/AITerminalService';

export interface UseTerminalAIOptions {
  directory?: string;
}

export function useTerminalAI(options?: UseTerminalAIOptions) {
  const [partialInput, setPartialInput] = useState('');
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const [history, setHistory] = useState<TerminalCommand[]>(() => aiTerminalService.getCommandHistory(100));
  const [pendingApproval, setPendingApproval] = useState<TerminalCommand | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!partialInput.trim()) { setSuggestions([]); return; }
      setLoading(true);
      try {
        const res = await aiTerminalService.getCommandSuggestions(partialInput, options?.directory);
        if (active) setSuggestions(res);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [partialInput, options?.directory]);

  useEffect(() => {
    const onCompleted = () => setHistory(aiTerminalService.getCommandHistory(100));
    const onFailed = () => setHistory(aiTerminalService.getCommandHistory(100));
    const onExecuting = () => setHistory(aiTerminalService.getCommandHistory(100));
    const onConfirmationRequired = (evt: any) => setPendingApproval(evt.command);

    aiTerminalService.on('commandCompleted', onCompleted);
    aiTerminalService.on('commandFailed', onFailed);
    aiTerminalService.on('commandExecuting', onExecuting);
    aiTerminalService.on('confirmationRequired', onConfirmationRequired);

    return () => {
      aiTerminalService.off('commandCompleted', onCompleted);
      aiTerminalService.off('commandFailed', onFailed);
      aiTerminalService.off('commandExecuting', onExecuting);
      aiTerminalService.off('confirmationRequired', onConfirmationRequired);
    };
  }, []);

  const executeNaturalLanguage = useCallback(async (text: string) => {
    setLoading(true);
    try {
      await aiTerminalService.processNaturalLanguageCommand(text, options?.directory ? { currentDirectory: options.directory } as any : undefined);
    } finally {
      setLoading(false);
    }
  }, [options?.directory]);

  const approvePending = useCallback(async () => {
    if (!pendingApproval) return;
    await aiTerminalService.confirmCommand(pendingApproval.id);
    setPendingApproval(null);
  }, [pendingApproval]);

  const cancelPending = useCallback(() => setPendingApproval(null), []);

  return {
    partialInput,
    setPartialInput,
    suggestions,
    loading,
    history,
    pendingApproval,
    approvePending,
    cancelPending,
    executeNaturalLanguage,
  };
}
