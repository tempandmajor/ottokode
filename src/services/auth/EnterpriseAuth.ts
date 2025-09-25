import { supabase } from '../../lib/supabase';

export interface SAMLConfig {
  entityId: string;
  ssoUrl: string;
  x509Certificate: string;
  attributeMapping: {
    email: string;
    firstName: string;
    lastName: string;
    groups: string;
  };
  signRequests: boolean;
  encryptAssertions: boolean;
}

export interface OIDCConfig {
  clientId: string;
  clientSecret: string;
  discoveryUrl: string;
  scopes: string[];
  redirectUri: string;
  additionalParams?: Record<string, string>;
}

export interface SCIMConfig {
  enabled: boolean;
  bearerToken: string;
  baseUrl: string;
  version: '1.1' | '2.0';
  userMappings: {
    email: string;
    firstName: string;
    lastName: string;
    active: string;
  };
}

export interface EnterpriseAuthConfig {
  organizationId: string;
  domain: string;
  ssoProvider: 'saml' | 'oidc' | 'oauth2' | 'ldap';
  samlConfig?: SAMLConfig;
  oidcConfig?: OIDCConfig;
  scimConfig?: SCIMConfig;
  jitProvisioning: boolean;
  enforceSSO: boolean;
  allowedDomains: string[];
  sessionTimeout: number; // minutes
  mfaRequired: boolean;
  roleMapping: Record<string, string[]>;
}

export interface EnterpriseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  groups: string[];
  roles: string[];
  department?: string;
  managerId?: string;
  isActive: boolean;
  lastLogin?: Date;
  ssoProvider: string;
  externalId: string;
  metadata: Record<string, any>;
}

export interface AuthenticationResult {
  success: boolean;
  user?: EnterpriseUser;
  error?: string;
  requiresMFA?: boolean;
  mfaToken?: string;
}

export interface SessionInfo {
  userId: string;
  sessionId: string;
  expiresAt: Date;
  metadata: {
    ipAddress: string;
    userAgent: string;
    ssoProvider: string;
    lastActivity: Date;
  };
}

export class EnterpriseAuth {
  private config: EnterpriseAuthConfig | null = null;
  private activeSessions: Map<string, SessionInfo> = new Map();

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Load enterprise auth configuration
      await this.loadConfiguration();

      // Set up session monitoring
      this.startSessionMonitoring();

      // Initialize SSO provider
      if (this.config) {
        await this.initializeSSO();
      }
    } catch (error) {
      console.error('Enterprise Auth initialization failed:', error);
    }
  }

  private async loadConfiguration(): Promise<void> {
    try {
      // In production, this would load from your configuration service
      const { data, error } = await supabase
        .from('enterprise_auth_config')
        .select('*')
        .single();

      if (error || !data) {
        console.log('No enterprise auth configuration found');
        return;
      }

      this.config = this.mapConfigData(data);
    } catch (error) {
      console.error('Error loading enterprise auth configuration:', error);
    }
  }

  private async initializeSSO(): Promise<void> {
    if (!this.config) return;

    switch (this.config.ssoProvider) {
      case 'saml':
        await this.initializeSAML();
        break;
      case 'oidc':
        await this.initializeOIDC();
        break;
      case 'oauth2':
        await this.initializeOAuth2();
        break;
      case 'ldap':
        await this.initializeLDAP();
        break;
    }
  }

  private async initializeSAML(): Promise<void> {
    if (!this.config?.samlConfig) return;

    // SAML initialization would integrate with a SAML library
    console.log('SAML SSO initialized for organization:', this.config.organizationId);
  }

  private async initializeOIDC(): Promise<void> {
    if (!this.config?.oidcConfig) return;

    try {
      // Fetch OIDC discovery document
      const response = await fetch(this.config.oidcConfig.discoveryUrl);
      const discoveryDoc = await response.json();

      console.log('OIDC SSO initialized:', {
        issuer: discoveryDoc.issuer,
        authorizationEndpoint: discoveryDoc.authorization_endpoint,
        tokenEndpoint: discoveryDoc.token_endpoint
      });
    } catch (error) {
      console.error('OIDC initialization failed:', error);
    }
  }

  private async initializeOAuth2(): Promise<void> {
    // OAuth2 initialization
    console.log('OAuth2 SSO initialized for organization:', this.config?.organizationId);
  }

  private async initializeLDAP(): Promise<void> {
    // LDAP initialization
    console.log('LDAP SSO initialized for organization:', this.config?.organizationId);
  }

  async authenticateUser(
    email: string,
    password?: string,
    ssoToken?: string
  ): Promise<AuthenticationResult> {
    try {
      // Check if domain requires SSO
      const domain = email.split('@')[1];

      if (this.config && this.config.enforceSSO && this.config.allowedDomains.includes(domain)) {
        return await this.authenticateWithSSO(email, ssoToken);
      }

      // Standard authentication
      return await this.authenticateStandard(email, password);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  private async authenticateWithSSO(email: string, ssoToken?: string): Promise<AuthenticationResult> {
    if (!this.config) {
      return { success: false, error: 'SSO not configured' };
    }

    if (!ssoToken) {
      // Return SSO redirect URL
      const ssoUrl = this.generateSSOUrl(email);
      return {
        success: false,
        error: 'SSO_REDIRECT',
        // In a real implementation, this would include the redirect URL
      };
    }

    try {
      // Validate SSO token
      const tokenValidation = await this.validateSSOToken(ssoToken);

      if (!tokenValidation.valid) {
        return { success: false, error: 'Invalid SSO token' };
      }

      // Get or create user from SSO claims
      const user = await this.processUserFromSSO(tokenValidation.claims);

      // Check if MFA is required
      if (this.config.mfaRequired && !tokenValidation.claims.mfa_verified) {
        return {
          success: false,
          requiresMFA: true,
          mfaToken: this.generateMFAToken(user.id)
        };
      }

      // Create session
      const session = await this.createSession(user);

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SSO authentication failed'
      };
    }
  }

  private async authenticateStandard(email: string, password?: string): Promise<AuthenticationResult> {
    if (!password) {
      return { success: false, error: 'Password required' };
    }

    try {
      // Use Supabase auth for standard authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data.user) {
        return { success: false, error: error?.message || 'Authentication failed' };
      }

      // Convert to enterprise user format
      const user = await this.convertToEnterpriseUser(data.user);

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  private generateSSOUrl(email: string): string {
    if (!this.config) throw new Error('SSO not configured');

    const state = this.generateStateToken();
    const params = new URLSearchParams({
      client_id: this.config.oidcConfig?.clientId || '',
      response_type: 'code',
      scope: this.config.oidcConfig?.scopes.join(' ') || 'openid email profile',
      redirect_uri: this.config.oidcConfig?.redirectUri || '',
      state,
      login_hint: email
    });

    // Store state for validation
    this.storeStateToken(state, email);

    return `${this.config.oidcConfig?.discoveryUrl}/auth?${params.toString()}`;
  }

  private async validateSSOToken(token: string): Promise<{
    valid: boolean;
    claims?: any;
  }> {
    try {
      // This would validate the JWT token or SAML assertion
      // For now, we'll mock the validation

      // Decode JWT token (simplified)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false };
      }

      const payload = JSON.parse(atob(parts[1]));

      // Validate token expiration
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return { valid: false };
      }

      // Validate issuer
      if (this.config?.oidcConfig && payload.iss !== this.getExpectedIssuer()) {
        return { valid: false };
      }

      return { valid: true, claims: payload };
    } catch (error) {
      console.error('Token validation failed:', error);
      return { valid: false };
    }
  }

  private async processUserFromSSO(claims: any): Promise<EnterpriseUser> {
    const email = claims.email || claims.preferred_username;
    const firstName = claims.given_name || claims.firstName || '';
    const lastName = claims.family_name || claims.lastName || '';
    const groups = claims.groups || [];

    // Check if user exists
    let user = await this.getUserByEmail(email);

    if (!user && this.config?.jitProvisioning) {
      // Just-in-time user provisioning
      user = await this.createEnterpriseUser({
        email,
        firstName,
        lastName,
        groups,
        ssoProvider: this.config.ssoProvider,
        externalId: claims.sub || claims.nameID || email
      });
    } else if (user) {
      // Update existing user with latest claims
      user = await this.updateUserFromClaims(user, claims);
    }

    if (!user) {
      throw new Error('User not found and JIT provisioning is disabled');
    }

    return user;
  }

  private async createSession(user: EnterpriseUser): Promise<SessionInfo> {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + (this.config?.sessionTimeout || 480)); // 8 hours default

    const session: SessionInfo = {
      userId: user.id,
      sessionId,
      expiresAt,
      metadata: {
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent(),
        ssoProvider: user.ssoProvider,
        lastActivity: new Date()
      }
    };

    this.activeSessions.set(sessionId, session);

    // Store session in database
    await this.storeSession(session);

    return session;
  }

  private async getUserByEmail(email: string): Promise<EnterpriseUser | null> {
    try {
      const { data, error } = await supabase
        .from('enterprise_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !data) return null;

      return this.mapUserData(data);
    } catch {
      return null;
    }
  }

  private async createEnterpriseUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    groups: string[];
    ssoProvider: string;
    externalId: string;
  }): Promise<EnterpriseUser> {
    const user: EnterpriseUser = {
      id: crypto.randomUUID(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      groups: userData.groups,
      roles: this.mapGroupsToRoles(userData.groups),
      isActive: true,
      ssoProvider: userData.ssoProvider,
      externalId: userData.externalId,
      metadata: {}
    };

    // Store in database
    await supabase
      .from('enterprise_users')
      .insert({
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        groups: user.groups,
        roles: user.roles,
        is_active: user.isActive,
        sso_provider: user.ssoProvider,
        external_id: user.externalId,
        metadata: user.metadata,
        created_at: new Date().toISOString()
      });

    return user;
  }

  private async updateUserFromClaims(user: EnterpriseUser, claims: any): Promise<EnterpriseUser> {
    const updatedUser = {
      ...user,
      firstName: claims.given_name || claims.firstName || user.firstName,
      lastName: claims.family_name || claims.lastName || user.lastName,
      groups: claims.groups || user.groups,
      roles: this.mapGroupsToRoles(claims.groups || user.groups),
      lastLogin: new Date()
    };

    // Update in database
    await supabase
      .from('enterprise_users')
      .update({
        first_name: updatedUser.firstName,
        last_name: updatedUser.lastName,
        groups: updatedUser.groups,
        roles: updatedUser.roles,
        last_login: updatedUser.lastLogin?.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    return updatedUser;
  }

  private async convertToEnterpriseUser(supabaseUser: any): Promise<EnterpriseUser> {
    // Convert Supabase user to enterprise user format
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      firstName: supabaseUser.user_metadata?.firstName || '',
      lastName: supabaseUser.user_metadata?.lastName || '',
      groups: [],
      roles: ['user'],
      isActive: true,
      ssoProvider: 'supabase',
      externalId: supabaseUser.id,
      metadata: supabaseUser.user_metadata || {}
    };
  }

  private mapGroupsToRoles(groups: string[]): string[] {
    if (!this.config?.roleMapping) return ['user'];

    const roles = new Set<string>();

    for (const group of groups) {
      const mappedRoles = this.config.roleMapping[group] || [];
      mappedRoles.forEach(role => roles.add(role));
    }

    return roles.size > 0 ? Array.from(roles) : ['user'];
  }

  async validateSession(sessionId: string): Promise<SessionInfo | null> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (Date.now() > session.expiresAt.getTime()) {
      await this.invalidateSession(sessionId);
      return null;
    }

    // Update last activity
    session.metadata.lastActivity = new Date();
    this.activeSessions.set(sessionId, session);

    return session;
  }

  async invalidateSession(sessionId: string): Promise<void> {
    this.activeSessions.delete(sessionId);

    // Remove from database
    await supabase
      .from('user_sessions')
      .delete()
      .eq('session_id', sessionId);
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    // Remove all sessions for user
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.activeSessions.delete(sessionId);
      }
    }

    // Remove from database
    await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId);
  }

  private startSessionMonitoring(): void {
    // Clean up expired sessions every 5 minutes
    setInterval(async () => {
      const now = Date.now();
      const expiredSessions: string[] = [];

      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (now > session.expiresAt.getTime()) {
          expiredSessions.push(sessionId);
        }
      }

      // Remove expired sessions
      for (const sessionId of expiredSessions) {
        await this.invalidateSession(sessionId);
      }

      // Clean up sessions with no activity for timeout period
      if (this.config?.sessionTimeout) {
        const timeoutMs = this.config.sessionTimeout * 60 * 1000;

        for (const [sessionId, session] of this.activeSessions.entries()) {
          const inactiveTime = now - session.metadata.lastActivity.getTime();

          if (inactiveTime > timeoutMs) {
            await this.invalidateSession(sessionId);
          }
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // SCIM Integration Methods

  async processSCIMRequest(method: string, path: string, body: any): Promise<any> {
    if (!this.config?.scimConfig?.enabled) {
      throw new Error('SCIM not enabled');
    }

    switch (method) {
      case 'GET':
        return this.handleSCIMGet(path);
      case 'POST':
        return this.handleSCIMPost(path, body);
      case 'PUT':
        return this.handleSCIMPut(path, body);
      case 'PATCH':
        return this.handleSCIMPatch(path, body);
      case 'DELETE':
        return this.handleSCIMDelete(path);
      default:
        throw new Error('Unsupported SCIM method');
    }
  }

  private async handleSCIMGet(path: string): Promise<any> {
    if (path === '/Users') {
      return this.getSCIMUsers();
    } else if (path.startsWith('/Users/')) {
      const userId = path.split('/')[2];
      return this.getSCIMUser(userId);
    }

    throw new Error('SCIM path not supported');
  }

  private async getSCIMUsers(): Promise<any> {
    const { data, error } = await supabase
      .from('enterprise_users')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults: data.length,
      Resources: data.map(user => this.mapUserToSCIM(user))
    };
  }

  private async getSCIMUser(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('enterprise_users')
      .select('*')
      .eq('external_id', userId)
      .single();

    if (error || !data) {
      throw new Error('User not found');
    }

    return this.mapUserToSCIM(data);
  }

  private mapUserToSCIM(user: any): any {
    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
      id: user.external_id,
      userName: user.email,
      name: {
        givenName: user.first_name,
        familyName: user.last_name
      },
      emails: [
        {
          value: user.email,
          primary: true
        }
      ],
      active: user.is_active,
      groups: user.groups || []
    };
  }

  private async handleSCIMPost(path: string, body: any): Promise<any> {
    if (path === '/Users') {
      return this.createSCIMUser(body);
    }
    throw new Error('SCIM POST path not supported');
  }

  private async createSCIMUser(scimUser: any): Promise<any> {
    const user = await this.createEnterpriseUser({
      email: scimUser.userName || scimUser.emails[0].value,
      firstName: scimUser.name?.givenName || '',
      lastName: scimUser.name?.familyName || '',
      groups: scimUser.groups || [],
      ssoProvider: 'scim',
      externalId: scimUser.id || crypto.randomUUID()
    });

    return this.mapUserToSCIM(user);
  }

  private async handleSCIMPut(path: string, body: any): Promise<any> {
    // Handle SCIM PUT requests (full user update)
    throw new Error('SCIM PUT not implemented');
  }

  private async handleSCIMPatch(path: string, body: any): Promise<any> {
    // Handle SCIM PATCH requests (partial user update)
    throw new Error('SCIM PATCH not implemented');
  }

  private async handleSCIMDelete(path: string): Promise<any> {
    // Handle SCIM DELETE requests (deactivate user)
    throw new Error('SCIM DELETE not implemented');
  }

  // Helper methods

  private generateStateToken(): string {
    return crypto.randomUUID();
  }

  private storeStateToken(token: string, email: string): void {
    // Store state token for CSRF protection
    // In production, this would use a secure storage mechanism
  }

  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  private generateMFAToken(userId: string): string {
    return `mfa_${userId}_${Date.now()}`;
  }

  private getExpectedIssuer(): string {
    return this.config?.oidcConfig?.discoveryUrl || '';
  }

  private getClientIP(): string {
    // Get client IP address
    return '127.0.0.1'; // Placeholder
  }

  private getUserAgent(): string {
    return typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown';
  }

  private async storeSession(session: SessionInfo): Promise<void> {
    await supabase
      .from('user_sessions')
      .insert({
        session_id: session.sessionId,
        user_id: session.userId,
        expires_at: session.expiresAt.toISOString(),
        metadata: session.metadata,
        created_at: new Date().toISOString()
      });
  }

  private mapConfigData(data: any): EnterpriseAuthConfig {
    return {
      organizationId: data.organization_id,
      domain: data.domain,
      ssoProvider: data.sso_provider,
      samlConfig: data.saml_config,
      oidcConfig: data.oidc_config,
      scimConfig: data.scim_config,
      jitProvisioning: data.jit_provisioning,
      enforceSSO: data.enforce_sso,
      allowedDomains: data.allowed_domains,
      sessionTimeout: data.session_timeout,
      mfaRequired: data.mfa_required,
      roleMapping: data.role_mapping
    };
  }

  private mapUserData(data: any): EnterpriseUser {
    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      groups: data.groups,
      roles: data.roles,
      department: data.department,
      managerId: data.manager_id,
      isActive: data.is_active,
      lastLogin: data.last_login ? new Date(data.last_login) : undefined,
      ssoProvider: data.sso_provider,
      externalId: data.external_id,
      metadata: data.metadata
    };
  }

  // Public API

  getConfiguration(): EnterpriseAuthConfig | null {
    return this.config;
  }

  async updateConfiguration(config: Partial<EnterpriseAuthConfig>): Promise<void> {
    if (!this.config) {
      throw new Error('No configuration to update');
    }

    this.config = { ...this.config, ...config };

    // Update in database
    await supabase
      .from('enterprise_auth_config')
      .update(config)
      .eq('organization_id', this.config.organizationId);

    // Reinitialize if SSO provider changed
    if (config.ssoProvider) {
      await this.initializeSSO();
    }
  }

  getActiveSessions(): SessionInfo[] {
    return Array.from(this.activeSessions.values());
  }

  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId);
  }

  isEnterpriseUser(email: string): boolean {
    if (!this.config) return false;

    const domain = email.split('@')[1];
    return this.config.allowedDomains.includes(domain);
  }

  requiresSSO(email: string): boolean {
    return this.isEnterpriseUser(email) &&
           (this.config?.enforceSSO ?? false);
  }
}

export const enterpriseAuth = new EnterpriseAuth();
export default EnterpriseAuth;