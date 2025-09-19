/**
 * Admin User Validation Service
 * Handles authorization for administrative functions
 */

import { supabase } from '../supabase';

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
  created_at: string;
  last_login_at?: string;
}

export interface AdminValidationResult {
  isValid: boolean;
  user?: AdminUser;
  error?: string;
}

export class AdminValidationService {
  private static readonly ADMIN_ROLES = ['admin', 'super_admin'];
  private static readonly ADMIN_PERMISSIONS = {
    'ai:manage': 'Manage AI settings and providers',
    'functions:deploy': 'Deploy Supabase functions',
    'functions:config': 'Configure function environment variables',
    'db:migrate': 'Execute database migrations',
    'audit:view': 'View audit logs',
    'audit:export': 'Export audit data',
    'users:manage': 'Manage user accounts',
    'admin:create': 'Create admin users (super_admin only)',
  };

  /**
   * Validate if current user has admin privileges
   */
  static async validateAdminAccess(): Promise<AdminValidationResult> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          isValid: false,
          error: 'Authentication required'
        };
      }

      // Check if user has admin role in user metadata or custom table
      const adminUser = await this.getAdminUser(user.id);

      if (!adminUser) {
        return {
          isValid: false,
          error: 'Admin privileges required'
        };
      }

      return {
        isValid: true,
        user: adminUser
      };

    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(permission: string): Promise<boolean> {
    const validation = await this.validateAdminAccess();

    if (!validation.isValid || !validation.user) {
      return false;
    }

    return validation.user.permissions.includes(permission);
  }

  /**
   * Validate admin access for Supabase function operations
   */
  static async validateFunctionAccess(operation: 'deploy' | 'config' | 'logs'): Promise<AdminValidationResult> {
    const validation = await this.validateAdminAccess();

    if (!validation.isValid) {
      return validation;
    }

    const requiredPermission = operation === 'deploy' ? 'functions:deploy' :
                              operation === 'config' ? 'functions:config' :
                              'audit:view';

    const hasPermission = await this.hasPermission(requiredPermission);

    if (!hasPermission) {
      return {
        isValid: false,
        error: `Permission required: ${requiredPermission}`
      };
    }

    return validation;
  }

  /**
   * Get admin user details from database
   */
  private static async getAdminUser(userId: string): Promise<AdminUser | null> {
    try {
      // First check user metadata for quick validation
      const { data: { user } } = await supabase.auth.getUser();
      const userRole = user?.user_metadata?.role;

      if (userRole && this.ADMIN_ROLES.includes(userRole)) {
        // Create admin user object from metadata
        return {
          id: userId,
          email: user?.email || '',
          role: userRole as 'admin' | 'super_admin',
          permissions: this.getDefaultPermissions(userRole),
          created_at: user?.created_at || new Date().toISOString(),
          last_login_at: user?.last_sign_in_at || undefined
        };
      }

      // Fallback: Check custom admin_users table (if exists)
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !adminUser) {
        return null;
      }

      return {
        id: adminUser.user_id,
        email: adminUser.email,
        role: adminUser.role,
        permissions: adminUser.permissions || this.getDefaultPermissions(adminUser.role),
        created_at: adminUser.created_at,
        last_login_at: adminUser.last_login_at
      };

    } catch (error) {
      console.error('Error fetching admin user:', error);
      return null;
    }
  }

  /**
   * Get default permissions for role
   */
  private static getDefaultPermissions(role: string): string[] {
    switch (role) {
      case 'super_admin':
        return Object.keys(this.ADMIN_PERMISSIONS);
      case 'admin':
        return [
          'ai:manage',
          'functions:config',
          'audit:view',
          'audit:export'
        ];
      default:
        return [];
    }
  }

  /**
   * Create admin authorization header for API calls
   */
  static async getAdminAuthHeader(): Promise<{ Authorization: string } | null> {
    const validation = await this.validateAdminAccess();

    if (!validation.isValid) {
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return null;
    }

    return {
      Authorization: `Bearer ${session.access_token}`
    };
  }

  /**
   * Log admin action for audit trail
   */
  static async logAdminAction(action: string, details: Record<string, any> = {}): Promise<void> {
    try {
      const validation = await this.validateAdminAccess();

      if (!validation.isValid || !validation.user) {
        return;
      }

      await supabase
        .from('admin_audit_log')
        .insert({
          admin_user_id: validation.user.id,
          admin_email: validation.user.email,
          action,
          details,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });

    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  /**
   * Get client IP address (best effort)
   */
  private static async getClientIP(): Promise<string | null> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  }

  /**
   * Initialize admin user (development helper)
   */
  static async initializeAdminUser(email: string, role: 'admin' | 'super_admin' = 'admin'): Promise<boolean> {
    try {
      // This should only be used in development
      if (process.env.NODE_ENV === 'production') {
        console.error('Admin initialization not allowed in production');
        return false;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user || user.email !== email) {
        console.error('Current user does not match admin email');
        return false;
      }

      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: { role }
      });

      if (error) {
        console.error('Failed to update user metadata:', error);
        return false;
      }

      await this.logAdminAction('admin_user_initialized', { role, email });

      return true;

    } catch (error) {
      console.error('Failed to initialize admin user:', error);
      return false;
    }
  }
}

export default AdminValidationService;