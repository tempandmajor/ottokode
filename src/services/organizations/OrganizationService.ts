import { supabase } from '../../lib/supabase';
import { EventEmitter } from '../../utils/EventEmitter';
import { authService } from '../auth/AuthService';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  industry?: string;
  size_category: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  settings: OrganizationSettings;
  billing_email?: string;
  tax_id?: string;
  address?: any;
  subscription_plan: 'team' | 'business' | 'enterprise';
  subscription_status: 'active' | 'trial' | 'suspended' | 'cancelled';
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  allow_external_collaborators: boolean;
  require_2fa: boolean;
  sso_enabled: boolean;
  audit_logging: boolean;
  data_retention_days: number;
  ip_whitelist: string[];
  allowed_domains: string[];
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  permissions: MemberPermissions;
  invited_by?: string;
  invited_at?: string;
  joined_at: string;
  status: 'pending' | 'active' | 'suspended' | 'left';
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
  };
}

export interface MemberPermissions {
  manage_billing: boolean;
  manage_members: boolean;
  manage_projects: boolean;
  manage_settings: boolean;
  view_analytics: boolean;
  export_data: boolean;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  description?: string;
  industry?: string;
  size_category?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  subscription_plan: 'team' | 'business' | 'enterprise';
  billing_email?: string;
}

export interface InviteMemberRequest {
  email: string;
  role: 'admin' | 'member' | 'guest';
  permissions?: Partial<MemberPermissions>;
}

export interface Team {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  color: string;
  created_by: string;
  settings: TeamSettings;
  created_at: string;
  updated_at: string;
}

export interface TeamSettings {
  privacy: 'private' | 'public';
  auto_assign_projects: boolean;
  notification_preferences: {
    project_updates: boolean;
    member_changes: boolean;
    mentions: boolean;
  };
}

class OrganizationService extends EventEmitter {
  private currentOrganization: Organization | null = null;
  private userOrganizations: Organization[] = [];

  constructor() {
    super();
    this.initializeService();
  }

  private async initializeService() {
    authService.onAuthStateChange((authState) => {
      if (authState.isAuthenticated) {
        this.loadUserOrganizations();
      } else {
        this.currentOrganization = null;
        this.userOrganizations = [];
      }
    });
  }

  async loadUserOrganizations(): Promise<Organization[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        role,
        status,
        organizations:organization_id (*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (error) {
      console.error('Error loading user organizations:', error);
      throw error;
    }

    this.userOrganizations = data?.map(item => item.organizations).filter(Boolean) || [];
    this.emit('organizationsLoaded', this.userOrganizations);
    return this.userOrganizations;
  }

  async createOrganization(request: CreateOrganizationRequest): Promise<Organization> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: request.name,
        slug: request.slug,
        description: request.description,
        industry: request.industry,
        size_category: request.size_category || 'small',
        subscription_plan: request.subscription_plan,
        billing_email: request.billing_email || user.email,
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      throw orgError;
    }

    // Add creator as owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'owner',
        permissions: {
          manage_billing: true,
          manage_members: true,
          manage_projects: true,
          manage_settings: true,
          view_analytics: true,
          export_data: true,
        },
        joined_at: new Date().toISOString(),
        status: 'active',
      });

    if (memberError) {
      console.error('Error adding organization owner:', memberError);
      // Clean up organization if member creation fails
      await supabase.from('organizations').delete().eq('id', org.id);
      throw memberError;
    }

    // Create initial subscription record
    await supabase
      .from('organization_subscriptions')
      .insert({
        organization_id: org.id,
        plan_type: request.subscription_plan,
        status: 'trial',
        trial_start: new Date().toISOString(),
        trial_end: org.trial_ends_at,
        seats_purchased: request.subscription_plan === 'team' ? 5 :
                        request.subscription_plan === 'business' ? 20 : 100,
        seats_used: 1,
      });

    await this.loadUserOrganizations();
    this.emit('organizationCreated', org);
    return org;
  }

  async getOrganization(orgId: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (error) {
      console.error('Error getting organization:', error);
      return null;
    }

    return data;
  }

  async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<Organization> {
    await this.requirePermission(orgId, 'manage_settings');

    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', orgId)
      .select()
      .single();

    if (error) {
      console.error('Error updating organization:', error);
      throw error;
    }

    this.emit('organizationUpdated', data);
    return data;
  }

  async deleteOrganization(orgId: string): Promise<void> {
    await this.requireRole(orgId, 'owner');

    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', orgId);

    if (error) {
      console.error('Error deleting organization:', error);
      throw error;
    }

    await this.loadUserOrganizations();
    this.emit('organizationDeleted', orgId);
  }

  async getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
    await this.requireMembership(orgId);

    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        users:user_id (id, email, name, avatar_url)
      `)
      .eq('organization_id', orgId)
      .in('status', ['active', 'pending']);

    if (error) {
      console.error('Error getting organization members:', error);
      throw error;
    }

    return data?.map(member => ({
      ...member,
      user: member.users
    })) || [];
  }

  async inviteMember(orgId: string, request: InviteMemberRequest): Promise<void> {
    await this.requirePermission(orgId, 'manage_members');

    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      throw new Error('User is already a member of this organization');
    }

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        organization_id: orgId,
        invited_by: user.id,
        email: request.email,
        role: request.role,
        permissions: request.permissions || this.getDefaultPermissions(request.role),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }

    this.emit('memberInvited', { orgId, invitation });
  }

  async updateMemberRole(orgId: string, memberId: string, role: string, permissions?: Partial<MemberPermissions>): Promise<void> {
    await this.requirePermission(orgId, 'manage_members');

    const updateData: any = { role };
    if (permissions) {
      updateData.permissions = permissions;
    }

    const { error } = await supabase
      .from('organization_members')
      .update(updateData)
      .eq('organization_id', orgId)
      .eq('id', memberId);

    if (error) {
      console.error('Error updating member role:', error);
      throw error;
    }

    this.emit('memberRoleUpdated', { orgId, memberId, role, permissions });
  }

  async removeMember(orgId: string, memberId: string): Promise<void> {
    await this.requirePermission(orgId, 'manage_members');

    const { error } = await supabase
      .from('organization_members')
      .update({ status: 'left' })
      .eq('organization_id', orgId)
      .eq('id', memberId);

    if (error) {
      console.error('Error removing member:', error);
      throw error;
    }

    this.emit('memberRemoved', { orgId, memberId });
  }

  async createTeam(orgId: string, name: string, description?: string): Promise<Team> {
    await this.requirePermission(orgId, 'manage_projects');

    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('teams')
      .insert({
        organization_id: orgId,
        name,
        description,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating team:', error);
      throw error;
    }

    // Add creator to team
    await supabase
      .from('team_members')
      .insert({
        team_id: data.id,
        user_id: user.id,
        role: 'lead',
        added_by: user.id,
      });

    this.emit('teamCreated', { orgId, team: data });
    return data;
  }

  async getOrganizationTeams(orgId: string): Promise<Team[]> {
    await this.requireMembership(orgId);

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('organization_id', orgId);

    if (error) {
      console.error('Error getting organization teams:', error);
      throw error;
    }

    return data || [];
  }

  async getUserRole(orgId: string): Promise<string | null> {
    const user = authService.getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error || !data) return null;
    return data.role;
  }

  async hasPermission(orgId: string, permission: keyof MemberPermissions): Promise<boolean> {
    const user = authService.getCurrentUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('organization_members')
      .select('permissions')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error || !data) return false;
    return data.permissions[permission] === true;
  }

  private async requireMembership(orgId: string): Promise<void> {
    const role = await this.getUserRole(orgId);
    if (!role) {
      throw new Error('Access denied: Not a member of this organization');
    }
  }

  private async requireRole(orgId: string, requiredRole: string): Promise<void> {
    const role = await this.getUserRole(orgId);
    if (role !== requiredRole) {
      throw new Error(`Access denied: Requires ${requiredRole} role`);
    }
  }

  private async requirePermission(orgId: string, permission: keyof MemberPermissions): Promise<void> {
    const hasPermission = await this.hasPermission(orgId, permission);
    if (!hasPermission) {
      throw new Error(`Access denied: Missing ${permission} permission`);
    }
  }

  private getDefaultPermissions(role: string): MemberPermissions {
    switch (role) {
      case 'admin':
        return {
          manage_billing: true,
          manage_members: true,
          manage_projects: true,
          manage_settings: true,
          view_analytics: true,
          export_data: true,
        };
      case 'member':
        return {
          manage_billing: false,
          manage_members: false,
          manage_projects: true,
          manage_settings: false,
          view_analytics: true,
          export_data: false,
        };
      case 'guest':
        return {
          manage_billing: false,
          manage_members: false,
          manage_projects: false,
          manage_settings: false,
          view_analytics: false,
          export_data: false,
        };
      default:
        return {
          manage_billing: false,
          manage_members: false,
          manage_projects: false,
          manage_settings: false,
          view_analytics: false,
          export_data: false,
        };
    }
  }

  getCurrentOrganization(): Organization | null {
    return this.currentOrganization;
  }

  setCurrentOrganization(org: Organization | null): void {
    this.currentOrganization = org;
    this.emit('currentOrganizationChanged', org);
  }

  getUserOrganizations(): Organization[] {
    return this.userOrganizations;
  }
}

export const organizationService = new OrganizationService();