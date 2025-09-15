import React, { useState, useEffect } from 'react';
import { collaborationService, CollaborationSession, CollaborationUser } from '../services/collaboration/CollaborationService';
import './CollaborationPanel.css';

interface CollaborationPanelProps {
  onClose: () => void;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'session' | 'users' | 'create'>('session');
  const [currentSession, setCurrentSession] = useState<CollaborationSession | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<CollaborationUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [newSession, setNewSession] = useState({
    name: '',
    description: '',
    isPublic: false
  });
  const [joinSessionId, setJoinSessionId] = useState('');
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    color: '#007acc'
  });

  useEffect(() => {
    // Initialize collaboration service listeners
    const handleSessionJoined = (session: CollaborationSession) => {
      setCurrentSession(session);
      setIsConnected(true);
    };

    const handleUserJoined = (user: CollaborationUser) => {
      setOnlineUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
    };

    const handleUserLeft = (userId: string) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== userId));
    };

    const handleConnected = () => {
      setIsConnected(true);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
    };

    collaborationService.on('sessionJoined', handleSessionJoined);
    collaborationService.on('userJoined', handleUserJoined);
    collaborationService.on('userLeft', handleUserLeft);
    collaborationService.on('connected', handleConnected);
    collaborationService.on('disconnected', handleDisconnected);

    // Check current session
    setCurrentSession(collaborationService.getCurrentSession());
    setOnlineUsers(collaborationService.getOnlineUsers());
    setIsConnected(collaborationService.isSessionActive());

    return () => {
      collaborationService.removeAllListeners();
    };
  }, []);

  const handleCreateSession = async () => {
    if (!newSession.name.trim()) {
      alert('Please enter a session name');
      return;
    }

    try {
      const session = await collaborationService.createSession(newSession);

      // Join the created session
      if (userProfile.name) {
        await collaborationService.joinSession(session.id, {
          id: generateUserId(),
          name: userProfile.name,
          email: userProfile.email,
          color: userProfile.color
        });
      }

      // Reset form
      setNewSession({ name: '', description: '', isPublic: false });
      setActiveTab('session');
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to create session');
    }
  };

  const handleJoinSession = async () => {
    if (!joinSessionId.trim() || !userProfile.name.trim()) {
      alert('Please enter session ID and your name');
      return;
    }

    try {
      const success = await collaborationService.joinSession(joinSessionId, {
        id: generateUserId(),
        name: userProfile.name,
        email: userProfile.email,
        color: userProfile.color
      });

      if (success) {
        setJoinSessionId('');
        setActiveTab('session');
      } else {
        alert('Failed to join session');
      }
    } catch (error) {
      console.error('Failed to join session:', error);
      alert('Failed to join session');
    }
  };

  const handleLeaveSession = async () => {
    if (confirm('Are you sure you want to leave this session?')) {
      await collaborationService.leaveSession();
      setCurrentSession(null);
      setOnlineUsers([]);
      setIsConnected(false);
    }
  };

  const copySessionId = () => {
    if (currentSession) {
      navigator.clipboard.writeText(currentSession.id);
      alert('Session ID copied to clipboard!');
    }
  };

  const generateUserId = () => {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const getUserColor = (color: string) => ({
    backgroundColor: color,
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'inline-block'
  });

  return (
    <div className="collaboration-panel">
      <div className="collaboration-header">
        <h2>👥 Collaboration</h2>
        <button onClick={onClose} className="close-button">×</button>
      </div>

      <div className="collaboration-tabs">
        <button
          className={`tab ${activeTab === 'session' ? 'active' : ''}`}
          onClick={() => setActiveTab('session')}
        >
          Session
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({onlineUsers.length})
        </button>
        <button
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          {currentSession ? 'Join New' : 'Create/Join'}
        </button>
      </div>

      <div className="collaboration-content">
        {activeTab === 'session' && (
          <div className="session-tab">
            {currentSession ? (
              <div className="active-session">
                <div className="session-info">
                  <h3>{currentSession.name}</h3>
                  <p>{currentSession.description}</p>

                  <div className="session-details">
                    <div className="detail-item">
                      <span className="label">Session ID:</span>
                      <div className="session-id">
                        <code>{currentSession.id}</code>
                        <button onClick={copySessionId} className="copy-button" title="Copy Session ID">
                          📋
                        </button>
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="label">Status:</span>
                      <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                      </span>
                    </div>

                    <div className="detail-item">
                      <span className="label">Users:</span>
                      <span>{onlineUsers.length} online</span>
                    </div>

                    <div className="detail-item">
                      <span className="label">Owner:</span>
                      <span>{currentSession.owner}</span>
                    </div>
                  </div>
                </div>

                <div className="session-actions">
                  <button onClick={handleLeaveSession} className="leave-button">
                    Leave Session
                  </button>
                </div>

                <div className="active-files">
                  <h4>Shared Files</h4>
                  {currentSession.activeFiles.length > 0 ? (
                    <div className="files-list">
                      {currentSession.activeFiles.map(fileId => (
                        <div key={fileId} className="file-item">
                          <span className="file-icon">📄</span>
                          <span className="file-name">{fileId}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-files">No files shared yet</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="no-session">
                <div className="no-session-content">
                  <h3>No Active Session</h3>
                  <p>Create a new collaboration session or join an existing one to start coding with your team.</p>
                  <button onClick={() => setActiveTab('create')} className="create-session-button">
                    Get Started
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-tab">
            {onlineUsers.length > 0 ? (
              <div className="users-list">
                {onlineUsers.map(user => (
                  <div key={user.id} className="user-item">
                    <div className="user-avatar">
                      <div style={getUserColor(user.color)}></div>
                    </div>
                    <div className="user-info">
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                      {user.cursor && (
                        <div className="user-activity">
                          Editing: {user.cursor.fileId} (Line {user.cursor.line})
                        </div>
                      )}
                    </div>
                    <div className="user-status">
                      {user.isOnline ? '🟢' : '⚪'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-users">
                <p>No other users in this session</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-tab">
            {!currentSession && (
              <div className="user-profile-section">
                <h4>Your Profile</h4>
                <div className="form-group">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                    placeholder="Enter your email"
                  />
                </div>
                <div className="form-group">
                  <label>Color:</label>
                  <div className="color-picker">
                    <input
                      type="color"
                      value={userProfile.color}
                      onChange={(e) => setUserProfile({...userProfile, color: e.target.value})}
                    />
                    <span>This color will represent you to other users</span>
                  </div>
                </div>
              </div>
            )}

            <div className="session-actions-section">
              <div className="action-section">
                <h4>Create New Session</h4>
                <div className="form-group">
                  <label>Session Name:</label>
                  <input
                    type="text"
                    value={newSession.name}
                    onChange={(e) => setNewSession({...newSession, name: e.target.value})}
                    placeholder="Enter session name"
                  />
                </div>
                <div className="form-group">
                  <label>Description (optional):</label>
                  <textarea
                    value={newSession.description}
                    onChange={(e) => setNewSession({...newSession, description: e.target.value})}
                    placeholder="Describe your project..."
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newSession.isPublic}
                      onChange={(e) => setNewSession({...newSession, isPublic: e.target.checked})}
                    />
                    Make session public
                  </label>
                </div>
                <button onClick={handleCreateSession} className="create-button">
                  Create Session
                </button>
              </div>

              <div className="divider">OR</div>

              <div className="action-section">
                <h4>Join Existing Session</h4>
                <div className="form-group">
                  <label>Session ID:</label>
                  <input
                    type="text"
                    value={joinSessionId}
                    onChange={(e) => setJoinSessionId(e.target.value)}
                    placeholder="Paste session ID here"
                  />
                </div>
                <button onClick={handleJoinSession} className="join-button">
                  Join Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};