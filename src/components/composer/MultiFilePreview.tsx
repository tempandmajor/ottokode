import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { FileChange } from '../../services/agents/AgentOrchestrator';
import './MultiFilePreview.css';

export interface FileChangeExtended extends FileChange {
  id: string;
  language?: string;
  originalContent?: string;
  newContent?: string;
  changeType: 'create' | 'modify' | 'delete' | 'rename';
  linesAdded?: number;
  linesRemoved?: number;
  conflicted?: boolean;
  approved?: boolean;
  previewExpanded?: boolean;
}

export interface ChangesetPreview {
  id: string;
  description: string;
  files: FileChangeExtended[];
  summary: {
    filesCreated: number;
    filesModified: number;
    filesDeleted: number;
    filesRenamed: number;
    totalLinesAdded: number;
    totalLinesRemoved: number;
  };
  risks: Array<{
    level: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    affectedFiles: string[];
  }>;
  dependencies: Array<{
    from: string;
    to: string;
    type: 'import' | 'reference' | 'inheritance';
  }>;
}

export interface MultiFilePreviewProps {
  changeset: ChangesetPreview;
  onApprove: (fileIds: string[]) => Promise<void>;
  onReject: (fileIds: string[], reason?: string) => Promise<void>;
  onApproveAll: () => Promise<void>;
  onRejectAll: (reason?: string) => Promise<void>;
  onClose?: () => void;
  readOnly?: boolean;
  showDiff?: boolean;
  allowPartialApproval?: boolean;
}

export const MultiFilePreview: React.FC<MultiFilePreviewProps> = ({
  changeset,
  onApprove,
  onReject,
  onApproveAll,
  onRejectAll,
  onClose,
  readOnly = false,
  showDiff = true,
  allowPartialApproval = true
}) => {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'tree' | 'diff'>('list');
  const [filterType, setFilterType] = useState<'all' | 'create' | 'modify' | 'delete' | 'rename'>('all');
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showRisks, setShowRisks] = useState(true);
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredFiles = useMemo(() => {
    let files = changeset.files;

    // Apply type filter
    if (filterType !== 'all') {
      files = files.filter(file => file.changeType === filterType);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      files = files.filter(file =>
        file.path.toLowerCase().includes(query) ||
        file.newContent?.toLowerCase().includes(query) ||
        file.originalContent?.toLowerCase().includes(query)
      );
    }

    return files;
  }, [changeset.files, filterType, searchQuery]);

  const sortedFiles = useMemo(() => {
    return [...filteredFiles].sort((a, b) => {
      // Sort by change type priority
      const typePriority = { create: 0, modify: 1, rename: 2, delete: 3 };
      const aPriority = typePriority[a.changeType];
      const bPriority = typePriority[b.changeType];

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Then sort alphabetically
      return a.path.localeCompare(b.path);
    });
  }, [filteredFiles]);

  const selectedFilesList = useMemo(() => {
    return Array.from(selectedFiles);
  }, [selectedFiles]);

  const handleFileToggle = useCallback((fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedFiles(new Set(sortedFiles.map(f => f.id)));
  }, [sortedFiles]);

  const handleDeselectAll = useCallback(() => {
    setSelectedFiles(new Set());
  }, []);

  const handleExpandFile = useCallback((fileId: string) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  }, []);

  const handleApproveSelected = useCallback(async () => {
    if (selectedFilesList.length === 0) return;

    setProcessingFiles(new Set(selectedFilesList));
    try {
      await onApprove(selectedFilesList);
      setSelectedFiles(new Set());
    } finally {
      setProcessingFiles(new Set());
    }
  }, [selectedFilesList, onApprove]);

  const handleRejectSelected = useCallback(async (reason?: string) => {
    if (selectedFilesList.length === 0) return;

    setProcessingFiles(new Set(selectedFilesList));
    try {
      await onReject(selectedFilesList, reason);
      setSelectedFiles(new Set());
    } finally {
      setProcessingFiles(new Set());
    }
  }, [selectedFilesList, onReject]);

  const handleScrollToFile = useCallback((fileId: string) => {
    const element = document.getElementById(`file-${fileId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const getRiskLevel = useCallback((file: FileChangeExtended): 'low' | 'medium' | 'high' | 'critical' => {
    // Determine risk level based on file type and changes
    if (file.changeType === 'delete') return 'high';
    if (file.path.includes('config') || file.path.includes('package.json')) return 'medium';
    if (file.path.includes('test') || file.path.includes('spec')) return 'low';
    if ((file.linesRemoved || 0) > (file.linesAdded || 0) * 2) return 'medium';
    return 'low';
  }, []);

  const renderFileSummary = useCallback(() => (
    <div className="changeset-summary">
      <div className="summary-stats">
        <div className="stat-item">
          <div className="stat-icon create">+</div>
          <div className="stat-details">
            <div className="stat-value">{changeset.summary.filesCreated}</div>
            <div className="stat-label">Created</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon modify">~</div>
          <div className="stat-details">
            <div className="stat-value">{changeset.summary.filesModified}</div>
            <div className="stat-label">Modified</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon delete">-</div>
          <div className="stat-details">
            <div className="stat-value">{changeset.summary.filesDeleted}</div>
            <div className="stat-label">Deleted</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon rename">→</div>
          <div className="stat-details">
            <div className="stat-value">{changeset.summary.filesRenamed}</div>
            <div className="stat-label">Renamed</div>
          </div>
        </div>
      </div>

      <div className="summary-lines">
        <div className="lines-added">
          +{changeset.summary.totalLinesAdded} lines
        </div>
        <div className="lines-removed">
          -{changeset.summary.totalLinesRemoved} lines
        </div>
      </div>
    </div>
  ), [changeset.summary]);

  const renderRisks = useCallback(() => {
    if (!showRisks || changeset.risks.length === 0) return null;

    return (
      <div className="risks-section">
        <div className="risks-header">
          <h3>⚠️ Potential Risks</h3>
          <button
            className="btn btn-ghost toggle-risks"
            onClick={() => setShowRisks(!showRisks)}
          >
            {showRisks ? 'Hide' : 'Show'}
          </button>
        </div>

        <div className="risks-list">
          {changeset.risks.map((risk, index) => (
            <div key={index} className={`risk-item ${risk.level}`}>
              <div className="risk-header">
                <div className="risk-level">{getRiskIcon(risk.level)}</div>
                <div className="risk-message">{risk.message}</div>
              </div>
              {risk.affectedFiles.length > 0 && (
                <div className="risk-files">
                  Affects: {risk.affectedFiles.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }, [showRisks, changeset.risks]);

  const renderFileItem = useCallback((file: FileChangeExtended) => {
    const isSelected = selectedFiles.has(file.id);
    const isExpanded = expandedFiles.has(file.id);
    const isProcessing = processingFiles.has(file.id);
    const riskLevel = getRiskLevel(file);

    return (
      <div
        key={file.id}
        id={`file-${file.id}`}
        className={`file-item ${file.changeType} ${isSelected ? 'selected' : ''} ${isProcessing ? 'processing' : ''}`}
      >
        <div className="file-header" onClick={() => handleExpandFile(file.id)}>
          <div className="file-controls">
            {allowPartialApproval && !readOnly && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleFileToggle(file.id)}
                onClick={(e) => e.stopPropagation()}
                className="file-checkbox"
              />
            )}

            <div className="file-expand-button">
              {isExpanded ? '▼' : '▶'}
            </div>
          </div>

          <div className="file-info">
            <div className="file-path-container">
              <div className="file-change-type">
                {getChangeTypeIcon(file.changeType)}
              </div>
              <div className="file-path">{file.path}</div>
              {file.previousPath && (
                <div className="file-previous-path">
                  from: {file.previousPath}
                </div>
              )}
            </div>

            <div className="file-meta">
              {file.language && (
                <div className="file-language">{file.language}</div>
              )}
              {(file.linesAdded || file.linesRemoved) && (
                <div className="file-changes">
                  {file.linesAdded && <span className="lines-added">+{file.linesAdded}</span>}
                  {file.linesRemoved && <span className="lines-removed">-{file.linesRemoved}</span>}
                </div>
              )}
              <div className={`risk-indicator ${riskLevel}`}>
                {getRiskIcon(riskLevel)}
              </div>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="file-content">
            {file.changeType === 'delete' ? (
              <div className="file-deleted">
                <div className="deleted-message">This file will be deleted</div>
                {file.originalContent && showDiff && (
                  <div className="deleted-content">
                    <pre><code>{file.originalContent}</code></pre>
                  </div>
                )}
              </div>
            ) : file.changeType === 'create' ? (
              <div className="file-created">
                {file.newContent && (
                  <div className="created-content">
                    <pre><code>{file.newContent}</code></pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="file-diff">
                {showDiff && file.originalContent && file.newContent ? (
                  <DiffViewer
                    original={file.originalContent}
                    modified={file.newContent}
                    language={file.language || 'text'}
                  />
                ) : (
                  <div className="content-preview">
                    {file.newContent && (
                      <pre><code>{file.newContent.substring(0, 1000)}...</code></pre>
                    )}
                  </div>
                )}
              </div>
            )}

            {!readOnly && (
              <div className="file-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onApprove([file.id])}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Approve'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onReject([file.id])}
                  disabled={isProcessing}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }, [selectedFiles, expandedFiles, processingFiles, allowPartialApproval, readOnly, showDiff, handleExpandFile, handleFileToggle, getRiskLevel, onApprove, onReject]);

  return (
    <div className="multi-file-preview">
      <div className="preview-header">
        <div className="header-left">
          <h2>📋 Change Preview</h2>
          <div className="changeset-description">{changeset.description}</div>
        </div>

        <div className="header-actions">
          {onClose && (
            <button className="btn btn-ghost" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </div>

      {renderFileSummary()}
      {renderRisks()}

      <div className="preview-controls">
        <div className="controls-left">
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
              className={`btn btn-ghost ${viewMode === 'diff' ? 'active' : ''}`}
              onClick={() => setViewMode('diff')}
            >
              📊 Diff
            </button>
          </div>

          <div className="filter-controls">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">All Changes</option>
              <option value="create">Created</option>
              <option value="modify">Modified</option>
              <option value="delete">Deleted</option>
              <option value="rename">Renamed</option>
            </select>

            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="controls-right">
          {allowPartialApproval && selectedFiles.size > 0 && (
            <div className="selection-controls">
              <span className="selection-count">
                {selectedFiles.size} of {sortedFiles.length} selected
              </span>
              <button className="btn btn-ghost" onClick={handleSelectAll}>
                Select All
              </button>
              <button className="btn btn-ghost" onClick={handleDeselectAll}>
                Deselect All
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="preview-content" ref={scrollContainerRef}>
        <div className="files-list">
          {sortedFiles.map(renderFileItem)}

          {sortedFiles.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-message">
                {searchQuery || filterType !== 'all'
                  ? 'No files match your filter criteria'
                  : 'No files to preview'
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {!readOnly && (
        <div className="preview-actions">
          <div className="actions-left">
            {allowPartialApproval && selectedFiles.size > 0 ? (
              <>
                <button
                  className="btn btn-primary"
                  onClick={handleApproveSelected}
                  disabled={processingFiles.size > 0}
                >
                  Approve Selected ({selectedFiles.size})
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleRejectSelected()}
                  disabled={processingFiles.size > 0}
                >
                  Reject Selected
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-primary"
                  onClick={onApproveAll}
                  disabled={processingFiles.size > 0}
                >
                  ✅ Approve All Changes
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => onRejectAll()}
                  disabled={processingFiles.size > 0}
                >
                  ❌ Reject All Changes
                </button>
              </>
            )}
          </div>

          <div className="actions-right">
            <div className="risk-summary">
              {changeset.risks.filter(r => r.level === 'critical' || r.level === 'high').length > 0 && (
                <div className="high-risk-warning">
                  ⚠️ High risk changes detected
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const DiffViewer: React.FC<{
  original: string;
  modified: string;
  language: string;
}> = ({ original, modified, language }) => {
  const [diffMode, setDiffMode] = useState<'unified' | 'split'>('unified');

  const generateDiff = useMemo(() => {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    const diff: Array<{
      type: 'unchanged' | 'added' | 'removed';
      content: string;
      lineNumber?: number;
    }> = [];

    // Simple diff algorithm - in production, use a proper diff library
    let i = 0, j = 0;
    while (i < originalLines.length || j < modifiedLines.length) {
      if (i >= originalLines.length) {
        diff.push({ type: 'added', content: modifiedLines[j], lineNumber: j + 1 });
        j++;
      } else if (j >= modifiedLines.length) {
        diff.push({ type: 'removed', content: originalLines[i], lineNumber: i + 1 });
        i++;
      } else if (originalLines[i] === modifiedLines[j]) {
        diff.push({ type: 'unchanged', content: originalLines[i], lineNumber: i + 1 });
        i++;
        j++;
      } else {
        diff.push({ type: 'removed', content: originalLines[i], lineNumber: i + 1 });
        diff.push({ type: 'added', content: modifiedLines[j], lineNumber: j + 1 });
        i++;
        j++;
      }
    }

    return diff;
  }, [original, modified]);

  return (
    <div className="diff-viewer">
      <div className="diff-controls">
        <button
          className={`btn btn-ghost ${diffMode === 'unified' ? 'active' : ''}`}
          onClick={() => setDiffMode('unified')}
        >
          Unified
        </button>
        <button
          className={`btn btn-ghost ${diffMode === 'split' ? 'active' : ''}`}
          onClick={() => setDiffMode('split')}
        >
          Split
        </button>
      </div>

      <div className={`diff-content ${diffMode}`}>
        {generateDiff.map((line, index) => (
          <div
            key={index}
            className={`diff-line ${line.type}`}
          >
            <div className="line-number">{line.lineNumber}</div>
            <div className="line-content">
              <pre><code>{line.content}</code></pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper Functions
function getChangeTypeIcon(changeType: string): string {
  const icons = {
    create: '✨',
    modify: '📝',
    delete: '🗑️',
    rename: '📝'
  };
  return icons[changeType as keyof typeof icons] || '📄';
}

function getRiskIcon(level: string): string {
  const icons = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    critical: '🔴'
  };
  return icons[level as keyof typeof icons] || '⚪';
}

export default MultiFilePreview;