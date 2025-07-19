import { NextRequest, NextResponse } from 'next/server'
import { TaagerApiConfig } from '@/lib/types/admin'
import { ProductConfigurationService, productConfigurationService } from '@/lib/services/product-configuration-service'
import { ServerConfigService } from '@/lib/services/server-config-service'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/admin-auth'

const configService = productConfigurationService
const serverConfigService = new ServerConfigService()

async function getHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const config = await serverConfigService.getConfig()
    
    // Check if taagerApi configuration exists
    if (!config.taagerApi) {
      return NextResponse.json({
        success: false,
        error: 'Taager API configuration not found',
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }
    
    // Return credentials without sensitive data
    const safeCredentials = {
      taagerId: config.taagerApi.taagerId,
      baseUrl: config.taagerApi.baseUrl,
      country: config.taagerApi.country,
      isConfigured: config.taagerApi.isConfigured,
      lastValidated: config.taagerApi.lastValidated,
      hasApiKey: !!config.taagerApi.apiKey
    }
    
    return NextResponse.json({
      success: true,
      data: safeCredentials,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('GET /api/admin/taager-credentials error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load Taager API credentials',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function putHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const credentials = body as Partial<TaagerApiConfig>
    
    // Validate required fields
    if (credentials.apiKey && (!credentials.taagerId || typeof credentials.taagerId !== 'number')) {
      return NextResponse.json({
        success: false,
        error: 'taagerId is required when setting API key',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }
    
    if (credentials.taagerId && !credentials.apiKey) {
      return NextResponse.json({
        success: false,
        error: 'apiKey is required when setting taagerId',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }
    
    // Get current config and update with new credentials
    const config = await serverConfigService.getConfig()
    
    // Ensure taagerApi configuration exists
    if (!config.taagerApi) {
      config.taagerApi = {
        apiKey: null,
        taagerId: null,
        baseUrl: "https://public.api.dev.taager.com",
        country: "SAU",
        isConfigured: false,
        lastValidated: null
      }
    }
    
    // Update Taager API configuration
    config.taagerApi = {
      ...config.taagerApi,
      ...credentials,
      isConfigured: !!(credentials.apiKey && credentials.taagerId),
      lastValidated: new Date().toISOString()
    }
    
    // Save the updated configuration
    const success = await serverConfigService.saveConfig(config)
    
    if (success) {
      // Return updated credentials (without sensitive data)
      const safeCredentials = {
        taagerId: config.taagerApi.taagerId,
        baseUrl: config.taagerApi.baseUrl,
        country: config.taagerApi.country,
        isConfigured: config.taagerApi.isConfigured,
        lastValidated: config.taagerApi.lastValidated,
        hasApiKey: !!config.taagerApi.apiKey
      }
      
      return NextResponse.json({
        success: true,
        data: safeCredentials,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to save Taager API credentials',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }
  } catch (error) {
    console.error('PUT /api/admin/taager-credentials error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to save Taager API credentials',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Export the protected handlers
export const GET = withAuth(getHandler)
export const PUT = withAuth(putHandler)