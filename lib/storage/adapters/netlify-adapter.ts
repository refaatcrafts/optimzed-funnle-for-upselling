import { AdminConfig } from '@/lib/types/admin'
import { StorageAdapter, ConfigAuditEntry } from '../storage-adapter'
import { PlatformInfo, PlatformType, PlatformDetector } from '../platform-detector'
import { ConfigError, ErrorHandler, CONFIG_ERRORS } from '../errors'

// Netlify Blobs storage format
interface NetlifyConfigBlob {
  config: AdminConfig
  metadata: {
    created_at: string
    updated_at: string
    version: number
  }
  audit: ConfigAuditEntry[]
}

export class NetlifyBlobsAdapter extends StorageAdapter {
  private store: any = null
  private readonly storeName: string

  constructor() {
    super()
    this.storeName = process.env.NETLIFY_BLOBS_STORE_NAME || 'admin-config'
  }

  async initialize(): Promise<void> {
    try {
      // Dynamic import to avoid issues when not on Netlify
      const { getStore } = await import('@netlify/blobs')
      this.store = getStore(this.storeName)
      
      // Test connection
      await this.store.list({ limit: 1 })
    } catch (error) {
      if (error.message?.includes('not found') || error.message?.includes('module')) {
        throw new ConfigError(
          'Netlify Blobs not available. Make sure @netlify/blobs is installed and you are deploying to Netlify.',
          CONFIG_ERRORS.INITIALIZATION_FAILED,
          PlatformType.NETLIFY,
          503
        )
      }
      throw ErrorHandler.handleStorageError(error, PlatformType.NETLIFY)
    }
  }

  async migrate(): Promise<void> {
    if (!this.store) {
      throw new ConfigError('Netlify Blobs not initialized', CONFIG_ERRORS.INITIALIZATION_FAILED, PlatformType.NETLIFY)
    }

    try {
      // Check if config blob exists, if not create initial structure
      const existing = await this.store.get('config', { type: 'json' })
      
      if (!existing) {
        const initialBlob: NetlifyConfigBlob = {
          config: this.getDefaultConfig(),
          metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            version: 1
          },
          audit: []
        }
        
        await this.store.set('config', JSON.stringify(initialBlob))
        console.log('Initialized Netlify Blobs storage with default configuration')
      }
    } catch (error) {
      throw ErrorHandler.handleStorageError(error, PlatformType.NETLIFY)
    }
  }

  async getConfig(): Promise<AdminConfig | null> {
    if (!this.store) {
      throw new ConfigError('Netlify Blobs not initialized', CONFIG_ERRORS.INITIALIZATION_FAILED, PlatformType.NETLIFY)
    }

    try {
      const blobData = await this.store.get('config', { type: 'json' })
      
      if (!blobData) return null

      const blob: NetlifyConfigBlob = typeof blobData === 'string' ? JSON.parse(blobData) : blobData
      
      return this.isValidConfig(blob.config) ? blob.config : null
    } catch (error) {
      if (error.message?.includes('not found')) {
        return null
      }
      throw ErrorHandler.handleStorageError(error, PlatformType.NETLIFY)
    }
  }

  async saveConfig(config: AdminConfig): Promise<boolean> {
    if (!this.store) {
      throw new ConfigError('Netlify Blobs not initialized', CONFIG_ERRORS.INITIALIZATION_FAILED, PlatformType.NETLIFY)
    }
    
    if (!this.isValidConfig(config)) {
      throw new ConfigError('Invalid configuration', CONFIG_ERRORS.INVALID_CONFIG, PlatformType.NETLIFY)
    }

    try {
      // Get existing blob or create new one
      let blob: NetlifyConfigBlob
      
      try {
        const existingData = await this.store.get('config', { type: 'json' })
        blob = existingData ? (typeof existingData === 'string' ? JSON.parse(existingData) : existingData) : null
      } catch (error) {
        blob = null
      }

      if (!blob) {
        blob = {
          config: this.getDefaultConfig(),
          metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            version: 1
          },
          audit: []
        }
      }

      // Update configuration and metadata
      const now = new Date().toISOString()
      const updatedConfig = { ...config, lastUpdated: now }
      
      blob.config = updatedConfig
      blob.metadata.updated_at = now
      blob.metadata.version += 1

      // Save updated blob
      await this.store.set('config', JSON.stringify(blob))
      
      // Log the change
      await this.logConfigChange('UPDATE', updatedConfig)
      
      return true
    } catch (error) {
      throw ErrorHandler.handleStorageError(error, PlatformType.NETLIFY)
    }
  }

  async resetToDefaults(): Promise<AdminConfig> {
    const defaultConfig = this.getDefaultConfig()
    const success = await this.saveConfig(defaultConfig)
    
    if (!success) {
      throw new ConfigError('Failed to reset configuration', CONFIG_ERRORS.SAVE_FAILED, PlatformType.NETLIFY)
    }

    await this.logConfigChange('RESET', defaultConfig)
    return defaultConfig
  }

  async logConfigChange(action: string, config: AdminConfig, userAgent?: string): Promise<void> {
    if (!this.store) return // Don't throw error for audit logging

    try {
      // Get existing blob
      const blobData = await this.store.get('config', { type: 'json' })
      const blob: NetlifyConfigBlob = blobData ? (typeof blobData === 'string' ? JSON.parse(blobData) : blobData) : {
        config: this.getDefaultConfig(),
        metadata: {
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: 1
        },
        audit: []
      }

      // Add audit entry
      const auditEntry: ConfigAuditEntry = {
        id: Date.now().toString(),
        action: action as any,
        config_data: JSON.stringify(config),
        timestamp: new Date().toISOString(),
        user_agent: userAgent,
        platform: PlatformType.NETLIFY
      }

      blob.audit.unshift(auditEntry)
      
      // Keep only last 100 audit entries
      if (blob.audit.length > 100) {
        blob.audit = blob.audit.slice(0, 100)
      }

      // Save updated blob
      await this.store.set('config', JSON.stringify(blob))
    } catch (error) {
      console.error('Failed to log config change to Netlify Blobs:', error)
      // Don't throw error for audit logging failures
    }
  }

  async getAuditLog(): Promise<ConfigAuditEntry[]> {
    if (!this.store) return []

    try {
      const blobData = await this.store.get('config', { type: 'json' })
      
      if (!blobData) return []

      const blob: NetlifyConfigBlob = typeof blobData === 'string' ? JSON.parse(blobData) : blobData
      
      return blob.audit || []
    } catch (error) {
      console.error('Failed to get audit log from Netlify Blobs:', error)
      return []
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      if (!this.store) return false
      
      // Test connection by listing blobs
      await this.store.list({ limit: 1 })
      
      return true
    } catch (error) {
      console.error('Netlify Blobs health check failed:', error)
      return false
    }
  }

  getPlatformInfo(): PlatformInfo {
    return PlatformDetector.getPlatformInfo(PlatformType.NETLIFY)
  }

  getStore(): any {
    return this.store
  }
}