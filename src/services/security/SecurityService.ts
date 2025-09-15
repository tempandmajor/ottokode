import { supabase } from '../../lib/supabase';
import { authService } from '../auth/AuthService';

export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
}

export interface InputValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: string;
}

class SecurityService {
  private csrfTokens = new Map<string, { token: string; timestamp: number }>();
  private rateLimitMap = new Map<string, { requests: number; windowStart: number }>();

  // Rate limiting: 100 requests per minute per user
  private readonly RATE_LIMIT_REQUESTS = 100;
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms

  // CSRF token validity: 1 hour
  private readonly CSRF_TOKEN_VALIDITY = 60 * 60 * 1000;

  constructor() {
    this.setupSecurityHeaders();
    this.startCleanupInterval();
  }

  private setupSecurityHeaders(): void {
    // Set up Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob:",
      "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://*.stripe.com wss://*.supabase.co",
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');

    // Apply CSP via meta tag since we can't set HTTP headers in client-side apps
    let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      cspMeta = document.createElement('meta');
      cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
      document.head.appendChild(cspMeta);
    }
    cspMeta.setAttribute('content', csp);
  }

  public generateCSRFToken(userId: string): string {
    const token = this.generateRandomToken();
    this.csrfTokens.set(userId, {
      token,
      timestamp: Date.now()
    });
    return token;
  }

  public validateCSRFToken(userId: string, token: string): boolean {
    const stored = this.csrfTokens.get(userId);
    if (!stored) return false;

    const isValid = stored.token === token &&
                   (Date.now() - stored.timestamp) < this.CSRF_TOKEN_VALIDITY;

    if (isValid) {
      // One-time use token
      this.csrfTokens.delete(userId);
    }

    return isValid;
  }

  public checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = this.rateLimitMap.get(userId);

    if (!userLimit) {
      this.rateLimitMap.set(userId, {
        requests: 1,
        windowStart: now
      });
      return true;
    }

    // Reset window if expired
    if (now - userLimit.windowStart >= this.RATE_LIMIT_WINDOW) {
      userLimit.requests = 1;
      userLimit.windowStart = now;
      return true;
    }

    // Check if within limit
    if (userLimit.requests >= this.RATE_LIMIT_REQUESTS) {
      return false;
    }

    userLimit.requests++;
    return true;
  }

  public validateInput(input: string, type: 'text' | 'email' | 'code' | 'filename'): InputValidationResult {
    const errors: string[] = [];
    let sanitized = input;

    // Basic sanitization - remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    switch (type) {
      case 'text':
        // Allow most text but limit length
        if (sanitized.length > 10000) {
          errors.push('Text input too long (max 10,000 characters)');
        }
        // Remove script tags and javascript: protocol
        sanitized = this.sanitizeHTML(sanitized);
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitized)) {
          errors.push('Invalid email format');
        }
        if (sanitized.length > 254) {
          errors.push('Email too long');
        }
        break;

      case 'code':
        // Allow code but limit size and scan for suspicious patterns
        if (sanitized.length > 100000) {
          errors.push('Code input too long (max 100,000 characters)');
        }
        // Check for potentially dangerous patterns
        if (this.containsSuspiciousCode(sanitized)) {
          errors.push('Code contains potentially unsafe patterns');
        }
        break;

      case 'filename':
        // Strict filename validation
        const filenameRegex = /^[a-zA-Z0-9._-]+$/;
        if (!filenameRegex.test(sanitized)) {
          errors.push('Invalid filename format');
        }
        if (sanitized.length > 255) {
          errors.push('Filename too long');
        }
        // Check for directory traversal
        if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
          errors.push('Filename contains invalid characters');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : undefined
    };
  }

  private sanitizeHTML(input: string): string {
    // Basic HTML sanitization - remove script tags and event handlers
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '');
  }

  private containsSuspiciousCode(code: string): boolean {
    const suspiciousPatterns = [
      // System access attempts
      /\b(exec|eval|system|shell_exec|passthru|proc_open)\s*\(/i,
      // File system access
      /\b(file_get_contents|file_put_contents|fopen|fwrite|include|require)\s*\(/i,
      // Network access
      /\b(curl_exec|file_get_contents|fsockopen|socket_create)\s*\(/i,
      // Database access
      /\b(mysql_query|pg_query|sqlite_query|exec)\s*\(/i,
      // Potential code injection
      /\$\{.*\}/,
      /<\?php/i,
      /<%.*%>/
    ];

    return suspiciousPatterns.some(pattern => pattern.test(code));
  }

  private generateRandomToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private startCleanupInterval(): void {
    // Clean up expired CSRF tokens and rate limit data every 5 minutes
    setInterval(() => {
      const now = Date.now();

      // Clean CSRF tokens
      for (const [userId, data] of this.csrfTokens.entries()) {
        if (now - data.timestamp > this.CSRF_TOKEN_VALIDITY) {
          this.csrfTokens.delete(userId);
        }
      }

      // Clean rate limit data
      for (const [userId, data] of this.rateLimitMap.entries()) {
        if (now - data.windowStart > this.RATE_LIMIT_WINDOW) {
          this.rateLimitMap.delete(userId);
        }
      }
    }, 5 * 60 * 1000);
  }

  public async logSecurityEvent(eventType: string, details: any): Promise<void> {
    const authState = authService.getAuthState();

    try {
      await supabase
        .from('security_events')
        .insert({
          user_id: authState.user?.id,
          event_type: eventType,
          details,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  public sanitizeForStorage(data: any): any {
    if (typeof data === 'string') {
      return this.sanitizeHTML(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForStorage(item));
    }

    if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeForStorage(value);
      }
      return sanitized;
    }

    return data;
  }

  public getSecurityHeaders(): SecurityHeaders {
    return {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co https://api.openai.com https://api.anthropic.com https://*.stripe.com wss://*.supabase.co;",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };
  }
}

export const securityService = new SecurityService();