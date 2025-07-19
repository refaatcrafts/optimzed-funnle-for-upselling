import { NextRequest, NextResponse } from 'next/server'
import { ProductConfigurationService, productConfigurationService } from '@/lib/services/product-configuration-service'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/admin-auth'

const configService = productConfigurationService

async function postHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { sku, skus } = body
    
    if (sku && typeof sku === 'string') {
      // Validate single SKU
      const validation = await configService['productDataService'].validateSku(sku)
      
      return NextResponse.json({
        success: true,
        data: validation,
        timestamp: new Date().toISOString()
      })
    } else if (skus && Array.isArray(skus)) {
      // Validate multiple SKUs
      const results = []
      
      for (const skuToValidate of skus) {
        if (typeof skuToValidate === 'string') {
          const validation = await configService['productDataService'].validateSku(skuToValidate)
          results.push(validation)
        }
      }
      
      return NextResponse.json({
        success: true,
        data: results,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid request: provide either "sku" (string) or "skus" (array)',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }
  } catch (error) {
    console.error('POST /api/admin/product-config/validate error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to validate SKU(s)',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function getHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    // Validate all configured SKUs
    const validation = await configService.validateConfiguration()
    
    return NextResponse.json({
      success: true,
      data: validation,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('GET /api/admin/product-config/validate error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to validate configuration',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Export the protected handlers
export const POST = withAuth(postHandler)
export const GET = withAuth(getHandler)