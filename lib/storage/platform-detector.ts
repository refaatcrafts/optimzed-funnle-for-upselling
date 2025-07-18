export enum PlatformType {
  NETLIFY = 'netlify',
  VERCEL = 'vercel',
  SQLITE = 'sqlite'
}

export interface PlatformInfo {
  type: PlatformType
  name: string
  supportsFileSystem: boolean
  storageType: string
}

export class PlatformDetector {
  static detect(): PlatformType {
    // Debug logging to see what environment variables are available
    console.log('Platform detection - Environment variables:', {
      NETLIFY: process.env.NETLIFY,
      NETLIFY_DEV: process.env.NETLIFY_DEV,
      CONTEXT: process.env.CONTEXT,
      DEPLOY_PRIME_URL: process.env.DEPLOY_PRIME_URL,
      SITE_ID: process.env.SITE_ID,
      BUILD_ID: process.env.BUILD_ID,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NODE_ENV: process.env.NODE_ENV
    })
    
    // Check for Netlify environment - multiple ways to detect
    if (
      process.env.NETLIFY || 
      process.env.NETLIFY_DEV || 
      process.env.CONTEXT || 
      process.env.DEPLOY_PRIME_URL ||
      process.env.SITE_ID ||
      process.env.BUILD_ID
    ) {
      console.log('Detected Netlify platform')
      return PlatformType.NETLIFY
    }
    
    // Check for Vercel environment
    if (process.env.VERCEL || process.env.VERCEL_ENV) {
      console.log('Detected Vercel platform')
      return PlatformType.VERCEL
    }
    
    console.log('Defaulting to SQLite platform')
    // Default to SQLite for local development
    return PlatformType.SQLITE
  }

  static getPlatformInfo(type?: PlatformType): PlatformInfo {
    const platform = type || this.detect()
    
    switch (platform) {
      case PlatformType.NETLIFY:
        return {
          type: PlatformType.NETLIFY,
          name: 'Netlify Blobs',
          supportsFileSystem: false,
          storageType: 'blob'
        }
      case PlatformType.VERCEL:
        return {
          type: PlatformType.VERCEL,
          name: 'Vercel KV',
          supportsFileSystem: false,
          storageType: 'kv'
        }
      case PlatformType.SQLITE:
      default:
        return {
          type: PlatformType.SQLITE,
          name: 'SQLite Database',
          supportsFileSystem: true,
          storageType: 'database'
        }
    }
  }
}