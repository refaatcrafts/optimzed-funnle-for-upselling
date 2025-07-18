import { NextRequest, NextResponse } from 'next/server'
import { ServerConfigService } from '@/lib/services/server-config-service'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/admin-auth'
import { ConfigError } from '@/lib/storage/errors'

const configService = new ServerConfigService()

async function getHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const platformInfo = await configService.getPlatformInfo()
    const storageHealth = await configService.checkHealth()
    
    // Get platform-specific capabilities
    const capabilities = {
      supportsAudit: true, // All platforms support audit logging
      supportsBackup: true, // All platforms support export/import
      maxConfigSize: getPlatformMaxConfigSize(platformInfo.type),
      supportsRealtime: false, // None currently support real-time updates
      supportsConcurrency: platformInfo.type === 'sqlite' // Only SQLite supports concurrent access well
    }
    
    return NextResponse.json({
      success: true,
      platform: platformInfo,
      capabilities,
      health: {
        storage: storageHealth,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('GET /api/admin/platform error:', error)
    
    const statusCode = error instanceof ConfigError ? error.statusCode : 500
    const errorMessage = error instanceof ConfigError ? error.message : 'Failed to get platform information'
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: statusCode })
  }
}

function getPlatformMaxConfigSize(platformType: string): number {
  switch (platformType) {
    case 'netlify':
      return 1024 * 1024 // 1MB for Netlify Blobs
    case 'vercel':
      return 1024 * 100 // 100KB for Vercel KV
    case 'sqlite':
    default:
      return 1024 * 1024 * 10 // 10MB for SQLite
  }
}

// Export the protected handler
export const GET = withAuth(getHandler)