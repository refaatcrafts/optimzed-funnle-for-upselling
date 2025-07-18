import { AdminConfig } from '@/lib/types/admin'
import { DEFAULT_ADMIN_CONFIG, SESSION_CONFIG } from '@/lib/constants/admin'

export class ConfigurationManager {
  private static config: AdminConfig | null = null

  static getConfig(): AdminConfig {
    if (this.config) {
      return this.config
    }

    this.config = this.loadConfig()
    return this.config
  }

  static loadConfig(): AdminConfig {
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
      console.error('Failed to load config:', error)
      return { ...DEFAULT_ADMIN_CONFIG }
    }
  }

  static saveConfig(config?: AdminConfig): boolean {
    if (typeof window === 'undefined') return false

    const configToSave = config || this.config
    if (!configToSave) return false

    try {
      // Validate config before saving
      if (!this.isValidConfig(configToSave)) {
        console.error('Invalid config structure, cannot save')
        return false
      }

      const configWithTimestamp = {
        ...configToSave,
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
      
      this.config = configWithTimestamp
      return true
    } catch (error) {
      console.error('Failed to save config:', error)
      return false
    }
  }

  static updateFeature(featureId: keyof AdminConfig['upselling'], enabled: boolean): boolean {
    const config = this.getConfig()
    
    if (!(featureId in config.upselling)) {
      console.error(`Invalid feature ID: ${featureId}`)
      return false
    }

    config.upselling[featureId] = enabled
    return this.saveConfig(config)
  }

  static resetToDefaults(): boolean {
    this.config = { ...DEFAULT_ADMIN_CONFIG }
    return this.saveConfig()
  }

  static isFeatureEnabled(featureId: keyof AdminConfig['upselling']): boolean {
    const config = this.getConfig()
    return config.upselling[featureId] ?? false
  }

  static getAllFeatures(): AdminConfig['upselling'] {
    const config = this.getConfig()
    return { ...config.upselling }
  }

  private static isValidConfig(config: any): config is AdminConfig {
    if (!config || typeof config !== 'object') return false
    
    if (!config.upselling || typeof config.upselling !== 'object') return false

    const requiredFeatures: (keyof AdminConfig['upselling'])[] = [
      'frequentlyBoughtTogether',
      'youMightAlsoLike',
      'freeShippingProgressBar',
      'postCartUpsellOffers',
      'crossSellRecommendations',
    ]

    return requiredFeatures.every(
      feature => typeof config.upselling[feature] === 'boolean'
    )
  }

  static validateAndRepair(): AdminConfig {
    const config = this.getConfig()
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
      this.saveConfig(config)
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