import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import SecurityMiddleware from './src/middleware/security'

export function middleware(req: NextRequest) {
  // Temporarily disable all middleware functionality to resolve CSP issues
  return NextResponse.next()

  /*
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

  const res = NextResponse.next()

  // Skip security headers in development to avoid CSP conflicts with Next.js
  if (process.env.NODE_ENV === 'development') {
    return res
  }

  // Apply security headers using shared configuration in production only
  const securedResponse = SecurityMiddleware.applySecurityHeaders(req, res)

  return securedResponse
  */
}

export const config = {
  // Temporarily disable middleware matcher to prevent any execution
  matcher: [],
  /*
  matcher: [
    // Apply to all app routes
    '/((?!_next/|static/|api/health|favicon.ico).*)',
  ],
  */
}
