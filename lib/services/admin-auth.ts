import { AdminSession, AdminAuthState, LoginAttempt } from '@/lib/types/admin'
import { 
  ADMIN_CREDENTIALS, 
  SESSION_CONFIG, 
  RATE_LIMITING 
} from '@/lib/constants/admin'
import { AdminAuthError, logError } from '@/lib/utils/errors'

export class AdminAuthService {
  private static getAuthState(): AdminAuthState {
    if (typeof window === 'undefined') {
      return { session: null, loginAttempts: [] }
    }

    try {
      const stored = localStorage.getItem(SESSION_CONFIG.AUTH_STATE_KEY)
      if (!stored) {
        return { session: null, loginAttempts: [] }
      }
      return JSON.parse(stored)
    } catch {
      return { session: null, loginAttempts: [] }
    }
  }

  private static saveAuthState(state: AdminAuthState): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(SESSION_CONFIG.AUTH_STATE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save auth state:', error)
    }
  }

  private static cleanOldAttempts(attempts: LoginAttempt[]): LoginAttempt[] {
    const now = Date.now()
    return attempts.filter(
      attempt => now - attempt.timestamp < RATE_LIMITING.WINDOW_DURATION
    )
  }

  static isRateLimited(): boolean {
    const authState = this.getAuthState()
    const recentAttempts = this.cleanOldAttempts(authState.loginAttempts)
    const failedAttempts = recentAttempts.filter(attempt => !attempt.success)
    
    return failedAttempts.length >= RATE_LIMITING.MAX_ATTEMPTS
  }

  static authenticate(username: string, password: string): boolean {
    try {
      if (this.isRateLimited()) {
        throw new AdminAuthError('Too many failed attempts', 'RATE_LIMITED')
      }

      if (!username || !password) {
        throw new AdminAuthError('Username and password are required', 'MISSING_CREDENTIALS')
      }

      const isValid = username === ADMIN_CREDENTIALS.USERNAME && 
                     password === ADMIN_CREDENTIALS.PASSWORD

      // Record login attempt
      const authState = this.getAuthState()
      const attempt: LoginAttempt = {
        timestamp: Date.now(),
        success: isValid,
      }

      authState.loginAttempts = this.cleanOldAttempts([
        ...authState.loginAttempts,
        attempt,
      ])

      if (isValid) {
        authState.session = this.createSession()
      } else {
        throw new AdminAuthError('Invalid credentials', 'INVALID_CREDENTIALS')
      }

      this.saveAuthState(authState)
      return isValid
    } catch (error) {
      logError(error, 'AdminAuthService.authenticate')
      if (error instanceof AdminAuthError) {
        throw error
      }
      throw new AdminAuthError('Authentication failed')
    }
  }

  static createSession(): AdminSession {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + SESSION_CONFIG.DURATION)

    return {
      isAuthenticated: true,
      expiresAt: expiresAt.toISOString(),
      lastActivity: now.toISOString(),
    }
  }

  static validateSession(): boolean {
    const authState = this.getAuthState()
    const session = authState.session

    if (!session || !session.isAuthenticated) {
      return false
    }

    const now = new Date()
    const expiresAt = new Date(session.expiresAt)

    if (now > expiresAt) {
      this.logout()
      return false
    }

    return true
  }

  static refreshSession(): void {
    if (!this.validateSession()) return

    const authState = this.getAuthState()
    if (authState.session) {
      const now = new Date()
      authState.session.lastActivity = now.toISOString()
      
      // Extend session if more than half the duration has passed
      const lastActivity = new Date(authState.session.lastActivity)
      const expiresAt = new Date(authState.session.expiresAt)
      const sessionDuration = expiresAt.getTime() - lastActivity.getTime()
      
      if (sessionDuration < SESSION_CONFIG.DURATION / 2) {
        authState.session.expiresAt = new Date(now.getTime() + SESSION_CONFIG.DURATION).toISOString()
      }
      
      this.saveAuthState(authState)
    }
  }

  static logout(): void {
    const authState = this.getAuthState()
    authState.session = null
    this.saveAuthState(authState)
  }

  static getSession(): AdminSession | null {
    const authState = this.getAuthState()
    return authState.session
  }

  static getRemainingAttempts(): number {
    const authState = this.getAuthState()
    const recentAttempts = this.cleanOldAttempts(authState.loginAttempts)
    const failedAttempts = recentAttempts.filter(attempt => !attempt.success)
    
    return Math.max(0, RATE_LIMITING.MAX_ATTEMPTS - failedAttempts.length)
  }
}