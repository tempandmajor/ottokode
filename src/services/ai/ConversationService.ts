import { supabase } from '../../lib/supabase';
import { authService } from '../auth/AuthService';
import { EventEmitter } from '../../utils/EventEmitter';

export interface AIMessage {
  id?: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  tokens: number;
  cost: number;
  created_at: Date;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  model: string;
  provider: string;
  total_tokens: number;
  total_cost: number;
  created_at: Date;
  updated_at: Date;
  messages: AIMessage[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  model: string;
  provider: string;
  message_count: number;
  total_tokens: number;
  total_cost: number;
  last_message_at: Date;
  created_at: Date;
}

class ConversationService extends EventEmitter {
  private activeConversation: AIConversation | null = null;

  constructor() {
    super();
  }

  async createConversation(data: {
    title: string;
    model: string;
    provider: string;
  }): Promise<AIConversation> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data: conversation, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: authState.user.id,
          title: data.title,
          model: data.model,
          provider: data.provider,
          total_tokens: 0,
          total_cost: 0
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newConversation: AIConversation = {
        ...conversation,
        created_at: new Date(conversation.created_at),
        updated_at: new Date(conversation.updated_at),
        messages: []
      };

      this.activeConversation = newConversation;
      this.emit('conversationCreated', newConversation);

      return newConversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  }

  async getConversation(conversationId: string): Promise<AIConversation> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error('User not authenticated');
    }

    try {
      // Get conversation details
      const { data: conversation, error: conversationError } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', authState.user.id)
        .single();

      if (conversationError || !conversation) {
        throw new Error('Conversation not found');
      }

      // Get messages
      const { data: messages, error: messagesError } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        throw messagesError;
      }

      const fullConversation: AIConversation = {
        ...conversation,
        created_at: new Date(conversation.created_at),
        updated_at: new Date(conversation.updated_at),
        messages: (messages || []).map(msg => ({
          ...msg,
          created_at: new Date(msg.created_at)
        }))
      };

      return fullConversation;
    } catch (error) {
      console.error('Failed to get conversation:', error);
      throw error;
    }
  }

  async getConversationSummaries(limit = 50): Promise<ConversationSummary[]> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data: conversations, error } = await supabase
        .from('ai_conversations')
        .select(`
          id,
          title,
          model,
          provider,
          total_tokens,
          total_cost,
          created_at,
          updated_at,
          ai_messages (count)
        `)
        .eq('user_id', authState.user.id)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (conversations || []).map(conv => ({
        id: conv.id,
        title: conv.title,
        model: conv.model,
        provider: conv.provider,
        message_count: conv.ai_messages?.[0]?.count || 0,
        total_tokens: conv.total_tokens,
        total_cost: conv.total_cost,
        last_message_at: new Date(conv.updated_at),
        created_at: new Date(conv.created_at)
      }));
    } catch (error) {
      console.error('Failed to get conversation summaries:', error);
      throw error;
    }
  }

  async addMessage(
    conversationId: string,
    message: Omit<AIMessage, 'id' | 'conversation_id' | 'created_at'>
  ): Promise<AIMessage> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error('User not authenticated');
    }

    try {
      // Add the message
      const { data: newMessage, error: messageError } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          tokens: message.tokens,
          cost: message.cost
        })
        .select()
        .single();

      if (messageError) {
        throw messageError;
      }

      // Update conversation totals
      const { error: updateError } = await supabase.rpc('update_conversation_totals', {
        conversation_id: conversationId,
        additional_tokens: message.tokens,
        additional_cost: message.cost
      });

      if (updateError) {
        console.error('Failed to update conversation totals:', updateError);
      }

      const addedMessage: AIMessage = {
        ...newMessage,
        created_at: new Date(newMessage.created_at)
      };

      // Update local active conversation if it matches
      if (this.activeConversation?.id === conversationId) {
        this.activeConversation.messages.push(addedMessage);
        this.activeConversation.total_tokens += message.tokens;
        this.activeConversation.total_cost += message.cost;
        this.activeConversation.updated_at = new Date();
      }

      this.emit('messageAdded', addedMessage);
      return addedMessage;
    } catch (error) {
      console.error('Failed to add message:', error);
      throw error;
    }
  }

  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ title })
        .eq('id', conversationId)
        .eq('user_id', authState.user.id);

      if (error) {
        throw error;
      }

      // Update local active conversation if it matches
      if (this.activeConversation?.id === conversationId) {
        this.activeConversation.title = title;
        this.activeConversation.updated_at = new Date();
      }

      this.emit('conversationUpdated', conversationId, { title });
    } catch (error) {
      console.error('Failed to update conversation title:', error);
      throw error;
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', authState.user.id);

      if (error) {
        throw error;
      }

      // Clear active conversation if it matches
      if (this.activeConversation?.id === conversationId) {
        this.activeConversation = null;
      }

      this.emit('conversationDeleted', conversationId);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }

  async searchConversations(query: string, limit = 20): Promise<ConversationSummary[]> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data: conversations, error } = await supabase
        .from('ai_conversations')
        .select(`
          id,
          title,
          model,
          provider,
          total_tokens,
          total_cost,
          created_at,
          updated_at,
          ai_messages (count)
        `)
        .eq('user_id', authState.user.id)
        .or(`title.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (conversations || []).map(conv => ({
        id: conv.id,
        title: conv.title,
        model: conv.model,
        provider: conv.provider,
        message_count: conv.ai_messages?.[0]?.count || 0,
        total_tokens: conv.total_tokens,
        total_cost: conv.total_cost,
        last_message_at: new Date(conv.updated_at),
        created_at: new Date(conv.created_at)
      }));
    } catch (error) {
      console.error('Failed to search conversations:', error);
      throw error;
    }
  }

  async exportConversation(conversationId: string): Promise<string> {
    try {
      const conversation = await this.getConversation(conversationId);

      const exportData = {
        conversation: {
          id: conversation.id,
          title: conversation.title,
          model: conversation.model,
          provider: conversation.provider,
          created_at: conversation.created_at,
          total_tokens: conversation.total_tokens,
          total_cost: conversation.total_cost
        },
        messages: conversation.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          tokens: msg.tokens,
          cost: msg.cost,
          created_at: msg.created_at
        }))
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export conversation:', error);
      throw error;
    }
  }

  async getConversationStats(timeRange: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<{
    totalConversations: number;
    totalMessages: number;
    totalTokens: number;
    totalCost: number;
    averageMessagesPerConversation: number;
    averageTokensPerMessage: number;
    providerBreakdown: Record<string, { conversations: number; cost: number; tokens: number }>;
    modelBreakdown: Record<string, { conversations: number; cost: number; tokens: number }>;
  }> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error('User not authenticated');
    }

    const now = new Date();
    const startDate = this.getStartDate(now, timeRange);

    try {
      const { data: conversations, error } = await supabase
        .from('ai_conversations')
        .select(`
          id,
          provider,
          model,
          total_tokens,
          total_cost,
          ai_messages (count)
        `)
        .eq('user_id', authState.user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString());

      if (error) {
        throw error;
      }

      const stats = {
        totalConversations: conversations?.length || 0,
        totalMessages: 0,
        totalTokens: 0,
        totalCost: 0,
        averageMessagesPerConversation: 0,
        averageTokensPerMessage: 0,
        providerBreakdown: {} as Record<string, any>,
        modelBreakdown: {} as Record<string, any>
      };

      if (conversations && conversations.length > 0) {
        stats.totalMessages = conversations.reduce((sum, conv) =>
          sum + (conv.ai_messages?.[0]?.count || 0), 0);
        stats.totalTokens = conversations.reduce((sum, conv) =>
          sum + conv.total_tokens, 0);
        stats.totalCost = conversations.reduce((sum, conv) =>
          sum + conv.total_cost, 0);

        stats.averageMessagesPerConversation = stats.totalMessages / stats.totalConversations;
        stats.averageTokensPerMessage = stats.totalMessages > 0 ?
          stats.totalTokens / stats.totalMessages : 0;

        // Provider breakdown
        conversations.forEach(conv => {
          if (!stats.providerBreakdown[conv.provider]) {
            stats.providerBreakdown[conv.provider] = {
              conversations: 0, cost: 0, tokens: 0
            };
          }
          stats.providerBreakdown[conv.provider].conversations += 1;
          stats.providerBreakdown[conv.provider].cost += conv.total_cost;
          stats.providerBreakdown[conv.provider].tokens += conv.total_tokens;
        });

        // Model breakdown
        conversations.forEach(conv => {
          if (!stats.modelBreakdown[conv.model]) {
            stats.modelBreakdown[conv.model] = {
              conversations: 0, cost: 0, tokens: 0
            };
          }
          stats.modelBreakdown[conv.model].conversations += 1;
          stats.modelBreakdown[conv.model].cost += conv.total_cost;
          stats.modelBreakdown[conv.model].tokens += conv.total_tokens;
        });
      }

      return stats;
    } catch (error) {
      console.error('Failed to get conversation stats:', error);
      throw error;
    }
  }

  private getStartDate(now: Date, timeRange: string): Date {
    const start = new Date(now);

    switch (timeRange) {
      case 'day':
        start.setDate(start.getDate() - 1);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return start;
  }

  // Setters and getters
  setActiveConversation(conversation: AIConversation | null): void {
    this.activeConversation = conversation;
    this.emit('activeConversationChanged', conversation);
  }

  getActiveConversation(): AIConversation | null {
    return this.activeConversation;
  }
}

export const conversationService = new ConversationService();