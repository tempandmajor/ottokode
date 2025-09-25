import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabase';

export interface Team {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  settings: TeamSettings;
  members: TeamMember[];
  projects: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
  permissions: TeamPermissions;
  joinedAt: Date;
  lastActive?: Date;
  status: 'active' | 'inactive' | 'suspended';
}

export interface TeamPermissions {
  canCreateProjects: boolean;
  canManageMembers: boolean;
  canAccessBilling: boolean;
  canManageIntegrations: boolean;
  canViewAnalytics: boolean;
  canManageCommands: boolean;
  canAccessLogs: boolean;
}

export interface TeamSettings {
  defaultAIModel: string;
  allowedAIModels: string[];
  codingStandards: {
    linting: boolean;
    formatting: boolean;
    customRules: string[];
  };
  collaboration: {
    allowRealTimeEditing: boolean;
    requireCodeReview: boolean;
    maxConcurrentUsers: number;
  };
  security: {
    requireSSO: boolean;
    allowExternalSharing: boolean;
    dataRetentionDays: number;
  };
  billing: {
    usageLimits: {
      monthlyTokens: number;
      maxProjects: number;
      maxMembers: number;
    };
    costAlerts: {
      thresholds: number[];
      recipients: string[];
    };
  };
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: TeamMember['role'];
  invitedBy: string;
  token: string;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
}

export interface TeamUsage {
  teamId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalTokens: number;
    totalRequests: number;
    activeUsers: number;
    projectsCreated: number;
    collaborationSessions: number;
  };
  breakdown: {
    byUser: { userId: string; tokens: number; requests: number }[];
    byModel: { model: string; tokens: number; requests: number; cost: number }[];
    byProject: { projectId: string; tokens: number; requests: number }[];
  };
  costs: {
    total: number;
    byService: { service: string; cost: number }[];
  };
}

export class TeamService {
  private currentTeam: Team | null = null;

  constructor() {
    this.initializeTeamContext();
  }

  private async initializeTeamContext(): Promise<void> {
    // Load current user's default team
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        const teams = await this.getUserTeams(user.id);
        if (teams.length > 0) {
          this.currentTeam = teams[0]; // Default to first team
        }
      }
    } catch (error) {
      console.error('Error initializing team context:', error);
    }
  }

  async createTeam(data: {
    name: string;
    description: string;
    organizationId: string;
    settings?: Partial<TeamSettings>;
  }): Promise<Team> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const team: Team = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      organizationId: data.organizationId,
      settings: this.createDefaultSettings(data.settings),
      members: [
        {
          userId: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email!,
          role: 'owner',
          permissions: this.getOwnerPermissions(),
          joinedAt: new Date(),
          status: 'active'
        }
      ],
      projects: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const { data: teamData, error } = await supabase
        .from('teams')
        .insert({
          id: team.id,
          name: team.name,
          description: team.description,
          organization_id: team.organizationId,
          settings: team.settings,
          created_at: team.createdAt.toISOString(),
          updated_at: team.updatedAt.toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Add owner as first member
      await this.addTeamMember(team.id, team.members[0]);

      this.currentTeam = team;
      return team;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  async getTeam(teamId: string): Promise<Team | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_members(
            user_id,
            role,
            permissions,
            joined_at,
            last_active,
            status,
            profiles(email, name)
          )
        `)
        .eq('id', teamId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapTeamData(data);
    } catch (error) {
      console.error('Error fetching team:', error);
      return null;
    }
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          teams(
            *,
            team_members(
              user_id,
              role,
              permissions,
              joined_at,
              last_active,
              status,
              profiles(email, name)
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error || !data) {
        return [];
      }

      return data.map(item => this.mapTeamData(item.teams)).filter(Boolean);
    } catch (error) {
      console.error('Error fetching user teams:', error);
      return [];
    }
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
    if (!await this.hasPermission(teamId, 'canManageMembers')) {
      throw new Error('Insufficient permissions to update team');
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', teamId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedTeam = await this.getTeam(teamId);
      if (updatedTeam) {
        this.currentTeam = updatedTeam;
      }

      return updatedTeam!;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }

  async deleteTeam(teamId: string): Promise<void> {
    if (!await this.hasPermission(teamId, 'canManageMembers')) {
      throw new Error('Insufficient permissions to delete team');
    }

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) {
        throw error;
      }

      if (this.currentTeam?.id === teamId) {
        this.currentTeam = null;
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  }

  async inviteTeamMember(
    teamId: string,
    email: string,
    role: TeamMember['role']
  ): Promise<TeamInvitation> {
    if (!await this.hasPermission(teamId, 'canManageMembers')) {
      throw new Error('Insufficient permissions to invite members');
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const invitation: TeamInvitation = {
      id: uuidv4(),
      teamId,
      email,
      role,
      invitedBy: user.id,
      token: this.generateInvitationToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending',
      createdAt: new Date()
    };

    try {
      const { error } = await supabase
        .from('team_invitations')
        .insert({
          id: invitation.id,
          team_id: invitation.teamId,
          email: invitation.email,
          role: invitation.role,
          invited_by: invitation.invitedBy,
          token: invitation.token,
          expires_at: invitation.expiresAt.toISOString(),
          status: invitation.status,
          created_at: invitation.createdAt.toISOString()
        });

      if (error) {
        throw error;
      }

      // Send invitation email (would integrate with email service)
      await this.sendInvitationEmail(invitation);

      return invitation;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  }

  async acceptInvitation(token: string): Promise<void> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Get invitation
      const { data: invitation, error: fetchError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (fetchError || !invitation) {
        throw new Error('Invalid or expired invitation');
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Check if user email matches invitation
      if (user.email !== invitation.email) {
        throw new Error('Invitation is for a different email address');
      }

      // Add user to team
      const member: TeamMember = {
        userId: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email!,
        role: invitation.role,
        permissions: this.getRolePermissions(invitation.role),
        joinedAt: new Date(),
        status: 'active'
      };

      await this.addTeamMember(invitation.team_id, member);

      // Update invitation status
      await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    if (!await this.hasPermission(teamId, 'canManageMembers')) {
      throw new Error('Insufficient permissions to remove members');
    }

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  }

  async updateMemberRole(
    teamId: string,
    userId: string,
    role: TeamMember['role']
  ): Promise<void> {
    if (!await this.hasPermission(teamId, 'canManageMembers')) {
      throw new Error('Insufficient permissions to update member roles');
    }

    const permissions = this.getRolePermissions(role);

    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          role,
          permissions,
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  async getTeamUsage(
    teamId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TeamUsage> {
    if (!await this.hasPermission(teamId, 'canViewAnalytics')) {
      throw new Error('Insufficient permissions to view analytics');
    }

    try {
      // Fetch usage data from analytics tables
      const { data, error } = await supabase
        .from('team_usage')
        .select('*')
        .eq('team_id', teamId)
        .gte('period_start', startDate.toISOString())
        .lte('period_end', endDate.toISOString());

      if (error) {
        throw error;
      }

      // Aggregate and format usage data
      return this.aggregateUsageData(teamId, data, startDate, endDate);
    } catch (error) {
      console.error('Error fetching team usage:', error);
      throw error;
    }
  }

  async setCurrentTeam(teamId: string): Promise<void> {
    const team = await this.getTeam(teamId);
    if (team) {
      this.currentTeam = team;

      // Store preference
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            current_team_id: teamId,
            updated_at: new Date().toISOString()
          });
      }
    }
  }

  getCurrentTeam(): Team | null {
    return this.currentTeam;
  }

  // Private helper methods

  private createDefaultSettings(overrides?: Partial<TeamSettings>): TeamSettings {
    return {
      defaultAIModel: 'gpt-4-turbo',
      allowedAIModels: ['gpt-4-turbo', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet'],
      codingStandards: {
        linting: true,
        formatting: true,
        customRules: []
      },
      collaboration: {
        allowRealTimeEditing: true,
        requireCodeReview: false,
        maxConcurrentUsers: 10
      },
      security: {
        requireSSO: false,
        allowExternalSharing: true,
        dataRetentionDays: 30
      },
      billing: {
        usageLimits: {
          monthlyTokens: 100000,
          maxProjects: 10,
          maxMembers: 5
        },
        costAlerts: {
          thresholds: [50, 80, 100],
          recipients: []
        }
      },
      ...overrides
    };
  }

  private getOwnerPermissions(): TeamPermissions {
    return {
      canCreateProjects: true,
      canManageMembers: true,
      canAccessBilling: true,
      canManageIntegrations: true,
      canViewAnalytics: true,
      canManageCommands: true,
      canAccessLogs: true
    };
  }

  private getRolePermissions(role: TeamMember['role']): TeamPermissions {
    const permissions = {
      owner: this.getOwnerPermissions(),
      admin: {
        canCreateProjects: true,
        canManageMembers: true,
        canAccessBilling: false,
        canManageIntegrations: true,
        canViewAnalytics: true,
        canManageCommands: true,
        canAccessLogs: true
      },
      developer: {
        canCreateProjects: true,
        canManageMembers: false,
        canAccessBilling: false,
        canManageIntegrations: false,
        canViewAnalytics: false,
        canManageCommands: false,
        canAccessLogs: false
      },
      viewer: {
        canCreateProjects: false,
        canManageMembers: false,
        canAccessBilling: false,
        canManageIntegrations: false,
        canViewAnalytics: false,
        canManageCommands: false,
        canAccessLogs: false
      }
    };

    return permissions[role];
  }

  private async addTeamMember(teamId: string, member: TeamMember): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: member.userId,
        role: member.role,
        permissions: member.permissions,
        joined_at: member.joinedAt.toISOString(),
        last_active: member.lastActive?.toISOString(),
        status: member.status
      });

    if (error) {
      throw error;
    }
  }

  private async hasPermission(
    teamId: string,
    permission: keyof TeamPermissions
  ): Promise<boolean> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('permissions')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error || !data) return false;

      return data.permissions[permission] === true;
    } catch {
      return false;
    }
  }

  private generateInvitationToken(): string {
    return `inv_${uuidv4().replace(/-/g, '')}`;
  }

  private async sendInvitationEmail(invitation: TeamInvitation): Promise<void> {
    // In production, this would integrate with an email service
    console.log(`Invitation sent to ${invitation.email} for team ${invitation.teamId}`);
  }

  private mapTeamData(data: any): Team {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      organizationId: data.organization_id,
      settings: data.settings,
      members: data.team_members?.map((tm: any) => ({
        userId: tm.user_id,
        email: tm.profiles?.email || '',
        name: tm.profiles?.name || '',
        role: tm.role,
        permissions: tm.permissions,
        joinedAt: new Date(tm.joined_at),
        lastActive: tm.last_active ? new Date(tm.last_active) : undefined,
        status: tm.status
      })) || [],
      projects: [], // Would be loaded separately
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private aggregateUsageData(
    teamId: string,
    rawData: any[],
    startDate: Date,
    endDate: Date
  ): TeamUsage {
    // Aggregate raw usage data into structured format
    const totalTokens = rawData.reduce((sum, record) => sum + (record.tokens || 0), 0);
    const totalRequests = rawData.reduce((sum, record) => sum + (record.requests || 0), 0);

    return {
      teamId,
      period: { start: startDate, end: endDate },
      metrics: {
        totalTokens,
        totalRequests,
        activeUsers: new Set(rawData.map(r => r.user_id)).size,
        projectsCreated: rawData.filter(r => r.event_type === 'project_created').length,
        collaborationSessions: rawData.filter(r => r.event_type === 'collaboration_session').length
      },
      breakdown: {
        byUser: this.aggregateByUser(rawData),
        byModel: this.aggregateByModel(rawData),
        byProject: this.aggregateByProject(rawData)
      },
      costs: {
        total: rawData.reduce((sum, record) => sum + (record.cost || 0), 0),
        byService: this.aggregateByService(rawData)
      }
    };
  }

  private aggregateByUser(rawData: any[]): { userId: string; tokens: number; requests: number }[] {
    const userMap = new Map();

    rawData.forEach(record => {
      const userId = record.user_id;
      if (!userMap.has(userId)) {
        userMap.set(userId, { userId, tokens: 0, requests: 0 });
      }

      const user = userMap.get(userId);
      user.tokens += record.tokens || 0;
      user.requests += record.requests || 0;
    });

    return Array.from(userMap.values());
  }

  private aggregateByModel(rawData: any[]): { model: string; tokens: number; requests: number; cost: number }[] {
    const modelMap = new Map();

    rawData.forEach(record => {
      const model = record.ai_model || 'unknown';
      if (!modelMap.has(model)) {
        modelMap.set(model, { model, tokens: 0, requests: 0, cost: 0 });
      }

      const modelData = modelMap.get(model);
      modelData.tokens += record.tokens || 0;
      modelData.requests += record.requests || 0;
      modelData.cost += record.cost || 0;
    });

    return Array.from(modelMap.values());
  }

  private aggregateByProject(rawData: any[]): { projectId: string; tokens: number; requests: number }[] {
    const projectMap = new Map();

    rawData.forEach(record => {
      const projectId = record.project_id || 'unknown';
      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, { projectId, tokens: 0, requests: 0 });
      }

      const project = projectMap.get(projectId);
      project.tokens += record.tokens || 0;
      project.requests += record.requests || 0;
    });

    return Array.from(projectMap.values());
  }

  private aggregateByService(rawData: any[]): { service: string; cost: number }[] {
    const serviceMap = new Map();

    rawData.forEach(record => {
      const service = record.service_type || 'ai-service';
      if (!serviceMap.has(service)) {
        serviceMap.set(service, { service, cost: 0 });
      }

      const serviceData = serviceMap.get(service);
      serviceData.cost += record.cost || 0;
    });

    return Array.from(serviceMap.values());
  }
}

export const teamService = new TeamService();
export default TeamService;