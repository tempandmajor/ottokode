-- Team and Enterprise Features Migration
-- This adds collaborative features for mid-sized to large organizations

-- Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    industry TEXT,
    size_category TEXT CHECK (size_category IN ('startup', 'small', 'medium', 'large', 'enterprise')) DEFAULT 'small',
    settings JSONB DEFAULT '{
        "allow_external_collaborators": false,
        "require_2fa": false,
        "sso_enabled": false,
        "audit_logging": false,
        "data_retention_days": 90,
        "ip_whitelist": [],
        "allowed_domains": []
    }',
    billing_email TEXT,
    tax_id TEXT,
    address JSONB DEFAULT '{}',
    subscription_plan TEXT DEFAULT 'team' CHECK (subscription_plan IN ('team', 'business', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'suspended', 'cancelled')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'guest')) DEFAULT 'member',
    permissions JSONB DEFAULT '{
        "manage_billing": false,
        "manage_members": false,
        "manage_projects": true,
        "manage_settings": false,
        "view_analytics": false,
        "export_data": false
    }',
    invited_by UUID REFERENCES public.users(id),
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'left')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Teams within organizations
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#007acc',
    created_by UUID REFERENCES public.users(id) NOT NULL,
    settings JSONB DEFAULT '{
        "privacy": "private",
        "auto_assign_projects": false,
        "notification_preferences": {
            "project_updates": true,
            "member_changes": true,
            "mentions": true
        }
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('lead', 'member')),
    added_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Projects (enhanced for collaboration)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    repository_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'internal', 'public')),
    settings JSONB DEFAULT '{
        "collaboration_enabled": true,
        "real_time_editing": true,
        "commenting_enabled": true,
        "ai_assistance": true,
        "auto_save": true,
        "version_control": true,
        "branch_protection": false
    }',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project collaborators
CREATE TABLE IF NOT EXISTS public.project_collaborators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'contributor' CHECK (role IN ('owner', 'maintainer', 'contributor', 'viewer')),
    permissions JSONB DEFAULT '{
        "read": true,
        "write": false,
        "admin": false,
        "delete": false
    }',
    invited_by UUID REFERENCES public.users(id),
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- File versions for collaboration
CREATE TABLE IF NOT EXISTS public.file_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    content TEXT,
    content_hash TEXT,
    author_id UUID REFERENCES public.users(id) NOT NULL,
    commit_message TEXT,
    changes_summary JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, file_path, version_number)
);

-- Real-time collaboration cursors
CREATE TABLE IF NOT EXISTS public.collaboration_cursors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    selection_start INTEGER,
    selection_end INTEGER,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id, file_path)
);

-- Comments and discussions
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    file_path TEXT,
    line_number INTEGER,
    position INTEGER,
    content TEXT NOT NULL,
    mentions JSONB DEFAULT '[]',
    reactions JSONB DEFAULT '{}',
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'deleted')),
    resolved_by UUID REFERENCES public.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization usage analytics
CREATE TABLE IF NOT EXISTS public.organization_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    active_users INTEGER DEFAULT 0,
    projects_created INTEGER DEFAULT 0,
    ai_requests INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10,6) DEFAULT 0.000000,
    storage_used BIGINT DEFAULT 0, -- bytes
    bandwidth_used BIGINT DEFAULT 0, -- bytes
    collaboration_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, date)
);

-- Audit logs for enterprise security
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invitations system
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    permissions JSONB DEFAULT '{}',
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES public.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SSO configurations
CREATE TABLE IF NOT EXISTS public.sso_configurations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('saml', 'oidc', 'oauth2')),
    name TEXT NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, provider, name)
);

-- Billing and subscription management
CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('team', 'business', 'enterprise')),
    status TEXT NOT NULL CHECK (status IN ('active', 'trial', 'past_due', 'cancelled', 'incomplete')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    seats_purchased INTEGER DEFAULT 0,
    seats_used INTEGER DEFAULT 0,
    monthly_budget DECIMAL(10,2),
    usage_limits JSONB DEFAULT '{
        "ai_requests_per_month": null,
        "storage_gb": null,
        "bandwidth_gb": null,
        "projects": null
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_org_id ON public.teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON public.projects(team_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON public.project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON public.project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_project_id ON public.file_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_file_path ON public.file_versions(project_id, file_path);
CREATE INDEX IF NOT EXISTS idx_collaboration_cursors_project_id ON public.collaboration_cursors(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON public.comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_organization_usage_org_id ON public.organization_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_usage_date ON public.organization_usage(date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invitations_org_id ON public.invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON public.organization_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sso_configurations_updated_at BEFORE UPDATE ON public.sso_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organization_subscriptions_updated_at BEFORE UPDATE ON public.organization_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();