import { 
  TaagerApiConfig, 
  TaagerVariantGroup, 
  TaagerSearchResponse, 
  TaagerSearchParams 
} from '@/lib/types/admin'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheConfig {
  defaultTTL: number // Time to live in milliseconds
  maxEntries: number
  cleanupInterval: number
}

export class TaagerApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public originalError?: any
  ) {
    super(message)
    this.name = 'TaagerApiError'
  }
}

interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors: number[]
}

export class TaagerApiClient {
  private config: TaagerApiConfig | null = null
  private readonly retryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: [408, 429, 500, 502, 503, 504]
  }

  // Cache configuration
  private readonly cacheConfig: CacheConfig = {
    defaultTTL: 60 * 60 * 1000, // 1 hour
    maxEntries: 1000,
    cleanupInterval: 15 * 60 * 1000 // 15 minutes
  }

  // Cache storage
  private cache = new Map<string, CacheEntry<any>>()
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor(config?: TaagerApiConfig) {
    if (config) {
      this.configure(config)
    }
    this.startCacheCleanup()
  }

  // Configuration methods
  configure(config: TaagerApiConfig): void {
    this.config = { ...config }
  }

  isConfigured(): boolean {
    return !!(
      this.config?.apiKey && 
      this.config?.taagerId && 
      this.config?.baseUrl
    )
  }

  // Core API methods with caching
  async getVariantGroup(variantId: string, useCache: boolean = true): Promise<TaagerVariantGroup | null> {
    if (!this.isConfigured()) {
      throw new TaagerApiError('API client not configured', 400, 'getVariantGroup')
    }

    const cacheKey = `variant:${variantId}:${this.config!.country}`
    
    // Check cache first
    if (useCache) {
      const cached = this.getFromCache<TaagerVariantGroup>(cacheKey)
      if (cached) {
        return cached
      }
    }

    const params: TaagerSearchParams = {
      page: 1,
      pageSize: 1,
      country: this.config!.country,
      variantId
    }

    const response = await this.searchVariantGroups(params, false) // Don't use cache for search
    const result = response.variantGroups.length > 0 ? response.variantGroups[0] : null
    
    // Cache the result if found
    if (result && useCache) {
      this.setCache(cacheKey, result)
    }
    
    return result
  }

  async searchVariantGroups(params: TaagerSearchParams, useCache: boolean = true): Promise<TaagerSearchResponse> {
    if (!this.isConfigured()) {
      throw new TaagerApiError('API client not configured', 400, 'searchVariantGroups')
    }

    // Create cache key from params
    const cacheKey = `search:${JSON.stringify(params)}`
    
    // Check cache first
    if (useCache) {
      const cached = this.getFromCache<TaagerSearchResponse>(cacheKey)
      if (cached) {
        return cached
      }
    }

    const url = new URL('/v0/variant-groups', this.config!.baseUrl)
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString())
      }
    })

    const endpoint = url.toString()

    const result = await this.executeWithRetry(async () => {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-api-key': this.config!.apiKey!,
        },
      })

      if (!response.ok) {
        throw new TaagerApiError(
          `API request failed: ${response.status} ${response.statusText}`,
          response.status,
          endpoint
        )
      }

      const data = await response.json()
      
      // Validate response structure
      if (!this.isValidSearchResponse(data)) {
        throw new TaagerApiError(
          'Invalid API response structure',
          500,
          endpoint,
          data
        )
      }

      return data as TaagerSearchResponse
    })

    // Cache the result
    if (useCache) {
      this.setCache(cacheKey, result)
    }

    return result
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.config?.apiKey || !this.config?.taagerId) {
      return false
    }

    try {
      // Test with a simple search request
      const testParams: TaagerSearchParams = {
        page: 1,
        pageSize: 1,
        country: this.config.country
      }

      await this.searchVariantGroups(testParams)
      return true
    } catch (error) {
      console.warn('Credential validation failed:', error)
      return false
    }
  }

  // Batch operations
  async getMultipleVariantGroups(variantIds: string[]): Promise<TaagerVariantGroup[]> {
    if (!this.isConfigured()) {
      throw new TaagerApiError('API client not configured', 400, 'getMultipleVariantGroups')
    }

    if (variantIds.length === 0) {
      return []
    }

    // For now, we'll make individual requests since the API doesn't support batch requests
    // In the future, this could be optimized if the API supports batch operations
    const results: TaagerVariantGroup[] = []
    const errors: string[] = []

    for (const variantId of variantIds) {
      try {
        const variantGroup = await this.getVariantGroup(variantId)
        if (variantGroup) {
          results.push(variantGroup)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`${variantId}: ${errorMessage}`)
        console.warn(`Failed to fetch variant ${variantId}:`, error)
      }
    }

    // If we have some results, return them even if some failed
    if (results.length > 0) {
      if (errors.length > 0) {
        console.warn(`Partial success: ${results.length}/${variantIds.length} variants fetched. Errors:`, errors)
      }
      return results
    }

    // If all requests failed, throw an error
    if (errors.length > 0) {
      throw new TaagerApiError(
        `Failed to fetch any variants. Errors: ${errors.join(', ')}`,
        500,
        'getMultipleVariantGroups'
      )
    }

    return []
  }

  // Private helper methods
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        // Don't retry if it's not a retryable error
        if (error instanceof TaagerApiError && 
            !this.retryConfig.retryableErrors.includes(error.statusCode)) {
          throw error
        }

        // Don't retry on the last attempt
        if (attempt === this.retryConfig.maxAttempts) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
          this.retryConfig.maxDelay
        )

        console.warn(`API request failed (attempt ${attempt}/${this.retryConfig.maxAttempts}), retrying in ${delay}ms:`, error)
        
        await this.sleep(delay)
      }
    }

    throw lastError || new Error('Unknown error during retry operation')
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private isValidSearchResponse(data: any): data is TaagerSearchResponse {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.count === 'number' &&
      Array.isArray(data.variantGroups) &&
      data.variantGroups.every((group: any) => 
        group &&
        typeof group.id === 'string' &&
        group.primaryVariant &&
        typeof group.primaryVariant.id === 'string' &&
        typeof group.primaryVariant.productName === 'string'
      )
    )
  }

  // Utility methods
  getConfig(): TaagerApiConfig | null {
    return this.config ? { ...this.config } : null
  }

  getBaseUrl(): string {
    return this.config?.baseUrl || 'https://public.api.taager.com'
  }

  getCountry(): string {
    return this.config?.country || 'SAU'
  }

  // Health check method
  async checkHealth(): Promise<boolean> {
    try {
      const testParams: TaagerSearchParams = {
        page: 1,
        pageSize: 1,
        country: this.getCountry()
      }

      const response = await this.searchVariantGroups(testParams)
      return response.count >= 0 // API is responding correctly
    } catch (error) {
      console.warn('Health check failed:', error)
      return false
    }
  }

  // Cache management methods
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  private setCache<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const expiresAt = now + (ttl || this.cacheConfig.defaultTTL)

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.cacheConfig.maxEntries) {
      this.evictOldestEntries()
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt
    })
  }

  private evictOldestEntries(): void {
    // Remove 10% of entries (oldest first)
    const entriesToRemove = Math.floor(this.cacheConfig.maxEntries * 0.1)
    const entries = Array.from(this.cache.entries())
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    for (let i = 0; i < entriesToRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0])
    }
  }

  private startCacheCleanup(): void {
    if (typeof window !== 'undefined') {
      // Browser environment
      this.cleanupTimer = setInterval(() => {
        this.cleanupExpiredEntries()
      }, this.cacheConfig.cleanupInterval) as any
    } else {
      // Node.js environment
      this.cleanupTimer = setInterval(() => {
        this.cleanupExpiredEntries()
      }, this.cacheConfig.cleanupInterval)
    }
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    
    if (keysToDelete.length > 0) {
      console.debug(`Cleaned up ${keysToDelete.length} expired cache entries`)
    }
  }

  // Public cache management methods
  clearCache(): void {
    this.cache.clear()
    console.debug('Cache cleared')
  }

  async refreshCache(): Promise<void> {
    // Clear existing cache
    this.clearCache()
    console.debug('Cache refreshed')
  }

  getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.cacheConfig.maxEntries
    }
  }

  // Cleanup method for proper resource disposal
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.clearCache()
  }
}

// Export a singleton instance for convenience
export const taagerApiClient = new TaagerApiClient()