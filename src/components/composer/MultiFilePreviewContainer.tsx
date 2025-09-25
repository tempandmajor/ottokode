"use client";

import React from 'react';
import { Card, CardContent } from '../../../web-app/src/components/ui/card';
import { Button } from '../../../web-app/src/components/ui/button';
import { Input } from '../../../web-app/src/components/ui/input';
import { Label } from '../../../web-app/src/components/ui/label';
import { Badge } from '../../../web-app/src/components/ui/badge';
import { MultiFilePreview } from './MultiFilePreview';
import { multiFileAgent } from '../../services/agents/MultiFileAgent';

// Adapter types matching MultiFilePreview's expected props
interface DiffLine {
  type: 'unchanged' | 'added' | 'removed' | 'modified';
  lineNumber: { original?: number; modified?: number };
  content: string;
}
interface CodeChange {
  id: string;
  type: 'add' | 'remove' | 'modify';
  startLine: number;
  endLine: number;
  content: string;
  description: string;
  confidence: number;
}
interface FileChangeViewModel {
  id: string;
  filePath: string;
  fileName: string;
  type: 'create' | 'modify' | 'delete' | 'rename' | 'move';
  status: 'pending' | 'approved' | 'rejected' | 'applying' | 'completed' | 'failed';
  language?: string;
  size?: number;
  changes: CodeChange[];
  preview: { original?: string; modified: string; diff: DiffLine[] };
  metadata: { linesAdded: number; linesRemoved: number; linesModified: number; complexity: 'low' | 'medium' | 'high'; confidence: number; estimatedTime: number };
  dependencies: string[];
  warnings: string[];
  suggestions: string[];
}
interface ChangesetViewModel {
  id: string;
  title: string;
  description: string;
  files: FileChangeViewModel[];
  status: 'draft' | 'ready' | 'applying' | 'completed' | 'failed';
  createdAt: Date;
  estimatedDuration: number;
  metadata: { totalLinesAdded: number; totalLinesRemoved: number; totalFilesChanged: number; overallConfidence: number; riskLevel: 'low' | 'medium' | 'high' };
}

export function MultiFilePreviewContainer() {
  const [description, setDescription] = React.useState('Improve authentication UX with validation and error states');
  const [fileList, setFileList] = React.useState<string>('/src/components/auth/LoginForm.tsx, /src/hooks/useAuth.ts');
  const [loading, setLoading] = React.useState(false);
  const [changeset, setChangeset] = React.useState<ChangesetViewModel | undefined>(undefined);
  const [error, setError] = React.useState<string | null>(null);

  const parseFiles = React.useCallback(() => fileList.split(',').map(s => s.trim()).filter(Boolean), [fileList]);

  const planChanges = async () => {
    setLoading(true);
    setError(null);
    try {
      const files = parseFiles();
      const plan = await multiFileAgent.plan(description, files);
      await multiFileAgent.validate(plan);

      // Map to view model (best-effort; diff/content may be absent until deeper integration)
      const filesVm: FileChangeViewModel[] = (plan.changes || []).map((c, idx) => ({
        id: `file-${idx + 1}`,
        filePath: c.path,
        fileName: c.path.split('/').pop() || c.path,
        type: (c.action as any) || 'modify',
        status: 'pending',
        language: c.path.endsWith('.ts') || c.path.endsWith('.tsx') ? 'typescript' : undefined,
        size: undefined,
        changes: [],
        preview: { modified: c.content || c.diff || '', diff: [], original: undefined },
        metadata: { linesAdded: 0, linesRemoved: 0, linesModified: 0, complexity: 'low', confidence: 0.8, estimatedTime: 15000 },
        dependencies: [],
        warnings: [],
        suggestions: [],
      }));

      const view: ChangesetViewModel = {
        id: plan.id,
        title: 'Planned Multi-file Changes',
        description: plan.description,
        files: filesVm,
        status: plan.status === 'ready' ? 'ready' : 'draft',
        createdAt: new Date(),
        estimatedDuration: 120000,
        metadata: {
          totalLinesAdded: filesVm.reduce((sum) => sum + 0, 0),
          totalLinesRemoved: 0,
          totalFilesChanged: filesVm.length,
          overallConfidence: 0.85,
          riskLevel: ((() => {
            const r = plan.impact?.riskLevel || 'medium';
            return r === 'critical' ? 'high' : (r as 'low' | 'medium' | 'high');
          })()),
        }
      };
      setChangeset(view);
    } catch (e: any) {
      setError(e?.message || 'Failed to plan changes');
    } finally {
      setLoading(false);
    }
  };

  const applySelected = async (_fileIds: string[]) => {
    try {
      await multiFileAgent.apply();
    } catch (e: any) {
      setError(e?.message || 'Failed to apply changes');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mfa-desc">Task Description</Label>
              <Input id="mfa-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the multi-file task" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mfa-files">Files (comma-separated)</Label>
              <Input id="mfa-files" value={fileList} onChange={(e) => setFileList(e.target.value)} placeholder="/path/a.ts, /path/b.tsx" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={planChanges} disabled={loading}>{loading ? 'Planning…' : 'Plan Changes'}</Button>
            {changeset && (
              <Badge variant="outline">{changeset.files.length} files</Badge>
            )}
          </div>
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {changeset && (
        <MultiFilePreview
          changeset={changeset as any}
          onApplyChanges={applySelected}
          onRejectChanges={() => {}}
          onModifyChange={() => {}}
          onPreviewModeChange={() => {}}
        />
      )}
    </div>
  );
}
