import { NextRequest, NextResponse } from 'next/server'
import { ProductConfigurationService, productConfigurationService } from '@/lib/services/product-configuration-service'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/admin-auth'

const configService = productConfigurationService

async function getHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    // Generate preview for all configured products
    const preview = await configService.previewConfiguration()
    
    // Group by section for better organization
    const groupedPreview = preview.reduce((acc, item) => {
      if (!acc[item.section]) {
        acc[item.section] = []
      }
      acc[item.section].push(item)
      return acc
    }, {} as Record<string, typeof preview>)
    
    // Calculate summary statistics
    const summary = {
      totalProducts: preview.length,
      successfullyLoaded: preview.filter(p => p.product !== null).length,
      failedToLoad: preview.filter(p => p.product === null).length,
      sections: Object.keys(groupedPreview).length
    }
    
    return NextResponse.json({
      success: true,
      data: {
        preview: groupedPreview,
        summary
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('GET /api/admin/product-config/preview error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate product configuration preview',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Export the protected handler
export const GET = withAuth(getHandler)