export enum PlatformType {
  NETLIFY = 'netlify',
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