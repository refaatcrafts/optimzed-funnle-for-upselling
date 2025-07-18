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
    // Check for Netlify environment
    if (process.env.NETLIFY || process.env.NETLIFY_DEV) {
      return PlatformType.NETLIFY
    }
    
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