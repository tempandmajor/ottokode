import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { authService } from '../auth/AuthService';
import { EventEmitter } from '../../utils/EventEmitter';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  color: string;
  isOnline: boolean;
  lastSeen: Date;
  cursor?: {
    file_id: string;
    line: number;
    column: number;
  };
  selection?: {
    file_id: string;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

export interface CollaborationSession {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
  participants: CollaborationUser[];
}

export interface FileOperation {
  id?: string;
  session_id: string;
  user_id: string;
  file_id: string;
  operation_type: 'insert' | 'delete' | 'replace';
  position_line: number;
  position_column: number;
  content?: string;
  content_length: number;
  created_at: Date;
}

export interface SessionParticipant {
  id?: string;
  session_id: string;
  user_id: string;
  joined_at: Date;
  last_seen: Date;
  cursor_file_id?: string;
  cursor_line?: number;
  cursor_column?: number;
}

class SupabaseCollaborationService extends EventEmitter {
  private currentSession: CollaborationSession | null = null;
  private currentUser: CollaborationUser | null = null;
  private realtimeChannel: RealtimeChannel | null = null;
  private operationQueue: FileOperation[] = [];
  private isConnected = false;

  constructor() {
    super();
  }

  // Session Management
  async createSession(sessionData: {
    name: string;
    description?: string;
    is_public: boolean;
  }): Promise<CollaborationSession> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data: session, error } = await supabase
        .from('collaboration_sessions')
        .insert({
          name: sessionData.name,
          description: sessionData.description,
          owner_id: authState.user.id,
          is_public: sessionData.is_public
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const collaborationSession: CollaborationSession = {
        ...session,
        created_at: new Date(session.created_at),
        updated_at: new Date(session.updated_at),
        participants: []
      };

      // Join the session as the owner
      await this.joinSession(session.id);

      this.emit('sessionCreated', collaborationSession);
      return collaborationSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  async joinSession(sessionId: string): Promise<boolean> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error('User not authenticated');
    }

    try {
      // Get session details
      const { data: session, error: sessionError } = await supabase
        .from('collaboration_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        throw new Error('Session not found or access denied');
      }

      // Check if user can join (public session or owner)
      if (!session.is_public && session.owner_id !== authState.user.id) {
        throw new Error('Access denied to private session');
      }

      // Add participant record
      const { error: participantError } = await supabase
        .from('session_participants')
        .upsert({
          session_id: sessionId,
          user_id: authState.user.id,
          joined_at: new Date().toISOString(),
          last_seen: new Date().toISOString()
        });

      if (participantError) {
        throw participantError;
      }

      // Set current session and user
      this.currentSession = {
        ...session,
        created_at: new Date(session.created_at),
        updated_at: new Date(session.updated_at),
        participants: []
      };

      this.currentUser = {
        id: authState.user.id,
        name: authState.user.name || authState.user.email,
        email: authState.user.email,
        avatar_url: authState.user.avatar_url,
        color: authState.user.color,
        isOnline: true,
        lastSeen: new Date()
      };

      // Subscribe to real-time updates
      await this.subscribeToSession(sessionId);

      // Load existing participants
      await this.loadParticipants();

      this.emit('sessionJoined', this.currentSession);
      return true;
    } catch (error) {
      console.error('Failed to join session:', error);
      return false;
    }
  }

  async leaveSession(): Promise<void> {
    if (!this.currentSession || !this.currentUser) {
      return;
    }

    try {
      // Update last seen timestamp
      await supabase
        .from('session_participants')
        .update({ last_seen: new Date().toISOString() })
        .eq('session_id', this.currentSession.id)
        .eq('user_id', this.currentUser.id);

      // Unsubscribe from real-time updates
      if (this.realtimeChannel) {
        supabase.removeChannel(this.realtimeChannel);
        this.realtimeChannel = null;
      }

      this.currentSession = null;
      this.currentUser = null;
      this.isConnected = false;

      this.emit('sessionLeft');
    } catch (error) {
      console.error('Failed to leave session:', error);
    }
  }

  async getSessions(onlyOwnedByUser = false): Promise<CollaborationSession[]> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error('User not authenticated');
    }

    try {
      let query = supabase
        .from('collaboration_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (onlyOwnedByUser) {
        query = query.eq('owner_id', authState.user.id);
      } else {
        // Show public sessions and sessions where user is owner
        query = query.or(`is_public.eq.true,owner_id.eq.${authState.user.id}`);
      }

      const { data: sessions, error } = await query;

      if (error) {
        throw error;
      }

      return (sessions || []).map(session => ({
        ...session,
        created_at: new Date(session.created_at),
        updated_at: new Date(session.updated_at),
        participants: []
      }));
    } catch (error) {
      console.error('Failed to get sessions:', error);
      throw error;
    }
  }

  // Real-time Editing
  async applyEdit(fileId: string, operation: Omit<FileOperation, 'id' | 'session_id' | 'user_id' | 'created_at'>): Promise<void> {
    if (!this.currentUser || !this.currentSession) {
      throw new Error('No active session');
    }

    const fileOperation: FileOperation = {
      session_id: this.currentSession.id,
      user_id: this.currentUser.id,
      file_id: fileId,
      operation_type: operation.operation_type,
      position_line: operation.position_line,
      position_column: operation.position_column,
      content: operation.content,
      content_length: operation.content_length,
      created_at: new Date()
    };

    try {
      // Save to database
      const { data, error } = await supabase
        .from('file_operations')
        .insert(fileOperation)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Apply locally first for instant feedback
      this.emit('localEdit', { ...fileOperation, id: data.id });

      // Real-time updates will be handled by the subscription
    } catch (error) {
      console.error('Failed to apply edit:', error);
      // Queue for retry
      this.operationQueue.push(fileOperation);
      throw error;
    }
  }

  async updateCursor(fileId: string, line: number, column: number): Promise<void> {
    if (!this.currentUser || !this.currentSession) {
      return;
    }

    try {
      await supabase
        .from('session_participants')
        .update({
          cursor_file_id: fileId,
          cursor_line: line,
          cursor_column: column,
          last_seen: new Date().toISOString()
        })
        .eq('session_id', this.currentSession.id)
        .eq('user_id', this.currentUser.id);

      // Update local state
      this.currentUser.cursor = { file_id: fileId, line, column };
    } catch (error) {
      console.error('Failed to update cursor:', error);
    }
  }

  async getFileOperations(fileId: string, limit = 100): Promise<FileOperation[]> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    try {
      const { data: operations, error } = await supabase
        .from('file_operations')
        .select('*')
        .eq('session_id', this.currentSession.id)
        .eq('file_id', fileId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (operations || []).map(op => ({
        ...op,
        created_at: new Date(op.created_at)
      }));
    } catch (error) {
      console.error('Failed to get file operations:', error);
      throw error;
    }
  }

  // Private methods
  private async subscribeToSession(sessionId: string): Promise<void> {
    // Subscribe to file operations
    this.realtimeChannel = supabase
      .channel(`collaboration:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'file_operations',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const operation = {
            ...payload.new,
            created_at: new Date(payload.new.created_at)
          } as FileOperation;

          // Don't emit for our own operations
          if (operation.user_id !== this.currentUser?.id) {
            this.emit('remoteEdit', operation);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const participant = payload.new;

          // Don't emit for our own cursor updates
          if (participant.user_id !== this.currentUser?.id) {
            this.emit('cursorUpdate', participant.user_id, {
              file_id: participant.cursor_file_id,
              line: participant.cursor_line,
              column: participant.cursor_column
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`
        },
        async (payload) => {
          const participant = payload.new;

          // Don't emit for ourselves
          if (participant.user_id !== this.currentUser?.id) {
            // Get user details
            const { data: user } = await supabase
              .from('users')
              .select('*')
              .eq('id', participant.user_id)
              .single();

            if (user) {
              const collaborationUser: CollaborationUser = {
                id: user.id,
                name: user.name || user.email,
                email: user.email,
                avatar_url: user.avatar_url,
                color: user.color,
                isOnline: true,
                lastSeen: new Date(participant.last_seen)
              };

              this.emit('userJoined', collaborationUser);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          this.emit('connected');
        } else if (status === 'CLOSED') {
          this.isConnected = false;
          this.emit('disconnected');
        }
      });
  }

  private async loadParticipants(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    try {
      const { data: participants, error } = await supabase
        .from('session_participants')
        .select(`
          *,
          users (
            id,
            name,
            email,
            avatar_url,
            color
          )
        `)
        .eq('session_id', this.currentSession.id);

      if (error) {
        throw error;
      }

      const collaborationUsers: CollaborationUser[] = (participants || []).map(p => ({
        id: p.users.id,
        name: p.users.name || p.users.email,
        email: p.users.email,
        avatar_url: p.users.avatar_url,
        color: p.users.color,
        isOnline: true, // Assume online if in participants table
        lastSeen: new Date(p.last_seen),
        cursor: p.cursor_file_id ? {
          file_id: p.cursor_file_id,
          line: p.cursor_line || 0,
          column: p.cursor_column || 0
        } : undefined
      }));

      this.currentSession.participants = collaborationUsers;
      this.emit('participantsLoaded', collaborationUsers);
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
  }

  // Public getters
  getCurrentSession(): CollaborationSession | null {
    return this.currentSession;
  }

  getCurrentUser(): CollaborationUser | null {
    return this.currentUser;
  }

  isSessionActive(): boolean {
    return this.currentSession !== null && this.isConnected;
  }

  getParticipants(): CollaborationUser[] {
    return this.currentSession?.participants || [];
  }

  getOnlineUsers(): CollaborationUser[] {
    return this.getParticipants().filter(u => u.isOnline);
  }
}

export const supabaseCollaborationService = new SupabaseCollaborationService();