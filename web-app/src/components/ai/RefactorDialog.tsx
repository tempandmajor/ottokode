"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAIPatchRefactor } from "@/hooks/useAIPatchRefactor";
import { DiffViewer } from "./diff-viewer/DiffViewer";
import { ExperimentalBadge } from "@/components/ui/experimental-badge";

interface RefactorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string;
  fileContent: string;
  selectedText?: string;
  onApply?: (diff: string) => void;
}

export function RefactorDialog({
  open,
  onOpenChange,
  filePath,
  fileContent,
  selectedText,
  onApply
}: RefactorDialogProps) {
  const [instruction, setInstruction] = useState("");
  const { isRefactoring, lastResult, error, requestRefactor, clearResult } = useAIPatchRefactor();

  const handleSubmit = async () => {
    if (!instruction.trim()) return;

    await requestRefactor({
      filePath,
      originalContent: fileContent,
      instruction: instruction.trim(),
      selectedText
    });
  };

  const handleApply = () => {
    if (lastResult && onApply) {
      onApply(lastResult.unified_diff);
    }
    handleClose();
  };

  const handleClose = () => {
    setInstruction("");
    clearResult();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Ask AI to Refactor
            <ExperimentalBadge variant="experimental" />
          </DialogTitle>
          <DialogDescription>
            Describe what you want to change in {filePath}
            {selectedText && " (selected text will be prioritized)"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {selectedText && (
            <div>
              <Label className="text-sm font-medium">Selected Text:</Label>
              <pre className="mt-1 p-2 bg-muted rounded text-xs max-h-20 overflow-y-auto">
                {selectedText}
              </pre>
            </div>
          )}

          <div>
            <Label htmlFor="instruction">Refactoring Instructions</Label>
            <Textarea
              id="instruction"
              placeholder="e.g., 'Extract this into a reusable hook', 'Add error handling', 'Optimize this function'..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
              {error}
            </div>
          )}

          {lastResult && (
            <div className="space-y-2">
              <Label>Proposed Changes:</Label>
              <DiffViewer
                filePath={lastResult.file_path}
                unifiedDiff={lastResult.unified_diff}
                changed={lastResult.changed}
                provider={lastResult.provider}
                model={lastResult.model}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {lastResult && lastResult.changed ? (
            <Button onClick={handleApply}>
              Apply Changes
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!instruction.trim() || isRefactoring}
            >
              {isRefactoring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Patch
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}