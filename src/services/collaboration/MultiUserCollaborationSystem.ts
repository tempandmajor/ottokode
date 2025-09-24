import { EventEmitter } from 'events';
import { WebSocket } from 'ws';

// Core Collaboration Types
export interface CollaborationSession {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  projectId: string;
  hostUserId: string;
  participants: Participant[];
  status: 'active' | 'paused' | 'ended';
  sessionType: 'live_coding' | 'code_review' | 'planning' | 'debugging' | 'pair_programming';
  permissions: SessionPermissions;
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
  metadata: SessionMetadata;
}

export interface Participant {
  userId: string;
  displayName: string;
  avatar?: string;
  role: ParticipantRole;
  permissions: ParticipantPermissions;
  joinedAt: Date;
  lastActivity: Date;
  status: 'active' | 'idle' | 'away' | 'offline';
  cursor?: CursorPosition;
  selection?: SelectionRange;
  isPresent: boolean;
  connectionId: string;
}

export type ParticipantRole = 'host' | 'editor' | 'reviewer' | 'observer' | 'guest';

export interface ParticipantPermissions {
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
  canInvite: boolean;
  canModerateSession: boolean;
  canViewPrivateFiles: boolean;
  canExecuteCode: boolean;
  canAccessTerminal: boolean;
  restrictedPaths?: string[];
}

export interface SessionPermissions {
  isPublic: boolean;
  requiresApproval: boolean;
  maxParticipants: number;
  allowedRoles: ParticipantRole[];
  allowedDomains?: string[];
  sessionPassword?: string;
  expiresAt?: Date;
}

export interface SessionMetadata {
  language: string;
  framework?: string;
  tags: string[];
  objectives: string[];
  sharedFiles: string[];
  recordings?: Recording[];
  analytics: SessionAnalytics;
}

export interface Recording {
  id: string;
  type: 'video' | 'audio' | 'screen' | 'code_changes';
  startTime: Date;
  endTime?: Date;
  duration: number;
  size: number;
  url: string;
  isPublic: boolean;
}

export interface SessionAnalytics {
  totalParticipants: number;
  averageParticipants: number;
  totalDuration: number;
  codeChanges: number;
  commentsCount: number;
  filesModified: number;
  linesAdded: number;
  linesDeleted: number;
  productivityScore: number;
  engagementScore: number;
}

// Real-time Collaboration Types
export interface CollaborationEvent {
  id: string;
  sessionId: string;
  userId: string;
  type: CollaborationEventType;
  timestamp: Date;
  data: any;
  acknowledgments: string[]; // User IDs that have acknowledged this event
}

export type CollaborationEventType =
  | 'cursor_move'
  | 'selection_change'
  | 'text_insert'
  | 'text_delete'
  | 'text_replace'
  | 'file_open'
  | 'file_close'
  | 'file_save'
  | 'comment_add'
  | 'comment_edit'
  | 'comment_delete'
  | 'comment_resolve'
  | 'user_join'
  | 'user_leave'
  | 'user_status_change'
  | 'permission_change'
  | 'session_control'
  | 'code_execution'
  | 'terminal_input'
  | 'voice_activity'
  | 'screen_share';

export interface CursorPosition {
  fileId: string;
  line: number;
  column: number;
  isVisible: boolean;
}

export interface SelectionRange {
  fileId: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface TextOperation {
  id: string;
  sessionId: string;
  userId: string;
  fileId: string;
  type: 'insert' | 'delete' | 'replace';
  position: { line: number; column: number };
  content: string;
  timestamp: Date;
  transformedBy: string[]; // IDs of operations this was transformed by
}

// Collaborative Commenting System
export interface Comment {
  id: string;
  sessionId: string;
  userId: string;
  authorName: string;
  fileId: string;
  line: number;
  column?: number;
  content: string;
  type: 'general' | 'suggestion' | 'issue' | 'question' | 'approval';
  status: 'open' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  replies: CommentReply[];
  reactions: CommentReaction[];
  isPrivate: boolean;
  mentions: string[]; // User IDs mentioned in the comment
}

export interface CommentReply {
  id: string;
  userId: string;
  authorName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  reactions: CommentReaction[];
  mentions: string[];
}

export interface CommentReaction {
  userId: string;
  type: 'like' | 'dislike' | 'heart' | 'laugh' | 'confused' | 'rocket' | 'eyes';
  timestamp: Date;
}

// Conflict Resolution System
export interface ConflictResolution {
  id: string;
  sessionId: string;
  fileId: string;
  conflictType: 'concurrent_edit' | 'merge_conflict' | 'permission_conflict' | 'version_conflict';
  participants: string[]; // User IDs involved in the conflict
  operations: TextOperation[];
  resolutionStrategy: 'manual' | 'automatic' | 'defer' | 'rollback';
  status: 'pending' | 'resolved' | 'escalated';
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: ConflictResolutionData;
}

export interface ConflictResolutionData {
  acceptedOperation?: string;
  mergedContent?: string;
  customResolution?: string;
  reasoning: string;
}

// Session Management and Discovery
export interface SessionInvitation {
  id: string;
  sessionId: string;
  inviterId: string;
  inviterName: string;
  inviteeId?: string;
  inviteeEmail?: string;
  role: ParticipantRole;
  permissions: ParticipantPermissions;
  message?: string;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  respondedAt?: Date;
}

export interface SessionDiscovery {
  id: string;
  name: string;
  description?: string;
  hostName: string;
  participantCount: number;
  maxParticipants: number;
  sessionType: string;
  language: string;
  tags: string[];
  isPublic: boolean;
  requiresApproval: boolean;
  createdAt: Date;
  estimatedDuration?: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

// Voice and Video Collaboration
export interface VoiceSession {
  id: string;
  sessionId: string;
  participants: VoiceParticipant[];
  isActive: boolean;
  quality: 'low' | 'medium' | 'high';
  isRecording: boolean;
  recordingId?: string;
}

export interface VoiceParticipant {
  userId: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  volume: number;
  quality: number;
}

export interface ScreenShare {
  id: string;
  sessionId: string;
  sharerId: string;
  viewers: string[];
  type: 'screen' | 'window' | 'tab';
  quality: 'low' | 'medium' | 'high';
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date;
}

export class MultiUserCollaborationSystem extends EventEmitter {
  private sessions: Map<string, CollaborationSession> = new Map();
  private participants: Map<string, Map<string, Participant>> = new Map(); // sessionId -> userId -> Participant
  private connections: Map<string, WebSocket> = new Map(); // connectionId -> WebSocket
  private operations: Map<string, TextOperation[]> = new Map(); // sessionId -> operations
  private comments: Map<string, Comment[]> = new Map(); // sessionId -> comments
  private conflicts: Map<string, ConflictResolution[]> = new Map(); // sessionId -> conflicts
  private invitations: Map<string, SessionInvitation> = new Map();
  private voiceSessions: Map<string, VoiceSession> = new Map();
  private screenShares: Map<string, ScreenShare> = new Map();

  constructor() {
    super();
    this.initializeCollaborationSystem();
  }

  // Session Management
  async createSession(sessionData: Omit<CollaborationSession, 'id' | 'createdAt' | 'updatedAt' | 'participants'>): Promise<CollaborationSession> {
    const session: CollaborationSession = {
      ...sessionData,
      id: this.generateSessionId(),
      participants: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        ...sessionData.metadata,
        analytics: {
          totalParticipants: 0,
          averageParticipants: 0,
          totalDuration: 0,
          codeChanges: 0,
          commentsCount: 0,
          filesModified: 0,
          linesAdded: 0,
          linesDeleted: 0,
          productivityScore: 0,
          engagementScore: 0
        }
      }
    };

    this.sessions.set(session.id, session);
    this.participants.set(session.id, new Map());
    this.operations.set(session.id, []);
    this.comments.set(session.id, []);
    this.conflicts.set(session.id, []);

    this.emit('session_created', session);
    return session;
  }

  async joinSession(sessionId: string, userId: string, userInfo: {
    displayName: string;
    avatar?: string;
    connectionId: string;
  }): Promise<Participant> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.status !== 'active') {
      throw new Error('Session is not active');
    }

    const existingParticipants = this.participants.get(sessionId)!;

    if (existingParticipants.size >= session.permissions.maxParticipants) {
      throw new Error('Session is at maximum capacity');
    }

    const participant: Participant = {
      userId,
      displayName: userInfo.displayName,
      avatar: userInfo.avatar,
      role: userId === session.hostUserId ? 'host' : 'editor',
      permissions: this.getDefaultPermissions(userId === session.hostUserId ? 'host' : 'editor'),
      joinedAt: new Date(),
      lastActivity: new Date(),
      status: 'active',
      isPresent: true,
      connectionId: userInfo.connectionId
    };

    existingParticipants.set(userId, participant);
    session.participants = Array.from(existingParticipants.values());
    session.updatedAt = new Date();

    // Update analytics
    session.metadata.analytics.totalParticipants = Math.max(
      session.metadata.analytics.totalParticipants,
      existingParticipants.size
    );

    this.broadcastToSession(sessionId, {
      type: 'user_join',
      userId,
      data: participant
    });

    this.emit('participant_joined', { sessionId, participant });
    return participant;
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    const sessionParticipants = this.participants.get(sessionId);

    if (!session || !sessionParticipants) {
      return;
    }

    const participant = sessionParticipants.get(userId);
    if (!participant) {
      return;
    }

    sessionParticipants.delete(userId);
    session.participants = Array.from(sessionParticipants.values());
    session.updatedAt = new Date();

    // Remove connection
    this.connections.delete(participant.connectionId);

    this.broadcastToSession(sessionId, {
      type: 'user_leave',
      userId,
      data: { userId, displayName: participant.displayName }
    });

    // If host leaves and there are other participants, transfer host role
    if (participant.role === 'host' && sessionParticipants.size > 0) {
      await this.transferHostRole(sessionId, Array.from(sessionParticipants.keys())[0]);
    }

    // End session if no participants remain
    if (sessionParticipants.size === 0) {
      await this.endSession(sessionId);
    }

    this.emit('participant_left', { sessionId, userId });
  }

  // Real-time Text Operations
  async handleTextOperation(operation: Omit<TextOperation, 'id' | 'timestamp'>): Promise<void> {
    const session = this.sessions.get(operation.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Check permissions
    const participant = this.participants.get(operation.sessionId)?.get(operation.userId);
    if (!participant?.permissions.canEdit) {
      throw new Error('User does not have edit permissions');
    }

    const fullOperation: TextOperation = {
      ...operation,
      id: this.generateOperationId(),
      timestamp: new Date(),
      transformedBy: []
    };

    // Transform operation against concurrent operations
    const sessionOperations = this.operations.get(operation.sessionId) || [];
    const transformedOperation = this.transformOperation(fullOperation, sessionOperations);

    // Store operation
    sessionOperations.push(transformedOperation);
    this.operations.set(operation.sessionId, sessionOperations);

    // Update analytics
    session.metadata.analytics.codeChanges++;
    if (operation.type === 'insert') {
      session.metadata.analytics.linesAdded += (operation.content.match(/\n/g) || []).length;
    } else if (operation.type === 'delete') {
      session.metadata.analytics.linesDeleted += (operation.content.match(/\n/g) || []).length;
    }

    // Broadcast to other participants
    this.broadcastToSession(operation.sessionId, {
      type: `text_${operation.type}`,
      userId: operation.userId,
      data: transformedOperation
    }, operation.userId);

    // Check for conflicts
    await this.detectConflicts(operation.sessionId, transformedOperation);

    this.emit('text_operation', transformedOperation);
  }

  // Cursor and Selection Tracking
  async updateCursorPosition(sessionId: string, userId: string, position: CursorPosition): Promise<void> {
    const sessionParticipants = this.participants.get(sessionId);
    const participant = sessionParticipants?.get(userId);

    if (!participant) {
      return;
    }

    participant.cursor = position;
    participant.lastActivity = new Date();

    this.broadcastToSession(sessionId, {
      type: 'cursor_move',
      userId,
      data: position
    }, userId);
  }

  async updateSelection(sessionId: string, userId: string, selection: SelectionRange): Promise<void> {
    const sessionParticipants = this.participants.get(sessionId);
    const participant = sessionParticipants?.get(userId);

    if (!participant) {
      return;
    }

    participant.selection = selection;
    participant.lastActivity = new Date();

    this.broadcastToSession(sessionId, {
      type: 'selection_change',
      userId,
      data: selection
    }, userId);
  }

  // Commenting System
  async addComment(sessionId: string, commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'replies' | 'reactions'>): Promise<Comment> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const participant = this.participants.get(sessionId)?.get(commentData.userId);
    if (!participant?.permissions.canComment) {
      throw new Error('User does not have comment permissions');
    }

    const comment: Comment = {
      ...commentData,
      id: this.generateCommentId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      replies: [],
      reactions: []
    };

    const sessionComments = this.comments.get(sessionId) || [];
    sessionComments.push(comment);
    this.comments.set(sessionId, sessionComments);

    // Update analytics
    session.metadata.analytics.commentsCount++;

    this.broadcastToSession(sessionId, {
      type: 'comment_add',
      userId: commentData.userId,
      data: comment
    });

    // Notify mentioned users
    if (comment.mentions.length > 0) {
      await this.notifyMentionedUsers(sessionId, comment);
    }

    this.emit('comment_added', { sessionId, comment });
    return comment;
  }

  async resolveComment(sessionId: string, commentId: string, userId: string): Promise<void> {
    const sessionComments = this.comments.get(sessionId) || [];
    const comment = sessionComments.find(c => c.id === commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    comment.status = 'resolved';
    comment.resolvedAt = new Date();
    comment.resolvedBy = userId;
    comment.updatedAt = new Date();

    this.broadcastToSession(sessionId, {
      type: 'comment_resolve',
      userId,
      data: { commentId, resolvedBy: userId, resolvedAt: comment.resolvedAt }
    });

    this.emit('comment_resolved', { sessionId, commentId, userId });
  }

  // Conflict Resolution
  private async detectConflicts(sessionId: string, operation: TextOperation): Promise<void> {
    const sessionOperations = this.operations.get(sessionId) || [];
    const recentOperations = sessionOperations.filter(op =>
      op.fileId === operation.fileId &&
      op.id !== operation.id &&
      op.timestamp > new Date(Date.now() - 5000) && // Last 5 seconds
      this.operationsOverlap(op, operation)
    );

    if (recentOperations.length > 0) {
      const conflict: ConflictResolution = {
        id: this.generateConflictId(),
        sessionId,
        fileId: operation.fileId,
        conflictType: 'concurrent_edit',
        participants: [operation.userId, ...recentOperations.map(op => op.userId)],
        operations: [operation, ...recentOperations],
        resolutionStrategy: 'automatic',
        status: 'pending',
        createdAt: new Date()
      };

      const sessionConflicts = this.conflicts.get(sessionId) || [];
      sessionConflicts.push(conflict);
      this.conflicts.set(sessionId, sessionConflicts);

      // Attempt automatic resolution
      await this.attemptAutomaticResolution(conflict);

      this.emit('conflict_detected', conflict);
    }
  }

  private async attemptAutomaticResolution(conflict: ConflictResolution): Promise<void> {
    // Simple automatic resolution: accept the most recent operation
    const mostRecentOperation = conflict.operations
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    conflict.resolution = {
      acceptedOperation: mostRecentOperation.id,
      reasoning: 'Accepted most recent operation for automatic conflict resolution'
    };
    conflict.status = 'resolved';
    conflict.resolvedAt = new Date();
    conflict.resolvedBy = 'system';

    this.broadcastToSession(conflict.sessionId, {
      type: 'session_control',
      userId: 'system',
      data: {
        action: 'conflict_resolved',
        conflict: conflict
      }
    });
  }

  // Voice and Video Collaboration
  async startVoiceSession(sessionId: string): Promise<VoiceSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const voiceSession: VoiceSession = {
      id: this.generateVoiceSessionId(),
      sessionId,
      participants: [],
      isActive: true,
      quality: 'medium',
      isRecording: false
    };

    this.voiceSessions.set(voiceSession.id, voiceSession);

    this.broadcastToSession(sessionId, {
      type: 'voice_activity',
      userId: 'system',
      data: { action: 'voice_session_started', voiceSessionId: voiceSession.id }
    });

    this.emit('voice_session_started', voiceSession);
    return voiceSession;
  }

  async startScreenShare(sessionId: string, sharerId: string, type: 'screen' | 'window' | 'tab'): Promise<ScreenShare> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const screenShare: ScreenShare = {
      id: this.generateScreenShareId(),
      sessionId,
      sharerId,
      viewers: [],
      type,
      quality: 'medium',
      isActive: true,
      startedAt: new Date()
    };

    this.screenShares.set(screenShare.id, screenShare);

    this.broadcastToSession(sessionId, {
      type: 'screen_share',
      userId: sharerId,
      data: { action: 'started', screenShare }
    });

    this.emit('screen_share_started', screenShare);
    return screenShare;
  }

  // Session Analytics and Insights
  async getSessionAnalytics(sessionId: string): Promise<SessionAnalytics> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Calculate real-time analytics
    const operations = this.operations.get(sessionId) || [];
    const comments = this.comments.get(sessionId) || [];
    const participants = this.participants.get(sessionId) || new Map();

    const analytics: SessionAnalytics = {
      ...session.metadata.analytics,
      totalParticipants: participants.size,
      averageParticipants: this.calculateAverageParticipants(sessionId),
      totalDuration: this.calculateSessionDuration(session),
      codeChanges: operations.length,
      commentsCount: comments.length,
      filesModified: new Set(operations.map(op => op.fileId)).size,
      linesAdded: operations.filter(op => op.type === 'insert')
        .reduce((sum, op) => sum + (op.content.match(/\n/g) || []).length, 0),
      linesDeleted: operations.filter(op => op.type === 'delete')
        .reduce((sum, op) => sum + (op.content.match(/\n/g) || []).length, 0),
      productivityScore: this.calculateProductivityScore(sessionId),
      engagementScore: this.calculateEngagementScore(sessionId)
    };

    return analytics;
  }

  // Private Helper Methods
  private initializeCollaborationSystem(): void {
    // Clean up inactive sessions every 5 minutes
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, 5 * 60 * 1000);

    // Update participant statuses every minute
    setInterval(() => {
      this.updateParticipantStatuses();
    }, 60 * 1000);

    // Generate analytics every hour
    setInterval(() => {
      this.generatePeriodicAnalytics();
    }, 60 * 60 * 1000);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCommentId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVoiceSessionId(): string {
    return `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateScreenShareId(): string {
    return `screen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultPermissions(role: ParticipantRole): ParticipantPermissions {
    const basePermissions: Record<ParticipantRole, ParticipantPermissions> = {
      host: {
        canEdit: true,
        canComment: true,
        canShare: true,
        canInvite: true,
        canModerateSession: true,
        canViewPrivateFiles: true,
        canExecuteCode: true,
        canAccessTerminal: true
      },
      editor: {
        canEdit: true,
        canComment: true,
        canShare: false,
        canInvite: false,
        canModerateSession: false,
        canViewPrivateFiles: false,
        canExecuteCode: true,
        canAccessTerminal: true
      },
      reviewer: {
        canEdit: false,
        canComment: true,
        canShare: false,
        canInvite: false,
        canModerateSession: false,
        canViewPrivateFiles: false,
        canExecuteCode: false,
        canAccessTerminal: false
      },
      observer: {
        canEdit: false,
        canComment: false,
        canShare: false,
        canInvite: false,
        canModerateSession: false,
        canViewPrivateFiles: false,
        canExecuteCode: false,
        canAccessTerminal: false
      },
      guest: {
        canEdit: false,
        canComment: true,
        canShare: false,
        canInvite: false,
        canModerateSession: false,
        canViewPrivateFiles: false,
        canExecuteCode: false,
        canAccessTerminal: false
      }
    };

    return basePermissions[role];
  }

  private broadcastToSession(sessionId: string, event: Omit<CollaborationEvent, 'id' | 'sessionId' | 'timestamp' | 'acknowledgments'>, excludeUserId?: string): void {
    const sessionParticipants = this.participants.get(sessionId);
    if (!sessionParticipants) return;

    const collaborationEvent: CollaborationEvent = {
      ...event,
      id: this.generateOperationId(),
      sessionId,
      timestamp: new Date(),
      acknowledgments: []
    };

    for (const [userId, participant] of sessionParticipants) {
      if (excludeUserId && userId === excludeUserId) continue;

      const connection = this.connections.get(participant.connectionId);
      if (connection && connection.readyState === WebSocket.OPEN) {
        connection.send(JSON.stringify(collaborationEvent));
      }
    }
  }

  private transformOperation(operation: TextOperation, existingOperations: TextOperation[]): TextOperation {
    // Operational Transform (OT) implementation
    // This is a simplified version - real implementation would be more complex
    let transformedOperation = { ...operation };

    const concurrentOps = existingOperations.filter(op =>
      op.fileId === operation.fileId &&
      op.timestamp > new Date(operation.timestamp.getTime() - 1000) && // Within 1 second
      op.userId !== operation.userId
    );

    for (const concurrentOp of concurrentOps) {
      transformedOperation = this.transformAgainstOperation(transformedOperation, concurrentOp);
      transformedOperation.transformedBy.push(concurrentOp.id);
    }

    return transformedOperation;
  }

  private transformAgainstOperation(op1: TextOperation, op2: TextOperation): TextOperation {
    // Simplified OT - in reality this would handle all cases of concurrent operations
    if (op1.position.line > op2.position.line ||
        (op1.position.line === op2.position.line && op1.position.column > op2.position.column)) {

      if (op2.type === 'insert') {
        const newlines = (op2.content.match(/\n/g) || []).length;
        if (newlines > 0) {
          op1.position.line += newlines;
        } else if (op1.position.line === op2.position.line) {
          op1.position.column += op2.content.length;
        }
      } else if (op2.type === 'delete') {
        const newlines = (op2.content.match(/\n/g) || []).length;
        if (newlines > 0) {
          op1.position.line -= newlines;
        } else if (op1.position.line === op2.position.line) {
          op1.position.column -= op2.content.length;
        }
      }
    }

    return op1;
  }

  private operationsOverlap(op1: TextOperation, op2: TextOperation): boolean {
    if (op1.fileId !== op2.fileId) return false;

    // Simple overlap detection - real implementation would be more sophisticated
    const line1 = op1.position.line;
    const col1 = op1.position.column;
    const line2 = op2.position.line;
    const col2 = op2.position.column;

    return Math.abs(line1 - line2) <= 1 && Math.abs(col1 - col2) <= 10;
  }

  private async transferHostRole(sessionId: string, newHostUserId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    const sessionParticipants = this.participants.get(sessionId);

    if (!session || !sessionParticipants) return;

    const newHost = sessionParticipants.get(newHostUserId);
    if (!newHost) return;

    // Update old host
    const oldHost = sessionParticipants.get(session.hostUserId);
    if (oldHost) {
      oldHost.role = 'editor';
      oldHost.permissions = this.getDefaultPermissions('editor');
    }

    // Update new host
    newHost.role = 'host';
    newHost.permissions = this.getDefaultPermissions('host');

    // Update session
    session.hostUserId = newHostUserId;
    session.updatedAt = new Date();

    this.broadcastToSession(sessionId, {
      type: 'permission_change',
      userId: 'system',
      data: {
        action: 'host_transferred',
        oldHost: session.hostUserId,
        newHost: newHostUserId
      }
    });
  }

  private async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = 'ended';
    session.endedAt = new Date();
    session.updatedAt = new Date();

    // Calculate final analytics
    session.metadata.analytics = await this.getSessionAnalytics(sessionId);

    // Clean up resources
    this.participants.delete(sessionId);
    this.operations.delete(sessionId);

    this.emit('session_ended', session);
  }

  private async notifyMentionedUsers(sessionId: string, comment: Comment): Promise<void> {
    for (const mentionedUserId of comment.mentions) {
      const participant = this.participants.get(sessionId)?.get(mentionedUserId);
      if (participant) {
        const connection = this.connections.get(participant.connectionId);
        if (connection && connection.readyState === WebSocket.OPEN) {
          connection.send(JSON.stringify({
            type: 'mention_notification',
            userId: 'system',
            data: {
              comment,
              mentionedBy: comment.authorName
            }
          }));
        }
      }
    }
  }

  private cleanupInactiveSessions(): void {
    const now = new Date();
    const inactivityThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [sessionId, session] of this.sessions) {
      if (session.status === 'active' &&
          now.getTime() - session.updatedAt.getTime() > inactivityThreshold) {

        const sessionParticipants = this.participants.get(sessionId);
        if (!sessionParticipants || sessionParticipants.size === 0) {
          this.endSession(sessionId);
        }
      }
    }
  }

  private updateParticipantStatuses(): void {
    const idleThreshold = 5 * 60 * 1000; // 5 minutes
    const awayThreshold = 15 * 60 * 1000; // 15 minutes
    const now = new Date();

    for (const sessionParticipants of this.participants.values()) {
      for (const participant of sessionParticipants.values()) {
        const timeSinceActivity = now.getTime() - participant.lastActivity.getTime();

        let newStatus: Participant['status'] = 'active';
        if (timeSinceActivity > awayThreshold) {
          newStatus = 'away';
        } else if (timeSinceActivity > idleThreshold) {
          newStatus = 'idle';
        }

        if (participant.status !== newStatus) {
          participant.status = newStatus;
          // Broadcast status change would happen here
        }
      }
    }
  }

  private calculateAverageParticipants(sessionId: string): number {
    // This would track participant count over time and calculate average
    const sessionParticipants = this.participants.get(sessionId);
    return sessionParticipants ? sessionParticipants.size : 0;
  }

  private calculateSessionDuration(session: CollaborationSession): number {
    const endTime = session.endedAt || new Date();
    return endTime.getTime() - session.createdAt.getTime();
  }

  private calculateProductivityScore(sessionId: string): number {
    const operations = this.operations.get(sessionId) || [];
    const comments = this.comments.get(sessionId) || [];
    const session = this.sessions.get(sessionId);

    if (!session) return 0;

    const duration = this.calculateSessionDuration(session) / (1000 * 60 * 60); // hours
    const changesPerHour = operations.length / Math.max(duration, 0.1);
    const commentsPerHour = comments.length / Math.max(duration, 0.1);

    // Normalized score out of 100
    return Math.min(100, Math.round((changesPerHour * 10) + (commentsPerHour * 5)));
  }

  private calculateEngagementScore(sessionId: string): number {
    const sessionParticipants = this.participants.get(sessionId);
    const comments = this.comments.get(sessionId) || [];

    if (!sessionParticipants) return 0;

    const activeParticipants = Array.from(sessionParticipants.values())
      .filter(p => p.status === 'active').length;
    const participationRate = activeParticipants / sessionParticipants.size;
    const commentsPerParticipant = comments.length / Math.max(sessionParticipants.size, 1);

    return Math.min(100, Math.round((participationRate * 50) + (commentsPerParticipant * 10)));
  }

  private generatePeriodicAnalytics(): void {
    // Generate and store analytics for all active sessions
    for (const sessionId of this.sessions.keys()) {
      this.getSessionAnalytics(sessionId).then(analytics => {
        this.emit('analytics_updated', { sessionId, analytics });
      });
    }
  }

  // Public API Methods
  getSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values());
  }

  getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId);
  }

  getSessionParticipants(sessionId: string): Participant[] {
    const sessionParticipants = this.participants.get(sessionId);
    return sessionParticipants ? Array.from(sessionParticipants.values()) : [];
  }

  getSessionComments(sessionId: string): Comment[] {
    return this.comments.get(sessionId) || [];
  }

  getSessionOperations(sessionId: string): TextOperation[] {
    return this.operations.get(sessionId) || [];
  }

  getActiveConflicts(sessionId: string): ConflictResolution[] {
    const sessionConflicts = this.conflicts.get(sessionId) || [];
    return sessionConflicts.filter(c => c.status === 'pending');
  }
}

export default MultiUserCollaborationSystem;