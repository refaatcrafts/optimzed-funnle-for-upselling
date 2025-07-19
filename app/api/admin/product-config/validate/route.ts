import { NextRequest, NextResponse } from 'next/server'
import { ProductConfigurationService, productConfigurationService } from '@/lib/services/product-configuration-service'
import { ServerConfigService } from '@/lib/services/server-config-service'
import { ProductDataService, productDataService } from '@/lib/services/product-data-service'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/admin-auth'

const configService = productConfigurationService
const serverConfigService = new ServerConfigService()
const productDataServiceInstance = productDataService

async function postHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { sku, skus } = body
    
    // Get configuration and configure API client
    const fullConfig = await serverConfigService.getConfig()
    
    // Check if API is configured
    if (!fullConfig.taagerApi.isConfigured || !fullConfig.taagerApi.apiKey || !fullConfig.taagerApi.taagerId) {
      console.error('API configuration check failed:', {
        isConfigured: fullConfig.taagerApi.isConfigured,
        hasApiKey: !!fullConfig.taagerApi.apiKey,
        hasTaagerId: !!fullConfig.taagerApi.taagerId,
        config: fullConfig.taagerApi
      })
      return NextResponse.json({
        success: false,
        error: 'Taager API credentials not configured',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }
    
    const { TaagerApiClient } = await import('@/lib/services/taager-api-client')
    const { ProductDataService } = await import('@/lib/services/product-data-service')
    
    // Pass config directly to constructor
    const taagerApiClient = new TaagerApiClient(fullConfig.taagerApi)
    
    // Debug: Check if client is configured after constructor
    console.log('API client configured:', taagerApiClient.isConfigured())
    console.log('API client config:', taagerApiClient.getConfig())
    
    const productDataService = new ProductDataService(taagerApiClient)
    
    if (sku && typeof sku === 'string') {
      // Validate single SKU
      const validation = await productDataService.validateSku(sku)
      
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
          const validation = await productDataService.validateSku(skuToValidate)
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
    // Get configuration directly from server config service
    const fullConfig = await serverConfigService.getConfig()
    const config = fullConfig.productConfiguration
    
    // Check if API is configured
    if (!fullConfig.taagerApi.isConfigured || !fullConfig.taagerApi.apiKey || !fullConfig.taagerApi.taagerId) {
      console.error('GET API configuration check failed:', {
        isConfigured: fullConfig.taagerApi.isConfigured,
        hasApiKey: !!fullConfig.taagerApi.apiKey,
        hasTaagerId: !!fullConfig.taagerApi.taagerId,
        config: fullConfig.taagerApi
      })
      return NextResponse.json({
        success: false,
        error: 'Taager API credentials not configured',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }
    
    // Configure API client with current credentials
    const { TaagerApiClient } = await import('@/lib/services/taager-api-client')
    const { ProductDataService } = await import('@/lib/services/product-data-service')
    
    // Pass config directly to constructor
    const taagerApiClient = new TaagerApiClient(fullConfig.taagerApi)
    
    // Debug: Check if client is configured after constructor
    console.log('GET API client configured:', taagerApiClient.isConfigured())
    console.log('GET API client config:', taagerApiClient.getConfig())
    
    const productDataService = new ProductDataService(taagerApiClient)
    
    // Collect all SKUs from the configuration
    const allSkus = [
      config.homePagePrimary,
      ...config.recommendations,
      ...config.frequentlyBoughtTogether,
      ...config.upsellOffers,
      ...config.crossSellRecommendations
    ].filter(Boolean) as string[]

    const results = []
    
    // Validate each SKU
    for (const sku of allSkus) {
      const result = await productDataService.validateSku(sku)
      results.push(result)
    }

    const summary = {
      total: results.length,
      valid: results.filter(r => r.isValid).length,
      invalid: results.filter(r => !r.isValid).length,
      unchecked: 0
    }

    const validation = {
      isValid: summary.invalid === 0,
      results,
      summary
    }
    
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