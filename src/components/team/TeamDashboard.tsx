import React, { useState, useEffect } from 'react';
import {
  Users, Settings, Activity, DollarSign, Shield,
  Plus, Edit, Trash2, UserPlus, Mail, Calendar,
  TrendingUp, Clock, Code, GitBranch
} from 'lucide-react';
import { teamService, Team, TeamMember, TeamUsage } from '../../services/collaboration/TeamService';

interface TeamDashboardProps {
  teamId?: string;
}

export const TeamDashboard: React.FC<TeamDashboardProps> = ({ teamId }) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [usage, setUsage] = useState<TeamUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'usage' | 'settings'>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);

      const currentTeam = teamId ? await teamService.getTeam(teamId) : teamService.getCurrentTeam();
      if (!currentTeam) {
        throw new Error('No team found');
      }

      setTeam(currentTeam);

      // Load usage data for the current month
      const startDate = new Date();
      startDate.setDate(1);
      const endDate = new Date();

      const usageData = await teamService.getTeamUsage(currentTeam.id, startDate, endDate);
      setUsage(usageData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (email: string, role: TeamMember['role']) => {
    if (!team) return;

    try {
      await teamService.inviteTeamMember(team.id, email, role);
      setShowInviteModal(false);
      await loadTeamData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!team) return;

    if (confirm('Are you sure you want to remove this member from the team?')) {
      try {
        await teamService.removeTeamMember(team.id, userId);
        await loadTeamData(); // Refresh data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove member');
      }
    }
  };

  const handleUpdateMemberRole = async (userId: string, newRole: TeamMember['role']) => {
    if (!team) return;

    try {
      await teamService.updateMemberRole(team.id, userId, newRole);
      await loadTeamData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member role');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Selected</h3>
        <p className="text-gray-600">Select a team or create a new one to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
            <p className="text-gray-600 mt-1">{team.description}</p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <Users className="h-4 w-4 mr-1" />
              <span>{team.members.length} members</span>
              <Calendar className="h-4 w-4 ml-4 mr-1" />
              <span>Created {new Date(team.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </button>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <nav className="flex space-x-8 px-6 py-3 border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'usage', label: 'Usage & Billing', icon: DollarSign },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-6">
          {activeTab === 'overview' && (
            <TeamOverview team={team} usage={usage} />
          )}

          {activeTab === 'members' && (
            <TeamMembers
              members={team.members}
              onRemoveMember={handleRemoveMember}
              onUpdateRole={handleUpdateMemberRole}
            />
          )}

          {activeTab === 'usage' && (
            <TeamUsageBilling usage={usage} settings={team.settings} />
          )}

          {activeTab === 'settings' && (
            <TeamSettings team={team} onUpdate={loadTeamData} />
          )}
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <InviteMemberModal
          onInvite={handleInviteMember}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
};

// Team Overview Component
const TeamOverview: React.FC<{ team: Team; usage: TeamUsage | null }> = ({ team, usage }) => {
  const activeMembers = team.members.filter(m => m.status === 'active').length;
  const totalProjects = team.projects.length;

  const stats = [
    {
      label: 'Active Members',
      value: activeMembers,
      icon: Users,
      color: 'blue'
    },
    {
      label: 'Projects',
      value: totalProjects,
      icon: GitBranch,
      color: 'green'
    },
    {
      label: 'This Month Usage',
      value: usage ? `${usage.metrics.totalTokens.toLocaleString()} tokens` : '0 tokens',
      icon: Activity,
      color: 'purple'
    },
    {
      label: 'Monthly Cost',
      value: usage ? `$${usage.costs.total.toFixed(2)}` : '$0.00',
      icon: DollarSign,
      color: 'yellow'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-2 bg-${stat.color}-100 rounded-lg`}>
                <stat.icon className={`h-5 w-5 text-${stat.color}-600`} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {team.members.slice(0, 5).map(member => (
            <div key={member.userId} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.role}</p>
                </div>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {member.lastActive ?
                  new Date(member.lastActive).toLocaleDateString() :
                  'Never'
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Settings Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Team Configuration</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Default AI Model</p>
            <p className="text-sm text-gray-900">{team.settings.defaultAIModel}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Max Concurrent Users</p>
            <p className="text-sm text-gray-900">{team.settings.collaboration.maxConcurrentUsers}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Code Review Required</p>
            <p className="text-sm text-gray-900">
              {team.settings.collaboration.requireCodeReview ? 'Yes' : 'No'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Data Retention</p>
            <p className="text-sm text-gray-900">{team.settings.security.dataRetentionDays} days</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Team Members Component
const TeamMembers: React.FC<{
  members: TeamMember[];
  onRemoveMember: (userId: string) => void;
  onUpdateRole: (userId: string, role: TeamMember['role']) => void;
}> = ({ members, onRemoveMember, onUpdateRole }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Team Members ({members.length})</h3>
      </div>

      <div className="space-y-2">
        {members.map(member => (
          <div key={member.userId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {member.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                <p className="text-xs text-gray-500">{member.email}</p>
                <p className="text-xs text-gray-500">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={member.role}
                onChange={(e) => onUpdateRole(member.userId, e.target.value as TeamMember['role'])}
                className="text-xs border border-gray-300 rounded px-2 py-1"
                disabled={member.role === 'owner'}
              >
                <option value="viewer">Viewer</option>
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>

              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-2 ${
                  member.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                }`} />
                <span className={`text-xs ${
                  member.status === 'active' ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {member.status}
                </span>
              </div>

              {member.role !== 'owner' && (
                <button
                  onClick={() => onRemoveMember(member.userId)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Team Usage & Billing Component
const TeamUsageBilling: React.FC<{
  usage: TeamUsage | null;
  settings: Team['settings'];
}> = ({ usage, settings }) => {
  if (!usage) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No usage data available for this period.</p>
      </div>
    );
  }

  const utilizationPercentage = Math.round(
    (usage.metrics.totalTokens / settings.billing.usageLimits.monthlyTokens) * 100
  );

  return (
    <div className="space-y-6">
      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Tokens</p>
              <p className="text-2xl font-bold text-blue-900">{usage.metrics.totalTokens.toLocaleString()}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {utilizationPercentage}% of monthly limit
            </p>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Active Users</p>
              <p className="text-2xl font-bold text-green-900">{usage.metrics.activeUsers}</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Cost</p>
              <p className="text-2xl font-bold text-purple-900">${usage.costs.total.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Usage by Model */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Usage by AI Model</h3>
        <div className="space-y-3">
          {usage.breakdown.byModel.map((model, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                  <Code className="h-4 w-4 text-gray-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{model.model}</p>
                  <p className="text-xs text-gray-500">
                    {model.tokens.toLocaleString()} tokens • {model.requests} requests
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">${model.cost.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Limits */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">Monthly Limits</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-yellow-700">Tokens:</span>
            <span className="text-yellow-900">
              {usage.metrics.totalTokens.toLocaleString()} / {settings.billing.usageLimits.monthlyTokens.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-yellow-700">Projects:</span>
            <span className="text-yellow-900">
              {usage.metrics.projectsCreated} / {settings.billing.usageLimits.maxProjects}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Team Settings Component
const TeamSettings: React.FC<{
  team: Team;
  onUpdate: () => void;
}> = ({ team, onUpdate }) => {
  const [settings, setSettings] = useState(team.settings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await teamService.updateTeam(team.id, { settings });
      onUpdate();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Team Settings</h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* AI Configuration */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">AI Configuration</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default AI Model
            </label>
            <select
              value={settings.defaultAIModel}
              onChange={(e) => setSettings({ ...settings, defaultAIModel: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {settings.allowedAIModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Collaboration Settings */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Collaboration</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Allow Real-time Editing</span>
            <input
              type="checkbox"
              checked={settings.collaboration.allowRealTimeEditing}
              onChange={(e) => setSettings({
                ...settings,
                collaboration: { ...settings.collaboration, allowRealTimeEditing: e.target.checked }
              })}
              className="rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Require Code Review</span>
            <input
              type="checkbox"
              checked={settings.collaboration.requireCodeReview}
              onChange={(e) => setSettings({
                ...settings,
                collaboration: { ...settings.collaboration, requireCodeReview: e.target.checked }
              })}
              className="rounded"
            />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Security</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Retention (days)
            </label>
            <input
              type="number"
              value={settings.security.dataRetentionDays}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, dataRetentionDays: parseInt(e.target.value) }
              })}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2"
              min="1"
              max="365"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Invite Member Modal
const InviteMemberModal: React.FC<{
  onInvite: (email: string, role: TeamMember['role']) => void;
  onClose: () => void;
}> = ({ onInvite, onClose }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamMember['role']>('developer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onInvite(email.trim(), role);
      setEmail('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Invite Team Member</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="colleague@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as TeamMember['role'])}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="viewer">Viewer - Can view projects and code</option>
              <option value="developer">Developer - Can edit and contribute</option>
              <option value="admin">Admin - Can manage team and settings</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Send Invitation
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamDashboard;