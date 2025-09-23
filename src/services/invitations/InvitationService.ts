import { supabase } from '../../lib/supabase';
import { EventEmitter } from '../../utils/EventEmitter';
import { authService } from '../auth/AuthService';
import { organizationService, MemberPermissions } from '../organizations/OrganizationService';

export interface Invitation {
  id: string;
  organization_id?: string;
  project_id?: string;
  team_id?: string;
  invited_by: string;
  email: string;
  role: string;
  permissions: any;
  token: string;
  expires_at: string;
  accepted_at?: string;
  accepted_by?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  created_at: string;
  inviter?: {
    id: string;
    name?: string;
    email: string;
    avatar_url?: string;
  };
  organization?: {
    id: string;
    name: string;
    logo_url?: string;
  };
  project?: {
    id: string;
    name: string;
  };
  team?: {
    id: string;
    name: string;
  };
}

export interface SendInvitationRequest {
  emails: string[];
  role: string;
  permissions?: Partial<MemberPermissions>;
  message?: string;
  organization_id?: string;
  project_id?: string;
  team_id?: string;
}

export interface BulkInviteRequest {
  invitations: Array<{
    email: string;
    role: string;
    permissions?: any;
  }>;
  organization_id?: string;
  project_id?: string;
  team_id?: string;
  message?: string;
}

class InvitationService extends EventEmitter {
  constructor() {
    super();
  }

  async sendOrganizationInvitation(request: SendInvitationRequest & { organization_id: string }): Promise<Invitation[]> {
    await organizationService.requirePermission(request.organization_id, 'manage_members');

    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const organization = await organizationService.getOrganization(request.organization_id);
    if (!organization) throw new Error('Organization not found');

    const invitations: Invitation[] = [];

    for (const email of request.emails) {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', request.organization_id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        throw new Error(`${email} is already a member of this organization`);
      }

      // Check if there's already a pending invitation
      const { data: existingInvitation } = await supabase
        .from('invitations')
        .select('id')
        .eq('organization_id', request.organization_id)
        .eq('email', email)
        .eq('status', 'pending')
        .single();

      if (existingInvitation) {
        throw new Error(`${email} already has a pending invitation`);
      }

      // Create invitation
      const { data: invitation, error } = await supabase
        .from('invitations')
        .insert({
          organization_id: request.organization_id,
          invited_by: user.id,
          email,
          role: request.role,
          permissions: request.permissions || organizationService.getDefaultPermissions(request.role),
        })
        .select(`
          *,
          users:invited_by (id, name, email, avatar_url),
          organizations:organization_id (id, name, logo_url)
        `)
        .single();

      if (error) {
        console.error('Error creating invitation:', error);
        throw error;
      }

      // Send invitation email
      await this.sendInvitationEmail({
        invitation: {
          ...invitation,
          inviter: invitation.users,
          organization: invitation.organizations
        },
        message: request.message,
      });

      invitations.push({
        ...invitation,
        inviter: invitation.users,
        organization: invitation.organizations
      });
    }

    this.emit('invitationsSent', { organizationId: request.organization_id, invitations });
    return invitations;
  }

  async sendBulkInvitations(request: BulkInviteRequest): Promise<Invitation[]> {
    if (request.organization_id) {
      await organizationService.requirePermission(request.organization_id, 'manage_members');
    }

    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const invitations: Invitation[] = [];

    for (const inviteData of request.invitations) {
      // Create invitation
      const { data: invitation, error } = await supabase
        .from('invitations')
        .insert({
          organization_id: request.organization_id,
          project_id: request.project_id,
          team_id: request.team_id,
          invited_by: user.id,
          email: inviteData.email,
          role: inviteData.role,
          permissions: inviteData.permissions,
        })
        .select(`
          *,
          users:invited_by (id, name, email, avatar_url),
          organizations:organization_id (id, name, logo_url),
          projects:project_id (id, name),
          teams:team_id (id, name)
        `)
        .single();

      if (error) {
        console.error('Error creating bulk invitation:', error);
        continue; // Skip this invitation but continue with others
      }

      // Send invitation email
      await this.sendInvitationEmail({
        invitation: {
          ...invitation,
          inviter: invitation.users,
          organization: invitation.organizations,
          project: invitation.projects,
          team: invitation.teams
        },
        message: request.message,
      });

      invitations.push({
        ...invitation,
        inviter: invitation.users,
        organization: invitation.organizations,
        project: invitation.projects,
        team: invitation.teams
      });
    }

    this.emit('bulkInvitationsSent', invitations);
    return invitations;
  }

  async getInvitation(token: string): Promise<Invitation | null> {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        users:invited_by (id, name, email, avatar_url),
        organizations:organization_id (id, name, logo_url),
        projects:project_id (id, name),
        teams:team_id (id, name)
      `)
      .eq('token', token)
      .single();

    if (error) {
      console.error('Error getting invitation:', error);
      return null;
    }

    return {
      ...data,
      inviter: data.users,
      organization: data.organizations,
      project: data.projects,
      team: data.teams
    };
  }

  async acceptInvitation(token: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const invitation = await this.getInvitation(token);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer valid');
    }

    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('Invitation has expired');
    }

    if (invitation.email !== user.email) {
      throw new Error('Invitation email does not match authenticated user');
    }

    // Accept the invitation
    const { error: acceptError } = await supabase
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: user.id,
      })
      .eq('token', token);

    if (acceptError) {
      console.error('Error accepting invitation:', acceptError);
      throw acceptError;
    }

    // Add user to organization/project/team
    if (invitation.organization_id) {
      await this.addToOrganization(invitation, user.id);
    }

    if (invitation.project_id) {
      await this.addToProject(invitation, user.id);
    }

    if (invitation.team_id) {
      await this.addToTeam(invitation, user.id);
    }

    this.emit('invitationAccepted', { invitation, userId: user.id });
  }

  async declineInvitation(token: string): Promise<void> {
    const invitation = await this.getInvitation(token);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    const { error } = await supabase
      .from('invitations')
      .update({
        status: 'cancelled',
      })
      .eq('token', token);

    if (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }

    this.emit('invitationDeclined', { invitation });
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get invitation to check permissions
    const { data: invitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Check if user has permission to cancel
    if (invitation.invited_by !== user.id) {
      if (invitation.organization_id) {
        await organizationService.requirePermission(invitation.organization_id, 'manage_members');
      } else {
        throw new Error('Permission denied');
      }
    }

    const { error } = await supabase
      .from('invitations')
      .update({
        status: 'cancelled',
      })
      .eq('id', invitationId);

    if (error) {
      console.error('Error cancelling invitation:', error);
      throw error;
    }

    this.emit('invitationCancelled', { invitationId });
  }

  async getOrganizationInvitations(organizationId: string): Promise<Invitation[]> {
    await organizationService.requirePermission(organizationId, 'manage_members');

    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        users:invited_by (id, name, email, avatar_url)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting organization invitations:', error);
      throw error;
    }

    return data?.map(inv => ({
      ...inv,
      inviter: inv.users
    })) || [];
  }

  async getUserInvitations(): Promise<Invitation[]> {
    const user = authService.getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        users:invited_by (id, name, email, avatar_url),
        organizations:organization_id (id, name, logo_url),
        projects:project_id (id, name),
        teams:team_id (id, name)
      `)
      .eq('email', user.email)
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user invitations:', error);
      return [];
    }

    return data?.map(inv => ({
      ...inv,
      inviter: inv.users,
      organization: inv.organizations,
      project: inv.projects,
      team: inv.teams
    })) || [];
  }

  async resendInvitation(invitationId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data: invitation, error } = await supabase
      .from('invitations')
      .select(`
        *,
        users:invited_by (id, name, email, avatar_url),
        organizations:organization_id (id, name, logo_url)
      `)
      .eq('id', invitationId)
      .single();

    if (error || !invitation) {
      throw new Error('Invitation not found');
    }

    // Check permissions
    if (invitation.invited_by !== user.id && invitation.organization_id) {
      await organizationService.requirePermission(invitation.organization_id, 'manage_members');
    }

    // Extend expiration
    const newExpiration = new Date();
    newExpiration.setDate(newExpiration.getDate() + 7);

    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        expires_at: newExpiration.toISOString(),
        status: 'pending',
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      throw updateError;
    }

    // Resend email
    await this.sendInvitationEmail({
      invitation: {
        ...invitation,
        inviter: invitation.users,
        organization: invitation.organizations,
        expires_at: newExpiration.toISOString()
      },
    });

    this.emit('invitationResent', { invitationId });
  }

  private async addToOrganization(invitation: Invitation, userId: string): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: invitation.organization_id,
        user_id: userId,
        role: invitation.role,
        permissions: invitation.permissions,
        invited_by: invitation.invited_by,
        invited_at: invitation.created_at,
        joined_at: new Date().toISOString(),
        status: 'active',
      });

    if (error) {
      console.error('Error adding user to organization:', error);
      throw error;
    }
  }

  private async addToProject(invitation: Invitation, userId: string): Promise<void> {
    const { error } = await supabase
      .from('project_collaborators')
      .insert({
        project_id: invitation.project_id,
        user_id: userId,
        role: invitation.role,
        permissions: invitation.permissions,
        invited_by: invitation.invited_by,
        invited_at: invitation.created_at,
        joined_at: new Date().toISOString(),
        status: 'active',
      });

    if (error) {
      console.error('Error adding user to project:', error);
      throw error;
    }
  }

  private async addToTeam(invitation: Invitation, userId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: invitation.team_id,
        user_id: userId,
        role: invitation.role === 'admin' ? 'lead' : 'member',
        added_by: invitation.invited_by,
      });

    if (error) {
      console.error('Error adding user to team:', error);
      throw error;
    }
  }

  private async sendInvitationEmail(params: { invitation: Invitation; message?: string }): Promise<void> {
    const { invitation, message } = params;

    // In a real implementation, you would use an email service like SendGrid, Mailgun, etc.
    // For now, we'll just log the email that would be sent
    console.log('Sending invitation email:', {
      to: invitation.email,
      subject: `You're invited to join ${invitation.organization?.name || invitation.project?.name || invitation.team?.name}`,
      template: 'team-invitation',
      data: {
        inviterName: invitation.inviter?.name || invitation.inviter?.email,
        organizationName: invitation.organization?.name,
        projectName: invitation.project?.name,
        teamName: invitation.team?.name,
        role: invitation.role,
        acceptUrl: `${window.location.origin}/invitations/accept?token=${invitation.token}`,
        declineUrl: `${window.location.origin}/invitations/decline?token=${invitation.token}`,
        message,
        expiresAt: invitation.expires_at,
      }
    });

    // Email service integration - using environment configuration
    // Send email through configured service:
    /*
    await emailService.send({
      to: invitation.email,
      template: 'team-invitation',
      data: {
        inviterName: invitation.inviter?.name,
        organizationName: invitation.organization?.name,
        acceptUrl: `${window.location.origin}/invitations/accept?token=${invitation.token}`,
        message,
      }
    });
    */
  }

  async cleanupExpiredInvitations(): Promise<number> {
    const { data, error } = await supabase
      .from('invitations')
      .update({ status: 'expired' })
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'pending')
      .select('id');

    if (error) {
      console.error('Error cleaning up expired invitations:', error);
      return 0;
    }

    const count = data?.length || 0;
    if (count > 0) {
      this.emit('invitationsExpired', { count });
    }

    return count;
  }
}

export const invitationService = new InvitationService();