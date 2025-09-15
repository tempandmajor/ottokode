import { supabase } from '../../lib/supabase';
import { EventEmitter } from '../../utils/EventEmitter';
import { authService } from '../auth/AuthService';
import { organizationService } from '../organizations/OrganizationService';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
  max_members: number;
  stripe_price_id: string;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  plan_type: 'team' | 'enterprise';
}

export interface OrganizationSubscription {
  id: string;
  organization_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan_type: 'team' | 'business' | 'enterprise';
  status: 'active' | 'trial' | 'past_due' | 'cancelled' | 'incomplete';
  current_period_start?: string;
  current_period_end?: string;
  trial_start?: string;
  trial_end?: string;
  cancelled_at?: string;
  seats_purchased: number;
  seats_used: number;
  monthly_budget?: number;
  usage_limits: UsageLimits;
  created_at: string;
  updated_at: string;
}

export interface UsageLimits {
  ai_requests_per_month?: number;
  storage_gb?: number;
  bandwidth_gb?: number;
  projects?: number;
}

export interface BillingUsage {
  organization_id: string;
  current_period: {
    start: string;
    end: string;
  };
  usage: {
    ai_requests: number;
    storage_gb: number;
    bandwidth_gb: number;
    projects: number;
    active_users: number;
  };
  costs: {
    ai_costs: number;
    storage_costs: number;
    bandwidth_costs: number;
    total: number;
  };
  limits: UsageLimits;
  utilization: {
    ai_requests: number; // percentage
    storage: number; // percentage
    bandwidth: number; // percentage
    projects: number; // percentage
  };
}

export interface PricingTier {
  id: string;
  name: string;
  type: 'team' | 'enterprise';
  monthly_price: number;
  annual_price: number;
  max_members: number;
  features: {
    core: string[];
    collaboration: string[];
    security: string[];
    analytics: string[];
    support: string[];
  };
  limits: UsageLimits;
  markup_percentage: number;
  is_custom: boolean;
}

class EnterpriseSubscriptionService extends EventEmitter {
  private availablePlans: PricingTier[] = [
    {
      id: 'team_starter',
      name: 'Team Starter',
      type: 'team',
      monthly_price: 49,
      annual_price: 490,
      max_members: 5,
      markup_percentage: 15,
      is_custom: false,
      features: {
        core: ['Up to 5 team members', 'Basic project management', 'Shared AI conversations'],
        collaboration: ['Real-time editing', 'Comments & discussions', 'File versioning'],
        security: ['Basic access controls', 'Audit logs (30 days)'],
        analytics: ['Usage analytics', 'Team productivity metrics'],
        support: ['Email support', 'Documentation']
      },
      limits: {
        ai_requests_per_month: 10000,
        storage_gb: 10,
        bandwidth_gb: 100,
        projects: 25
      }
    },
    {
      id: 'team_pro',
      name: 'Team Pro',
      type: 'team',
      monthly_price: 149,
      annual_price: 1490,
      max_members: 15,
      markup_percentage: 10,
      is_custom: false,
      features: {
        core: ['Up to 15 team members', 'Advanced project management', 'Organization-wide conversations'],
        collaboration: ['Advanced real-time collaboration', 'Code reviews', 'Advanced versioning'],
        security: ['Role-based access control', 'Audit logs (90 days)', 'IP whitelisting'],
        analytics: ['Advanced analytics', 'Custom dashboards', 'Export capabilities'],
        support: ['Priority email support', 'Video calls', 'Onboarding']
      },
      limits: {
        ai_requests_per_month: 50000,
        storage_gb: 50,
        bandwidth_gb: 500,
        projects: 100
      }
    },
    {
      id: 'enterprise_standard',
      name: 'Enterprise Standard',
      type: 'enterprise',
      monthly_price: 599,
      annual_price: 5990,
      max_members: 100,
      markup_percentage: 5,
      is_custom: false,
      features: {
        core: ['Up to 100 team members', 'Enterprise project management', 'Advanced AI features'],
        collaboration: ['Enterprise collaboration tools', 'Advanced workflows', 'Integration APIs'],
        security: ['Advanced security features', 'SSO integration', 'Compliance tools', 'Unlimited audit logs'],
        analytics: ['Enterprise analytics', 'Custom reporting', 'Data export', 'API access'],
        support: ['Dedicated customer success', '24/7 priority support', 'Custom training']
      },
      limits: {
        ai_requests_per_month: 200000,
        storage_gb: 500,
        bandwidth_gb: 2000,
        projects: 500
      }
    },
    {
      id: 'enterprise_premium',
      name: 'Enterprise Premium',
      type: 'enterprise',
      monthly_price: 1199,
      annual_price: 11990,
      max_members: 500,
      markup_percentage: 3,
      is_custom: false,
      features: {
        core: ['Up to 500 team members', 'White-label solutions', 'Custom AI models'],
        collaboration: ['Advanced enterprise tools', 'Custom workflows', 'Full API access'],
        security: ['Enterprise-grade security', 'Custom SSO', 'Advanced compliance', 'Security certifications'],
        analytics: ['Custom analytics platform', 'Real-time dashboards', 'Unlimited exports'],
        support: ['Dedicated account manager', 'White-glove support', 'Custom development']
      },
      limits: {
        ai_requests_per_month: 1000000,
        storage_gb: 2000,
        bandwidth_gb: 10000,
        projects: 2000
      }
    },
    {
      id: 'enterprise_custom',
      name: 'Enterprise Custom',
      type: 'enterprise',
      monthly_price: 0, // Custom pricing
      annual_price: 0, // Custom pricing
      max_members: -1, // Unlimited
      markup_percentage: 0, // Negotiated
      is_custom: true,
      features: {
        core: ['Unlimited team members', 'Fully custom solution', 'Dedicated infrastructure'],
        collaboration: ['Custom collaboration platform', 'Unlimited integrations'],
        security: ['Custom security implementation', 'On-premise deployment options'],
        analytics: ['Custom analytics solution', 'Dedicated reporting infrastructure'],
        support: ['Dedicated development team', 'Custom SLA agreements']
      },
      limits: {} // All unlimited or custom
    }
  ];

  constructor() {
    super();
  }

  async getAvailablePlans(): Promise<PricingTier[]> {
    return this.availablePlans;
  }

  async getPlanById(planId: string): Promise<PricingTier | null> {
    return this.availablePlans.find(plan => plan.id === planId) || null;
  }

  async getOrganizationSubscription(organizationId: string): Promise<OrganizationSubscription | null> {
    await organizationService.requireMembership(organizationId);

    const { data, error } = await supabase
      .from('organization_subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      console.error('Error getting organization subscription:', error);
      return null;
    }

    return data;
  }

  async createSubscription(organizationId: string, planId: string, paymentMethodId?: string): Promise<OrganizationSubscription> {
    await organizationService.requirePermission(organizationId, 'manage_billing');

    const plan = await this.getPlanById(planId);
    if (!plan) {
      throw new Error('Invalid subscription plan');
    }

    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Create Stripe customer if needed
    let stripeCustomerId = null;
    if (paymentMethodId) {
      // In a real implementation, you would create a Stripe customer here
      stripeCustomerId = `cus_${Date.now()}`;
    }

    const subscription: Partial<OrganizationSubscription> = {
      organization_id: organizationId,
      stripe_customer_id: stripeCustomerId,
      plan_type: plan.type === 'team' ? 'team' : 'enterprise',
      status: paymentMethodId ? 'active' : 'trial',
      seats_purchased: plan.max_members,
      seats_used: 1,
      monthly_budget: plan.monthly_price,
      usage_limits: plan.limits,
    };

    if (!paymentMethodId) {
      // Set trial period
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14); // 14 days trial
      subscription.trial_start = new Date().toISOString();
      subscription.trial_end = trialEnd.toISOString();
    } else {
      // Set billing period
      const now = new Date();
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      subscription.current_period_start = now.toISOString();
      subscription.current_period_end = periodEnd.toISOString();
    }

    const { data, error } = await supabase
      .from('organization_subscriptions')
      .insert(subscription)
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }

    this.emit('subscriptionCreated', { organizationId, subscription: data });
    return data;
  }

  async upgradeSubscription(organizationId: string, newPlanId: string): Promise<OrganizationSubscription> {
    await organizationService.requirePermission(organizationId, 'manage_billing');

    const newPlan = await this.getPlanById(newPlanId);
    if (!newPlan) {
      throw new Error('Invalid subscription plan');
    }

    const currentSubscription = await this.getOrganizationSubscription(organizationId);
    if (!currentSubscription) {
      throw new Error('No active subscription found');
    }

    const { data, error } = await supabase
      .from('organization_subscriptions')
      .update({
        plan_type: newPlan.type === 'team' ? 'team' : 'enterprise',
        seats_purchased: newPlan.max_members,
        monthly_budget: newPlan.monthly_price,
        usage_limits: newPlan.limits,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    }

    this.emit('subscriptionUpgraded', { organizationId, oldPlan: currentSubscription, newPlan: data });
    return data;
  }

  async cancelSubscription(organizationId: string, immediate: boolean = false): Promise<void> {
    await organizationService.requirePermission(organizationId, 'manage_billing');

    const updateData: any = {
      status: immediate ? 'cancelled' : 'active',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (immediate) {
      updateData.current_period_end = new Date().toISOString();
    }

    const { error } = await supabase
      .from('organization_subscriptions')
      .update(updateData)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }

    this.emit('subscriptionCancelled', { organizationId, immediate });
  }

  async getBillingUsage(organizationId: string, startDate?: Date, endDate?: Date): Promise<BillingUsage> {
    await organizationService.requirePermission(organizationId, 'view_analytics');

    const subscription = await this.getOrganizationSubscription(organizationId);
    if (!subscription) {
      throw new Error('No subscription found');
    }

    const start = startDate || new Date(subscription.current_period_start || subscription.trial_start!);
    const end = endDate || new Date(subscription.current_period_end || subscription.trial_end!);

    // Get usage data
    const { data: usageData, error } = await supabase
      .from('organization_usage')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0]);

    if (error) {
      console.error('Error getting billing usage:', error);
      throw error;
    }

    // Calculate totals
    const usage = usageData?.reduce((acc, day) => ({
      ai_requests: acc.ai_requests + day.ai_requests,
      storage_gb: Math.max(acc.storage_gb, day.storage_used / (1024 * 1024 * 1024)),
      bandwidth_gb: acc.bandwidth_gb + (day.bandwidth_used / (1024 * 1024 * 1024)),
      projects: Math.max(acc.projects, day.projects_created),
      active_users: Math.max(acc.active_users, day.active_users),
    }), {
      ai_requests: 0,
      storage_gb: 0,
      bandwidth_gb: 0,
      projects: 0,
      active_users: 0,
    }) || {
      ai_requests: 0,
      storage_gb: 0,
      bandwidth_gb: 0,
      projects: 0,
      active_users: 0,
    };

    // Get plan for calculating costs and utilization
    const planId = this.getPlanIdFromSubscription(subscription);
    const plan = await this.getPlanById(planId);

    const limits = subscription.usage_limits;
    const costs = this.calculateCosts(usage, plan?.markup_percentage || 10);

    const utilization = {
      ai_requests: limits.ai_requests_per_month ? (usage.ai_requests / limits.ai_requests_per_month) * 100 : 0,
      storage: limits.storage_gb ? (usage.storage_gb / limits.storage_gb) * 100 : 0,
      bandwidth: limits.bandwidth_gb ? (usage.bandwidth_gb / limits.bandwidth_gb) * 100 : 0,
      projects: limits.projects ? (usage.projects / limits.projects) * 100 : 0,
    };

    return {
      organization_id: organizationId,
      current_period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      usage,
      costs,
      limits,
      utilization,
    };
  }

  async getUsageAlerts(organizationId: string): Promise<any[]> {
    await organizationService.requireMembership(organizationId);

    const usage = await this.getBillingUsage(organizationId);
    const alerts = [];

    // Check for usage alerts
    Object.entries(usage.utilization).forEach(([resource, percentage]) => {
      if (percentage > 90) {
        alerts.push({
          type: 'critical',
          resource,
          message: `${resource} usage is at ${percentage.toFixed(1)}% of limit`,
          percentage,
        });
      } else if (percentage > 75) {
        alerts.push({
          type: 'warning',
          resource,
          message: `${resource} usage is at ${percentage.toFixed(1)}% of limit`,
          percentage,
        });
      }
    });

    return alerts;
  }

  async getInvoices(organizationId: string): Promise<any[]> {
    await organizationService.requirePermission(organizationId, 'manage_billing');

    // In a real implementation, this would fetch from Stripe
    // For now, return mock data
    return [
      {
        id: 'in_1234567890',
        date: new Date().toISOString(),
        amount: 149.00,
        status: 'paid',
        description: 'Team Pro - Monthly',
        downloadUrl: '/api/invoices/in_1234567890/download'
      }
    ];
  }

  async estimateCost(organizationId: string, planId: string, seats?: number): Promise<any> {
    const plan = await this.getPlanById(planId);
    if (!plan) {
      throw new Error('Invalid plan');
    }

    const basePrice = plan.monthly_price;
    const seatPrice = seats && seats > plan.max_members ?
      (seats - plan.max_members) * (basePrice / plan.max_members) : 0;

    const estimatedUsage = await this.getEstimatedUsage(organizationId);
    const aiCosts = estimatedUsage.ai_requests * 0.002 * (1 + plan.markup_percentage / 100);

    return {
      base_subscription: basePrice,
      additional_seats: seatPrice,
      estimated_ai_costs: aiCosts,
      total_estimated: basePrice + seatPrice + aiCosts,
      breakdown: {
        subscription: basePrice,
        seats: seatPrice,
        ai_usage: aiCosts,
      }
    };
  }

  private calculateCosts(usage: any, markupPercentage: number): any {
    const aiCosts = usage.ai_requests * 0.002 * (1 + markupPercentage / 100);
    const storageCosts = Math.max(0, usage.storage_gb - 10) * 0.05; // First 10GB free
    const bandwidthCosts = Math.max(0, usage.bandwidth_gb - 100) * 0.01; // First 100GB free

    return {
      ai_costs: aiCosts,
      storage_costs: storageCosts,
      bandwidth_costs: bandwidthCosts,
      total: aiCosts + storageCosts + bandwidthCosts,
    };
  }

  private getPlanIdFromSubscription(subscription: OrganizationSubscription): string {
    // Logic to determine plan ID from subscription data
    if (subscription.plan_type === 'team') {
      if (subscription.seats_purchased <= 5) return 'team_starter';
      return 'team_pro';
    } else {
      if (subscription.seats_purchased <= 100) return 'enterprise_standard';
      if (subscription.seats_purchased <= 500) return 'enterprise_premium';
      return 'enterprise_custom';
    }
  }

  private async getEstimatedUsage(organizationId: string): Promise<any> {
    // Get historical usage to estimate future usage
    const { data } = await supabase
      .from('organization_usage')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false })
      .limit(30);

    if (!data || data.length === 0) {
      return { ai_requests: 1000, storage_gb: 5, bandwidth_gb: 50 };
    }

    const avgUsage = data.reduce((acc, day) => ({
      ai_requests: acc.ai_requests + day.ai_requests,
      storage_gb: acc.storage_gb + (day.storage_used / (1024 * 1024 * 1024)),
      bandwidth_gb: acc.bandwidth_gb + (day.bandwidth_used / (1024 * 1024 * 1024)),
    }), { ai_requests: 0, storage_gb: 0, bandwidth_gb: 0 });

    return {
      ai_requests: Math.ceil(avgUsage.ai_requests / data.length) * 30, // Monthly estimate
      storage_gb: avgUsage.storage_gb / data.length,
      bandwidth_gb: Math.ceil(avgUsage.bandwidth_gb / data.length) * 30,
    };
  }
}

export const enterpriseSubscriptionService = new EnterpriseSubscriptionService();