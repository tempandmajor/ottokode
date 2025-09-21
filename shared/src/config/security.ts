/**
 * Unified security configuration
 * Centralizes CSP, security headers, and protection measures
 */

import type { EnvConfig } from './environment';

export interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableXSS: boolean;
  enableFrameOptions: boolean;
  enableContentTypeOptions: boolean;
  enableReferrerPolicy: boolean;
  enablePermissionsPolicy: boolean;
  strictMode: boolean;
}

export class SecurityManager {
  private static instance: SecurityManager;

  static getInstance(): SecurityManager {
    if (!this.instance) {
      this.instance = new SecurityManager();
    }
    return this.instance;
  }

  /**
   * Build secure Content Security Policy
   */
  buildCSP(config: EnvConfig, nonce?: string): string {
    const { app, supabase } = config;
    const isDevelopment = app.isDevelopment;
    const isDesktop = app.isDesktop;

    // Base policies - more restrictive by default
    const cspPolicies = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        // Only allow nonce-based scripts in production
        ...(nonce ? [`'nonce-${nonce}'`] : []),
        // Allow unsafe-inline only in development or for specific needs
        ...(isDevelopment ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
        // Trusted domains
        'https://vercel.live',
        'https://va.vercel-scripts.com',
      ],
      'style-src': [
        "'self'",
        // Allow inline styles for CSS-in-JS libraries
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'data:',
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
        supabase.url,
      ],
      'connect-src': [
        "'self'",
        supabase.url,
        // AI providers
        'https://api.openai.com',
        'https://api.anthropic.com',
        'https://generativelanguage.googleapis.com',
        'https://api.cohere.ai',
        'https://api.mistral.ai',
        // Analytics and monitoring
        'https://vercel.live',
        'https://vitals.vercel-insights.com',
        // WebSocket connections
        ...(isDevelopment ? ['ws:', 'http:', 'http://localhost:*'] : ['wss:']),
      ],
      'frame-src': [
        isDesktop ? "'self'" : "'none'",
      ],
      'object-src': ["'none'"],
      'media-src': [
        "'self'",
        'data:',
        'blob:',
      ],
      'worker-src': [
        "'self'",
        'blob:',
      ],
      'child-src': [
        "'self'",
        'blob:',
      ],
      'form-action': [
        "'self'",
        supabase.url,
      ],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      ...(app.isProduction && !isDevelopment ? { 'upgrade-insecure-requests': [] } : {}),
    };

    return Object.entries(cspPolicies)
      .map(([directive, sources]) => {
        if (sources.length === 0) return directive;
        return `${directive} ${sources.join(' ')}`;
      })
      .join('; ');
  }

  /**
   * Build Permissions Policy header
   */
  buildPermissionsPolicy(): string {
    const policies = {
      'camera': '()',
      'microphone': '()',
      'geolocation': '()',
      'interest-cohort': '()',
      'payment': '()',
      'usb': '()',
      'fullscreen': '(self)',
      'clipboard-read': '(self)',
      'clipboard-write': '(self)',
      'web-share': '(self)',
    };

    return Object.entries(policies)
      .map(([feature, allowlist]) => `${feature}=${allowlist}`)
      .join(', ');
  }

  /**
   * Generate cryptographically secure nonce
   */
  generateNonce(): string {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  }

  /**
   * Get default security headers for the platform
   */
  getSecurityHeaders(config: EnvConfig, nonce?: string): Record<string, string> {
    const headers: Record<string, string> = {};
    const securityConfig = this.getSecurityConfig(config);

    // Content Security Policy
    if (securityConfig.enableCSP) {
      headers['Content-Security-Policy'] = this.buildCSP(config, nonce);
    }

    // HTTP Strict Transport Security
    if (securityConfig.enableHSTS && config.app.isProduction) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    }

    // XSS Protection (legacy but still useful)
    if (securityConfig.enableXSS) {
      headers['X-XSS-Protection'] = '1; mode=block';
    }

    // Frame Options
    if (securityConfig.enableFrameOptions) {
      headers['X-Frame-Options'] = config.app.isDesktop ? 'SAMEORIGIN' : 'DENY';
    }

    // Content Type Options
    if (securityConfig.enableContentTypeOptions) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    // Referrer Policy
    if (securityConfig.enableReferrerPolicy) {
      headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    }

    // Permissions Policy
    if (securityConfig.enablePermissionsPolicy) {
      headers['Permissions-Policy'] = this.buildPermissionsPolicy();
    }

    // Cross-Origin Policies
    if (config.app.isProduction) {
      headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
      headers['Cross-Origin-Opener-Policy'] = 'same-origin';
      headers['Cross-Origin-Resource-Policy'] = 'same-site';
    }

    // Remove framework disclosure
    headers['X-Powered-By'] = '';
    headers['Server'] = '';

    return headers;
  }

  private getSecurityConfig(config: EnvConfig): SecurityConfig {
    return {
      enableCSP: config.security.enableCSP,
      enableHSTS: config.security.enableHSTS,
      enableXSS: true,
      enableFrameOptions: true,
      enableContentTypeOptions: true,
      enableReferrerPolicy: true,
      enablePermissionsPolicy: true,
      strictMode: config.security.strictMode,
    };
  }

  /**
   * Validate request for security threats
   */
  validateRequest(url: string, headers: Record<string, string | null>): { isValid: boolean; reason?: string } {
    // Check for common attack patterns in URL
    const sqlInjectionPatterns = [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    ];

    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
    ];

    const pathTraversalPatterns = [
      /\.\.\//gi,
      /\.\.\\+/gi,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi,
    ];

    // Check for malicious patterns
    for (const pattern of [...sqlInjectionPatterns, ...xssPatterns, ...pathTraversalPatterns]) {
      if (pattern.test(url)) {
        return {
          isValid: false,
          reason: 'Malicious pattern detected in request'
        };
      }
    }

    // Check request size limits
    const contentLength = headers['content-length'];
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
      return {
        isValid: false,
        reason: 'Request too large'
      };
    }

    return { isValid: true };
  }
}

// Export singleton instance
export const security = SecurityManager.getInstance();