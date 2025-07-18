import { NextRequest, NextResponse } from 'next/server'
import { ServerConfigService } from '@/lib/services/server-config-service'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/admin-auth'

const configService = new ServerConfigService()

async function getHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const stats = await configService.getDatabaseStats()
    
    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('GET /api/admin/maintenance error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get database statistics',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function postHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const action = body.action
    
    switch (action) {
      case 'cleanup':
        const keepDays = body.keepDays || 30
        const deletedCount = await configService.cleanupOldAuditEntries(keepDays)
        
        return NextResponse.json({
          success: true,
          message: `Cleaned up ${deletedCount} old audit entries`,
          data: { deletedCount },
          timestamp: new Date().toISOString()
        })
      
      case 'repair':
        const repairResult = await configService.repairDatabase()
        
        return NextResponse.json({
          success: true,
          message: repairResult.repaired ? 'Database repaired successfully' : 'No repairs needed',
          data: repairResult,
          timestamp: new Date().toISOString()
        })
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: cleanup, repair',
          timestamp: new Date().toISOString()
        }, { status: 400 })
    }
  } catch (error) {
    console.error('POST /api/admin/maintenance error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Maintenance operation failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Export the protected handlers
export const GET = withAuth(getHandler)
export const POST = withAuth(postHandler)