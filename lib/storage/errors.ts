import { PlatformType } from './platform-detector'

export class ConfigError extends Error {
  constructor(
    message: string,
    public code: string,
    public platform: PlatformType,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'ConfigError'
  }
}

// Platform-specific error types
export const CONFIG_ERRORS = {
  // Common errors
  INVALID_CONFIG: 'INVALID_CONFIG',
  SAVE_FAILED: 'SAVE_FAILED',
  NOT_FOUND: 'NOT_FOUND',
  INITIALIZATION_FAILED: 'INITIALIZATION_FAILED',
  
  // SQLite specific
  DATABASE_CONNECTION: 'DATABASE_CONNECTION',
  DATABASE_LOCKED: 'DATABASE_LOCKED',
  DATABASE_CORRUPT: 'DATABASE_CORRUPT',
  
  // Netlify specific
  BLOB_QUOTA_EXCEEDED: 'BLOB_QUOTA_EXCEEDED',
  BLOB_ACCESS_DENIED: 'BLOB_ACCESS_DENIED',
  BLOB_NOT_FOUND: 'BLOB_NOT_FOUND'
} as const

export class ErrorHandler {
  static handleStorageError(error: any, platform: PlatformType): ConfigError {
    const errorMessage = error?.message || 'Unknown error'
    
    switch (platform) {
      case PlatformType.NETLIFY:
        if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
          return new ConfigError('Netlify Blobs quota exceeded', CONFIG_ERRORS.BLOB_QUOTA_EXCEEDED, platform, 507)
        }
        if (errorMessage.includes('access') || errorMessage.includes('permission')) {
          return new ConfigError('Netlify Blobs access denied', CONFIG_ERRORS.BLOB_ACCESS_DENIED, platform, 403)
        }
        if (errorMessage.includes('not found')) {
          return new ConfigError('Netlify Blob not found', CONFIG_ERRORS.BLOB_NOT_FOUND, platform, 404)
        }
        break
        
      case PlatformType.SQLITE:
        if (errorMessage.includes('database is locked')) {
          return new ConfigError('Database is locked', CONFIG_ERRORS.DATABASE_LOCKED, platform, 503)
        }
        if (errorMessage.includes('no such table') || errorMessage.includes('connection')) {
          return new ConfigError('Database connection failed', CONFIG_ERRORS.DATABASE_CONNECTION, platform, 500)
        }
        if (errorMessage.includes('corrupt') || errorMessage.includes('malformed')) {
          return new ConfigError('Database is corrupted', CONFIG_ERRORS.DATABASE_CORRUPT, platform, 500)
        }
        break
    }
    
    return new ConfigError(`Storage operation failed: ${errorMessage}`, CONFIG_ERRORS.SAVE_FAILED, platform, 500)
  }

  static getRetryDelay(attempt: number, platform: PlatformType): number {
    // Platform-specific retry delays (exponential backoff)
    const baseDelay = platform === PlatformType.SQLITE ? 100 : 500 // SQLite can retry faster
    return Math.min(baseDelay * Math.pow(2, attempt), 5000) // Max 5 seconds
  }

  static shouldRetry(error: ConfigError, attempt: number): boolean {
    const maxRetries = 3
    
    if (attempt >= maxRetries) return false
    
    // Don't retry on client errors (4xx)
    if (error.statusCode >= 400 && error.statusCode < 500) return false
    
    // Retry on server errors and specific platform issues
    return error.code === CONFIG_ERRORS.DATABASE_LOCKED ||
           error.code === CONFIG_ERRORS.DATABASE_CONNECTION ||
           error.statusCode >= 500
  }
}