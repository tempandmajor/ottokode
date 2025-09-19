import { useState } from 'react';
import { PatchService, ProposeDiffResult } from '@/services/ai/PatchService';

export interface RefactorRequest {
  filePath: string;
  originalContent: string;
  instruction: string;
  selectedText?: string;
}

export function useAIPatchRefactor() {
  const [isRefactoring, setIsRefactoring] = useState(false);
  const [lastResult, setLastResult] = useState<ProposeDiffResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestRefactor = async (request: RefactorRequest): Promise<ProposeDiffResult | null> => {
    setIsRefactoring(true);
    setError(null);
    setLastResult(null);

    try {
      const result = await PatchService.proposeDiff({
        file_path: request.filePath,
        original_content: request.originalContent,
        user_instruction: request.instruction,
        retrieved_context: request.selectedText
      });

      setLastResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate patch';
      setError(errorMessage);
      return null;
    } finally {
      setIsRefactoring(false);
    }
  };

  const clearResult = () => {
    setLastResult(null);
    setError(null);
  };

  return {
    isRefactoring,
    lastResult,
    error,
    requestRefactor,
    clearResult
  };
}