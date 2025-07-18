// Enhanced error handling utilities for admin configuration

export class ConfigError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'ConfigError'
  }
}

export const ERROR_CODES = {
  // Network errors (retryable)
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_UNAVAILABLE: 'SERVER_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  
  // Database errors (some retryable)
  DATABASE_CONNECTION: 'DATABASE_CONNECTION',
  DATABASE_LOCKED: 'DATABASE_LOCKED',
  DATABASE_CORRUPT: 'DATABASE_CORRUPT',
  
  // Validation errors (not retryable)
  INVALID_CONFIG: 'INVALID_CONFIG',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  
  // Storage errors (some retryable)
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
  
  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  SAVE_FAILED: 'SAVE_FAILED',
  LOAD_FAILED: 'LOAD_FAILED'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

export interface RetryOptions {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2
}

export class RetryManager {
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
    let lastError: Error
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        // Don't retry if it's not a retryable error
        if (error instanceof ConfigError && !error.retryable) {
          throw error
        }
        
        // Don't retry on the last attempt
        if (attempt === config.maxAttempts) {
          break
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
          config.maxDelay
        )
        
        console.warn(`Operation failed (attempt ${attempt}/${config.maxAttempts}), retrying in ${delay}ms:`, error)
        
        await this.sleep(delay)
      }
    }
    
    throw lastError!
  }
  
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export function createConfigError(error: unknown, context: string): ConfigError {
  if (error instanceof ConfigError) {
    return error
  }
  
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new ConfigError(
        `Network error in ${context}: ${error.message}`,
        ERROR_CODES.NETWORK_ERROR,
        503,
        true
      )
    }
    
    // Server errors
    if (error.message.includes('500') || error.message.includes('503')) {
      return new ConfigError(
        `Server error in ${context}: ${error.message}`,
        ERROR_CODES.SERVER_UNAVAILABLE,
        503,
        true
      )
    }
    
    // Database errors
    if (error.message.includes('database') || error.message.includes('SQLITE')) {
      const isLocked = error.message.includes('locked') || error.message.includes('busy')
      return new ConfigError(
        `Database error in ${context}: ${error.message}`,
        isLocked ? ERROR_CODES.DATABASE_LOCKED : ERROR_CODES.DATABASE_CONNECTION,
        500,
        isLocked
      )
    }
    
    // Storage errors
    if (error.message.includes('localStorage') || error.message.includes('quota')) {
      return new ConfigError(
        `Storage error in ${context}: ${error.message}`,
        ERROR_CODES.STORAGE_QUOTA_EXCEEDED,
        507,
        false
      )
    }
    
    // Generic error
    return new ConfigError(
      `Error in ${context}: ${error.message}`,
      ERROR_CODES.UNKNOWN_ERROR,
      500,
      false
    )
  }
  
  return new ConfigError(
    `Unknown error in ${context}: ${String(error)}`,
    ERROR_CODES.UNKNOWN_ERROR,
    500,
    false
  )
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ConfigError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return String(error)
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof ConfigError) {
    return error.retryable
  }
  
  // Default to non-retryable for unknown errors
  return false
}

export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof ConfigError) {
    switch (error.code) {
      case ERROR_CODES.NETWORK_ERROR:
        return 'Network connection failed. Please check your internet connection and try again.'
      
      case ERROR_CODES.SERVER_UNAVAILABLE:
        return 'Server is temporarily unavailable. Your changes have been saved locally and will sync when the server is back online.'
      
      case ERROR_CODES.DATABASE_CONNECTION:
        return 'Database connection failed. Please try again in a moment.'
      
      case ERROR_CODES.DATABASE_LOCKED:
        return 'Database is busy. Please wait a moment and try again.'
      
      case ERROR_CODES.INVALID_CONFIG:
        return 'Invalid configuration data. Please check your settings and try again.'
      
      case ERROR_CODES.STORAGE_QUOTA_EXCEEDED:
        return 'Storage quota exceeded. Please clear some browser data and try again.'
      
      case ERROR_CODES.STORAGE_UNAVAILABLE:
        return 'Local storage is not available. Some features may not work properly.'
      
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }
  
  return 'An unexpected error occurred. Please try again.'
}

export function logError(error: unknown, context: string): void {
  console.error(`[${context}]`, error)
}