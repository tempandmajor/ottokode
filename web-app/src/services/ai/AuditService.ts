import { createClient } from '@/lib/supabase';

export interface PatchAuditEntry {
  id?: string;
  user_id?: string;
  file_path: string;
  diff_hash: string;
  applied_hunks: Array<{
    hunk_id: string;
    lines_added: number;
    lines_removed: number;
    applied_at: string;
  }>;
  notes?: string;
  created_at?: string;
}

export interface CreateAuditParams {
  filePath: string;
  unifiedDiff: string;
  notes?: string;
}

export class AuditService {
  private static async generateDiffHash(diff: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(diff);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private static parseHunksFromDiff(diff: string): Array<{
    hunk_id: string;
    lines_added: number;
    lines_removed: number;
    applied_at: string;
  }> {
    const hunks = [];
    const lines = diff.split('\n');
    let hunkIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('@@')) {
        hunkIndex++;
        let linesAdded = 0;
        let linesRemoved = 0;

        // Count added/removed lines in this hunk
        for (let j = i + 1; j < lines.length; j++) {
          const hunkLine = lines[j];
          if (hunkLine.startsWith('@@')) break; // Next hunk

          if (hunkLine.startsWith('+') && !hunkLine.startsWith('+++')) {
            linesAdded++;
          } else if (hunkLine.startsWith('-') && !hunkLine.startsWith('---')) {
            linesRemoved++;
          }
        }

        hunks.push({
          hunk_id: `hunk_${hunkIndex}`,
          lines_added: linesAdded,
          lines_removed: linesRemoved,
          applied_at: new Date().toISOString()
        });
      }
    }

    return hunks;
  }

  static async createAuditEntry(params: CreateAuditParams): Promise<PatchAuditEntry | null> {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.warn('Cannot create audit entry: user not authenticated');
        return null;
      }

      const diffHash = await this.generateDiffHash(params.unifiedDiff);
      const appliedHunks = this.parseHunksFromDiff(params.unifiedDiff);

      const auditEntry: Omit<PatchAuditEntry, 'id' | 'created_at'> = {
        user_id: user.id,
        file_path: params.filePath,
        diff_hash: diffHash,
        applied_hunks: appliedHunks,
        notes: params.notes
      };

      const { data, error } = await supabase
        .from('ai_patch_audit')
        .insert(auditEntry)
        .select()
        .single();

      if (error) {
        console.error('Failed to create audit entry:', error);
        return null;
      }

      return data as PatchAuditEntry;
    } catch (error) {
      console.error('Error creating audit entry:', error);
      return null;
    }
  }

  static async getAuditHistory(filePath?: string, limit = 50): Promise<PatchAuditEntry[]> {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return [];
      }

      let query = supabase
        .from('ai_patch_audit')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filePath) {
        query = query.eq('file_path', filePath);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch audit history:', error);
        return [];
      }

      return data as PatchAuditEntry[];
    } catch (error) {
      console.error('Error fetching audit history:', error);
      return [];
    }
  }

  static async getAuditStats(): Promise<{
    totalPatches: number;
    totalHunks: number;
    totalLinesAdded: number;
    totalLinesRemoved: number;
  }> {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { totalPatches: 0, totalHunks: 0, totalLinesAdded: 0, totalLinesRemoved: 0 };
      }

      const { data, error } = await supabase
        .from('ai_patch_audit')
        .select('applied_hunks')
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to fetch audit stats:', error);
        return { totalPatches: 0, totalHunks: 0, totalLinesAdded: 0, totalLinesRemoved: 0 };
      }

      let totalHunks = 0;
      let totalLinesAdded = 0;
      let totalLinesRemoved = 0;

      data.forEach((entry: any) => {
        const hunks = entry.applied_hunks as Array<{
          lines_added: number;
          lines_removed: number;
        }>;

        totalHunks += hunks.length;
        hunks.forEach((hunk) => {
          totalLinesAdded += hunk.lines_added;
          totalLinesRemoved += hunk.lines_removed;
        });
      });

      return {
        totalPatches: data.length,
        totalHunks,
        totalLinesAdded,
        totalLinesRemoved
      };
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      return { totalPatches: 0, totalHunks: 0, totalLinesAdded: 0, totalLinesRemoved: 0 };
    }
  }
}