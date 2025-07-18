import { AdminConfig } from '@/lib/types/admin'
import { StorageAdapter, ConfigAuditEntry } from '@/lib/storage/storage-adapter'
import { StorageAdapterFactory } from '@/lib/storage/factory'
import { PlatformInfo } from '@/lib/storage/platform-detector'
import { ConfigError, CONFIG_ERRORS } from '@/lib/storage/errors'

export class ServerConfigService {
  private adapter: StorageAdapter | null = null

  constructor(adapter?: StorageAdapter) {
    this.adapter = adapter || null
  }

  private async getAdapter(): Promise<StorageAdapter> {
    if (!this.adapter) {
      this.adapter = await StorageAdapterFactory.createAdapter()
    }
    return this.adapter
  }

  // Core operations
  async getConfig(): Promise<AdminConfig> {
    const adapter = await this.getAdapter()
    const config = await adapter.getConfig()
    return config || this.getDefaultConfig()
  }

  async saveConfig(config: AdminConfig, userAgent?: string): Promise<boolean> {
    if (!this.isValidConfig(config)) {
      throw new ConfigError('Invalid configuration data', CONFIG_ERRORS.INVALID_CONFIG, (await this.getAdapter()).getPlatformInfo().type)
    }

    const adapter = await this.getAdapter()
    return await adapter.saveConfig(config)
  }

  async resetToDefaults(): Promise<AdminConfig> {
    const adapter = await this.getAdapter()
    return await adapter.resetToDefaults()
  }

  // Platform operations
  async initialize(): Promise<void> {
    const adapter = await this.getAdapter()
    await adapter.initialize()
  }

  async checkHealth(): Promise<boolean> {
    try {
      const adapter = await this.getAdapter()
      return await adapter.checkHealth()
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }

  async getPlatformInfo(): Promise<PlatformInfo> {
    const adapter = await this.getAdapter()
    return adapter.getPlatformInfo()
  }

  // Audit operations
  async getAuditLog(): Promise<ConfigAuditEntry[]> {
    try {
      const adapter = await this.getAdapter()
      return await adapter.getAuditLog()
    } catch (error) {
      console.error('Failed to get audit log:', error)
      return []
    }
  }

  async logConfigChange(action: string, config: AdminConfig, userAgent?: string): Promise<void> {
    try {
      const adapter = await this.getAdapter()
      await adapter.logConfigChange(action, config, userAgent)
    } catch (error) {
      console.error('Failed to log config change:', error)
      // Don't throw error for audit logging failures
    }
  }

  // Helper methods
  private getDefaultConfig(): AdminConfig {
    return {
      upselling: {
        frequentlyBoughtTogether: false,
        youMightAlsoLike: false,
        freeShippingProgressBar: false,
        postCartUpsellOffers: false,
        crossSellRecommendations: false
      },
      lastUpdated: new Date().toISOString()
    }
  }

  private isValidConfig(config: any): config is AdminConfig {
    return config && 
           typeof config === 'object' && 
           'upselling' in config && 
           'lastUpdated' in config &&
           typeof config.upselling === 'object' &&
           typeof config.upselling.frequentlyBoughtTogether === 'boolean' &&
           typeof config.upselling.youMightAlsoLike === 'boolean' &&
           typeof config.upselling.freeShippingProgressBar === 'boolean' &&
           typeof config.upselling.postCartUpsellOffers === 'boolean' &&
           typeof config.upselling.crossSellRecommendations === 'boolean'
  }

  // Export/Import functionality
  async exportConfig(): Promise<{ config: AdminConfig; metadata: any; audit: ConfigAuditEntry[] }> {
    const adapter = await this.getAdapter()
    const config = await adapter.getConfig()
    const audit = await adapter.getAuditLog()
    const platformInfo = adapter.getPlatformInfo()

    return {
      config: config || this.getDefaultConfig(),
      metadata: {
        platform: platformInfo,
        exportedAt: new Date().toISOString(),
        version: 1
      },
      audit
    }
  }

  async importConfig(data: { config: AdminConfig; metadata?: any }): Promise<boolean> {
    if (!this.isValidConfig(data.config)) {
      throw new ConfigError('Invalid configuration data in import', CONFIG_ERRORS.INVALID_CONFIG, (await this.getAdapter()).getPlatformInfo().type)
    }

    const success = await this.saveConfig(data.config)
    if (success) {
      await this.logConfigChange('IMPORT', data.config, 'config-import')
    }
    return success
  }
}