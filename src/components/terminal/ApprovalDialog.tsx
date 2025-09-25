"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../web-app/src/components/ui/dialog';
import { Button } from '../../../web-app/src/components/ui/button';
import { Badge } from '../../../web-app/src/components/ui/badge';

export interface ApprovalDialogProps {
  open: boolean;
  command: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason?: string;
  onApprove: () => void;
  onCancel: () => void;
}

const RISK_COLOR: Record<ApprovalDialogProps['riskLevel'], string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export function ApprovalDialog({ open, command, riskLevel, reason, onApprove, onCancel }: ApprovalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Approve Command</DialogTitle>
          <DialogDescription>
            This command requires your approval. Review the details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Risk</span>
            <Badge variant="outline" className={RISK_COLOR[riskLevel]}>
              {riskLevel}
            </Badge>
          </div>

          {reason && (
            <div className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded p-2">
              {reason}
            </div>
          )}

          <div className="text-sm">
            <div className="text-muted-foreground mb-1">Command</div>
            <pre className="p-3 bg-gray-50 rounded border overflow-x-auto text-sm">
{command}
            </pre>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onApprove}>Approve & Run</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
