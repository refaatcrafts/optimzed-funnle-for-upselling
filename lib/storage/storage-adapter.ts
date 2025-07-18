import { AdminConfig } from '@/lib/types/admin'
import { PlatformInfo, PlatformType } from './platform-detector'

export interface ConfigAuditEntry {
  id: string | number
  action: 'UPDATE' | 'RESET' | 'CREATE' | 'MIGRATE'
  config_data: string
  timestamp: string
  user_agent?: string
  platform: PlatformType
}

export interface ConfigRecord {
  id: string | number
  config_data: string
  created_at: string
  updated_at: string
  version: number
  platform: PlatformType
}

export abstract class StorageAdapter {
  // Core operations
  abstract getConfig(): Promise<AdminConfig | null>
  abstract saveConfig(config: AdminConfig): Promise<boolean>
  abstract resetToDefaults(): Promise<AdminConfig>
  
  // Storage operations
  abstract initialize(): Promise<void>
  abstract migrate(): Promise<void>
  
  // Audit operations
  abstract logConfigChange(action: string, config: AdminConfig, userAgent?: string): Promise<void>
  abstract getAuditLog(): Promise<ConfigAuditEntry[]>
  
  // Health checks
  abstract checkHealth(): Promise<boolean>
  
  // Platform info
  abstract getPlatformInfo(): PlatformInfo

  // Default configuration
  protected getDefaultConfig(): AdminConfig {
    return {
      upselling: {
        frequentlyBoughtTogether: true,
        youMightAlsoLike: true,
        freeShippingProgressBar: true,
        postCartUpsellOffers: true,
        crossSellRecommendations: true
      },
      lastUpdated: new Date().toISOString()
    }
  }

  // Validation helper
  protected isValidConfig(config: any): config is AdminConfig {
    return config && 
           typeof config === 'object' && 
           'upselling' in config && 
           'lastUpdated' in config &&
           typeof config.upselling === 'object'
  }
}