import React, { useState, useEffect } from 'react';
import { gitService, GitStatus, GitBranch, GitCommit, GitRemote, GitStash } from '../services/git/GitService';
import './GitPanel.css';

interface GitPanelProps {
  onClose: () => void;
}

export const GitPanel: React.FC<GitPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'branches' | 'history' | 'remotes' | 'stash'>('status');
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [remotes, setRemotes] = useState<GitRemote[]>([]);
  const [stashes, setStashes] = useState<GitStash[]>([]);
  const [isRepository, setIsRepository] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  // const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [newBranchName, setNewBranchName] = useState('');
  const [newRemoteName, setNewRemoteName] = useState('');
  const [newRemoteUrl, setNewRemoteUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeGit();
    setupEventListeners();

    return () => {
      gitService.removeAllListeners();
    };
  }, []);

  const initializeGit = async () => {
    setIsLoading(true);
    try {
      // Set working directory - in real app this would come from the opened project
      const isRepo = await gitService.setWorkingDirectory('/current/project');
      setIsRepository(isRepo);

      if (isRepo) {
        await refreshData();
      }
    } catch (error) {
      console.error('Failed to initialize git:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupEventListeners = () => {
    gitService.on('workingDirectoryChanged', refreshData);
    gitService.on('committed', refreshData);
    gitService.on('branchSwitched', refreshData);
    gitService.on('branchCreated', refreshData);
    gitService.on('branchDeleted', refreshData);
    gitService.on('filesStaged', refreshData);
    gitService.on('filesUnstaged', refreshData);
    gitService.on('pushed', refreshData);
    gitService.on('pulled', refreshData);
    gitService.on('fetched', refreshData);
    gitService.on('stashed', refreshData);
    gitService.on('stashApplied', refreshData);
    gitService.on('merged', refreshData);
    gitService.on('rebased', refreshData);
  };

  const refreshData = async () => {
    if (!isRepository) return;

    try {
      const [status, branchList, commitHistory, remoteList, stashList] = await Promise.all([
        gitService.getStatus(),
        gitService.getBranches(true),
        gitService.getCommitHistory({ maxCount: 50 }),
        gitService.getRemotes(),
        gitService.getStashes()
      ]);

      setGitStatus(status);
      setBranches(branchList);
      setCommits(commitHistory);
      setRemotes(remoteList);
      setStashes(stashList);
    } catch (error) {
      console.error('Failed to refresh git data:', error);
    }
  };

  const handleStageFile = async (file: string) => {
    await gitService.addFiles([file]);
  };

  const handleUnstageFile = async (file: string) => {
    await gitService.unstageFiles([file]);
  };

  const handleDiscardChanges = async (file: string) => {
    if (confirm(`Are you sure you want to discard changes to ${file}?`)) {
      await gitService.discardChanges([file]);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      alert('Please enter a commit message');
      return;
    }

    const success = await gitService.commit(commitMessage);
    if (success) {
      setCommitMessage('');
      // setSelectedFiles([]);
    }
  };

  const handleStageAll = async () => {
    await gitService.addAllFiles();
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) {
      alert('Please enter a branch name');
      return;
    }

    const success = await gitService.createBranch(newBranchName);
    if (success) {
      setNewBranchName('');
    }
  };

  const handleSwitchBranch = async (branchName: string) => {
    await gitService.switchBranch(branchName);
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (confirm(`Are you sure you want to delete branch ${branchName}?`)) {
      await gitService.deleteBranch(branchName);
    }
  };

  const handleMergeBranch = async (branchName: string) => {
    const result = await gitService.merge(branchName);
    if (!result.success && result.conflicts) {
      alert(`Merge conflicts detected in: ${result.conflicts.join(', ')}`);
    }
  };

  const handlePull = async () => {
    await gitService.pull();
  };

  const handlePush = async () => {
    await gitService.push();
  };

  const handleFetch = async () => {
    await gitService.fetch();
  };

  const handleAddRemote = async () => {
    if (!newRemoteName.trim() || !newRemoteUrl.trim()) {
      alert('Please enter both remote name and URL');
      return;
    }

    const success = await gitService.addRemote(newRemoteName, newRemoteUrl);
    if (success) {
      setNewRemoteName('');
      setNewRemoteUrl('');
    }
  };

  const handleStash = async () => {
    await gitService.stash('WIP: ' + new Date().toLocaleString());
  };

  const handleApplyStash = async (index: number) => {
    await gitService.applyStash(index);
  };

  const handlePopStash = async (index: number) => {
    await gitService.popStash(index);
  };

  const handleDropStash = async (index: number) => {
    if (confirm(`Are you sure you want to drop stash@{${index}}?`)) {
      await gitService.dropStash(index);
    }
  };

  const getFileStatusIcon = (status: string) => {
    switch (status) {
      case 'added': return '➕';
      case 'modified': return '📝';
      case 'deleted': return '🗑️';
      case 'renamed': return '🔄';
      case 'untracked': return '❓';
      default: return '📄';
    }
  };

  const getFileStatusColor = (status: string) => {
    switch (status) {
      case 'added': return '#27ae60';
      case 'modified': return '#f39c12';
      case 'deleted': return '#e74c3c';
      case 'renamed': return '#3498db';
      case 'untracked': return '#95a5a6';
      default: return '#cccccc';
    }
  };

  if (!isRepository) {
    return (
      <div className="git-panel">
        <div className="git-panel-header">
          <h2>📁 Git</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        <div className="git-not-initialized">
          <div className="git-not-initialized-content">
            <h3>Not a Git Repository</h3>
            <p>This directory is not a Git repository.</p>
            <button onClick={() => gitService.initRepository()} className="init-button">
              Initialize Repository
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="git-panel">
      <div className="git-panel-header">
        <h2>📁 Git</h2>
        <div className="header-actions">
          <button onClick={refreshData} className="refresh-button" title="Refresh">
            🔄
          </button>
          <button onClick={onClose} className="close-button">×</button>
        </div>
      </div>

      <div className="git-tabs">
        <button
          className={`tab ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          Status
        </button>
        <button
          className={`tab ${activeTab === 'branches' ? 'active' : ''}`}
          onClick={() => setActiveTab('branches')}
        >
          Branches ({branches.length})
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          className={`tab ${activeTab === 'remotes' ? 'active' : ''}`}
          onClick={() => setActiveTab('remotes')}
        >
          Remotes ({remotes.length})
        </button>
        <button
          className={`tab ${activeTab === 'stash' ? 'active' : ''}`}
          onClick={() => setActiveTab('stash')}
        >
          Stash ({stashes.length})
        </button>
      </div>

      <div className="git-content">
        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {activeTab === 'status' && gitStatus && (
              <div className="status-tab">
                <div className="branch-info">
                  <h3>Current Branch: {gitStatus.branch}</h3>
                  {(gitStatus.ahead > 0 || gitStatus.behind > 0) && (
                    <div className="sync-status">
                      {gitStatus.ahead > 0 && <span className="ahead">↑{gitStatus.ahead}</span>}
                      {gitStatus.behind > 0 && <span className="behind">↓{gitStatus.behind}</span>}
                    </div>
                  )}
                </div>

                <div className="quick-actions">
                  <button onClick={handlePull} className="action-button">Pull</button>
                  <button onClick={handlePush} className="action-button">Push</button>
                  <button onClick={handleFetch} className="action-button">Fetch</button>
                  <button onClick={handleStash} className="action-button">Stash</button>
                </div>

                <div className="commit-section">
                  <h4>Commit Changes</h4>
                  <textarea
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Enter commit message..."
                    rows={3}
                    className="commit-message"
                  />
                  <div className="commit-actions">
                    <button onClick={handleStageAll} className="stage-all-button">
                      Stage All
                    </button>
                    <button
                      onClick={handleCommit}
                      disabled={!commitMessage.trim() || gitStatus.staged.length === 0}
                      className="commit-button"
                    >
                      Commit ({gitStatus.staged.length})
                    </button>
                  </div>
                </div>

                <div className="changes-section">
                  {gitStatus.staged.length > 0 && (
                    <div className="staged-changes">
                      <h4>Staged Changes ({gitStatus.staged.length})</h4>
                      <div className="file-list">
                        {gitStatus.staged.map((file, index) => (
                          <div key={index} className="file-item staged">
                            <span
                              className="file-status"
                              style={{ color: getFileStatusColor(file.status) }}
                            >
                              {getFileStatusIcon(file.status)}
                            </span>
                            <span className="file-path">{file.path}</span>
                            <div className="file-actions">
                              <button
                                onClick={() => handleUnstageFile(file.path)}
                                className="unstage-button"
                                title="Unstage"
                              >
                                ➖
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {gitStatus.unstaged.length > 0 && (
                    <div className="unstaged-changes">
                      <h4>Unstaged Changes ({gitStatus.unstaged.length})</h4>
                      <div className="file-list">
                        {gitStatus.unstaged.map((file, index) => (
                          <div key={index} className="file-item unstaged">
                            <span
                              className="file-status"
                              style={{ color: getFileStatusColor(file.status) }}
                            >
                              {getFileStatusIcon(file.status)}
                            </span>
                            <span className="file-path">{file.path}</span>
                            <div className="file-actions">
                              <button
                                onClick={() => handleStageFile(file.path)}
                                className="stage-button"
                                title="Stage"
                              >
                                ➕
                              </button>
                              <button
                                onClick={() => handleDiscardChanges(file.path)}
                                className="discard-button"
                                title="Discard Changes"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {gitStatus.untracked.length > 0 && (
                    <div className="untracked-files">
                      <h4>Untracked Files ({gitStatus.untracked.length})</h4>
                      <div className="file-list">
                        {gitStatus.untracked.map((file, index) => (
                          <div key={index} className="file-item untracked">
                            <span className="file-status">❓</span>
                            <span className="file-path">{file}</span>
                            <div className="file-actions">
                              <button
                                onClick={() => handleStageFile(file)}
                                className="stage-button"
                                title="Stage"
                              >
                                ➕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {gitStatus.conflicts.length > 0 && (
                    <div className="conflicts">
                      <h4>Merge Conflicts ({gitStatus.conflicts.length})</h4>
                      <div className="file-list">
                        {gitStatus.conflicts.map((file, index) => (
                          <div key={index} className="file-item conflict">
                            <span className="file-status">⚠️</span>
                            <span className="file-path">{file}</span>
                            <div className="file-actions">
                              <button className="resolve-button" title="Resolve">
                                🔧
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {gitStatus.clean && (
                    <div className="clean-status">
                      <p>✅ Working directory clean</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'branches' && (
              <div className="branches-tab">
                <div className="create-branch">
                  <h4>Create New Branch</h4>
                  <div className="create-branch-form">
                    <input
                      type="text"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      placeholder="Enter branch name"
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateBranch()}
                    />
                    <button onClick={handleCreateBranch} className="create-button">
                      Create
                    </button>
                  </div>
                </div>

                <div className="branches-list">
                  <h4>Branches</h4>
                  {branches.map((branch, index) => (
                    <div key={index} className={`branch-item ${branch.current ? 'current' : ''}`}>
                      <div className="branch-info">
                        <span className="branch-name">
                          {branch.current && '🔹 '}
                          {branch.name}
                        </span>
                        {branch.upstream && (
                          <span className="upstream">→ {branch.upstream}</span>
                        )}
                        {(branch.ahead || branch.behind) && (
                          <div className="sync-info">
                            {branch.ahead && <span className="ahead">↑{branch.ahead}</span>}
                            {branch.behind && <span className="behind">↓{branch.behind}</span>}
                          </div>
                        )}
                      </div>
                      <div className="branch-actions">
                        {!branch.current && (
                          <>
                            <button
                              onClick={() => handleSwitchBranch(branch.name)}
                              className="switch-button"
                              title="Switch to branch"
                            >
                              🔄
                            </button>
                            <button
                              onClick={() => handleMergeBranch(branch.name)}
                              className="merge-button"
                              title="Merge branch"
                            >
                              🔀
                            </button>
                            <button
                              onClick={() => handleDeleteBranch(branch.name)}
                              className="delete-button"
                              title="Delete branch"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="history-tab">
                <h4>Commit History</h4>
                <div className="commits-list">
                  {commits.map((commit, index) => (
                    <div key={index} className="commit-item">
                      <div className="commit-header">
                        <span className="commit-hash">{commit.shortHash}</span>
                        <span className="commit-author">{commit.author}</span>
                        <span className="commit-date">
                          {commit.date.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="commit-message">{commit.message}</div>
                      {commit.refs && (
                        <div className="commit-refs">
                          {commit.refs.map((ref, refIndex) => (
                            <span key={refIndex} className="ref-tag">{ref}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'remotes' && (
              <div className="remotes-tab">
                <div className="add-remote">
                  <h4>Add Remote</h4>
                  <div className="add-remote-form">
                    <input
                      type="text"
                      value={newRemoteName}
                      onChange={(e) => setNewRemoteName(e.target.value)}
                      placeholder="Remote name (e.g., origin)"
                    />
                    <input
                      type="text"
                      value={newRemoteUrl}
                      onChange={(e) => setNewRemoteUrl(e.target.value)}
                      placeholder="Remote URL"
                    />
                    <button onClick={handleAddRemote} className="add-button">
                      Add Remote
                    </button>
                  </div>
                </div>

                <div className="remotes-list">
                  <h4>Remotes</h4>
                  {remotes.map((remote, index) => (
                    <div key={index} className="remote-item">
                      <div className="remote-info">
                        <span className="remote-name">{remote.name}</span>
                        <span className="remote-type">({remote.type})</span>
                      </div>
                      <div className="remote-url">{remote.url}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'stash' && (
              <div className="stash-tab">
                <div className="stash-actions">
                  <button onClick={handleStash} className="stash-button">
                    💾 Stash Changes
                  </button>
                </div>

                <div className="stashes-list">
                  <h4>Stashed Changes</h4>
                  {stashes.length === 0 ? (
                    <p className="no-stashes">No stashes</p>
                  ) : (
                    stashes.map((stash, index) => (
                      <div key={index} className="stash-item">
                        <div className="stash-info">
                          <span className="stash-index">stash@{`{${stash.index}}`}</span>
                          <span className="stash-message">{stash.message}</span>
                          <span className="stash-date">
                            {stash.date.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="stash-actions">
                          <button
                            onClick={() => handleApplyStash(stash.index)}
                            className="apply-button"
                            title="Apply stash"
                          >
                            📥
                          </button>
                          <button
                            onClick={() => handlePopStash(stash.index)}
                            className="pop-button"
                            title="Pop stash"
                          >
                            📤
                          </button>
                          <button
                            onClick={() => handleDropStash(stash.index)}
                            className="drop-button"
                            title="Drop stash"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};