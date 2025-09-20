"use client";

import React, { useState, useMemo } from "react";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import { parseDiff } from "./parseDiff";
import { DiffViewerProps, DiffHunk, DiffLine } from "./types";
import { Check, X, FileText, GitBranch } from "lucide-react";
import { cn } from "../../../lib/utils";

export function EnhancedDiffViewer({
  filePath,
  unifiedDiff,
  changed,
  provider,
  model,
  onApplyHunks,
  onRejectHunks,
  readonly = false
}: DiffViewerProps) {
  const parsedDiff = useMemo(() => parseDiff(unifiedDiff, filePath), [unifiedDiff, filePath]);
  const [hunks, setHunks] = useState<DiffHunk[]>(parsedDiff.hunks);
  const [isApplying, setIsApplying] = useState(false);

  const selectedHunks = hunks.filter(h => h.selected);
  const hasSelections = selectedHunks.length > 0;

  const toggleHunk = (hunkId: string) => {
    setHunks(prev => prev.map(h =>
      h.id === hunkId ? { ...h, selected: !h.selected } : h
    ));
  };

  const selectAll = () => {
    setHunks(prev => prev.map(h => ({ ...h, selected: true })));
  };

  const selectNone = () => {
    setHunks(prev => prev.map(h => ({ ...h, selected: false })));
  };

  const handleApply = async () => {
    if (!onApplyHunks || !hasSelections) return;

    setIsApplying(true);
    try {
      await onApplyHunks(selectedHunks);
    } catch (error) {
      console.error('Failed to apply hunks:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleReject = async () => {
    if (!onRejectHunks || !hasSelections) return;

    setIsApplying(true);
    try {
      await onRejectHunks(selectedHunks);
    } catch (error) {
      console.error('Failed to reject hunks:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const renderLineNumber = (num?: number) => (
    <span className="inline-block w-8 text-right text-muted-foreground select-none">
      {num ?? " "}
    </span>
  );

  const renderLine = (line: DiffLine, index: number) => {
    const lineClasses = cn(
      "flex",
      {
        "bg-red-500/10 text-red-400": line.type === 'remove',
        "bg-green-500/10 text-green-400": line.type === 'add',
        "text-muted-foreground": line.type === 'context',
      }
    );

    return (
      <div key={index} className={lineClasses}>
        {renderLineNumber(line.oldNumber)}
        {renderLineNumber(line.newNumber)}
        <span className="inline-block w-4 text-center">
          {line.type === 'remove' ? '-' : line.type === 'add' ? '+' : ' '}
        </span>
        <code className="flex-1 whitespace-pre">{line.content}</code>
      </div>
    );
  };

  if (!changed) {
    return (
      <div className="w-full border rounded-md overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">{filePath}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {provider ? `${provider}${model ? ` • ${model}` : ""}` : ""} • no changes
          </div>
        </div>
        <div className="p-4 text-center text-muted-foreground">
          No changes proposed for this file.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border rounded-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          <span className="text-sm font-medium">{filePath}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {provider ? `${provider}${model ? ` • ${model}` : ""}` : ""} • {hunks.length} hunk{hunks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Controls */}
      {!readonly && (
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/25">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={selectNone}>
              Select None
            </Button>
            <span className="text-xs text-muted-foreground">
              {selectedHunks.length} of {hunks.length} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              disabled={!hasSelections || isApplying}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-3 w-3 mr-1" />
              Reject
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleApply}
              disabled={!hasSelections || isApplying}
              className="text-green-600 hover:text-green-700"
            >
              <Check className="h-3 w-3 mr-1" />
              {isApplying ? 'Applying...' : 'Apply'}
            </Button>
          </div>
        </div>
      )}

      {/* Diff Content */}
      <div className="font-mono text-xs bg-[var(--code-bg,#0b1020)] text-[var(--code-fg,#eaeefe)]">
        {hunks.map((hunk) => (
          <div key={hunk.id} className="border-b border-border/30">
            {/* Hunk Header */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 bg-blue-500/10 border-b border-blue-500/20",
              !readonly && "cursor-pointer hover:bg-blue-500/20"
            )} onClick={() => !readonly && toggleHunk(hunk.id)}>
              {!readonly && (
                <Checkbox
                  checked={hunk.selected}
                  onChange={() => toggleHunk(hunk.id)}
                  className="h-3 w-3"
                />
              )}
              <code className="text-blue-400">{hunk.header}</code>
            </div>

            {/* Hunk Lines */}
            <div className={cn(
              "transition-opacity",
              !readonly && !hunk.selected && "opacity-50"
            )}>
              {hunk.lines.map((line, index) => renderLine(line, index))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EnhancedDiffViewer;