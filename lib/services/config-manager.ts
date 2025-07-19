import { AdminConfig, ProductConfiguration, TaagerApiConfig } from '@/lib/types/admin'
import { DEFAULT_ADMIN_CONFIG, SESSION_CONFIG, isValidExtendedAdminConfig } from '@/lib/constants/admin'
import { RetryManager, createConfigError, ConfigError, ERROR_CODES } from '@/lib/utils/errors'
import { AdminAuthService } from '@/lib/services/admin-auth'

import { PlatformInfo } from '@/lib/storage/platform-detector'

interface ConfigApiResponse {
  success: boolean
  data?: AdminConfig
  error?: string
  platform?: PlatformInfo
  timestamp: string
}

export class ConfigurationManager {
  private static config: AdminConfig | null = null
  private static isServerAvailable: boolean = true
  private static lastServerCheck: number = 0
  private static platformInfo: PlatformInfo | null = null
  private static readonly SERVER_CHECK_INTERVAL = 30000 // 30 seconds

  // Primary methods (now server-first)
  static async getConfig(): Promise<AdminConfig> {
    try {
      // Try server first with retry logic
      const serverConfig = await RetryManager.withRetry(
        () => this.getConfigFromServer(),
        { maxAttempts: 2, baseDelay: 500 }
      )
      this.saveConfigToCache(serverConfig)
      this.config = serverConfig
      return serverConfig
    } catch (error) {
      const configError = createConfigError(error, 'getConfig')
      console.warn('Server unavailable, using cache:', configError.message)
      this.isServerAvailable = false

      // Show platform-specific warning
      this.showPlatformWarning(error)

      // Fallback to localStorage
      return this.getConfigFromCache()
    }
  }

  // Synchronous version for backward compatibility
  static getConfigSync(): AdminConfig {
    if (this.config) {
      return this.config
    }

    // For SSR or when server is unavailable, return defaults
    if (typeof window === 'undefined') {
      return { ...DEFAULT_ADMIN_CONFIG }
    }

    // Try to load from cache first
    const cachedConfig = this.getConfigFromCache()

    // Always trigger async load in background to keep config fresh
    this.getConfig().then(config => {
      this.config = config
      // Trigger a custom event to notify components of config update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('configUpdated', { detail: config }))
      }
    }).catch(error => {
      console.warn('Background config load failed:', error)
    })

    return cachedConfig
  }

  // Server-first methods
  static async saveConfig(config?: AdminConfig): Promise<boolean> {
    const configToSave = config || this.config
    if (!configToSave) return false

    try {
      // Try server first with retry logic
      const success = await RetryManager.withRetry(
        () => this.saveConfigToServer(configToSave),
        { maxAttempts: 3, baseDelay: 1000 }
      )
      if (success) {
        // Update cache on successful server save
        this.saveConfigToCache(configToSave)
        this.config = configToSave
        this.isServerAvailable = true
        return true
      }
    } catch (error) {
      const configError = createConfigError(error, 'saveConfig')
      console.warn('Server save failed, using localStorage:', configError.message)
      this.isServerAvailable = false
    }

    // Fallback to localStorage
    return this.saveConfigToCache(configToSave)
  }

  static async updateFeature(featureId: keyof AdminConfig['upselling'], enabled: boolean): Promise<boolean> {
    try {
      const config = await this.getConfig()

      if (!(featureId in config.upselling)) {
        console.error(`Invalid feature ID: ${featureId}`)
        return false
      }

      config.upselling[featureId] = enabled
      return await this.saveConfig(config)
    } catch (error) {
      console.error('Failed to update feature:', error)
      return false
    }
  }

  // Product configuration methods
  static async updateProductConfiguration(updates: Partial<ProductConfiguration>): Promise<boolean> {
    try {
      const config = await this.getConfig()

      // Merge updates with existing configuration
      config.productConfiguration = {
        ...config.productConfiguration,
        ...updates
      }

      return await this.saveConfig(config)
    } catch (error) {
      console.error('Failed to update product configuration:', error)
      return false
    }
  }

  static async updateTaagerApiConfig(updates: Partial<TaagerApiConfig>): Promise<boolean> {
    try {
      const config = await this.getConfig()

      // Merge updates with existing configuration
      config.taagerApi = {
        ...config.taagerApi,
        ...updates
      }

      return await this.saveConfig(config)
    } catch (error) {
      console.error('Failed to update Taager API configuration:', error)
      return false
    }
  }

  static async setHomePagePrimary(sku: string | null): Promise<boolean> {
    return await this.updateProductConfiguration({ homePagePrimary: sku })
  }

  static async addRecommendation(sku: string): Promise<boolean> {
    try {
      const config = await this.getConfig()
      const recommendations = [...config.productConfiguration.recommendations]

      if (!recommendations.includes(sku)) {
        recommendations.push(sku)
        return await this.updateProductConfiguration({ recommendations })
      }

      return true // Already exists
    } catch (error) {
      console.error('Failed to add recommendation:', error)
      return false
    }
  }

  static async removeRecommendation(sku: string): Promise<boolean> {
    try {
      const config = await this.getConfig()
      const recommendations = config.productConfiguration.recommendations.filter(s => s !== sku)
      return await this.updateProductConfiguration({ recommendations })
    } catch (error) {
      console.error('Failed to remove recommendation:', error)
      return false
    }
  }

  static async addFrequentlyBoughtTogether(sku: string): Promise<boolean> {
    try {
      const config = await this.getConfig()
      const frequentlyBoughtTogether = [...config.productConfiguration.frequentlyBoughtTogether]

      if (!frequentlyBoughtTogether.includes(sku)) {
        frequentlyBoughtTogether.push(sku)
        return await this.updateProductConfiguration({ frequentlyBoughtTogether })
      }

      return true // Already exists
    } catch (error) {
      console.error('Failed to add frequently bought together:', error)
      return false
    }
  }

  static async removeFrequentlyBoughtTogether(sku: string): Promise<boolean> {
    try {
      const config = await this.getConfig()
      const frequentlyBoughtTogether = config.productConfiguration.frequentlyBoughtTogether.filter(s => s !== sku)
      return await this.updateProductConfiguration({ frequentlyBoughtTogether })
    } catch (error) {
      console.error('Failed to remove frequently bought together:', error)
      return false
    }
  }

  static async addUpsellOffer(sku: string): Promise<boolean> {
    try {
      const config = await this.getConfig()
      const upsellOffers = [...config.productConfiguration.upsellOffers]

      if (!upsellOffers.includes(sku)) {
        upsellOffers.push(sku)
        return await this.updateProductConfiguration({ upsellOffers })
      }

      return true // Already exists
    } catch (error) {
      console.error('Failed to add upsell offer:', error)
      return false
    }
  }

  static async removeUpsellOffer(sku: string): Promise<boolean> {
    try {
      const config = await this.getConfig()
      const upsellOffers = config.productConfiguration.upsellOffers.filter(s => s !== sku)
      return await this.updateProductConfiguration({ upsellOffers })
    } catch (error) {
      console.error('Failed to remove upsell offer:', error)
      return false
    }
  }

  static async addCrossSellRecommendation(sku: string): Promise<boolean> {
    try {
      const config = await this.getConfig()
      const crossSellRecommendations = [...config.productConfiguration.crossSellRecommendations]

      if (!crossSellRecommendations.includes(sku)) {
        crossSellRecommendations.push(sku)
        return await this.updateProductConfiguration({ crossSellRecommendations })
      }

      return true // Already exists
    } catch (error) {
      console.error('Failed to add cross-sell recommendation:', error)
      return false
    }
  }

  static async removeCrossSellRecommendation(sku: string): Promise<boolean> {
    try {
      const config = await this.getConfig()
      const crossSellRecommendations = config.productConfiguration.crossSellRecommendations.filter(s => s !== sku)
      return await this.updateProductConfiguration({ crossSellRecommendations })
    } catch (error) {
      console.error('Failed to remove cross-sell recommendation:', error)
      return false
    }
  }

  static async resetToDefaults(): Promise<AdminConfig> {
    try {
      // Try server reset first with retry logic
      const result = await RetryManager.withRetry(async () => {
        // Skip server calls if we're on the server side to avoid circular calls
        if (typeof window === 'undefined') {
          throw new Error('Server-side fetch not supported')
        }

        const authHeaders = AdminAuthService.getAuthHeaders()
        const response = await fetch('/api/admin/config/reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
        })

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`)
        }

        const result: ConfigApiResponse = await response.json()
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to reset configuration')
        }

        return result.data
      }, { maxAttempts: 2, baseDelay: 1000 })

      this.saveConfigToCache(result)
      this.config = result
      this.isServerAvailable = true
      return result
    } catch (error) {
      const configError = createConfigError(error, 'resetToDefaults')
      console.warn('Server reset failed, using localStorage:', configError.message)
      this.isServerAvailable = false
    }

    // Fallback to localStorage reset
    const defaultConfig = { ...DEFAULT_ADMIN_CONFIG }
    this.saveConfigToCache(defaultConfig)
    this.config = defaultConfig
    return defaultConfig
  }

  // Server communication methods
  private static async getConfigFromServer(): Promise<AdminConfig> {
    // Skip server calls if we're on the server side to avoid circular calls
    if (typeof window === 'undefined') {
      throw new Error('Server-side fetch not supported')
    }

    // First try the public endpoint (no auth required)
    try {
      const response = await fetch('/api/config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result: ConfigApiResponse = await response.json()

        if (result.success && result.data) {
          // Convert partial config to full config with defaults
          const fullConfig = {
            ...DEFAULT_ADMIN_CONFIG,
            ...result.data,
            lastUpdated: new Date().toISOString()
          }

          this.isServerAvailable = true
          this.lastServerCheck = Date.now()
          return fullConfig
        }
      }
    } catch (error) {
      console.warn('Public config endpoint failed:', error)
    }

    // Fallback to admin endpoint if user is authenticated
    const authHeaders = AdminAuthService.getAuthHeaders()
    if (Object.keys(authHeaders).length > 0) {
      const response = await fetch('/api/admin/config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }

      const result: ConfigApiResponse = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Invalid server response')
      }

      this.isServerAvailable = true
      this.lastServerCheck = Date.now()
      return result.data
    }

    throw new Error('No configuration available')
  }

  private static async saveConfigToServer(config: AdminConfig): Promise<boolean> {
    // Skip server calls if we're on the server side to avoid circular calls
    if (typeof window === 'undefined') {
      throw new Error('Server-side fetch not supported')
    }

    const authHeaders = AdminAuthService.getAuthHeaders()
    const response = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`)
    }

    const result: ConfigApiResponse = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to save configuration')
    }

    this.isServerAvailable = true
    this.lastServerCheck = Date.now()
    return true
  }

  // Cache methods (localStorage)
  static getConfigFromCache(): AdminConfig {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_ADMIN_CONFIG }
    }

    try {
      const stored = localStorage.getItem(SESSION_CONFIG.CONFIG_STORAGE_KEY)
      if (!stored) {
        return { ...DEFAULT_ADMIN_CONFIG }
      }

      const parsed = JSON.parse(stored) as AdminConfig

      // Validate the loaded config structure
      if (!this.isValidConfig(parsed)) {
        console.warn('Invalid config structure, using defaults')
        return { ...DEFAULT_ADMIN_CONFIG }
      }

      return parsed
    } catch (error) {
      console.error('Failed to load config from cache:', error)
      return { ...DEFAULT_ADMIN_CONFIG }
    }
  }

  static saveConfigToCache(config: AdminConfig): boolean {
    if (typeof window === 'undefined') return false

    try {
      // Validate config before saving
      if (!this.isValidConfig(config)) {
        console.error('Invalid config structure, cannot save to cache')
        return false
      }

      const configWithTimestamp = {
        ...config,
        lastUpdated: new Date().toISOString(),
      }

      // Check localStorage availability and quota
      if (!this.isLocalStorageAvailable()) {
        console.error('localStorage is not available')
        return false
      }

      const configString = JSON.stringify(configWithTimestamp)

      // Check if we have enough space
      try {
        localStorage.setItem(SESSION_CONFIG.CONFIG_STORAGE_KEY, configString)
      } catch (quotaError) {
        console.error('localStorage quota exceeded:', quotaError)
        // Try to clear old data and retry
        this.clearOldData()
        localStorage.setItem(SESSION_CONFIG.CONFIG_STORAGE_KEY, configString)
      }

      return true
    } catch (error) {
      console.error('Failed to save config to cache:', error)
      return false
    }
  }

  static isFeatureEnabled(featureId: keyof AdminConfig['upselling']): boolean {
    const config = this.getConfigSync()
    return config.upselling[featureId] ?? false
  }

  static getAllFeatures(): AdminConfig['upselling'] {
    const config = this.getConfigSync()
    return { ...config.upselling }
  }

  // Sync methods
  static async syncWithServer(): Promise<boolean> {
    try {
      const serverConfig = await this.getConfigFromServer()
      this.saveConfigToCache(serverConfig)
      this.config = serverConfig
      this.isServerAvailable = true
      return true
    } catch (error) {
      console.warn('Failed to sync with server:', error)
      this.isServerAvailable = false
      return false
    }
  }

  static async checkServerHealth(): Promise<boolean> {
    try {
      // Skip server calls if we're on the server side to avoid circular calls
      if (typeof window === 'undefined') {
        return false
      }

      const authHeaders = AdminAuthService.getAuthHeaders()
      const response = await fetch('/api/admin/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      })

      const isHealthy = response.ok
      this.isServerAvailable = isHealthy
      this.lastServerCheck = Date.now()
      return isHealthy
    } catch (error) {
      console.warn('Server health check failed:', error)
      this.isServerAvailable = false
      this.lastServerCheck = Date.now()
      return false
    }
  }

  // Platform-aware methods
  static async getPlatformInfo(): Promise<PlatformInfo | null> {
    if (this.platformInfo) {
      return this.platformInfo
    }

    try {
      // Skip server calls if we're on the server side to avoid circular calls
      if (typeof window === 'undefined') {
        return null
      }

      const authHeaders = AdminAuthService.getAuthHeaders()
      const response = await fetch('/api/admin/platform', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.platform) {
          this.platformInfo = result.platform
          return result.platform
        }
      }
    } catch (error) {
      console.warn('Failed to get platform info:', error)
    }

    return null
  }

  private static shouldUseCache(): boolean {
    const timeSinceLastCheck = Date.now() - this.lastServerCheck
    return timeSinceLastCheck < this.SERVER_CHECK_INTERVAL
  }

  static showPlatformWarning(error: any): void {
    if (typeof window === 'undefined') return

    const platform = this.platformInfo
    if (!platform) return

    const warnings: Record<string, string> = {
      netlify: 'Netlify Blobs storage is temporarily unavailable. Using cached configuration.',
      vercel: 'Vercel KV storage is temporarily unavailable. Using cached configuration.',
      sqlite: 'Database connection failed. Using cached configuration.'
    }

    const message = warnings[platform.type] || 'Server storage unavailable. Using cached configuration.'
    console.warn(`[${platform.name}] ${message}`, error)

    // You could also show a user-friendly notification here
    // For example, using a toast notification system
  }

  static async getConfigWithPlatformInfo(): Promise<{ config: AdminConfig; platform: PlatformInfo | null }> {
    const config = await this.getConfig()
    const platform = await this.getPlatformInfo()
    return { config, platform }
  }

  // Migration utility
  static async migrateFromLocalStorage(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const localConfig = localStorage.getItem(SESSION_CONFIG.CONFIG_STORAGE_KEY)
      if (!localConfig) return

      // Check if server already has config
      try {
        await this.getConfigFromServer()
        console.log('Server already has configuration, skipping migration')
        return
      } catch {
        // Server doesn't have config, proceed with migration
      }

      const config = JSON.parse(localConfig) as AdminConfig
      if (this.isValidConfig(config)) {
        const success = await this.saveConfigToServer(config)
        if (success) {
          const platform = await this.getPlatformInfo()
          console.log(`Successfully migrated configuration from localStorage to ${platform?.name || 'server'}`)
        }
      }
    } catch (error) {
      console.warn('Failed to migrate from localStorage:', error)
    }
  }

  private static isValidConfig(config: any): config is AdminConfig {
    return isValidExtendedAdminConfig(config)
  }

  static async validateAndRepair(): Promise<AdminConfig> {
    const config = await this.getConfig()
    const defaults = DEFAULT_ADMIN_CONFIG
    let needsRepair = false

    // Ensure all required features exist
    Object.keys(defaults.upselling).forEach(key => {
      const featureKey = key as keyof AdminConfig['upselling']
      if (!(featureKey in config.upselling)) {
        config.upselling[featureKey] = defaults.upselling[featureKey]
        needsRepair = true
      }
    })

    if (needsRepair) {
      await this.saveConfig(config)
    }

    return config
  }

  static clearConfig(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(SESSION_CONFIG.CONFIG_STORAGE_KEY)
      this.config = null
    } catch (error) {
      console.error('Failed to clear config:', error)
    }
  }

  private static isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  private static clearOldData(): void {
    try {
      // Clear any old session data that might be taking up space
      const keysToCheck = [
        'adminAuthState',
        'adminSession',
        'tempData',
        'cache'
      ]

      keysToCheck.forEach(key => {
        try {
          localStorage.removeItem(key)
        } catch {
          // Ignore individual removal errors
        }
      })
    } catch (error) {
      console.warn('Failed to clear old data:', error)
    }
  }

  static getStorageInfo(): { used: number; available: boolean; error?: string } {
    if (typeof window === 'undefined') {
      return { used: 0, available: false, error: 'Server-side rendering' }
    }

    try {
      if (!this.isLocalStorageAvailable()) {
        return { used: 0, available: false, error: 'localStorage not available' }
      }

      // Estimate used space
      let used = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length
        }
      }

      return { used, available: true }
    } catch (error) {
      return { used: 0, available: false, error: String(error) }
    }
  }
}