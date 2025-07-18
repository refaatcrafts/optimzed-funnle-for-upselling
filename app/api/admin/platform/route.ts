import { NextResponse } from 'next/server'
import { ServerConfigService } from '@/lib/services/server-config-service'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/admin-auth'
import { ConfigError } from '@/lib/storage/errors'

const configService = new ServerConfigService()

async function getHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const platformInfo = await configService.getPlatformInfo()
    const healthStatus = await configService.checkHealth()

    return NextResponse.json({
      success: true,
      platform: platformInfo,
      health: healthStatus,
      capabilities: {
        supportsAudit: true,
        supportsBackup: true,
        maxConfigSize: platformInfo.type === 'netlify' ? 1024 * 1024 : 10 * 1024 * 1024 // 1MB for Netlify, 10MB for others
      },
      timestamp: new Date().toISOString()
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

// Export the protected handler
export const GET = withAuth(getHandler)