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
    console.log('NetlifyBlobsAdapter: Starting initialization...')
    console.log('NetlifyBlobsAdapter: Store name:', this.storeName)
    console.log('NetlifyBlobsAdapter: Environment check:', {
      NETLIFY: process.env.NETLIFY,
      NETLIFY_DEV: process.env.NETLIFY_DEV,
      CONTEXT: process.env.CONTEXT,
      NODE_ENV: process.env.NODE_ENV
    })
    
    try {
      // Dynamic import to avoid issues when not on Netlify
      console.log('NetlifyBlobsAdapter: Importing @netlify/blobs...')
      const { getStore } = await import('@netlify/blobs')
      
      console.log('NetlifyBlobsAdapter: Creating store...')
      this.store = getStore(this.storeName)
      
      console.log('NetlifyBlobsAdapter: Testing connection...')
      // Test connection with more detailed error handling
      try {
        await this.store.list({ limit: 1 })
        console.log('NetlifyBlobsAdapter: Connection test successful!')
      } catch (connectionError: any) {
        console.error('NetlifyBlobsAdapter: Connection test failed:', connectionError)
        // Don't fail initialization on connection test - Netlify Blobs might not be ready yet
        console.warn('NetlifyBlobsAdapter: Continuing despite connection test failure')
      }
      
      console.log('NetlifyBlobsAdapter: Initialization successful!')
    } catch (error: any) {
      console.error('NetlifyBlobsAdapter: Initialization failed:', error)
      
      if (error?.message?.includes('not found') || error?.message?.includes('module')) {
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
      console.log('NetlifyBlobsAdapter: Getting config from Netlify Blobs...')
      
      // Add cache-busting by using a fresh request
      const blobData = await this.store.get('config', { 
        type: 'json',
        // Add timestamp to avoid caching issues
        cacheBust: Date.now().toString()
      })
      
      console.log('NetlifyBlobsAdapter: Raw blob data:', blobData ? 'Found' : 'Not found')
      
      if (!blobData) {
        console.log('NetlifyBlobsAdapter: No config found, returning null')
        return null
      }

      const blob: NetlifyConfigBlob = typeof blobData === 'string' ? JSON.parse(blobData) : blobData
      
      console.log('NetlifyBlobsAdapter: Parsed config:', {
        hasConfig: !!blob.config,
        lastUpdated: blob.config?.lastUpdated,
        version: blob.metadata?.version
      })
      
      const config = this.isValidConfig(blob.config) ? blob.config : null
      console.log('NetlifyBlobsAdapter: Returning config:', config ? 'Valid config' : 'Invalid/null config')
      
      return config
    } catch (error: any) {
      console.error('NetlifyBlobsAdapter: Error getting config:', error)
      if (error?.message?.includes('not found')) {
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
      console.log('NetlifyBlobsAdapter: Saving config to Netlify Blobs...', {
        upselling: config.upselling,
        lastUpdated: config.lastUpdated
      })
      
      // Get existing blob or create new one
      let blob: NetlifyConfigBlob | null = null
      
      try {
        const existingData = await this.store.get('config', { type: 'json' })
        blob = existingData ? (typeof existingData === 'string' ? JSON.parse(existingData) : existingData) : null
        console.log('NetlifyBlobsAdapter: Existing blob found:', !!blob)
      } catch (error) {
        console.log('NetlifyBlobsAdapter: No existing blob, creating new one')
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
      
      console.log('NetlifyBlobsAdapter: Updating blob with new config:', {
        oldVersion: blob.metadata.version,
        newConfig: updatedConfig.upselling,
        timestamp: now
      })
      
      blob.config = updatedConfig
      blob.metadata.updated_at = now
      blob.metadata.version += 1

      // Save updated blob
      console.log('NetlifyBlobsAdapter: Saving blob to Netlify Blobs...')
      await this.store.set('config', JSON.stringify(blob))
      console.log('NetlifyBlobsAdapter: Blob saved successfully!')
      
      // Log the change
      await this.logConfigChange('UPDATE', updatedConfig)
      
      return true
    } catch (error) {
      console.error('NetlifyBlobsAdapter: Error saving config:', error)
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