import { StorageAdapter } from './storage-adapter'
import { PlatformDetector, PlatformType } from './platform-detector'
import { ConfigError, CONFIG_ERRORS } from './errors'

export class StorageAdapterFactory {
  private static instance: StorageAdapter | null = null

  static async createAdapter(forcePlatform?: PlatformType): Promise<StorageAdapter> {
    // Return cached instance if available
    if (this.instance) {
      return this.instance
    }

    const platform = forcePlatform || PlatformDetector.detect()
    
    try {
      let adapter: StorageAdapter

      switch (platform) {
        case PlatformType.NETLIFY:
          const { NetlifyBlobsAdapter } = await import('./adapters/netlify-adapter')
          adapter = new NetlifyBlobsAdapter()
          break
          
        case PlatformType.VERCEL:
          // For now, fall back to SQLite for Vercel until we implement Vercel KV
          console.warn('Vercel KV not implemented yet, falling back to SQLite')
          const { SQLiteAdapter: VercelSQLiteAdapter } = await import('./adapters/sqlite-adapter')
          adapter = new VercelSQLiteAdapter()
          break
          
        case PlatformType.SQLITE:
        default:
          const { SQLiteAdapter } = await import('./adapters/sqlite-adapter')
          adapter = new SQLiteAdapter()
          break
      }

      // Initialize the adapter
      await adapter.initialize()
      
      // Cache the instance
      this.instance = adapter
      
      return adapter
    } catch (error) {
      console.error(`Failed to create storage adapter for platform ${platform}:`, error)
      throw new ConfigError(
        `Failed to initialize storage adapter for ${platform}`,
        CONFIG_ERRORS.INITIALIZATION_FAILED,
        platform,
        500
      )
    }
  }

  static clearCache(): void {
    this.instance = null
  }

  static getCurrentAdapter(): StorageAdapter | null {
    return this.instance
  }
}