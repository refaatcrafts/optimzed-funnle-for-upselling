import { NextRequest, NextResponse } from 'next/server'
import { TaagerApiConfig } from '@/lib/types/admin'
import { ProductConfigurationService, productConfigurationService } from '@/lib/services/product-configuration-service'
import { TaagerApiClient } from '@/lib/services/taager-api-client'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/admin-auth'

const configService = productConfigurationService

async function postHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { apiKey, taagerId, baseUrl, country } = body
    
    // Validate required fields
    if (!apiKey || !taagerId) {
      return NextResponse.json({
        success: false,
        error: 'apiKey and taagerId are required for validation',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }
    
    if (typeof taagerId !== 'number') {
      return NextResponse.json({
        success: false,
        error: 'taagerId must be a number',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }
    
    // Create a temporary API client with the provided credentials
    const tempConfig: TaagerApiConfig = {
      apiKey,
      taagerId,
      baseUrl: baseUrl || 'https://public.api.taager.com',
      country: country || 'SAU',
      isConfigured: false,
      lastValidated: null
    }
    
    const tempClient = new TaagerApiClient(tempConfig)
    
    // Test the credentials
    const isValid = await tempClient.validateCredentials()
    
    return NextResponse.json({
      success: true,
      data: {
        isValid,
        testedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('POST /api/admin/taager-credentials/validate error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to validate Taager API credentials',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function getHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    // Validate current stored credentials
    const isValid = await configService.validateApiCredentials()
    
    return NextResponse.json({
      success: true,
      data: {
        isValid,
        testedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('GET /api/admin/taager-credentials/validate error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to validate stored credentials',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Export the protected handlers
export const POST = withAuth(postHandler)
export const GET = withAuth(getHandler)