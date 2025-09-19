-- Admin User System Migration
-- Creates tables for admin user management and audit logging

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'super_admin')),
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(user_id),
    UNIQUE(email)
);

-- Create admin_audit_log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Index for efficient querying
    INDEX(admin_user_id),
    INDEX(timestamp),
    INDEX(action)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for admin_users table
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Admin users can read their own record
CREATE POLICY "Admin users can view their own record" ON admin_users
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Only super_admin can manage admin users
CREATE POLICY "Super admin can manage admin users" ON admin_users
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.role = 'super_admin'
            AND au.is_active = true
        )
    );

-- Create RLS policies for admin_audit_log table
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin users can view audit logs
CREATE POLICY "Admin users can view audit logs" ON admin_audit_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

-- Only the system can insert audit logs
CREATE POLICY "System can insert audit logs" ON admin_audit_log
    FOR INSERT
    TO authenticated
    WITH CHECK (admin_user_id = auth.uid());

-- Create function to check admin permissions
CREATE OR REPLACE FUNCTION check_admin_permission(required_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_permissions JSONB;
    user_role TEXT;
BEGIN
    -- Get user permissions and role
    SELECT permissions, role INTO user_permissions, user_role
    FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true;

    -- If no admin record found, return false
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Super admin has all permissions
    IF user_role = 'super_admin' THEN
        RETURN TRUE;
    END IF;

    -- Check if user has specific permission
    RETURN user_permissions ? required_permission;
END;
$$;

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    action_name TEXT,
    action_details JSONB DEFAULT '{}'::jsonb,
    client_ip INET DEFAULT NULL,
    client_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id UUID;
    admin_email TEXT;
BEGIN
    -- Get admin email
    SELECT email INTO admin_email
    FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true;

    -- If no admin record found, raise exception
    IF admin_email IS NULL THEN
        RAISE EXCEPTION 'Admin user not found or inactive';
    END IF;

    -- Insert audit log
    INSERT INTO admin_audit_log (
        admin_user_id,
        admin_email,
        action,
        details,
        ip_address,
        user_agent
    ) VALUES (
        auth.uid(),
        admin_email,
        action_name,
        action_details,
        client_ip,
        client_user_agent
    ) RETURNING id INTO log_id;

    RETURN log_id;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_timestamp ON admin_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user ON admin_audit_log(admin_user_id, timestamp DESC);

-- Insert initial super admin (update with your email)
-- This should be run manually with the correct email address
-- INSERT INTO admin_users (user_id, email, role, permissions, created_by)
-- SELECT
--     id,
--     email,
--     'super_admin',
--     '["ai:manage", "functions:deploy", "functions:config", "db:migrate", "audit:view", "audit:export", "users:manage", "admin:create"]'::jsonb,
--     id
-- FROM auth.users
-- WHERE email = 'your-admin-email@example.com'
-- ON CONFLICT (user_id) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON admin_users TO authenticated;
GRANT SELECT, INSERT ON admin_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION check_admin_permission(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action(TEXT, JSONB, INET, TEXT) TO authenticated;