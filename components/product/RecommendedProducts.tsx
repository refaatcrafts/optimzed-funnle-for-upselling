"use client"

import { memo, useState, useEffect } from 'react'
import { ProductCard } from './ProductCard'
import { Product } from '@/lib/types'
import { useFeatureToggleStandalone } from '@/lib/hooks/useAdminConfig'
import { productDataService } from '@/lib/services/product-data-service'
import { Skeleton } from '@/components/ui/skeleton'

interface RecommendedProductsProps {
  products?: readonly Product[] // Make optional to allow dynamic loading
  onAddToCart?: (product: Product) => void
  title?: string
  className?: string
  featureId?: 'youMightAlsoLike' | 'crossSellRecommendations'
  useDynamicData?: boolean // New prop to enable dynamic data loading
}

export const RecommendedProducts = memo(function RecommendedProducts({ 
  products: staticProducts, 
  onAddToCart, 
  title = "Complete Your Coffee Experience",
  className,
  featureId = 'youMightAlsoLike',
  useDynamicData = false
}: RecommendedProductsProps) {
  const isEnabled = useFeatureToggleStandalone(featureId)
  const [dynamicProducts, setDynamicProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load dynamic products if enabled
  useEffect(() => {
    if (!useDynamicData || !isEnabled) return

    async function loadDynamicProducts() {
      try {
        setLoading(true)
        setError(null)
        
        let products: Product[] = []
        
        if (featureId === 'youMightAlsoLike') {
          products = await productDataService.getRecommendations()
        } else if (featureId === 'crossSellRecommendations') {
          products = await productDataService.getCrossSellRecommendations()
        }
        
        setDynamicProducts(products)
      } catch (err) {
        console.error(`Failed to load ${featureId} products:`, err)
        setError('Failed to load recommendations')
      } finally {
        setLoading(false)
      }
    }

    loadDynamicProducts()
  }, [useDynamicData, isEnabled, featureId])

  // Don't render if feature is disabled
  if (!isEnabled) return null

  // Determine which products to use
  const products = useDynamicData ? dynamicProducts : (staticProducts || [])

  // Show loading state for dynamic data
  if (useDynamicData && loading) {
    return (
      <div className={className}>
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          {title}
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show error state for dynamic data (fallback to empty)
  if (useDynamicData && error) {
    console.warn(`RecommendedProducts error for ${featureId}:`, error)
    return null // Gracefully hide the section on error
  }

  // Don't render if no products
  if (products.length === 0) return null

  return (
    <div className={className}>
      <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
        {title}
      </h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  )
})