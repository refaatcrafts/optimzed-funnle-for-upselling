import { NextRequest, NextResponse } from 'next/server'
import { ServerConfigService } from '@/lib/services/server-config-service'
import { getDatabaseInfo } from '@/lib/db/connection'
import { migrator } from '@/lib/db/migrations'
import { AdminAuthMiddleware } from '@/lib/middleware/admin-auth'

const configService = new ServerConfigService()

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Optional authentication for health checks
  const session = AdminAuthMiddleware.validateSession(request)
  const isAuthenticated = !!session
  
  try {
    const dbInfo = await getDatabaseInfo()
    const healthCheck = await migrator.checkDatabaseHealth()
    const serverHealth = await configService.checkDatabaseHealth()
    
    const isHealthy = dbInfo.connected && healthCheck.healthy && serverHealth
    
    return NextResponse.json({
      healthy: isHealthy,
      database: {
        connected: dbInfo.connected,
        path: dbInfo.path,
        size: dbInfo.size,
        version: healthCheck.version,
        error: healthCheck.error
      },
      server: {
        healthy: serverHealth,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      },
      migrations: {
        current: healthCheck.version,
        applied: await migrator.getAppliedMigrations()
      }
    }, {
      status: isHealthy ? 200 : 503
    })
  } catch (error) {
    console.error('GET /api/admin/health error:', error)
    
    return NextResponse.json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}