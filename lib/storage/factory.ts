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
      
      // Try fallback strategies based on platform
      if (platform === PlatformType.SQLITE) {
        console.log('SQLite failed, trying file-based storage fallback...')
        try {
          const { FileAdapter } = await import('./adapters/file-adapter')
          const fallbackAdapter = new FileAdapter()
          await fallbackAdapter.initialize()
          this.instance = fallbackAdapter
          console.log('Successfully initialized file-based storage fallback')
          return fallbackAdapter
        } catch (fallbackError) {
          console.error('File adapter fallback also failed:', fallbackError)
        }
      }
      
      // If SQLite fails and we're likely on a serverless platform, try Netlify Blobs as fallback
      if (platform === PlatformType.SQLITE && this.isLikelyServerless()) {
        console.log('SQLite failed on serverless platform, trying Netlify Blobs fallback...')
        try {
          const { NetlifyBlobsAdapter } = await import('./adapters/netlify-adapter')
          const fallbackAdapter = new NetlifyBlobsAdapter()
          await fallbackAdapter.initialize()
          this.instance = fallbackAdapter
          return fallbackAdapter
        } catch (fallbackError) {
          console.error('Netlify Blobs fallback also failed:', fallbackError)
        }
      }
      
      throw new ConfigError(
        `Failed to initialize storage adapter for ${platform}`,
        CONFIG_ERRORS.INITIALIZATION_FAILED,
        platform,
        500
      )
    }
  }

  private static isLikelyServerless(): boolean {
    // Check for common serverless environment indicators
    return !!(
      process.env.NETLIFY ||
      process.env.NETLIFY_DEV ||
      process.env.CONTEXT ||
      process.env.DEPLOY_PRIME_URL ||
      process.env.SITE_ID ||
      process.env.BUILD_ID ||
      process.env.VERCEL ||
      process.env.VERCEL_ENV ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT
    )
  }

  static clearCache(): void {
    this.instance = null
  }

  static getCurrentAdapter(): StorageAdapter | null {
    return this.instance
  }
}