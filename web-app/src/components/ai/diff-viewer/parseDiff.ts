import { DiffHunk, DiffLine, ParsedDiff } from './types';

export function parseDiff(unifiedDiff: string, filePath: string): ParsedDiff {
  const lines = unifiedDiff.split('\n');
  const hunks: DiffHunk[] = [];

  let currentHunk: DiffHunk | null = null;
  let hunkIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip file headers (---, +++)
    if (line.startsWith('---') || line.startsWith('+++')) {
      continue;
    }

    // Parse hunk header (@@ -oldStart,oldLines +newStart,newLines @@)
    const hunkHeaderMatch = line.match(/^@@\s*-(\d+)(?:,(\d+))?\s*\+(\d+)(?:,(\d+))?\s*@@(.*)$/);
    if (hunkHeaderMatch) {
      // Save previous hunk
      if (currentHunk) {
        hunks.push(currentHunk);
      }

      const oldStart = parseInt(hunkHeaderMatch[1]);
      const oldLines = parseInt(hunkHeaderMatch[2] || '1');
      const newStart = parseInt(hunkHeaderMatch[3]);
      const newLines = parseInt(hunkHeaderMatch[4] || '1');
      const context = hunkHeaderMatch[5];

      currentHunk = {
        id: `hunk-${hunkIndex++}`,
        header: line,
        oldStart,
        oldLines,
        newStart,
        newLines,
        lines: [],
        selected: true, // Default to selected
      };
      continue;
    }

    // Parse diff lines
    if (currentHunk && line.length > 0) {
      const type = line[0];
      const content = line.slice(1);

      let diffLine: DiffLine;

      switch (type) {
        case ' ':
          diffLine = {
            type: 'context',
            content,
            oldNumber: currentHunk.oldStart + currentHunk.lines.filter(l => l.type === 'context' || l.type === 'remove').length,
            newNumber: currentHunk.newStart + currentHunk.lines.filter(l => l.type === 'context' || l.type === 'add').length,
          };
          break;
        case '-':
          diffLine = {
            type: 'remove',
            content,
            oldNumber: currentHunk.oldStart + currentHunk.lines.filter(l => l.type === 'context' || l.type === 'remove').length,
          };
          break;
        case '+':
          diffLine = {
            type: 'add',
            content,
            newNumber: currentHunk.newStart + currentHunk.lines.filter(l => l.type === 'context' || l.type === 'add').length,
          };
          break;
        default:
          // Treat other lines as context
          diffLine = {
            type: 'context',
            content: line,
            oldNumber: currentHunk.oldStart + currentHunk.lines.filter(l => l.type === 'context' || l.type === 'remove').length,
            newNumber: currentHunk.newStart + currentHunk.lines.filter(l => l.type === 'context' || l.type === 'add').length,
          };
      }

      currentHunk.lines.push(diffLine);
    }
  }

  // Add the last hunk
  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return {
    filePath,
    hunks,
  };
}