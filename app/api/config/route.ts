import { NextResponse } from 'next/server'
import { ServerConfigService } from '@/lib/services/server-config-service'

const configService = new ServerConfigService()

// Public endpoint - no authentication required
export async function GET() {
  try {
    const config = await configService.getConfig()
    
    // Only return the upselling configuration (don't expose sensitive data)
    return NextResponse.json({
      success: true,
      data: {
        upselling: config.upselling
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('GET /api/config error:', error)
    
    // Return default config if there's an error (with all features enabled)
    const defaultConfig = {
      upselling: {
        frequentlyBoughtTogether: true,
        youMightAlsoLike: true,
        freeShippingProgressBar: true,
        postCartUpsellOffers: true,
        crossSellRecommendations: true
      }
    }
    
    return NextResponse.json({
      success: true,
      data: defaultConfig,
      timestamp: new Date().toISOString()
    })
  }
}