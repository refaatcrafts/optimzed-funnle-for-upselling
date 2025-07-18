export class AdminAuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AdminAuthError'
  }
}

export class ConfigurationError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function handleError(error: unknown): string {
  if (error instanceof AdminAuthError) {
    switch (error.code) {
      case 'RATE_LIMITED':
        return 'Too many login attempts. Please try again later.'
      case 'INVALID_CREDENTIALS':
        return 'Invalid username or password.'
      case 'SESSION_EXPIRED':
        return 'Your session has expired. Please log in again.'
      default:
        return error.message || 'Authentication failed.'
    }
  }

  if (error instanceof ConfigurationError) {
    switch (error.code) {
      case 'SAVE_FAILED':
        return 'Failed to save configuration. Please try again.'
      case 'LOAD_FAILED':
        return 'Failed to load configuration. Using defaults.'
      case 'INVALID_DATA':
        return 'Invalid configuration data detected.'
      default:
        return error.message || 'Configuration error occurred.'
    }
  }

  if (error instanceof ValidationError) {
    return error.message || 'Validation failed.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred.'
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof Error && (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('NetworkError')
  )
}

export function logError(error: unknown, context?: string): void {
  const errorInfo = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
  }

  console.error('Admin Error:', errorInfo)

  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToErrorTracking(errorInfo)
  }
}

export function createRetryHandler<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): () => Promise<T> {
  return async () => {
    let lastError: unknown

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        
        if (attempt === maxRetries) {
          throw error
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }

    throw lastError
  }
}