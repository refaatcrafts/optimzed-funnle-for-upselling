import { NextRequest, NextResponse } from 'next/server'
import { ServerConfigService } from '@/lib/services/server-config-service'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/admin-auth'

const configService = new ServerConfigService()

async function getHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const backup = await configService.createBackup()
    
    return NextResponse.json({
      success: true,
      data: backup,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('GET /api/admin/backup error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create backup',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function postHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    
    const success = await configService.restoreFromBackup(body, userAgent)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Configuration restored from backup successfully',
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to restore from backup',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  } catch (error) {
    console.error('POST /api/admin/backup error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore from backup',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Export the protected handlers
export const GET = withAuth(getHandler)
export const POST = withAuth(postHandler)