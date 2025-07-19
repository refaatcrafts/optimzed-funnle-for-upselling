import { NextResponse } from 'next/server'
import { ServerConfigService } from '@/lib/services/server-config-service'
import { TaagerApiClient } from '@/lib/services/taager-api-client'
import { ProductDataService } from '@/lib/services/product-data-service'

const serverConfigService = new ServerConfigService()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    
    // Get configuration from server
    const fullConfig = await serverConfigService.getConfig()
    
    // Check if API configuration exists and is configured
    if (!fullConfig.taagerApi || !fullConfig.taagerApi.isConfigured || !fullConfig.taagerApi.apiKey || !fullConfig.taagerApi.taagerId) {
      return NextResponse.json({
        success: false,
        error: 'API not configured',
        data: []
      })
    }
    
    // Create configured API client
    const taagerApiClient = new TaagerApiClient(fullConfig.taagerApi)
    const productDataService = new ProductDataService(taagerApiClient)
    
    // Get frequently bought together products - pass the full config
    const products = await productDataService.getFrequentlyBoughtTogether(productId || undefined, fullConfig)
    
    return NextResponse.json({
      success: true,
      data: products
    })
  } catch (error) {
    console.error('Failed to get frequently bought together products:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products',
      data: []
    }, { status: 500 })
  }
}