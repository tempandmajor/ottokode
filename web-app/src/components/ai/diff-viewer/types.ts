export interface DiffHunk {
  id: string;
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
  selected: boolean;
}

export interface DiffLine {
  type: 'context' | 'remove' | 'add';
  content: string;
  oldNumber?: number;
  newNumber?: number;
}

export interface ParsedDiff {
  filePath: string;
  hunks: DiffHunk[];
}

export interface DiffViewerProps {
  filePath: string;
  unifiedDiff: string;
  changed: boolean;
  provider?: string;
  model?: string;
  onApplyHunks?: (selectedHunks: DiffHunk[]) => Promise<void>;
  onRejectHunks?: (selectedHunks: DiffHunk[]) => Promise<void>;
  readonly?: boolean;
}