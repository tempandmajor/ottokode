import { invoke } from '@tauri-apps/api/core';
import { AuditService } from '../ai/AuditService';

export interface ApplyPatchResult {
  success: boolean;
  message: string;
  backup_path?: string;
}

export class TauriPatchService {
  static async applyPatchWithBackup(filePath: string, unifiedDiff: string, notes?: string): Promise<ApplyPatchResult> {
    try {
      const result = await invoke<ApplyPatchResult>('apply_patch_with_backup', {
        filePath,
        unifiedDiff
      });

      // If patch was applied successfully, create audit entry
      if (result.success) {
        await AuditService.createAuditEntry({
          filePath,
          unifiedDiff,
          notes: notes || `Patch applied successfully. ${result.backup_path ? `Backup: ${result.backup_path}` : ''}`
        });
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to apply patch'
      };
    }
  }

  static async restoreFromBackup(filePath: string, backupPath: string): Promise<ApplyPatchResult> {
    try {
      const result = await invoke<ApplyPatchResult>('restore_from_backup', {
        filePath,
        backupPath
      });

      // If restoration was successful, create audit entry
      if (result.success) {
        await AuditService.createAuditEntry({
          filePath,
          unifiedDiff: '', // No diff for restore operation
          notes: `File restored from backup: ${backupPath}`
        });
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to restore from backup'
      };
    }
  }
}