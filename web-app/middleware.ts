import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import SecurityMiddleware from './src/middleware/security'

export function middleware(req: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production'
  const isVercel = process.env.VERCEL === '1'

  // Only apply strict validation in non-Vercel production environments
  if (isProduction && !isVercel) {
    // Validate request for security threats
    const validation = SecurityMiddleware.validateRequest(req)
    if (!validation.isValid) {
      return new NextResponse('Bad Request', { status: 400 })
    }
  }

  // Check rate limiting (more lenient for Vercel)
  const clientIP = req.ip || req.headers.get('x-forwarded-for') || 'anonymous'
  const maxRequests = isVercel ? 500 : 200 // Higher limit for Vercel
  const rateLimit = SecurityMiddleware.checkRateLimit(clientIP, maxRequests, 60000)

  if (!rateLimit.allowed && isProduction && !isVercel) {
    const response = new NextResponse('Too Many Requests', { status: 429 })
    return SecurityMiddleware.applyRateLimitHeaders(response, rateLimit)
  }

  const res = NextResponse.next()

  // Apply security headers with Vercel-compatible settings
  const securedResponse = SecurityMiddleware.applySecurityHeaders(req, res, {
    // On Vercel, disable app-managed CSP to avoid conflicts with platform headers
    enableCSP: !isVercel,
    enableHSTS: isProduction && !isVercel, // Vercel handles HSTS
    enableXSS: true,
    enableFrameOptions: !isVercel, // Vercel may need frames for analytics
    enableContentTypeOptions: true,
    enableReferrerPolicy: true,
    enablePermissionsPolicy: !isVercel, // May interfere with Vercel features
  })

  // Apply rate limit headers
  SecurityMiddleware.applyRateLimitHeaders(securedResponse, rateLimit)

  return securedResponse
}

export const config = {
  matcher: [
    // Apply to all app routes
    '/((?!_next/|static/|api/health|favicon.ico).*)',
  ],
}
