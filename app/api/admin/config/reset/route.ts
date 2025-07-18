import { NextRequest, NextResponse } from 'next/server'
import { ServerConfigService } from '@/lib/services/server-config-service'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/admin-auth'

const configService = new ServerConfigService()

async function postHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    // Get user agent for audit logging
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    
    const config = await configService.resetToDefaults(userAgent)
    
    return NextResponse.json({
      success: true,
      data: config,
      message: 'Configuration reset to defaults successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('POST /api/admin/config/reset error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset configuration',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Export the protected handler
export const POST = withAuth(postHandler)