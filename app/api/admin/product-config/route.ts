import { NextRequest, NextResponse } from 'next/server'
import { ProductConfiguration } from '@/lib/types/admin'
import { ProductConfigurationService, productConfigurationService } from '@/lib/services/product-configuration-service'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/admin-auth'

const configService = productConfigurationService

async function getHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const config = await configService.getProductConfiguration()
    const stats = await configService.getConfigurationStats()
    
    return NextResponse.json({
      success: true,
      data: config,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('GET /api/admin/product-config error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load product configuration',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function putHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const config = body as Partial<ProductConfiguration>
    
    // Validate the configuration structure
    if (!config || typeof config !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Invalid configuration structure',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }
    
    const success = await configService.updateProductConfiguration(config)
    
    if (success) {
      // Return the updated configuration
      const updatedConfig = await configService.getProductConfiguration()
      const stats = await configService.getConfigurationStats()
      
      return NextResponse.json({
        success: true,
        data: updatedConfig,
        stats,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to save product configuration',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  } catch (error) {
    console.error('PUT /api/admin/product-config error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to save product configuration',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Export the protected handlers
export const GET = withAuth(getHandler)
export const PUT = withAuth(putHandler)