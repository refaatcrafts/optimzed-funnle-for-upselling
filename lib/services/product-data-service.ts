import { Product } from '@/lib/types'
import { 
  TaagerVariantGroup, 
  TaagerProductVariant, 
  ProductConfiguration,
  ValidationResult 
} from '@/lib/types/admin'
import { TaagerApiClient, taagerApiClient } from './taager-api-client'
import { ConfigurationManager } from './config-manager'

export class ProductDataService {
  private apiClient: TaagerApiClient
  private cache = new Map<string, { data: Product; timestamp: number }>()
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutes

  constructor(apiClient?: TaagerApiClient) {
    this.apiClient = apiClient || taagerApiClient
  }

  // Primary methods for fetching configured products
  async getHomePageProduct(): Promise<Product | null> {
    try {
      const config = await ConfigurationManager.getConfig()
      const sku = config.productConfiguration.homePagePrimary
      
      if (!sku) {
        console.debug('No home page primary product configured')
        return null
      }

      return await this.getProductBySku(sku)
    } catch (error) {
      console.error('Failed to get home page product:', error)
      return null
    }
  }

  async getRecommendations(): Promise<Product[]> {
    try {
      const config = await ConfigurationManager.getConfig()
      const skus = config.productConfiguration.recommendations
      
      if (skus.length === 0) {
        console.debug('No recommendation products configured')
        return []
      }

      return await this.getProductsBySkus(skus)
    } catch (error) {
      console.error('Failed to get recommendation products:', error)
      return []
    }
  }

  async getFrequentlyBoughtTogether(productId?: string): Promise<Product[]> {
    try {
      const config = await ConfigurationManager.getConfig()
      const skus = config.productConfiguration.frequentlyBoughtTogether
      
      if (skus.length === 0) {
        console.debug('No frequently bought together products configured')
        return []
      }

      return await this.getProductsBySkus(skus)
    } catch (error) {
      console.error('Failed to get frequently bought together products:', error)
      return []
    }
  }

  async getUpsellOffers(): Promise<Product[]> {
    try {
      const config = await ConfigurationManager.getConfig()
      const skus = config.productConfiguration.upsellOffers
      
      if (skus.length === 0) {
        console.debug('No upsell offer products configured')
        return []
      }

      return await this.getProductsBySkus(skus)
    } catch (error) {
      console.error('Failed to get upsell offer products:', error)
      return []
    }
  }

  async getCrossSellRecommendations(): Promise<Product[]> {
    try {
      const config = await ConfigurationManager.getConfig()
      const skus = config.productConfiguration.crossSellRecommendations
      
      if (skus.length === 0) {
        console.debug('No cross-sell recommendation products configured')
        return []
      }

      return await this.getProductsBySkus(skus)
    } catch (error) {
      console.error('Failed to get cross-sell recommendation products:', error)
      return []
    }
  }

  // Core product fetching methods
  async getProductBySku(sku: string): Promise<Product | null> {
    try {
      // Check cache first
      const cached = this.getFromCache(sku)
      if (cached) {
        return cached
      }

      // Fetch from API
      const variantGroup = await this.apiClient.getVariantGroup(sku)
      if (!variantGroup) {
        console.warn(`Product not found for SKU: ${sku}`)
        return null
      }

      const product = this.mapTaagerProductToProduct(variantGroup.primaryVariant)
      
      // Cache the result
      this.setCache(sku, product)
      
      return product
    } catch (error) {
      console.error(`Failed to fetch product for SKU ${sku}:`, error)
      return null
    }
  }

  async getProductsBySkus(skus: string[]): Promise<Product[]> {
    if (skus.length === 0) {
      return []
    }

    try {
      // Check cache for all SKUs first
      const results: Product[] = []
      const uncachedSkus: string[] = []

      for (const sku of skus) {
        const cached = this.getFromCache(sku)
        if (cached) {
          results.push(cached)
        } else {
          uncachedSkus.push(sku)
        }
      }

      // Fetch uncached products
      if (uncachedSkus.length > 0) {
        const variantGroups = await this.apiClient.getMultipleVariantGroups(uncachedSkus)
        
        for (const variantGroup of variantGroups) {
          const product = this.mapTaagerProductToProduct(variantGroup.primaryVariant)
          results.push(product)
          
          // Cache the result
          this.setCache(variantGroup.primaryVariant.id, product)
        }
      }

      return results
    } catch (error) {
      console.error('Failed to fetch products for SKUs:', skus, error)
      return []
    }
  }

  // Data transformation method
  private mapTaagerProductToProduct(variant: TaagerProductVariant): Product {
    // Extract additional images
    const additionalImages = [
      variant.extraImage1,
      variant.extraImage2,
      variant.extraImage3,
      variant.extraImage4,
      variant.extraImage5,
      variant.extraImage6
    ].filter(Boolean) as string[]

    // Parse specifications if available
    let specifications: Record<string, string> = {}
    if (variant.specifications) {
      try {
        // Try to parse as JSON first
        specifications = JSON.parse(variant.specifications)
      } catch {
        // If not JSON, treat as plain text
        specifications = { 'Specifications': variant.specifications }
      }
    }

    // Extract features from description or howToUse
    const features: string[] = []
    if (variant.howToUse) {
      // Split by common delimiters and clean up
      const howToUseFeatures = variant.howToUse
        .split(/[•\n\r-]/)
        .map(f => f.trim())
        .filter(f => f.length > 0 && f.length < 100)
      features.push(...howToUseFeatures)
    }

    return {
      id: variant.id,
      name: variant.productName,
      price: variant.productPrice,
      originalPrice: variant.productPrice + variant.productProfit, // Calculate original price
      image: variant.productPicture,
      rating: Math.min(5, Math.max(1, 4 + (variant.orderCount / 1000))), // Estimate rating based on order count
      reviews: variant.orderCount,
      description: variant.description?.en || variant.productDescription || '',
      features: features.length > 0 ? features : undefined,
      specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
      createdAt: variant.createdAt ? new Date(variant.createdAt) : undefined,
      updatedAt: variant.updatedAt ? new Date(variant.updatedAt) : undefined
    }
  }

  // Cache management methods
  private getFromCache(sku: string): Product | null {
    const cached = this.cache.get(sku)
    if (!cached) {
      return null
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(sku)
      return null
    }

    return cached.data
  }

  private setCache(sku: string, product: Product): void {
    this.cache.set(sku, {
      data: product,
      timestamp: Date.now()
    })
  }

  clearCache(): void {
    this.cache.clear()
    console.debug('Product data cache cleared')
  }

  async refreshCache(): Promise<void> {
    try {
      const config = await ConfigurationManager.getConfig()
      const allSkus = [
        config.productConfiguration.homePagePrimary,
        ...config.productConfiguration.recommendations,
        ...config.productConfiguration.frequentlyBoughtTogether,
        ...config.productConfiguration.upsellOffers,
        ...config.productConfiguration.crossSellRecommendations
      ].filter(Boolean) as string[]

      // Clear existing cache
      this.clearCache()

      // Pre-fetch all configured products
      if (allSkus.length > 0) {
        await this.getProductsBySkus(allSkus)
        console.debug(`Pre-fetched ${allSkus.length} products into cache`)
      }
    } catch (error) {
      console.error('Failed to refresh product cache:', error)
    }
  }

  // Validation methods
  async validateSku(sku: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      sku,
      isValid: false,
      lastChecked: new Date().toISOString()
    }

    try {
      const variantGroup = await this.apiClient.getVariantGroup(sku, false) // Don't use cache for validation
      
      if (variantGroup) {
        result.isValid = true
        result.productName = variantGroup.primaryVariant.productName
      } else {
        result.error = 'Product not found'
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error'
    }

    return result
  }

  async validateAllConfiguredSkus(): Promise<ValidationResult[]> {
    try {
      const config = await ConfigurationManager.getConfig()
      const allSkus = [
        config.productConfiguration.homePagePrimary,
        ...config.productConfiguration.recommendations,
        ...config.productConfiguration.frequentlyBoughtTogether,
        ...config.productConfiguration.upsellOffers,
        ...config.productConfiguration.crossSellRecommendations
      ].filter(Boolean) as string[]

      const results: ValidationResult[] = []
      
      // Validate each SKU
      for (const sku of allSkus) {
        const result = await this.validateSku(sku)
        results.push(result)
      }

      return results
    } catch (error) {
      console.error('Failed to validate configured SKUs:', error)
      return []
    }
  }

  // Utility methods
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      return await this.apiClient.checkHealth()
    } catch (error) {
      console.error('Product data service health check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const productDataService = new ProductDataService()