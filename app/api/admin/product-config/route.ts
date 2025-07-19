import { NextRequest, NextResponse } from 'next/server'
import { ProductConfiguration } from '@/lib/types/admin'
import { ProductConfigurationService, productConfigurationService } from '@/lib/services/product-configuration-service'
import { ServerConfigService } from '@/lib/services/server-config-service'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/admin-auth'

const configService = productConfigurationService
const serverConfigService = new ServerConfigService()

async function getHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const fullConfig = await serverConfigService.getConfig()
    const config = fullConfig.productConfiguration
    
    // Calculate stats directly from the config
    const stats = {
      totalSkus: [
        config.homePagePrimary,
        ...config.recommendations,
        ...config.frequentlyBoughtTogether,
        ...config.upsellOffers,
        ...config.crossSellRecommendations
      ].filter(Boolean).length,
      sections: {
        homePagePrimary: config.homePagePrimary ? 1 : 0,
        recommendations: config.recommendations.length,
        frequentlyBoughtTogether: config.frequentlyBoughtTogether.length,
        upsellOffers: config.upsellOffers.length,
        crossSellRecommendations: config.crossSellRecommendations.length
      },
      apiConfigured: fullConfig.taagerApi.isConfigured,
      lastValidated: fullConfig.taagerApi.lastValidated
    }
    
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
    
    console.log('PUT /api/admin/product-config - Received config:', JSON.stringify(config, null, 2))
    
    // Validate the configuration structure
    if (!config || typeof config !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Invalid configuration structure',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }
    
    // Get current config and update with new product configuration
    const fullConfig = await serverConfigService.getConfig()
    console.log('Current full config before update:', JSON.stringify(fullConfig.productConfiguration, null, 2))
    
    // Update product configuration
    fullConfig.productConfiguration = {
      ...fullConfig.productConfiguration,
      ...config
    }
    
    console.log('Updated product configuration:', JSON.stringify(fullConfig.productConfiguration, null, 2))
    
    // Save the updated configuration
    const success = await serverConfigService.saveConfig(fullConfig)
    console.log('Save success:', success)
    
    if (success) {
      // Return the updated configuration
      const updatedFullConfig = await serverConfigService.getConfig()
      const updatedConfig = updatedFullConfig.productConfiguration
      
      // Calculate stats directly from the config
      const stats = {
        totalSkus: [
          updatedConfig.homePagePrimary,
          ...updatedConfig.recommendations,
          ...updatedConfig.frequentlyBoughtTogether,
          ...updatedConfig.upsellOffers,
          ...updatedConfig.crossSellRecommendations
        ].filter(Boolean).length,
        sections: {
          homePagePrimary: updatedConfig.homePagePrimary ? 1 : 0,
          recommendations: updatedConfig.recommendations.length,
          frequentlyBoughtTogether: updatedConfig.frequentlyBoughtTogether.length,
          upsellOffers: updatedConfig.upsellOffers.length,
          crossSellRecommendations: updatedConfig.crossSellRecommendations.length
        },
        apiConfigured: updatedFullConfig.taagerApi.isConfigured,
        lastValidated: updatedFullConfig.taagerApi.lastValidated
      }
      
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