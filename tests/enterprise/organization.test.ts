// Enterprise Organization Testing Suite
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { organizationService } from '../../src/services/organizations/OrganizationService';
import { enterpriseSubscriptionService } from '../../src/services/billing/EnterpriseSubscriptionService';
import { invitationService } from '../../src/services/invitations/InvitationService';
import { authService } from '../../src/services/auth/AuthService';

describe('Enterprise Organization Management', () => {
  let testOrganizationId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Set up test user (you'll need to implement this based on your auth system)
    // For now, assuming a test user is authenticated
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Test user must be authenticated before running tests');
    }
    testUserId = currentUser.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testOrganizationId) {
      try {
        await organizationService.deleteOrganization(testOrganizationId);
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    }
  });

  describe('Organization CRUD Operations', () => {
    it('should create a new organization', async () => {
      const organizationData = {
        name: 'Test Organization',
        slug: 'test-org-' + Date.now(),
        description: 'A test organization for automated testing',
        industry: 'Technology',
        size_category: 'small' as const,
        subscription_plan: 'team' as const,
        billing_email: 'billing@testorg.com'
      };

      const organization = await organizationService.createOrganization(organizationData);

      expect(organization).toBeDefined();
      expect(organization.name).toBe(organizationData.name);
      expect(organization.slug).toBe(organizationData.slug);
      expect(organization.subscription_plan).toBe('team');

      testOrganizationId = organization.id;
    });

    it('should retrieve organization details', async () => {
      const organization = await organizationService.getOrganization(testOrganizationId);

      expect(organization).toBeDefined();
      expect(organization!.id).toBe(testOrganizationId);
      expect(organization!.name).toBe('Test Organization');
    });

    it('should update organization details', async () => {
      const updatedData = {
        description: 'Updated test organization description',
        industry: 'Software Development'
      };

      const updatedOrganization = await organizationService.updateOrganization(
        testOrganizationId,
        updatedData
      );

      expect(updatedOrganization.description).toBe(updatedData.description);
      expect(updatedOrganization.industry).toBe(updatedData.industry);
    });
  });

  describe('Member Management', () => {
    it('should get organization members', async () => {
      const members = await organizationService.getOrganizationMembers(testOrganizationId);

      expect(members).toBeDefined();
      expect(members.length).toBeGreaterThan(0);

      // Should include the creator as owner
      const ownerMember = members.find(m => m.user_id === testUserId);
      expect(ownerMember).toBeDefined();
      expect(ownerMember!.role).toBe('owner');
    });

    it('should invite a new member', async () => {
      const inviteRequest = {
        email: 'newmember@testorg.com',
        role: 'member' as const,
        permissions: {
          manage_billing: false,
          manage_members: false,
          manage_projects: true,
          manage_settings: false,
          view_analytics: true,
          export_data: false
        }
      };

      await expect(
        organizationService.inviteMember(testOrganizationId, inviteRequest)
      ).resolves.not.toThrow();

      // Verify invitation was created
      const invitations = await invitationService.getOrganizationInvitations(testOrganizationId);
      expect(invitations.length).toBeGreaterThan(0);

      const newInvitation = invitations.find(inv => inv.email === inviteRequest.email);
      expect(newInvitation).toBeDefined();
      expect(newInvitation!.role).toBe('member');
    });
  });

  describe('Team Management', () => {
    it('should create a team within organization', async () => {
      const team = await organizationService.createTeam(
        testOrganizationId,
        'Test Team',
        'A test team for automated testing'
      );

      expect(team).toBeDefined();
      expect(team.name).toBe('Test Team');
      expect(team.organization_id).toBe(testOrganizationId);
    });

    it('should get organization teams', async () => {
      const teams = await organizationService.getOrganizationTeams(testOrganizationId);

      expect(teams).toBeDefined();
      expect(teams.length).toBeGreaterThan(0);
      expect(teams[0].name).toBe('Test Team');
    });
  });

  describe('Permissions and Access Control', () => {
    it('should verify user role in organization', async () => {
      const role = await organizationService.getUserRole(testOrganizationId);
      expect(role).toBe('owner');
    });

    it('should check user permissions', async () => {
      const hasManageMembers = await organizationService.hasPermission(
        testOrganizationId,
        'manage_members'
      );
      const hasManageBilling = await organizationService.hasPermission(
        testOrganizationId,
        'manage_billing'
      );

      expect(hasManageMembers).toBe(true);
      expect(hasManageBilling).toBe(true);
    });

    it('should deny access to non-members', async () => {
      // This would require setting up a different user context
      // For now, we'll test error handling
      const invalidOrgId = 'invalid-org-id';

      await expect(
        organizationService.getOrganizationMembers(invalidOrgId)
      ).rejects.toThrow();
    });
  });
});

describe('Enterprise Subscription Management', () => {
  let testOrganizationId: string;

  beforeAll(async () => {
    // Create test organization for subscription tests
    const organization = await organizationService.createOrganization({
      name: 'Subscription Test Org',
      slug: 'subscription-test-' + Date.now(),
      subscription_plan: 'team',
    });
    testOrganizationId = organization.id;
  });

  afterAll(async () => {
    if (testOrganizationId) {
      try {
        await organizationService.deleteOrganization(testOrganizationId);
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    }
  });

  describe('Pricing Plans', () => {
    it('should retrieve available pricing plans', async () => {
      const plans = await enterpriseSubscriptionService.getAvailablePlans();

      expect(plans).toBeDefined();
      expect(plans.length).toBeGreaterThan(0);

      // Check required plans exist
      const planIds = plans.map(p => p.id);
      expect(planIds).toContain('team_starter');
      expect(planIds).toContain('team_pro');
      expect(planIds).toContain('enterprise_standard');
      expect(planIds).toContain('enterprise_premium');

      // Verify plan structure
      const teamPlan = plans.find(p => p.id === 'team_starter');
      expect(teamPlan).toBeDefined();
      expect(teamPlan!.monthly_price).toBeGreaterThan(0);
      expect(teamPlan!.max_members).toBeGreaterThan(0);
      expect(teamPlan!.features).toBeDefined();
    });

    it('should get specific plan details', async () => {
      const plan = await enterpriseSubscriptionService.getPlanById('team_pro');

      expect(plan).toBeDefined();
      expect(plan!.id).toBe('team_pro');
      expect(plan!.name).toBe('Team Pro');
      expect(plan!.type).toBe('team');
      expect(plan!.monthly_price).toBe(149);
      expect(plan!.max_members).toBe(15);
    });
  });

  describe('Subscription Operations', () => {
    it('should create a subscription', async () => {
      const subscription = await enterpriseSubscriptionService.createSubscription(
        testOrganizationId,
        'team_starter'
      );

      expect(subscription).toBeDefined();
      expect(subscription.organization_id).toBe(testOrganizationId);
      expect(subscription.plan_type).toBe('team');
      expect(subscription.status).toBe('trial');
    });

    it('should get organization subscription', async () => {
      const subscription = await enterpriseSubscriptionService.getOrganizationSubscription(
        testOrganizationId
      );

      expect(subscription).toBeDefined();
      expect(subscription!.organization_id).toBe(testOrganizationId);
      expect(subscription!.plan_type).toBe('team');
    });

    it('should upgrade subscription', async () => {
      const upgradedSubscription = await enterpriseSubscriptionService.upgradeSubscription(
        testOrganizationId,
        'team_pro'
      );

      expect(upgradedSubscription).toBeDefined();
      expect(upgradedSubscription.plan_type).toBe('team');
      expect(upgradedSubscription.seats_purchased).toBe(15);
      expect(upgradedSubscription.monthly_budget).toBe(149);
    });

    it('should estimate costs for different plans', async () => {
      const estimate = await enterpriseSubscriptionService.estimateCost(
        testOrganizationId,
        'enterprise_standard'
      );

      expect(estimate).toBeDefined();
      expect(estimate.base_subscription).toBe(599);
      expect(estimate.total_estimated).toBeGreaterThanOrEqual(599);
      expect(estimate.breakdown).toBeDefined();
    });
  });

  describe('Usage Tracking', () => {
    it('should get billing usage', async () => {
      const usage = await enterpriseSubscriptionService.getBillingUsage(testOrganizationId);

      expect(usage).toBeDefined();
      expect(usage.organization_id).toBe(testOrganizationId);
      expect(usage.current_period).toBeDefined();
      expect(usage.usage).toBeDefined();
      expect(usage.costs).toBeDefined();
      expect(usage.limits).toBeDefined();
      expect(usage.utilization).toBeDefined();

      // Verify usage structure
      expect(typeof usage.usage.ai_requests).toBe('number');
      expect(typeof usage.usage.storage_gb).toBe('number');
      expect(typeof usage.costs.total).toBe('number');
    });

    it('should get usage alerts', async () => {
      const alerts = await enterpriseSubscriptionService.getUsageAlerts(testOrganizationId);

      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
      // Alerts might be empty for new organization
    });
  });
});

describe('Team Invitation System', () => {
  let testOrganizationId: string;

  beforeAll(async () => {
    const organization = await organizationService.createOrganization({
      name: 'Invitation Test Org',
      slug: 'invitation-test-' + Date.now(),
      subscription_plan: 'team',
    });
    testOrganizationId = organization.id;
  });

  afterAll(async () => {
    if (testOrganizationId) {
      try {
        await organizationService.deleteOrganization(testOrganizationId);
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    }
  });

  describe('Single Invitations', () => {
    it('should send organization invitation', async () => {
      const invitations = await invitationService.sendOrganizationInvitation({
        organization_id: testOrganizationId,
        emails: ['test1@example.com'],
        role: 'member',
        message: 'Welcome to our team!'
      });

      expect(invitations).toBeDefined();
      expect(invitations.length).toBe(1);
      expect(invitations[0].email).toBe('test1@example.com');
      expect(invitations[0].role).toBe('member');
      expect(invitations[0].status).toBe('pending');
    });

    it('should get invitation by token', async () => {
      const invitations = await invitationService.getOrganizationInvitations(testOrganizationId);
      const invitation = invitations[0];

      const retrievedInvitation = await invitationService.getInvitation(invitation.token);

      expect(retrievedInvitation).toBeDefined();
      expect(retrievedInvitation!.id).toBe(invitation.id);
      expect(retrievedInvitation!.email).toBe(invitation.email);
    });
  });

  describe('Bulk Invitations', () => {
    it('should send bulk invitations', async () => {
      const bulkInvitations = await invitationService.sendBulkInvitations({
        organization_id: testOrganizationId,
        invitations: [
          { email: 'bulk1@example.com', role: 'member' },
          { email: 'bulk2@example.com', role: 'admin' },
          { email: 'bulk3@example.com', role: 'member' }
        ],
        message: 'Bulk invitation test'
      });

      expect(bulkInvitations).toBeDefined();
      expect(bulkInvitations.length).toBe(3);

      const adminInvitation = bulkInvitations.find(inv => inv.email === 'bulk2@example.com');
      expect(adminInvitation).toBeDefined();
      expect(adminInvitation!.role).toBe('admin');
    });

    it('should get all organization invitations', async () => {
      const allInvitations = await invitationService.getOrganizationInvitations(testOrganizationId);

      expect(allInvitations).toBeDefined();
      expect(allInvitations.length).toBe(4); // 1 single + 3 bulk

      const emails = allInvitations.map(inv => inv.email);
      expect(emails).toContain('test1@example.com');
      expect(emails).toContain('bulk1@example.com');
      expect(emails).toContain('bulk2@example.com');
      expect(emails).toContain('bulk3@example.com');
    });
  });

  describe('Invitation Management', () => {
    it('should cancel invitation', async () => {
      const invitations = await invitationService.getOrganizationInvitations(testOrganizationId);
      const invitationToCancel = invitations[0];

      await expect(
        invitationService.cancelInvitation(invitationToCancel.id)
      ).resolves.not.toThrow();
    });

    it('should resend invitation', async () => {
      const invitations = await invitationService.getOrganizationInvitations(testOrganizationId);
      const activeInvitation = invitations.find(inv => inv.status === 'pending');

      if (activeInvitation) {
        await expect(
          invitationService.resendInvitation(activeInvitation.id)
        ).resolves.not.toThrow();
      }
    });

    it('should clean up expired invitations', async () => {
      const cleanedCount = await invitationService.cleanupExpiredInvitations();
      expect(typeof cleanedCount).toBe('number');
    });
  });
});

// Performance and Integration Tests
describe('Performance Tests', () => {
  it('should handle multiple organization operations efficiently', async () => {
    const startTime = Date.now();

    // Create multiple organizations
    const orgPromises = Array.from({ length: 5 }, (_, i) =>
      organizationService.createOrganization({
        name: `Perf Test Org ${i}`,
        slug: `perf-test-${i}-${Date.now()}`,
        subscription_plan: 'team',
      })
    );

    const organizations = await Promise.all(orgPromises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(organizations.length).toBe(5);
    expect(duration).toBeLessThan(10000); // Should complete in under 10 seconds

    // Cleanup
    await Promise.all(
      organizations.map(org =>
        organizationService.deleteOrganization(org.id).catch(console.log)
      )
    );
  });

  it('should handle bulk member invitations efficiently', async () => {
    const testOrg = await organizationService.createOrganization({
      name: 'Bulk Test Org',
      slug: 'bulk-test-' + Date.now(),
      subscription_plan: 'enterprise',
    });

    const startTime = Date.now();

    // Create 50 bulk invitations
    const emails = Array.from({ length: 50 }, (_, i) => `perftest${i}@example.com`);

    const invitations = await invitationService.sendBulkInvitations({
      organization_id: testOrg.id,
      invitations: emails.map(email => ({ email, role: 'member' }))
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(invitations.length).toBe(50);
    expect(duration).toBeLessThan(15000); // Should complete in under 15 seconds

    // Cleanup
    await organizationService.deleteOrganization(testOrg.id).catch(console.log);
  });
});