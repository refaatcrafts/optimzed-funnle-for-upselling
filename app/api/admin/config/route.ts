import { NextRequest, NextResponse } from 'next/server'
import { AdminConfig } from '@/lib/types/admin'
import { ServerConfigService } from '@/lib/services/server-config-service'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/admin-auth'
import { ConfigError } from '@/lib/storage/errors'

const configService = new ServerConfigService()

async function getHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const config = await configService.getConfig()
    const platformInfo = await configService.getPlatformInfo()
    
    return NextResponse.json({
      success: true,
      data: config,
      platform: platformInfo,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('GET /api/admin/config error:', error)
    
    const statusCode = error instanceof ConfigError ? error.statusCode : 500
    const errorMessage = error instanceof ConfigError ? error.message : 'Failed to load configuration'
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: statusCode })
  }
}

async function putHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const config = body as AdminConfig
    
    // Validate the configuration structure
    if (!config || !config.upselling || typeof config.upselling !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Invalid configuration structure',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }
    
    // Get user agent for audit logging
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    
    const success = await configService.saveConfig(config, userAgent)
    
    if (success) {
      // Return the saved configuration with platform info
      const savedConfig = await configService.getConfig()
      const platformInfo = await configService.getPlatformInfo()
      
      return NextResponse.json({
        success: true,
        data: savedConfig,
        platform: platformInfo,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to save configuration',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  } catch (error) {
    console.error('PUT /api/admin/config error:', error)
    
    const statusCode = error instanceof ConfigError ? error.statusCode : 500
    const errorMessage = error instanceof ConfigError ? error.message : 'Failed to save configuration'
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: statusCode })
  }
}

// Export the protected handlers
export const GET = withAuth(getHandler)
export const PUT = withAuth(putHandler)