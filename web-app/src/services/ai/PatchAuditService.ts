import { createClient } from '../../lib/supabase';
import type { DiffHunk } from '../../components/ai/diff-viewer/types';

export interface PatchAuditEntry {
  id?: string;
  user_id: string;
  file_path: string;
  action: 'apply' | 'reject' | 'propose';
  diff_content: string;
  hunks_applied?: string[];
  provider?: string;
  model?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export class PatchAuditService {
  private supabase = createClient();

  /**
   * Log when a patch is proposed by AI
   */
  async logPatchProposal(
    filePath: string,
    diffContent: string,
    provider?: string,
    model?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const entry: Omit<PatchAuditEntry, 'id' | 'created_at'> = {
      user_id: user.id,
      file_path: filePath,
      action: 'propose',
      diff_content: diffContent,
      provider,
      model,
      metadata: {
        ...metadata,
        proposal_timestamp: new Date().toISOString(),
      },
    };

    const { error } = await this.supabase
      .from('ai_patch_audit')
      .insert([entry]);

    if (error) {
      console.error('Failed to log patch proposal:', error);
      throw error;
    }
  }

  /**
   * Log when hunks are applied to a file
   */
  async logPatchApplication(
    filePath: string,
    appliedHunks: DiffHunk[],
    originalDiffContent: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const hunkIds = appliedHunks.map(h => h.id);
    const appliedDiffContent = this.reconstructDiffFromHunks(appliedHunks);

    const entry: Omit<PatchAuditEntry, 'id' | 'created_at'> = {
      user_id: user.id,
      file_path: filePath,
      action: 'apply',
      diff_content: appliedDiffContent,
      hunks_applied: hunkIds,
      metadata: {
        ...metadata,
        original_diff_length: originalDiffContent.length,
        applied_hunks_count: appliedHunks.length,
        application_timestamp: new Date().toISOString(),
      },
    };

    const { error } = await this.supabase
      .from('ai_patch_audit')
      .insert([entry]);

    if (error) {
      console.error('Failed to log patch application:', error);
      throw error;
    }
  }

  /**
   * Log when hunks are rejected
   */
  async logPatchRejection(
    filePath: string,
    rejectedHunks: DiffHunk[],
    originalDiffContent: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const hunkIds = rejectedHunks.map(h => h.id);
    const rejectedDiffContent = this.reconstructDiffFromHunks(rejectedHunks);

    const entry: Omit<PatchAuditEntry, 'id' | 'created_at'> = {
      user_id: user.id,
      file_path: filePath,
      action: 'reject',
      diff_content: rejectedDiffContent,
      hunks_applied: hunkIds,
      metadata: {
        ...metadata,
        original_diff_length: originalDiffContent.length,
        rejected_hunks_count: rejectedHunks.length,
        rejection_timestamp: new Date().toISOString(),
      },
    };

    const { error } = await this.supabase
      .from('ai_patch_audit')
      .insert([entry]);

    if (error) {
      console.error('Failed to log patch rejection:', error);
      throw error;
    }
  }

  /**
   * Get audit history for a file
   */
  async getFileAuditHistory(filePath: string): Promise<PatchAuditEntry[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .from('ai_patch_audit')
      .select('*')
      .eq('file_path', filePath)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch audit history:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get recent audit activity for the user
   */
  async getRecentActivity(limit: number = 50): Promise<PatchAuditEntry[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .from('ai_patch_audit')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch recent activity:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get audit statistics for the user
   */
  async getAuditStats(): Promise<{
    totalProposals: number;
    totalApplications: number;
    totalRejections: number;
    uniqueFiles: number;
  }> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Use RPC function for efficient stats calculation
    const { data, error } = await this.supabase
      .rpc('get_user_patch_stats', { user_id: user.id });

    if (error) {
      console.error('Failed to fetch audit stats:', error);
      // Fallback to basic queries if RPC fails
      return this.getAuditStatsFallback(user.id);
    }

    return data || {
      totalProposals: 0,
      totalApplications: 0,
      totalRejections: 0,
      uniqueFiles: 0,
    };
  }

  /**
   * Fallback method to get stats using basic queries
   */
  private async getAuditStatsFallback(userId: string) {
    const { data } = await this.supabase
      .from('ai_patch_audit')
      .select('action, file_path')
      .eq('user_id', userId);

    if (!data) {
      return {
        totalProposals: 0,
        totalApplications: 0,
        totalRejections: 0,
        uniqueFiles: 0,
      };
    }

    const uniqueFiles = new Set(data.map(d => d.file_path)).size;
    const stats = data.reduce((acc, entry) => {
      switch (entry.action) {
        case 'propose':
          acc.totalProposals++;
          break;
        case 'apply':
          acc.totalApplications++;
          break;
        case 'reject':
          acc.totalRejections++;
          break;
      }
      return acc;
    }, {
      totalProposals: 0,
      totalApplications: 0,
      totalRejections: 0,
      uniqueFiles,
    });

    return stats;
  }

  /**
   * Reconstruct diff content from selected hunks
   */
  private reconstructDiffFromHunks(hunks: DiffHunk[]): string {
    const lines = [];

    for (const hunk of hunks) {
      // Add hunk header
      lines.push(hunk.header);

      // Add hunk lines
      for (const line of hunk.lines) {
        const prefix = line.type === 'remove' ? '-' :
                      line.type === 'add' ? '+' : ' ';
        lines.push(prefix + line.content);
      }
    }

    return lines.join('\n');
  }
}

// Export singleton instance
export const patchAuditService = new PatchAuditService();