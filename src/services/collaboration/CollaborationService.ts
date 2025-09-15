// Collaborative Coding Service - Real-time team collaboration
import { EventEmitter } from '../../utils/EventEmitter';
import { supabase } from '../../lib/supabase';
import { authService } from '../auth/AuthService';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  isOnline: boolean;
  lastSeen: Date;
  cursor?: {
    fileId: string;
    line: number;
    column: number;
  };
  selection?: {
    fileId: string;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

export interface CollaborationSession {
  id: string;
  name: string;
  description: string;
  owner: string;
  users: CollaborationUser[];
  activeFiles: string[];
  createdAt: Date;
  isPublic: boolean;
}

export interface FileOperation {
  id: string;
  type: 'insert' | 'delete' | 'replace';
  fileId: string;
  userId: string;
  position: {
    line: number;
    column: number;
  };
  content?: string;
  length?: number;
  timestamp: Date;
}

export interface RealTimeEdit {
  operationId: string;
  fileId: string;
  userId: string;
  operation: FileOperation;
  appliedAt: Date;
}

export class CollaborationService extends EventEmitter {
  private currentSession: CollaborationSession | null = null;
  private currentUser: CollaborationUser | null = null;
  private websocket: WebSocket | null = null;
  private operationQueue: FileOperation[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected = false;

  constructor() {
    super();
  }

  // Session Management
  public async createSession(sessionData: {
    name: string;
    description: string;
    isPublic: boolean;
  }): Promise<CollaborationSession> {
    const session: CollaborationSession = {
      id: this.generateSessionId(),
      name: sessionData.name,
      description: sessionData.description,
      owner: this.currentUser?.id || 'anonymous',
      users: this.currentUser ? [this.currentUser] : [],
      activeFiles: [],
      createdAt: new Date(),
      isPublic: sessionData.isPublic
    };

    this.currentSession = session;
    this.emit('sessionCreated', session);

    return session;
  }

  public async joinSession(sessionId: string, user: Omit<CollaborationUser, 'isOnline' | 'lastSeen'>): Promise<boolean> {
    try {
      // Connect to collaboration server
      await this.connectToCollaborationServer(sessionId);

      // Set current user
      this.currentUser = {
        ...user,
        isOnline: true,
        lastSeen: new Date()
      };

      // Send join request
      this.sendMessage({
        type: 'JOIN_SESSION',
        sessionId,
        user: this.currentUser
      });

      return true;
    } catch (error) {
      console.error('Failed to join session:', error);
      return false;
    }
  }

  public async leaveSession(): Promise<void> {
    if (this.currentSession && this.currentUser) {
      this.sendMessage({
        type: 'LEAVE_SESSION',
        sessionId: this.currentSession.id,
        userId: this.currentUser.id
      });
    }

    this.disconnect();
    this.currentSession = null;
    this.currentUser = null;
  }

  // Real-time Editing
  public applyEdit(fileId: string, operation: Omit<FileOperation, 'id' | 'userId' | 'timestamp'>): void {
    if (!this.currentUser || !this.currentSession) return;

    const fileOperation: FileOperation = {
      ...operation,
      id: this.generateOperationId(),
      userId: this.currentUser.id,
      fileId,
      timestamp: new Date()
    };

    // Apply locally first for instant feedback
    this.emit('localEdit', fileOperation);

    // Send to other users
    this.sendMessage({
      type: 'FILE_OPERATION',
      sessionId: this.currentSession.id,
      operation: fileOperation
    });
  }

  public updateCursor(fileId: string, line: number, column: number): void {
    if (!this.currentUser || !this.currentSession) return;

    this.currentUser.cursor = { fileId, line, column };

    this.sendMessage({
      type: 'CURSOR_UPDATE',
      sessionId: this.currentSession.id,
      userId: this.currentUser.id,
      cursor: this.currentUser.cursor
    });
  }

  public updateSelection(fileId: string, startLine: number, startColumn: number, endLine: number, endColumn: number): void {
    if (!this.currentUser || !this.currentSession) return;

    this.currentUser.selection = {
      fileId,
      startLine,
      startColumn,
      endLine,
      endColumn
    };

    this.sendMessage({
      type: 'SELECTION_UPDATE',
      sessionId: this.currentSession.id,
      userId: this.currentUser.id,
      selection: this.currentUser.selection
    });
  }

  // File Management
  public async shareFile(fileId: string, fileName: string, content: string): Promise<void> {
    if (!this.currentSession) return;

    this.sendMessage({
      type: 'SHARE_FILE',
      sessionId: this.currentSession.id,
      file: {
        id: fileId,
        name: fileName,
        content,
        sharedBy: this.currentUser?.id
      }
    });

    if (!this.currentSession.activeFiles.includes(fileId)) {
      this.currentSession.activeFiles.push(fileId);
    }
  }

  public async requestFileSync(fileId: string): Promise<void> {
    if (!this.currentSession) return;

    this.sendMessage({
      type: 'REQUEST_FILE_SYNC',
      sessionId: this.currentSession.id,
      fileId,
      requestedBy: this.currentUser?.id
    });
  }

  // WebSocket Connection
  private async connectToCollaborationServer(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // In production, this would connect to your collaboration server
        this.websocket = new WebSocket(`ws://localhost:3002/collaboration/${sessionId}`);

        this.websocket.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.websocket.onclose = () => {
          this.isConnected = false;
          this.emit('disconnected');
          this.handleReconnection();
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'));
          }
        }, 5000);

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'SESSION_JOINED':
        this.currentSession = message.session;
        this.emit('sessionJoined', message.session);
        break;

      case 'USER_JOINED':
        if (this.currentSession) {
          this.currentSession.users.push(message.user);
          this.emit('userJoined', message.user);
        }
        break;

      case 'USER_LEFT':
        if (this.currentSession) {
          this.currentSession.users = this.currentSession.users.filter(u => u.id !== message.userId);
          this.emit('userLeft', message.userId);
        }
        break;

      case 'FILE_OPERATION':
        this.handleRemoteEdit(message.operation);
        break;

      case 'CURSOR_UPDATE':
        this.handleCursorUpdate(message.userId, message.cursor);
        break;

      case 'SELECTION_UPDATE':
        this.handleSelectionUpdate(message.userId, message.selection);
        break;

      case 'FILE_SHARED':
        this.handleFileShared(message.file);
        break;

      case 'FILE_SYNC_RESPONSE':
        this.handleFileSyncResponse(message.fileId, message.content);
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleRemoteEdit(operation: FileOperation): void {
    // Apply operational transformation if needed
    const transformedOperation = this.transformOperation(operation);
    this.emit('remoteEdit', transformedOperation);
  }

  private handleCursorUpdate(userId: string, cursor: any): void {
    if (this.currentSession) {
      const user = this.currentSession.users.find(u => u.id === userId);
      if (user) {
        user.cursor = cursor;
        this.emit('cursorUpdate', userId, cursor);
      }
    }
  }

  private handleSelectionUpdate(userId: string, selection: any): void {
    if (this.currentSession) {
      const user = this.currentSession.users.find(u => u.id === userId);
      if (user) {
        user.selection = selection;
        this.emit('selectionUpdate', userId, selection);
      }
    }
  }

  private handleFileShared(file: any): void {
    this.emit('fileShared', file);
  }

  private handleFileSyncResponse(fileId: string, content: string): void {
    this.emit('fileSyncResponse', fileId, content);
  }

  private transformOperation(operation: FileOperation): FileOperation {
    // Implement operational transformation algorithm
    // For now, return as-is (in production, you'd implement proper OT)
    return operation;
  }

  private sendMessage(message: any): void {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      this.operationQueue.push(message);
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff

      setTimeout(() => {
        if (this.currentSession) {
          this.connectToCollaborationServer(this.currentSession.id)
            .then(() => {
              // Resend queued operations
              this.operationQueue.forEach(op => this.sendMessage(op));
              this.operationQueue = [];
            })
            .catch(() => {
              this.handleReconnection();
            });
        }
      }, delay);
    } else {
      this.emit('connectionFailed');
    }
  }

  private disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public getters
  public getCurrentSession(): CollaborationSession | null {
    return this.currentSession;
  }

  public getCurrentUser(): CollaborationUser | null {
    return this.currentUser;
  }

  public isSessionActive(): boolean {
    return this.currentSession !== null && this.isConnected;
  }

  public getOnlineUsers(): CollaborationUser[] {
    return this.currentSession?.users.filter(u => u.isOnline) || [];
  }
}

// Singleton instance
export const collaborationService = new CollaborationService();