/**
 * Security Middleware
 * Handles CSP, security headers, and protection measures
 */

import { NextRequest, NextResponse } from 'next/server';

export interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableXSS: boolean;
  enableFrameOptions: boolean;
  enableContentTypeOptions: boolean;
  enableReferrerPolicy: boolean;
  enablePermissionsPolicy: boolean;
}

export class SecurityMiddleware {
  private static readonly DEFAULT_CONFIG: SecurityConfig = {
    enableCSP: true,
    enableHSTS: true,
    enableXSS: true,
    enableFrameOptions: true,
    enableContentTypeOptions: true,
    enableReferrerPolicy: true,
    enablePermissionsPolicy: true,
  };

  /**
   * Apply security headers to response
   */
  static applySecurityHeaders(
    request: NextRequest,
    response: NextResponse,
    config: Partial<SecurityConfig> = {}
  ): NextResponse {
    const securityConfig = { ...this.DEFAULT_CONFIG, ...config };
    const nonce = this.generateNonce();

    // Content Security Policy
    if (securityConfig.enableCSP) {
      const cspHeader = this.buildCSPHeader(nonce, request);
      response.headers.set('Content-Security-Policy', cspHeader);
    }

    // HTTP Strict Transport Security
    if (securityConfig.enableHSTS) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // XSS Protection
    if (securityConfig.enableXSS) {
      response.headers.set('X-XSS-Protection', '1; mode=block');
    }

    // Frame Options
    if (securityConfig.enableFrameOptions) {
      response.headers.set('X-Frame-Options', 'DENY');
    }

    // Content Type Options
    if (securityConfig.enableContentTypeOptions) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }

    // Referrer Policy
    if (securityConfig.enableReferrerPolicy) {
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    // Permissions Policy
    if (securityConfig.enablePermissionsPolicy) {
      const permissionsPolicy = this.buildPermissionsPolicy();
      response.headers.set('Permissions-Policy', permissionsPolicy);
    }

    // Cross-Origin Policies
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Resource-Policy', 'same-site');

    // Custom Security Headers
    response.headers.set('X-Powered-By', ''); // Remove framework disclosure
    response.headers.set('Server', ''); // Remove server disclosure

    // Store nonce for use in HTML
    response.headers.set('X-CSP-Nonce', nonce);

    return response;
  }

  /**
   * Build Content Security Policy header
   */
  private static buildCSPHeader(nonce: string, request: NextRequest): string {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isVercel = process.env.VERCEL === '1';
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gbugafddunddrvkvgifl.supabase.co';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    const cspPolicies = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        // Pragmatic unblock: allow inline scripts (Next bootstrap) and eval only in dev/Vercel
        "'unsafe-inline'",
        ...(isDevelopment || isVercel ? ["'unsafe-eval'"] : []),
        'https://vercel.live',
        'https://va.vercel-scripts.com',
      ],
      'script-src-elem': [
        "'self'",
        // Inline <script> blocks are governed by script-src; this covers external script elements
        'https://vercel.live',
        'https://va.vercel-scripts.com',
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for styled-jsx and dynamic styles
        'https://fonts.googleapis.com',
        'https://cdnjs.cloudflare.com',
      ],
      'style-src-elem': [
        "'self'",
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
        supabaseUrl,
        'https://vercel.com', // Vercel assets
      ],
      'connect-src': [
        "'self'",
        supabaseUrl,
        'https://api.openai.com',
        'https://api.anthropic.com',
        'https://generativelanguage.googleapis.com',
        'https://vercel.live', // Vercel analytics
        'https://vitals.vercel-insights.com', // Vercel vitals
        'wss:', // WebSocket connections
        ...(isDevelopment ? ['ws:', 'http:', 'http://localhost:*'] : []),
      ],
      'frame-src': [
        "'self'",
        ...(isVercel ? ['https://vercel.live'] : ["'none'"]),
      ],
      'object-src': [
        "'none'",
      ],
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
        supabaseUrl,
      ],
      'frame-ancestors': [
        "'none'",
      ],
      'base-uri': [
        "'self'",
      ],
      'upgrade-insecure-requests': [],
    };

    // Build CSP string
    const cspString = Object.entries(cspPolicies)
      .map(([directive, sources]) => {
        if (sources.length === 0) {
          return directive;
        }
        return `${directive} ${sources.join(' ')}`;
      })
      .join('; ');

    return cspString;
  }

  /**
   * Build Permissions Policy header
   */
  private static buildPermissionsPolicy(): string {
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
  private static generateNonce(): string {
    // Use crypto.randomUUID() which is available in Edge Runtime
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  }

  /**
   * Validate request for security threats
   */
  static validateRequest(request: NextRequest): { isValid: boolean; reason?: string } {
    // Check for common attack patterns in URL
    const url = request.nextUrl.pathname + request.nextUrl.search;

    // SQL Injection patterns
    const sqlInjectionPatterns = [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    ];

    // XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
    ];

    // Path traversal patterns
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
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
      return {
        isValid: false,
        reason: 'Request too large'
      };
    }

    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-originating-ip',
      'x-remote-ip',
      'x-client-ip'
    ];

    const forwardedIPs = suspiciousHeaders
      .map(header => request.headers.get(header))
      .filter(Boolean);

    if (forwardedIPs.length > 2) {
      return {
        isValid: false,
        reason: 'Too many forwarded IP headers'
      };
    }

    return { isValid: true };
  }

  /**
   * Rate limiting check (simple in-memory implementation)
   */
  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  static checkRateLimit(
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 60000
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [key, value] of this.rateLimitStore.entries()) {
      if (value.resetTime < now) {
        this.rateLimitStore.delete(key);
      }
    }

    const current = this.rateLimitStore.get(identifier);

    if (!current || current.resetTime < now) {
      // New window
      this.rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs
      };
    }

    if (current.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime
      };
    }

    current.count++;
    return {
      allowed: true,
      remaining: maxRequests - current.count,
      resetTime: current.resetTime
    };
  }

  /**
   * Apply rate limiting headers
   */
  static applyRateLimitHeaders(response: NextResponse, rateLimit: {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }): NextResponse {
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());

    if (!rateLimit.allowed) {
      response.headers.set('Retry-After', Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString());
    }

    return response;
  }
}

export default SecurityMiddleware;