/**
 * Security Middleware
 * Now uses shared security configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { security, environment } from '@ottokode/shared';

export class SecurityMiddleware {
  /**
   * Apply security headers to response using shared configuration
   */
  static applySecurityHeaders(request: NextRequest, response: NextResponse): NextResponse {
    const config = environment.getConfig();
    const nonce = security.generateNonce();

    // Get all security headers from shared security manager
    const headers = security.getSecurityHeaders(config, nonce);

    // Apply headers to response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Store nonce for use in HTML
    response.headers.set('X-CSP-Nonce', nonce);

    return response;
  }


  /**
   * Validate request for security threats using shared security manager
   */
  static validateRequest(request: NextRequest): { isValid: boolean; reason?: string } {
    const url = request.nextUrl.pathname + request.nextUrl.search;
    const headers = Object.fromEntries(request.headers.entries());

    return security.validateRequest(url, headers);
  }

  /**
   * Generate secure nonce for CSP
   */
  static generateNonce(): string {
    return security.generateNonce();
  }
}

export default SecurityMiddleware;