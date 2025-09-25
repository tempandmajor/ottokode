import { EventEmitter } from '../../utils/EventEmitter';
import { agentOrchestrator, Task, TaskResult, FileChange } from './AgentOrchestrator';
import { codebaseIndexer } from '../indexing/CodebaseIndexer';
import { dependencyMapper } from '../analysis/DependencyMapper';
import { contextRetriever, ContextResponse } from '../context/ContextRetriever';
import { aiService } from '../ai/ResponsesAIService';

export interface MultiFileOperationPlan {
  id: string;
  description: string;
  files: string[];
  changes: FileChange[];
  impact?: {
    affectedFiles: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    requiredTests: string[];
  };
  context?: ContextResponse;
  status: 'planned' | 'validating' | 'ready' | 'applying' | 'completed' | 'failed';
  errors?: string[];
}

export class MultiFileAgent extends EventEmitter {
  private currentPlan: MultiFileOperationPlan | null = null;

  async plan(description: string, files: string[]): Promise<MultiFileOperationPlan> {
    // Ensure files are indexed
    const missing = files.filter((f) => !codebaseIndexer.getIndexedFile(f));
    if (missing.length) {
      await codebaseIndexer.indexCodebase(process.cwd(), { includePatterns: ['**/*'] });
    }

    const context = await contextRetriever.retrieveContext({
      id: `ctx_${Date.now()}`,
      type: 'task_context',
      query: description,
      focusFile: files[0],
      timestamp: new Date(),
      maxFiles: 10,
      depth: 2,
    });

    // Let AI propose a changeset outline
    const proposal = await aiService.complete([
      { role: 'system', content: 'You are a senior software engineer planning atomic multi-file edits.' },
      { role: 'user', content: `Task: ${description}\nFiles: ${files.join(', ')}\nProvide a JSON array of file changes with path and a short action description.` },
    ], { model: 'gpt-5', temperature: 0.2, maxTokens: 800 });

    let changes: FileChange[] = [];
    try {
      const parsed = JSON.parse(proposal.content);
      if (Array.isArray(parsed)) {
        changes = parsed.map((c) => ({
          path: c.path || c.filePath,
          action: (c.action || 'modify'),
          diff: c.diff,
          content: c.content,
        }));
      }
    } catch {
      // Fallback to empty planned changes; user will refine
      changes = [];
    }

    // Impact analysis (best effort)
    const impactFiles = Array.from(new Set([
      ...files,
      ...changes.map((c) => c.path).filter(Boolean) as string[],
    ]));

    const impact = await dependencyMapper.analyzeImpact(impactFiles[0] || files[0], 'modify');

    const plan: MultiFileOperationPlan = {
      id: `mfo_${Date.now()}`,
      description,
      files,
      changes,
      impact: {
        affectedFiles: impact.affectedFiles,
        riskLevel: impact.riskLevel,
        requiredTests: impact.requiredTests,
      },
      context,
      status: 'planned',
    };

    this.currentPlan = plan;
    this.emit('planCreated', plan);
    return plan;
  }

  async validate(plan?: MultiFileOperationPlan): Promise<MultiFileOperationPlan> {
    const p = plan || this.currentPlan;
    if (!p) throw new Error('No plan to validate');

    p.status = 'validating';
    this.emit('planStatus', { id: p.id, status: p.status });

    // Basic validations
    const errors: string[] = [];
    for (const ch of p.changes) {
      if (!ch.path) errors.push('Change missing path');
      if (!['create', 'modify', 'delete', 'rename', 'move'].includes(ch.action)) {
        errors.push(`Invalid action for ${ch.path}: ${ch.action}`);
      }
    }

    if (errors.length) {
      p.status = 'failed';
      p.errors = errors;
    } else {
      p.status = 'ready';
    }

    this.emit('planValidated', p);
    return p;
  }

  async apply(planId?: string): Promise<TaskResult> {
    const p = this.currentPlan && (!planId || this.currentPlan.id === planId) ? this.currentPlan : null;
    if (!p) throw new Error('No plan to apply');
    if (p.status !== 'ready') throw new Error(`Plan ${p.id} is not ready (status: ${p.status})`);

    // Route through orchestrator as a multi_file_operation
    const taskId = await agentOrchestrator.createTask({
      type: 'multi_file_operation',
      description: p.description,
      context: {
        language: 'typescript',
        files: p.files,
        projectPath: process.cwd(),
      },
      priority: 'high',
      requiredCapabilities: ['multi_file_operations'],
    });

    p.status = 'applying';
    this.emit('planStatus', { id: p.id, status: p.status, taskId });

    const result = await agentOrchestrator.executeTask(taskId);

    p.status = result.success ? 'completed' : 'failed';
    if (!result.success) p.errors = result.errors;
    this.emit('planCompleted', { plan: p, result });
    return result;
  }

  getCurrentPlan(): MultiFileOperationPlan | null { return this.currentPlan; }
  clear(): void { this.currentPlan = null; }
}

export const multiFileAgent = new MultiFileAgent();
