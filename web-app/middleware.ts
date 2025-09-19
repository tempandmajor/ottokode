import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Minimal nonce-based CSP scaffold. We still include 'unsafe-inline' for scripts
// for compatibility until all inline usages are replaced with nonced tags.
export function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Generate a simple nonce per request (Edge runtime compatible)
  const nonce = crypto.randomUUID()

  // Only set CSP in production to avoid over-constraining local dev if needed
  const isProd = process.env.NODE_ENV === 'production'

  if (isProd) {
    const csp = [
      "default-src 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      // Remove 'unsafe-inline' for scripts; use nonce and strict-dynamic
      `script-src 'self' 'strict-dynamic' 'nonce-${nonce}'`,
      // Allow required backends; keep tight
      "connect-src 'self' *.supabase.co *.anthropic.com *.openai.com wss://*.supabase.co",
    ].join('; ')

    res.headers.set('Content-Security-Policy', csp)
    // Expose nonce to the app if we later want to use it for inline tags
    res.headers.set('x-csp-nonce', nonce)
  }

  // Additional security headers kept from next.config.js
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return res
}

export const config = {
  matcher: [
    // Apply to all app routes
    '/((?!_next/|static/|api/health|favicon.ico).*)',
  ],
}
