import { NextRequest, NextResponse } from 'next/server'
import { ServerConfigService } from '@/lib/services/server-config-service'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/admin-auth'
import { ConfigError } from '@/lib/storage/errors'

const configService = new ServerConfigService()

async function postHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const config = await configService.resetToDefaults()
    const platformInfo = await configService.getPlatformInfo()
    
    return NextResponse.json({
      success: true,
      data: config,
      platform: platformInfo,
      message: 'Configuration reset to defaults successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('POST /api/admin/config/reset error:', error)
    
    const statusCode = error instanceof ConfigError ? error.statusCode : 500
    const errorMessage = error instanceof ConfigError ? error.message : 'Failed to reset configuration'
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: statusCode })
  }
}

// Export the protected handler
export const POST = withAuth(postHandler)