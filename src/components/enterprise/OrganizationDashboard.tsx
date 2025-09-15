import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Settings,
  TrendingUp,
  DollarSign,
  Shield,
  Bell,
  Crown,
  Building,
  UserPlus,
  BarChart3,
  Calendar
} from 'lucide-react';
import { organizationService, Organization, OrganizationMember } from '../../services/organizations/OrganizationService';
import { enterpriseSubscriptionService, BillingUsage } from '../../services/billing/EnterpriseSubscriptionService';
import { invitationService } from '../../services/invitations/InvitationService';

interface OrganizationDashboardProps {
  organizationId: string;
}

interface DashboardStats {
  totalMembers: number;
  activeProjects: number;
  monthlyUsage: number;
  pendingInvitations: number;
}

export const OrganizationDashboard: React.FC<OrganizationDashboardProps> = ({ organizationId }) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [billingUsage, setBillingUsage] = useState<BillingUsage | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeProjects: 0,
    monthlyUsage: 0,
    pendingInvitations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [organizationId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [orgData, membersData, role] = await Promise.all([
        organizationService.getOrganization(organizationId),
        organizationService.getOrganizationMembers(organizationId),
        organizationService.getUserRole(organizationId)
      ]);

      setOrganization(orgData);
      setMembers(membersData);
      setUserRole(role);

      // Load billing usage if user has permission
      if (role === 'owner' || role === 'admin') {
        try {
          const usage = await enterpriseSubscriptionService.getBillingUsage(organizationId);
          setBillingUsage(usage);
        } catch (error) {
          console.error('Error loading billing usage:', error);
        }
      }

      // Calculate stats
      const pendingInvitations = await invitationService.getOrganizationInvitations(organizationId);

      setStats({
        totalMembers: membersData.filter(m => m.status === 'active').length,
        activeProjects: 0, // TODO: Get from projects service
        monthlyUsage: billingUsage?.costs.total || 0,
        pendingInvitations: pendingInvitations.length
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const canManageMembers = userRole === 'owner' || userRole === 'admin';
  const canViewBilling = userRole === 'owner' || userRole === 'admin';
  const canManageSettings = userRole === 'owner';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error || 'Organization not found'}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {organization.logo_url ? (
              <img src={organization.logo_url} alt={organization.name} className="w-12 h-12 rounded-lg" />
            ) : (
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{organization.subscription_plan} Plan</span>
                <span>•</span>
                <span className="flex items-center">
                  <Crown className="w-4 h-4 mr-1" />
                  {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {canManageMembers && (
              <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Members
              </button>
            )}

            {canManageSettings && (
              <button className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Team Members"
          value={stats.totalMembers.toString()}
          icon={<Users className="w-5 h-5" />}
          color="blue"
          subtitle={`${stats.pendingInvitations} pending invitations`}
        />

        <StatCard
          title="Active Projects"
          value={stats.activeProjects.toString()}
          icon={<Briefcase className="w-5 h-5" />}
          color="green"
          subtitle="This month"
        />

        {canViewBilling && billingUsage && (
          <StatCard
            title="Monthly Usage"
            value={`$${billingUsage.costs.total.toFixed(2)}`}
            icon={<DollarSign className="w-5 h-5" />}
            color="purple"
            subtitle={`${billingUsage.utilization.ai_requests.toFixed(1)}% of AI limit`}
          />
        )}

        <StatCard
          title="Subscription"
          value={organization.subscription_status}
          icon={<TrendingUp className="w-5 h-5" />}
          color="orange"
          subtitle={organization.subscription_plan}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Members */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
                {canManageMembers && (
                  <button className="text-sm text-blue-600 hover:text-blue-700">
                    View All
                  </button>
                )}
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {members.slice(0, 5).map((member) => (
                <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {member.user?.avatar_url ? (
                      <img src={member.user.avatar_url} alt={member.user.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                          {member.user?.name?.[0] || member.user?.email[0].toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.user?.name || member.user?.email}
                      </p>
                      <p className="text-xs text-gray-500">{member.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                      member.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role}
                    </span>

                    <div className={`w-2 h-2 rounded-full ${
                      member.status === 'active' ? 'bg-green-400' :
                      member.status === 'pending' ? 'bg-yellow-400' :
                      'bg-gray-400'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions & Usage */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>

            <div className="p-6 space-y-3">
              {canManageMembers && (
                <button className="w-full flex items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <UserPlus className="w-4 h-4 mr-3" />
                  Invite Team Members
                </button>
              )}

              <button className="w-full flex items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                <Briefcase className="w-4 h-4 mr-3" />
                Create New Project
              </button>

              {canViewBilling && (
                <button className="w-full flex items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <BarChart3 className="w-4 h-4 mr-3" />
                  View Usage Analytics
                </button>
              )}

              {canManageSettings && (
                <button className="w-full flex items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Shield className="w-4 h-4 mr-3" />
                  Security Settings
                </button>
              )}
            </div>
          </div>

          {/* Usage Overview */}
          {canViewBilling && billingUsage && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Usage This Month</h2>
              </div>

              <div className="p-6 space-y-4">
                <UsageBar
                  label="AI Requests"
                  usage={billingUsage.usage.ai_requests}
                  limit={billingUsage.limits.ai_requests_per_month || 0}
                  percentage={billingUsage.utilization.ai_requests}
                />

                <UsageBar
                  label="Storage"
                  usage={billingUsage.usage.storage_gb}
                  limit={billingUsage.limits.storage_gb || 0}
                  percentage={billingUsage.utilization.storage}
                  unit="GB"
                />

                <UsageBar
                  label="Projects"
                  usage={billingUsage.usage.projects}
                  limit={billingUsage.limits.projects || 0}
                  percentage={billingUsage.utilization.projects}
                />

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Cost</span>
                    <span className="text-lg font-semibold text-gray-900">
                      ${billingUsage.costs.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600 bg-blue-50',
    green: 'bg-green-500 text-green-600 bg-green-50',
    purple: 'bg-purple-500 text-purple-600 bg-purple-50',
    orange: 'bg-orange-500 text-orange-600 bg-orange-50'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color].split(' ')[2]}`}>
          <div className={colorClasses[color].split(' ')[1]}>
            {icon}
          </div>
        </div>

        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

interface UsageBarProps {
  label: string;
  usage: number;
  limit: number;
  percentage: number;
  unit?: string;
}

const UsageBar: React.FC<UsageBarProps> = ({ label, usage, limit, percentage, unit = '' }) => {
  const getBarColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-900">
          {usage.toLocaleString()} {unit} / {limit.toLocaleString()} {unit}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getBarColor(percentage)}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>

      <div className="text-xs text-gray-500 mt-1">
        {percentage.toFixed(1)}% used
      </div>
    </div>
  );
};