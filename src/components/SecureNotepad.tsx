import React, { useState, useEffect } from 'react';
import { secureStorage } from '../services/security/SecureStorage';
import './SecureNotepad.css';

interface SecureNote {
  id: string;
  title: string;
  content: string;
  type: 'api_key' | 'password' | 'config' | 'note' | 'url';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isEncrypted: boolean;
}

interface SecureNotepadProps {
  onClose: () => void;
}

export const SecureNotepad: React.FC<SecureNotepadProps> = ({ onClose }) => {
  const [notes, setNotes] = useState<SecureNote[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'api_keys' | 'passwords' | 'configs'>('all');
  const [selectedNote, setSelectedNote] = useState<SecureNote | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    type: 'note' as SecureNote['type'],
    tags: [] as string[],
    tagInput: ''
  });
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showContent, setShowContent] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const savedNotes = await secureStorage.getAllNotes();
      setNotes(savedNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const handleUnlock = async () => {
    try {
      const success = await secureStorage.unlock(masterPassword);
      if (success) {
        setIsUnlocked(true);
        setShowMasterPassword(false);
        setMasterPassword('');
        loadNotes();
      } else {
        alert('Invalid master password');
      }
    } catch (error) {
      console.error('Failed to unlock:', error);
      alert('Failed to unlock secure storage');
    }
  };

  const handleLock = () => {
    secureStorage.lock();
    setIsUnlocked(false);
    setNotes([]);
    setSelectedNote(null);
    setShowContent({});
  };

  const handleSaveNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      alert('Please fill in title and content');
      return;
    }

    try {
      const note: SecureNote = {
        id: `note_${Date.now()}`,
        title: newNote.title,
        content: newNote.content,
        type: newNote.type,
        tags: newNote.tags,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEncrypted: true
      };

      await secureStorage.saveNote(note);
      await loadNotes();

      // Reset form
      setNewNote({
        title: '',
        content: '',
        type: 'note',
        tags: [],
        tagInput: ''
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await secureStorage.deleteNote(noteId);
        await loadNotes();
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
        }
      } catch (error) {
        console.error('Failed to delete note:', error);
        alert('Failed to delete note');
      }
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('Content copied to clipboard!');
  };

  const toggleContentVisibility = (noteId: string) => {
    setShowContent(prev => ({
      ...prev,
      [noteId]: !prev[noteId]
    }));
  };

  const addTag = () => {
    if (newNote.tagInput.trim() && !newNote.tags.includes(newNote.tagInput.trim())) {
      setNewNote(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: ''
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewNote(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTab = activeTab === 'all' ||
                      (activeTab === 'api_keys' && note.type === 'api_key') ||
                      (activeTab === 'passwords' && note.type === 'password') ||
                      (activeTab === 'configs' && (note.type === 'config' || note.type === 'url'));

    return matchesSearch && matchesTab;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api_key': return '🔑';
      case 'password': return '🔒';
      case 'config': return '⚙️';
      case 'url': return '🔗';
      default: return '📝';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'api_key': return '#f39c12';
      case 'password': return '#e74c3c';
      case 'config': return '#3498db';
      case 'url': return '#9b59b6';
      default: return '#95a5a6';
    }
  };

  if (!isUnlocked) {
    return (
      <div className="secure-notepad">
        <div className="secure-notepad-header">
          <h2>🔐 Secure Notepad</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="unlock-screen">
          <div className="unlock-content">
            <div className="lock-icon">🔐</div>
            <h3>Secure Storage Locked</h3>
            <p>Enter your master password to access your secure notes, API keys, and sensitive information.</p>

            {!showMasterPassword ? (
              <div className="unlock-actions">
                <button onClick={() => setShowMasterPassword(true)} className="unlock-button">
                  Unlock
                </button>
                <p className="security-note">
                  Your notes are encrypted and stored locally. No data is sent to external servers.
                </p>
              </div>
            ) : (
              <div className="password-input">
                <input
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Enter master password"
                  onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                  autoFocus
                />
                <div className="password-actions">
                  <button onClick={handleUnlock} className="unlock-button">
                    Unlock
                  </button>
                  <button onClick={() => setShowMasterPassword(false)} className="cancel-button">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="secure-notepad">
      <div className="secure-notepad-header">
        <h2>🔐 Secure Notepad</h2>
        <div className="header-actions">
          <button onClick={handleLock} className="lock-button" title="Lock Notepad">
            🔒
          </button>
          <button onClick={onClose} className="close-button">×</button>
        </div>
      </div>

      <div className="notepad-toolbar">
        <div className="toolbar-left">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All ({notes.length})
            </button>
            <button
              className={`tab ${activeTab === 'api_keys' ? 'active' : ''}`}
              onClick={() => setActiveTab('api_keys')}
            >
              🔑 API Keys ({notes.filter(n => n.type === 'api_key').length})
            </button>
            <button
              className={`tab ${activeTab === 'passwords' ? 'active' : ''}`}
              onClick={() => setActiveTab('passwords')}
            >
              🔒 Passwords ({notes.filter(n => n.type === 'password').length})
            </button>
            <button
              className={`tab ${activeTab === 'configs' ? 'active' : ''}`}
              onClick={() => setActiveTab('configs')}
            >
              ⚙️ Configs ({notes.filter(n => n.type === 'config' || n.type === 'url').length})
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={() => setIsCreating(true)} className="create-button">
            + New Note
          </button>
        </div>
      </div>

      <div className="notepad-content">
        <div className="notes-sidebar">
          {filteredNotes.length > 0 ? (
            <div className="notes-list">
              {filteredNotes.map(note => (
                <div
                  key={note.id}
                  className={`note-item ${selectedNote?.id === note.id ? 'selected' : ''}`}
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="note-header">
                    <span className="note-type" style={{color: getTypeColor(note.type)}}>
                      {getTypeIcon(note.type)}
                    </span>
                    <span className="note-title">{note.title}</span>
                  </div>
                  <div className="note-preview">
                    {note.content.substring(0, 60)}...
                  </div>
                  <div className="note-meta">
                    <span className="note-date">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                    {note.tags.length > 0 && (
                      <div className="note-tags">
                        {note.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="note-tag">{tag}</span>
                        ))}
                        {note.tags.length > 2 && <span className="tag-more">+{note.tags.length - 2}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-notes">
              <p>No notes found</p>
              <button onClick={() => setIsCreating(true)} className="create-first-button">
                Create your first note
              </button>
            </div>
          )}
        </div>

        <div className="note-editor">
          {isCreating ? (
            <div className="create-note">
              <div className="create-note-header">
                <h3>Create New Note</h3>
                <button onClick={() => setIsCreating(false)} className="close-create">×</button>
              </div>

              <div className="note-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Title:</label>
                    <input
                      type="text"
                      value={newNote.title}
                      onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                      placeholder="Enter note title"
                    />
                  </div>
                  <div className="form-group">
                    <label>Type:</label>
                    <select
                      value={newNote.type}
                      onChange={(e) => setNewNote({...newNote, type: e.target.value as SecureNote['type']})}
                    >
                      <option value="note">📝 Note</option>
                      <option value="api_key">🔑 API Key</option>
                      <option value="password">🔒 Password</option>
                      <option value="config">⚙️ Config</option>
                      <option value="url">🔗 URL</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Content:</label>
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                    placeholder={
                      newNote.type === 'api_key' ? 'sk-...' :
                      newNote.type === 'password' ? 'Enter password or credentials' :
                      newNote.type === 'config' ? 'Configuration details...' :
                      newNote.type === 'url' ? 'https://...' :
                      'Enter your note content...'
                    }
                    rows={8}
                  />
                </div>

                <div className="form-group">
                  <label>Tags:</label>
                  <div className="tags-input">
                    <input
                      type="text"
                      value={newNote.tagInput}
                      onChange={(e) => setNewNote({...newNote, tagInput: e.target.value})}
                      placeholder="Add tag and press Enter"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <button onClick={addTag} className="add-tag-button">Add</button>
                  </div>
                  {newNote.tags.length > 0 && (
                    <div className="tags-list">
                      {newNote.tags.map(tag => (
                        <span key={tag} className="tag">
                          {tag}
                          <button onClick={() => removeTag(tag)}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button onClick={handleSaveNote} className="save-button">
                    Save Note
                  </button>
                  <button onClick={() => setIsCreating(false)} className="cancel-form-button">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : selectedNote ? (
            <div className="view-note">
              <div className="note-viewer-header">
                <div className="note-info">
                  <h3>
                    <span style={{color: getTypeColor(selectedNote.type)}}>
                      {getTypeIcon(selectedNote.type)}
                    </span>
                    {selectedNote.title}
                  </h3>
                  <div className="note-metadata">
                    <span>Created: {new Date(selectedNote.createdAt).toLocaleString()}</span>
                    <span>Updated: {new Date(selectedNote.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="note-actions">
                  <button
                    onClick={() => toggleContentVisibility(selectedNote.id)}
                    className="toggle-visibility"
                    title={showContent[selectedNote.id] ? 'Hide content' : 'Show content'}
                  >
                    {showContent[selectedNote.id] ? '👁️' : '👁️‍🗨️'}
                  </button>
                  <button
                    onClick={() => handleCopyContent(selectedNote.content)}
                    className="copy-button"
                    title="Copy content"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className="delete-button"
                    title="Delete note"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="note-content">
                {showContent[selectedNote.id] ? (
                  <pre className="content-display">{selectedNote.content}</pre>
                ) : (
                  <div className="content-hidden">
                    <p>Content is hidden for security</p>
                    <button onClick={() => toggleContentVisibility(selectedNote.id)}>
                      Click to reveal
                    </button>
                  </div>
                )}
              </div>

              {selectedNote.tags.length > 0 && (
                <div className="note-tags-section">
                  <label>Tags:</label>
                  <div className="tags-display">
                    {selectedNote.tags.map(tag => (
                      <span key={tag} className="tag-display">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-selection">
              <div className="no-selection-content">
                <h3>Select a note to view</h3>
                <p>Choose a note from the sidebar or create a new one to get started.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};