"use client";

import React from "react";

interface DiffViewerProps {
  filePath: string;
  unifiedDiff: string;
  changed: boolean;
  provider?: string;
  model?: string;
}

// Minimal unified diff viewer: shows raw diff with monospace styling.
// Future: upgrade to side-by-side with hunk selection.
export function DiffViewer({ filePath, unifiedDiff, changed, provider, model }: DiffViewerProps) {
  return (
    <div className="w-full border rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="text-sm font-medium">Proposed changes: {filePath}</div>
        <div className="text-xs text-muted-foreground">
          {provider ? `${provider}${model ? ` • ${model}` : ""}` : ""} {changed ? "• changes detected" : "• no changes"}
        </div>
      </div>
      <pre className="p-3 text-xs whitespace-pre-wrap overflow-auto bg-[var(--code-bg,#0b1020)] text-[var(--code-fg,#eaeefe)]">
{unifiedDiff}
      </pre>
    </div>
  );
}

export default DiffViewer;
