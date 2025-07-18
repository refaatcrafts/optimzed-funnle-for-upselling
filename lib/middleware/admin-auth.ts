import { NextRequest, NextResponse } from 'next/server'
import { AdminSession } from '@/lib/types/admin'
import { SESSION_CONFIG, ADMIN_CREDENTIALS } from '@/lib/constants/admin'

export interface AuthenticatedRequest extends NextRequest {
  session?: AdminSession
}

export class AdminAuthMiddleware {
  /**
   * Validates admin session from request headers or cookies
   */
  static validateSession(request: NextRequest): AdminSession | null {
    try {
      // Try to get session from Authorization header
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        return this.validateToken(token)
      }

      // Try to get session from cookie
      const sessionCookie = request.cookies.get(SESSION_CONFIG.STORAGE_KEY)
      if (sessionCookie) {
        return this.validateSessionData(sessionCookie.value)
      }

      // For development/testing, allow basic auth
      const basicAuth = request.headers.get('authorization')
      if (basicAuth && basicAuth.startsWith('Basic ')) {
        const credentials = Buffer.from(basicAuth.substring(6), 'base64').toString()
        const [username, password] = credentials.split(':')
        
        if (username === ADMIN_CREDENTIALS.USERNAME && password === ADMIN_CREDENTIALS.PASSWORD) {
          return this.createTemporarySession()
        }
      }

      return null
    } catch (error) {
      console.error('Session validation error:', error)
      return null
    }
  }

  private static validateToken(token: string): AdminSession | null {
    try {
      // Simple token validation - in production, use JWT or similar
      const decoded = Buffer.from(token, 'base64').toString()
      const session = JSON.parse(decoded) as AdminSession
      
      if (!session.isAuthenticated) {
        return null
      }

      const now = new Date()
      const expiresAt = new Date(session.expiresAt)

      if (now > expiresAt) {
        return null
      }

      return session
    } catch {
      return null
    }
  }

  private static validateSessionData(sessionData: string): AdminSession | null {
    try {
      const session = JSON.parse(sessionData) as AdminSession
      
      if (!session.isAuthenticated) {
        return null
      }

      const now = new Date()
      const expiresAt = new Date(session.expiresAt)

      if (now > expiresAt) {
        return null
      }

      return session
    } catch {
      return null
    }
  }

  private static createTemporarySession(): AdminSession {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + SESSION_CONFIG.DURATION)

    return {
      isAuthenticated: true,
      expiresAt: expiresAt.toISOString(),
      lastActivity: now.toISOString(),
    }
  }

  /**
   * Middleware function to protect admin API routes
   */
  static async requireAuth(
    request: NextRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const session = this.validateSession(request)

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      }, { status: 401 })
    }

    // Add session to request
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.session = session

    try {
      return await handler(authenticatedRequest)
    } catch (error) {
      console.error('API handler error:', error)
      return NextResponse.json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }, { status: 500 })
    }
  }

  /**
   * Rate limiting middleware
   */
  static async rateLimit(
    request: NextRequest,
    options: { maxRequests: number; windowMs: number } = { maxRequests: 100, windowMs: 60000 }
  ): Promise<NextResponse | null> {
    try {
      const clientId = this.getClientId(request)
      const now = Date.now()
      const windowStart = now - options.windowMs

      // In a real application, you'd use Redis or a database for this
      // For now, we'll use a simple in-memory store
      const requestLog = this.getRequestLog(clientId)
      
      // Clean old requests
      const recentRequests = requestLog.filter(timestamp => timestamp > windowStart)
      
      if (recentRequests.length >= options.maxRequests) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMITED',
          retryAfter: Math.ceil((recentRequests[0] + options.windowMs - now) / 1000)
        }, { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((recentRequests[0] + options.windowMs - now) / 1000))
          }
        })
      }

      // Log this request
      this.logRequest(clientId, now)
      
      return null // Continue processing
    } catch (error) {
      console.error('Rate limiting error:', error)
      return null // Continue processing on error
    }
  }

  private static requestLogs = new Map<string, number[]>()

  private static getClientId(request: NextRequest): string {
    // Use IP address as client identifier
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
    return ip
  }

  private static getRequestLog(clientId: string): number[] {
    return this.requestLogs.get(clientId) || []
  }

  private static logRequest(clientId: string, timestamp: number): void {
    const log = this.getRequestLog(clientId)
    log.push(timestamp)
    
    // Keep only recent requests to prevent memory leaks
    const oneHourAgo = timestamp - 3600000
    const recentLog = log.filter(t => t > oneHourAgo)
    
    this.requestLogs.set(clientId, recentLog)
  }

  /**
   * CORS middleware for admin API routes
   */
  static corsHeaders(origin?: string): Record<string, string> {
    return {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  }

  /**
   * Handle preflight OPTIONS requests
   */
  static handleOptions(request: NextRequest): NextResponse {
    const origin = request.headers.get('origin')
    return new NextResponse(null, {
      status: 200,
      headers: this.corsHeaders(origin)
    })
  }
}

/**
 * Utility function to wrap API handlers with authentication
 */
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return AdminAuthMiddleware.handleOptions(request)
    }

    // Apply rate limiting
    const rateLimitResponse = await AdminAuthMiddleware.rateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Apply authentication
    return AdminAuthMiddleware.requireAuth(request, handler)
  }
}