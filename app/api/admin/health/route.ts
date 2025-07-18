import { NextRequest, NextResponse } from 'next/server'
import { ServerConfigService } from '@/lib/services/server-config-service'
import { AdminAuthMiddleware } from '@/lib/middleware/admin-auth'
import { ConfigError } from '@/lib/storage/errors'

const configService = new ServerConfigService()

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Optional authentication for health checks
  const session = AdminAuthMiddleware.validateSession(request)
  const isAuthenticated = !!session
  
  try {
    const platformInfo = await configService.getPlatformInfo()
    const storageHealth = await configService.checkHealth()
    
    // Test basic config operations
    let configOperational = false
    try {
      await configService.getConfig()
      configOperational = true
    } catch (error) {
      console.warn('Config operation test failed:', error)
    }
    
    const isHealthy = storageHealth && configOperational
    
    return NextResponse.json({
      healthy: isHealthy,
      storage: {
        platform: platformInfo,
        healthy: storageHealth,
        operational: configOperational
      },
      server: {
        healthy: isHealthy,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      }
    }, {
      status: isHealthy ? 200 : 503
    })
  } catch (error) {
    console.error('GET /api/admin/health error:', error)
    
    const statusCode = error instanceof ConfigError ? error.statusCode : 503
    const errorMessage = error instanceof ConfigError ? error.message : 'Health check failed'
    
    return NextResponse.json({
      healthy: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: statusCode })
  }
}