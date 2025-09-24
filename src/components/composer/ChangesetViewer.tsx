import React, { useState, useCallback, useMemo, useRef } from 'react';
import { dependencyMapper, ImpactAnalysis } from '../../services/analysis/DependencyMapper';
import { FileChange } from '../../services/agents/AgentOrchestrator';
import './ChangesetViewer.css';

export interface AtomicChangeset {
  id: string;
  description: string;
  changes: AtomicFileChange[];
  dependencies: ChangesetDependency[];
  impactAnalysis: ImpactAnalysis;
  status: 'pending' | 'validating' | 'ready' | 'applying' | 'completed' | 'failed' | 'rolled_back';
  validation: ValidationResult;
  rollbackPlan: RollbackStep[];
  metadata: ChangesetMetadata;
  createdAt: Date;
  appliedAt?: Date;
}

export interface AtomicFileChange extends FileChange {
  id: string;
  originalContent?: string;
  newContent?: string;
  changeType: 'create' | 'modify' | 'delete' | 'rename' | 'move';
  language?: string;
  byteSize: number;
  linesAdded: number;
  linesRemoved: number;
  conflicted: boolean;
  approved: boolean;
  validationErrors: string[];
  dependsOn: string[];
  affectsTests: boolean;
}

export interface ChangesetDependency {
  type: 'sequential' | 'parallel' | 'conditional';
  sourceChange: string;
  targetChange: string;
  reason: string;
  optional: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
  confidence: number;
  estimatedDuration: number;
}

export interface ValidationError {
  type: 'syntax' | 'type' | 'reference' | 'test' | 'build' | 'security';
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line?: number;
  column?: number;
  fixable: boolean;
  suggestedFix?: string;
}

export interface ValidationWarning {
  type: 'performance' | 'maintainability' | 'security' | 'compatibility';
  message: string;
  file: string;
  line?: number;
  impact: 'low' | 'medium' | 'high';
}

export interface RollbackStep {
  order: number;
  action: 'restore_file' | 'delete_file' | 'run_command' | 'revert_database';
  target: string;
  parameters: Record<string, any>;
  description: string;
  automatic: boolean;
}

export interface ChangesetMetadata {
  author: string;
  branch?: string;
  commitMessage?: string;
  tags: string[];
  relatedIssues: string[];
  reviewers: string[];
  complexity: 'low' | 'medium' | 'high' | 'very_high';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  testingRequired: boolean;
  deploymentNotes?: string;
}

export interface ChangesetViewerProps {
  changeset: AtomicChangeset;
  onValidate: () => Promise<void>;
  onApply: () => Promise<void>;
  onRollback: () => Promise<void>;
  onApproveChange: (changeId: string) => void;
  onRejectChange: (changeId: string, reason: string) => void;
  onPreview: (changeId: string) => void;
  onClose?: () => void;
  readOnly?: boolean;
  showDiff?: boolean;
}

export const ChangesetViewer: React.FC<ChangesetViewerProps> = ({
  changeset,
  onValidate,
  onApply,
  onRollback,
  onApproveChange,
  onRejectChange,
  onPreview,
  onClose,
  readOnly = false,
  showDiff = true
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'changes' | 'impact' | 'validation' | 'rollback'>('overview');
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'tree' | 'timeline'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'conflicted'>('all');
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState<string | null>(null);

  const summaryStats = useMemo(() => ({
    totalChanges: changeset.changes.length,
    approved: changeset.changes.filter(c => c.approved).length,
    conflicted: changeset.changes.filter(c => c.conflicted).length,
    created: changeset.changes.filter(c => c.changeType === 'create').length,
    modified: changeset.changes.filter(c => c.changeType === 'modify').length,
    deleted: changeset.changes.filter(c => c.changeType === 'delete').length,
    totalLinesAdded: changeset.changes.reduce((sum, c) => sum + c.linesAdded, 0),
    totalLinesRemoved: changeset.changes.reduce((sum, c) => sum + c.linesRemoved, 0)
  }), [changeset.changes]);

  const filteredChanges = useMemo(() => {
    return changeset.changes.filter(change => {
      switch (filterStatus) {
        case 'approved': return change.approved;
        case 'pending': return !change.approved && !change.conflicted;
        case 'conflicted': return change.conflicted;
        default: return true;
      }
    });
  }, [changeset.changes, filterStatus]);

  const handleChangeToggle = useCallback((changeId: string) => {
    setSelectedChanges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(changeId)) {
        newSet.delete(changeId);
      } else {
        newSet.add(changeId);
      }
      return newSet;
    });
  }, []);

  const handleExpandToggle = useCallback((changeId: string) => {
    setExpandedChanges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(changeId)) {
        newSet.delete(changeId);
      } else {
        newSet.add(changeId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedChanges(new Set(filteredChanges.map(c => c.id)));
  }, [filteredChanges]);

  const handleDeselectAll = useCallback(() => {
    setSelectedChanges(new Set());
  }, []);

  const renderOverviewTab = () => (
    <div className="changeset-overview">
      <div className="overview-header">
        <div className="changeset-title">
          <h3>{changeset.description}</h3>
          <div className={`status-badge ${changeset.status}`}>
            {changeset.status.replace('_', ' ')}
          </div>
        </div>

        <div className="changeset-metadata">
          <div className="metadata-item">
            <span className="label">Author:</span>
            <span className="value">{changeset.metadata.author}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Created:</span>
            <span className="value">{changeset.createdAt.toLocaleDateString()}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Complexity:</span>
            <span className={`complexity ${changeset.metadata.complexity}`}>
              {changeset.metadata.complexity}
            </span>
          </div>
          <div className="metadata-item">
            <span className="label">Risk Level:</span>
            <span className={`risk-level ${changeset.metadata.riskLevel}`}>
              {changeset.metadata.riskLevel}
            </span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon changes">📝</div>
          <div className="stat-content">
            <div className="stat-value">{summaryStats.totalChanges}</div>
            <div className="stat-label">Total Changes</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon approved">✅</div>
          <div className="stat-content">
            <div className="stat-value">{summaryStats.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon conflicted">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{summaryStats.conflicted}</div>
            <div className="stat-label">Conflicted</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon lines">📊</div>
          <div className="stat-content">
            <div className="stat-value">
              +{summaryStats.totalLinesAdded} -{summaryStats.totalLinesRemoved}
            </div>
            <div className="stat-label">Line Changes</div>
          </div>
        </div>
      </div>

      <div className="change-breakdown">
        <h4>Change Breakdown</h4>
        <div className="breakdown-items">
          <div className="breakdown-item created">
            <div className="breakdown-icon">✨</div>
            <div className="breakdown-label">Created</div>
            <div className="breakdown-count">{summaryStats.created}</div>
          </div>
          <div className="breakdown-item modified">
            <div className="breakdown-icon">📝</div>
            <div className="breakdown-label">Modified</div>
            <div className="breakdown-count">{summaryStats.modified}</div>
          </div>
          <div className="breakdown-item deleted">
            <div className="breakdown-icon">🗑️</div>
            <div className="breakdown-label">Deleted</div>
            <div className="breakdown-count">{summaryStats.deleted}</div>
          </div>
        </div>
      </div>

      {changeset.metadata.tags.length > 0 && (
        <div className="changeset-tags">
          <h4>Tags</h4>
          <div className="tags-list">
            {changeset.metadata.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderChangesTab = () => (
    <div className="changes-tab">
      <div className="changes-header">
        <div className="view-controls">
          <div className="view-modes">
            <button
              className={`btn btn-ghost ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              📋 List
            </button>
            <button
              className={`btn btn-ghost ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={() => setViewMode('tree')}
            >
              🌳 Tree
            </button>
            <button
              className={`btn btn-ghost ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              ⏱️ Timeline
            </button>
          </div>

          <div className="filter-controls">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">All Changes</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="conflicted">Conflicted</option>
            </select>
          </div>

          <div className="selection-controls">
            {selectedChanges.size > 0 && (
              <span className="selection-count">
                {selectedChanges.size} selected
              </span>
            )}
            <button className="btn btn-ghost" onClick={handleSelectAll}>
              Select All
            </button>
            <button className="btn btn-ghost" onClick={handleDeselectAll}>
              Deselect All
            </button>
          </div>
        </div>
      </div>

      <div className="changes-list">
        {filteredChanges.map(change => (
          <ChangeItem
            key={change.id}
            change={change}
            isSelected={selectedChanges.has(change.id)}
            isExpanded={expandedChanges.has(change.id)}
            onToggleSelect={() => handleChangeToggle(change.id)}
            onToggleExpand={() => handleExpandToggle(change.id)}
            onApprove={() => onApproveChange(change.id)}
            onReject={(reason) => onRejectChange(change.id, reason)}
            onPreview={() => {
              setShowPreview(change.id);
              onPreview(change.id);
            }}
            readOnly={readOnly}
            showDiff={showDiff}
          />
        ))}
      </div>
    </div>
  );

  const renderImpactTab = () => (
    <div className="impact-tab">
      <div className="impact-overview">
        <div className="impact-stats">
          <div className="impact-stat">
            <div className="impact-label">Affected Files</div>
            <div className="impact-value">{changeset.impactAnalysis.affectedFiles.length}</div>
          </div>
          <div className="impact-stat">
            <div className="impact-label">Risk Level</div>
            <div className={`impact-value risk-${changeset.impactAnalysis.riskLevel}`}>
              {changeset.impactAnalysis.riskLevel}
            </div>
          </div>
          <div className="impact-stat">
            <div className="impact-label">Estimated Effort</div>
            <div className="impact-value">{changeset.impactAnalysis.estimatedEffort}h</div>
          </div>
        </div>

        <div className="propagation-paths">
          <h4>Change Propagation</h4>
          {changeset.impactAnalysis.propagationPaths.slice(0, 5).map((path, index) => (
            <div key={index} className="propagation-path">
              <div className="path-steps">
                {path.map((file, stepIndex) => (
                  <React.Fragment key={stepIndex}>
                    <div className="path-step">{file}</div>
                    {stepIndex < path.length - 1 && <div className="path-arrow">→</div>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="affected-files">
          <h4>Affected Files</h4>
          <div className="files-list">
            {changeset.impactAnalysis.affectedFiles.map(file => (
              <div key={file} className="affected-file">
                <div className="file-icon">📄</div>
                <div className="file-path">{file}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="required-tests">
          <h4>Required Tests</h4>
          <div className="tests-list">
            {changeset.impactAnalysis.requiredTests.map(test => (
              <div key={test} className="required-test">
                <div className="test-icon">🧪</div>
                <div className="test-path">{test}</div>
              </div>
            ))}
          </div>
        </div>

        {changeset.impactAnalysis.warnings.length > 0 && (
          <div className="impact-warnings">
            <h4>Warnings</h4>
            {changeset.impactAnalysis.warnings.map((warning, index) => (
              <div key={index} className="warning-item">
                <div className="warning-icon">⚠️</div>
                <div className="warning-message">{warning}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderValidationTab = () => (
    <div className="validation-tab">
      <div className="validation-status">
        <div className={`validation-badge ${changeset.validation.isValid ? 'valid' : 'invalid'}`}>
          {changeset.validation.isValid ? '✅ Valid' : '❌ Invalid'}
        </div>
        <div className="validation-confidence">
          Confidence: {Math.round(changeset.validation.confidence * 100)}%
        </div>
      </div>

      {changeset.validation.errors.length > 0 && (
        <div className="validation-errors">
          <h4>Errors ({changeset.validation.errors.length})</h4>
          {changeset.validation.errors.map((error, index) => (
            <div key={index} className={`validation-item error ${error.severity}`}>
              <div className="validation-icon">
                {error.severity === 'error' ? '❌' : error.severity === 'warning' ? '⚠️' : 'ℹ️'}
              </div>
              <div className="validation-content">
                <div className="validation-message">{error.message}</div>
                <div className="validation-location">
                  {error.file}
                  {error.line && `:${error.line}`}
                  {error.column && `:${error.column}`}
                </div>
                {error.suggestedFix && (
                  <div className="validation-fix">
                    <strong>Suggested fix:</strong> {error.suggestedFix}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {changeset.validation.warnings.length > 0 && (
        <div className="validation-warnings">
          <h4>Warnings ({changeset.validation.warnings.length})</h4>
          {changeset.validation.warnings.map((warning, index) => (
            <div key={index} className={`validation-item warning ${warning.impact}`}>
              <div className="validation-icon">⚠️</div>
              <div className="validation-content">
                <div className="validation-message">{warning.message}</div>
                <div className="validation-location">{warning.file}</div>
                <div className="validation-impact">Impact: {warning.impact}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {changeset.validation.suggestions.length > 0 && (
        <div className="validation-suggestions">
          <h4>Suggestions</h4>
          {changeset.validation.suggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-item">
              <div className="suggestion-icon">💡</div>
              <div className="suggestion-text">{suggestion}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRollbackTab = () => (
    <div className="rollback-tab">
      <div className="rollback-header">
        <h4>Rollback Plan</h4>
        <div className="rollback-info">
          {changeset.rollbackPlan.length} steps prepared for safe rollback
        </div>
      </div>

      <div className="rollback-steps">
        {changeset.rollbackPlan.map(step => (
          <div key={step.order} className="rollback-step">
            <div className="step-number">{step.order}</div>
            <div className="step-content">
              <div className="step-action">{step.action.replace(/_/g, ' ')}</div>
              <div className="step-description">{step.description}</div>
              <div className="step-target">{step.target}</div>
              {step.automatic && (
                <div className="step-automatic">
                  <span className="auto-badge">Auto</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="changeset-viewer">
      <div className="viewer-header">
        <div className="header-title">
          <h2>Changeset Review</h2>
          <div className="changeset-id">#{changeset.id}</div>
        </div>

        {onClose && (
          <button className="btn btn-ghost close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <div className="viewer-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab ${activeTab === 'changes' ? 'active' : ''}`}
          onClick={() => setActiveTab('changes')}
        >
          📝 Changes ({changeset.changes.length})
        </button>
        <button
          className={`tab ${activeTab === 'impact' ? 'active' : ''}`}
          onClick={() => setActiveTab('impact')}
        >
          🎯 Impact
        </button>
        <button
          className={`tab ${activeTab === 'validation' ? 'active' : ''}`}
          onClick={() => setActiveTab('validation')}
        >
          ✅ Validation
          {changeset.validation.errors.length > 0 && (
            <span className="error-count">{changeset.validation.errors.length}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'rollback' ? 'active' : ''}`}
          onClick={() => setActiveTab('rollback')}
        >
          ↩️ Rollback
        </button>
      </div>

      <div className="viewer-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'changes' && renderChangesTab()}
        {activeTab === 'impact' && renderImpactTab()}
        {activeTab === 'validation' && renderValidationTab()}
        {activeTab === 'rollback' && renderRollbackTab()}
      </div>

      {!readOnly && (
        <div className="viewer-actions">
          <button
            className="btn btn-secondary"
            onClick={onValidate}
            disabled={changeset.status === 'validating'}
          >
            {changeset.status === 'validating' ? 'Validating...' : '✅ Validate'}
          </button>

          <button
            className="btn btn-primary"
            onClick={onApply}
            disabled={!changeset.validation.isValid || changeset.status === 'applying'}
          >
            {changeset.status === 'applying' ? 'Applying...' : '🚀 Apply Changes'}
          </button>

          {changeset.status === 'completed' && (
            <button className="btn btn-warning" onClick={onRollback}>
              ↩️ Rollback
            </button>
          )}
        </div>
      )}

      {showPreview && (
        <div className="preview-overlay" onClick={() => setShowPreview(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3>Change Preview</h3>
              <button
                className="btn btn-ghost"
                onClick={() => setShowPreview(null)}
              >
                ✕
              </button>
            </div>
            <div className="preview-content">
              {/* Preview content would be rendered here */}
              <div className="preview-placeholder">
                Change preview for {showPreview}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Change Item Component
interface ChangeItemProps {
  change: AtomicFileChange;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onPreview: () => void;
  readOnly: boolean;
  showDiff: boolean;
}

const ChangeItem: React.FC<ChangeItemProps> = ({
  change,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  onApprove,
  onReject,
  onPreview,
  readOnly,
  showDiff
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const getChangeIcon = (changeType: string) => {
    const icons = {
      create: '✨',
      modify: '📝',
      delete: '🗑️',
      rename: '📝',
      move: '📁'
    };
    return icons[changeType as keyof typeof icons] || '📄';
  };

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(rejectReason);
      setShowRejectDialog(false);
      setRejectReason('');
    }
  };

  return (
    <div className={`change-item ${change.changeType} ${isSelected ? 'selected' : ''} ${change.conflicted ? 'conflicted' : ''}`}>
      <div className="change-header" onClick={onToggleExpand}>
        <div className="change-controls">
          {!readOnly && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className="expand-button">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>

        <div className="change-info">
          <div className="change-icon">{getChangeIcon(change.changeType)}</div>
          <div className="change-details">
            <div className="change-path">{change.path}</div>
            {change.previousPath && (
              <div className="change-previous">from: {change.previousPath}</div>
            )}
            <div className="change-meta">
              {change.language && (
                <span className="change-language">{change.language}</span>
              )}
              <span className="change-size">
                +{change.linesAdded} -{change.linesRemoved}
              </span>
              <span className="change-bytes">{change.byteSize} bytes</span>
            </div>
          </div>
        </div>

        <div className="change-status">
          {change.approved && <span className="status-approved">✅</span>}
          {change.conflicted && <span className="status-conflicted">⚠️</span>}
          {change.validationErrors.length > 0 && (
            <span className="status-errors">{change.validationErrors.length}❌</span>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="change-expanded">
          {change.validationErrors.length > 0 && (
            <div className="change-errors">
              <h5>Validation Errors</h5>
              {change.validationErrors.map((error, index) => (
                <div key={index} className="error-item">
                  {error}
                </div>
              ))}
            </div>
          )}

          {showDiff && change.originalContent && change.newContent && (
            <div className="change-diff">
              <div className="diff-header">
                <h5>Changes</h5>
                <button className="btn btn-ghost" onClick={onPreview}>
                  👁️ Preview
                </button>
              </div>
              {/* Diff content would be rendered here */}
              <div className="diff-placeholder">
                Diff view for {change.path}
              </div>
            </div>
          )}

          {!readOnly && (
            <div className="change-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={onApprove}
                disabled={change.approved}
              >
                ✅ Approve
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowRejectDialog(true)}
              >
                ❌ Reject
              </button>
            </div>
          )}

          {showRejectDialog && (
            <div className="reject-dialog">
              <div className="reject-content">
                <h5>Reject Change</h5>
                <textarea
                  placeholder="Reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="reject-textarea"
                />
                <div className="reject-actions">
                  <button className="btn btn-secondary" onClick={() => setShowRejectDialog(false)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleReject}
                    disabled={!rejectReason.trim()}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChangesetViewer;