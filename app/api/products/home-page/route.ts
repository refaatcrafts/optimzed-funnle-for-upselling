import { NextResponse } from 'next/server'
import { ServerConfigService } from '@/lib/services/server-config-service'
import { TaagerApiClient } from '@/lib/services/taager-api-client'
import { ProductDataService } from '@/lib/services/product-data-service'

const serverConfigService = new ServerConfigService()

export async function GET() {
  try {
    // Get configuration from server
    const fullConfig = await serverConfigService.getConfig()
    
    // Check if API configuration exists and is configured
    if (!fullConfig.taagerApi || !fullConfig.taagerApi.isConfigured || !fullConfig.taagerApi.apiKey || !fullConfig.taagerApi.taagerId) {
      return NextResponse.json({
        success: false,
        error: 'API not configured',
        data: null
      })
    }
    
    // Create configured API client
    const taagerApiClient = new TaagerApiClient(fullConfig.taagerApi)
    const productDataService = new ProductDataService(taagerApiClient)
    
    // Get home page product - pass the full config
    const homePageProduct = await productDataService.getHomePageProduct(fullConfig)
    
    return NextResponse.json({
      success: true,
      data: homePageProduct
    })
  } catch (error) {
    console.error('Failed to get home page product:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch product data',
      data: null
    }, { status: 500 })
  }
}