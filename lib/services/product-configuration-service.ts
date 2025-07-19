import { 
  ProductConfiguration, 
  TaagerApiConfig, 
  ValidationResult, 
  ConfigurationValidationResult 
} from '@/lib/types/admin'
import { Product } from '@/lib/types'
import { ConfigurationManager } from './config-manager'
import { ProductDataService, productDataService } from './product-data-service'
import { TaagerApiClient, taagerApiClient } from './taager-api-client'
import { validateSku, PRODUCT_CONFIG_LIMITS } from '@/lib/constants/admin'

interface ProductPreview {
  section: string
  sku: string
  product: Product | null
  error?: string
}

export class ProductConfigurationService {
  private productDataService: ProductDataService
  private apiClient: TaagerApiClient

  constructor(
    productDataService?: ProductDataService,
    apiClient?: TaagerApiClient
  ) {
    this.productDataService = productDataService || productDataService
    this.apiClient = apiClient || taagerApiClient
  }

  // Configuration management
  async getProductConfiguration(): Promise<ProductConfiguration> {
    try {
      const config = await ConfigurationManager.getConfig()
      return config.productConfiguration
    } catch (error) {
      console.error('Failed to get product configuration:', error)
      // Return default configuration
      return {
        homePagePrimary: null,
        recommendations: [],
        frequentlyBoughtTogether: [],
        upsellOffers: [],
        crossSellRecommendations: []
      }
    }
  }

  async updateProductConfiguration(config: Partial<ProductConfiguration>): Promise<boolean> {
    try {
      // Validate the configuration before updating
      const validationResult = await this.validatePartialConfiguration(config)
      if (!validationResult.isValid) {
        console.error('Invalid product configuration:', validationResult)
        return false
      }

      return await ConfigurationManager.updateProductConfiguration(config)
    } catch (error) {
      console.error('Failed to update product configuration:', error)
      return false
    }
  }

  // SKU management methods
  async setHomePagePrimary(sku: string | null): Promise<boolean> {
    if (sku && !validateSku(sku)) {
      console.error('Invalid SKU format:', sku)
      return false
    }

    if (sku) {
      // Validate SKU exists in API
      const validation = await this.productDataService.validateSku(sku)
      if (!validation.isValid) {
        console.error('SKU validation failed:', validation.error)
        return false
      }
    }

    return await ConfigurationManager.setHomePagePrimary(sku)
  }

  async addRecommendation(sku: string): Promise<boolean> {
    if (!validateSku(sku)) {
      console.error('Invalid SKU format:', sku)
      return false
    }

    // Check current count
    const config = await this.getProductConfiguration()
    if (config.recommendations.length >= PRODUCT_CONFIG_LIMITS.MAX_RECOMMENDATIONS) {
      console.error(`Maximum recommendations limit reached (${PRODUCT_CONFIG_LIMITS.MAX_RECOMMENDATIONS})`)
      return false
    }

    // Validate SKU exists in API
    const validation = await this.productDataService.validateSku(sku)
    if (!validation.isValid) {
      console.error('SKU validation failed:', validation.error)
      return false
    }

    return await ConfigurationManager.addRecommendation(sku)
  }

  async removeRecommendation(sku: string): Promise<boolean> {
    return await ConfigurationManager.removeRecommendation(sku)
  }

  async addFrequentlyBoughtTogether(sku: string): Promise<boolean> {
    if (!validateSku(sku)) {
      console.error('Invalid SKU format:', sku)
      return false
    }

    // Check current count
    const config = await this.getProductConfiguration()
    if (config.frequentlyBoughtTogether.length >= PRODUCT_CONFIG_LIMITS.MAX_FREQUENTLY_BOUGHT_TOGETHER) {
      console.error(`Maximum frequently bought together limit reached (${PRODUCT_CONFIG_LIMITS.MAX_FREQUENTLY_BOUGHT_TOGETHER})`)
      return false
    }

    // Validate SKU exists in API
    const validation = await this.productDataService.validateSku(sku)
    if (!validation.isValid) {
      console.error('SKU validation failed:', validation.error)
      return false
    }

    return await ConfigurationManager.addFrequentlyBoughtTogether(sku)
  }

  async removeFrequentlyBoughtTogether(sku: string): Promise<boolean> {
    return await ConfigurationManager.removeFrequentlyBoughtTogether(sku)
  }

  async addUpsellOffer(sku: string): Promise<boolean> {
    if (!validateSku(sku)) {
      console.error('Invalid SKU format:', sku)
      return false
    }

    // Check current count
    const config = await this.getProductConfiguration()
    if (config.upsellOffers.length >= PRODUCT_CONFIG_LIMITS.MAX_UPSELL_OFFERS) {
      console.error(`Maximum upsell offers limit reached (${PRODUCT_CONFIG_LIMITS.MAX_UPSELL_OFFERS})`)
      return false
    }

    // Validate SKU exists in API
    const validation = await this.productDataService.validateSku(sku)
    if (!validation.isValid) {
      console.error('SKU validation failed:', validation.error)
      return false
    }

    return await ConfigurationManager.addUpsellOffer(sku)
  }

  async removeUpsellOffer(sku: string): Promise<boolean> {
    return await ConfigurationManager.removeUpsellOffer(sku)
  }

  async addCrossSellRecommendation(sku: string): Promise<boolean> {
    if (!validateSku(sku)) {
      console.error('Invalid SKU format:', sku)
      return false
    }

    // Check current count
    const config = await this.getProductConfiguration()
    if (config.crossSellRecommendations.length >= PRODUCT_CONFIG_LIMITS.MAX_CROSS_SELL_RECOMMENDATIONS) {
      console.error(`Maximum cross-sell recommendations limit reached (${PRODUCT_CONFIG_LIMITS.MAX_CROSS_SELL_RECOMMENDATIONS})`)
      return false
    }

    // Validate SKU exists in API
    const validation = await this.productDataService.validateSku(sku)
    if (!validation.isValid) {
      console.error('SKU validation failed:', validation.error)
      return false
    }

    return await ConfigurationManager.addCrossSellRecommendation(sku)
  }

  async removeCrossSellRecommendation(sku: string): Promise<boolean> {
    return await ConfigurationManager.removeCrossSellRecommendation(sku)
  }

  // Validation methods
  async validateConfiguration(): Promise<ConfigurationValidationResult> {
    try {
      const config = await this.getProductConfiguration()
      const allSkus = [
        config.homePagePrimary,
        ...config.recommendations,
        ...config.frequentlyBoughtTogether,
        ...config.upsellOffers,
        ...config.crossSellRecommendations
      ].filter(Boolean) as string[]

      const results: ValidationResult[] = []
      
      // Validate each SKU
      for (const sku of allSkus) {
        const result = await this.productDataService.validateSku(sku)
        results.push(result)
      }

      const summary = {
        total: results.length,
        valid: results.filter(r => r.isValid).length,
        invalid: results.filter(r => !r.isValid).length,
        unchecked: 0
      }

      return {
        isValid: summary.invalid === 0,
        results,
        summary
      }
    } catch (error) {
      console.error('Failed to validate configuration:', error)
      return {
        isValid: false,
        results: [],
        summary: { total: 0, valid: 0, invalid: 0, unchecked: 0 }
      }
    }
  }

  async previewConfiguration(): Promise<ProductPreview[]> {
    try {
      const config = await this.getProductConfiguration()
      const previews: ProductPreview[] = []

      // Home page primary
      if (config.homePagePrimary) {
        try {
          const product = await this.productDataService.getProductBySku(config.homePagePrimary)
          previews.push({
            section: 'Home Page Primary',
            sku: config.homePagePrimary,
            product
          })
        } catch (error) {
          previews.push({
            section: 'Home Page Primary',
            sku: config.homePagePrimary,
            product: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      // Recommendations
      for (const sku of config.recommendations) {
        try {
          const product = await this.productDataService.getProductBySku(sku)
          previews.push({
            section: 'Recommendations',
            sku,
            product
          })
        } catch (error) {
          previews.push({
            section: 'Recommendations',
            sku,
            product: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      // Frequently bought together
      for (const sku of config.frequentlyBoughtTogether) {
        try {
          const product = await this.productDataService.getProductBySku(sku)
          previews.push({
            section: 'Frequently Bought Together',
            sku,
            product
          })
        } catch (error) {
          previews.push({
            section: 'Frequently Bought Together',
            sku,
            product: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      // Upsell offers
      for (const sku of config.upsellOffers) {
        try {
          const product = await this.productDataService.getProductBySku(sku)
          previews.push({
            section: 'Upsell Offers',
            sku,
            product
          })
        } catch (error) {
          previews.push({
            section: 'Upsell Offers',
            sku,
            product: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      // Cross-sell recommendations
      for (const sku of config.crossSellRecommendations) {
        try {
          const product = await this.productDataService.getProductBySku(sku)
          previews.push({
            section: 'Cross-sell Recommendations',
            sku,
            product
          })
        } catch (error) {
          previews.push({
            section: 'Cross-sell Recommendations',
            sku,
            product: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return previews
    } catch (error) {
      console.error('Failed to generate configuration preview:', error)
      return []
    }
  }

  // API credentials management
  async setApiCredentials(credentials: Partial<TaagerApiConfig>): Promise<boolean> {
    try {
      // Update the configuration
      const success = await ConfigurationManager.updateTaagerApiConfig(credentials)
      
      if (success && credentials.apiKey && credentials.taagerId) {
        // Configure the API client
        const config = await ConfigurationManager.getConfig()
        this.apiClient.configure(config.taagerApi)
        
        // Test the credentials
        const isValid = await this.validateApiCredentials()
        if (isValid) {
          // Mark as configured and update last validated timestamp
          await ConfigurationManager.updateTaagerApiConfig({
            isConfigured: true,
            lastValidated: new Date().toISOString()
          })
        }
        
        return isValid
      }
      
      return success
    } catch (error) {
      console.error('Failed to set API credentials:', error)
      return false
    }
  }

  async validateApiCredentials(): Promise<boolean> {
    try {
      const config = await ConfigurationManager.getConfig()
      
      if (!config.taagerApi.apiKey || !config.taagerApi.taagerId) {
        return false
      }

      // Configure the API client with current credentials
      this.apiClient.configure(config.taagerApi)
      
      // Test the credentials
      const isValid = await this.apiClient.validateCredentials()
      
      if (isValid) {
        // Update last validated timestamp
        await ConfigurationManager.updateTaagerApiConfig({
          lastValidated: new Date().toISOString()
        })
      }
      
      return isValid
    } catch (error) {
      console.error('Failed to validate API credentials:', error)
      return false
    }
  }

  // Helper methods
  private async validatePartialConfiguration(config: Partial<ProductConfiguration>): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []

    // Validate array lengths
    if (config.recommendations && config.recommendations.length > PRODUCT_CONFIG_LIMITS.MAX_RECOMMENDATIONS) {
      errors.push(`Too many recommendations (max: ${PRODUCT_CONFIG_LIMITS.MAX_RECOMMENDATIONS})`)
    }

    if (config.frequentlyBoughtTogether && config.frequentlyBoughtTogether.length > PRODUCT_CONFIG_LIMITS.MAX_FREQUENTLY_BOUGHT_TOGETHER) {
      errors.push(`Too many frequently bought together items (max: ${PRODUCT_CONFIG_LIMITS.MAX_FREQUENTLY_BOUGHT_TOGETHER})`)
    }

    if (config.upsellOffers && config.upsellOffers.length > PRODUCT_CONFIG_LIMITS.MAX_UPSELL_OFFERS) {
      errors.push(`Too many upsell offers (max: ${PRODUCT_CONFIG_LIMITS.MAX_UPSELL_OFFERS})`)
    }

    if (config.crossSellRecommendations && config.crossSellRecommendations.length > PRODUCT_CONFIG_LIMITS.MAX_CROSS_SELL_RECOMMENDATIONS) {
      errors.push(`Too many cross-sell recommendations (max: ${PRODUCT_CONFIG_LIMITS.MAX_CROSS_SELL_RECOMMENDATIONS})`)
    }

    // Validate SKU formats
    const allSkus = [
      config.homePagePrimary,
      ...(config.recommendations || []),
      ...(config.frequentlyBoughtTogether || []),
      ...(config.upsellOffers || []),
      ...(config.crossSellRecommendations || [])
    ].filter(Boolean) as string[]

    for (const sku of allSkus) {
      if (!validateSku(sku)) {
        errors.push(`Invalid SKU format: ${sku}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Utility methods
  async getConfigurationStats(): Promise<{
    totalSkus: number
    sections: Record<string, number>
    apiConfigured: boolean
    lastValidated: string | null
  }> {
    try {
      const config = await ConfigurationManager.getConfig()
      
      return {
        totalSkus: [
          config.productConfiguration.homePagePrimary,
          ...config.productConfiguration.recommendations,
          ...config.productConfiguration.frequentlyBoughtTogether,
          ...config.productConfiguration.upsellOffers,
          ...config.productConfiguration.crossSellRecommendations
        ].filter(Boolean).length,
        sections: {
          homePagePrimary: config.productConfiguration.homePagePrimary ? 1 : 0,
          recommendations: config.productConfiguration.recommendations.length,
          frequentlyBoughtTogether: config.productConfiguration.frequentlyBoughtTogether.length,
          upsellOffers: config.productConfiguration.upsellOffers.length,
          crossSellRecommendations: config.productConfiguration.crossSellRecommendations.length
        },
        apiConfigured: config.taagerApi.isConfigured,
        lastValidated: config.taagerApi.lastValidated
      }
    } catch (error) {
      console.error('Failed to get configuration stats:', error)
      return {
        totalSkus: 0,
        sections: {
          homePagePrimary: 0,
          recommendations: 0,
          frequentlyBoughtTogether: 0,
          upsellOffers: 0,
          crossSellRecommendations: 0
        },
        apiConfigured: false,
        lastValidated: null
      }
    }
  }
}

// Export singleton instance
export const productConfigurationService = new ProductConfigurationService()