"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Bundle, Product } from '@/lib/types'
import { formatPrice, calculateDiscountPercentage } from '@/lib/utils/format'
import { PRODUCT_CONFIG } from '@/lib/constants/products'
import { useFeatureToggleStandalone } from '@/lib/hooks/useAdminConfig'
import { productDataService } from '@/lib/services/product-data-service'
import { Skeleton } from '@/components/ui/skeleton'

interface BundleOfferProps {
  bundle?: Bundle // Make optional to allow dynamic loading
  onAddBundle: () => void
  className?: string
  useDynamicData?: boolean // New prop to enable dynamic data loading
  productId?: string // Optional product ID for context
}

export function BundleOffer({ 
  bundle: staticBundle, 
  onAddBundle, 
  className,
  useDynamicData = false,
  productId
}: BundleOfferProps) {
  const isEnabled = useFeatureToggleStandalone('frequentlyBoughtTogether')
  const [dynamicBundle, setDynamicBundle] = useState<Bundle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load dynamic bundle if enabled
  useEffect(() => {
    if (!useDynamicData || !isEnabled) return

    async function loadDynamicBundle() {
      try {
        setLoading(true)
        setError(null)
        
        const products = await productDataService.getFrequentlyBoughtTogether(productId)
        
        if (products.length > 0) {
          // Create a bundle from the products
          const originalTotal = products.reduce((sum, p) => sum + (p.originalPrice || p.price), 0)
          const bundlePrice = products.reduce((sum, p) => sum + p.price, 0)
          const savings = originalTotal - bundlePrice
          
          const bundle: Bundle = {
            id: `dynamic-bundle-${Date.now()}`,
            name: 'Frequently Bought Together',
            products,
            originalTotal,
            bundlePrice,
            savings
          }
          
          setDynamicBundle(bundle)
        } else {
          setDynamicBundle(null)
        }
      } catch (err) {
        console.error('Failed to load frequently bought together products:', err)
        setError('Failed to load bundle')
      } finally {
        setLoading(false)
      }
    }

    loadDynamicBundle()
  }, [useDynamicData, isEnabled, productId])

  // Don't render if feature is disabled
  if (!isEnabled) {
    return null
  }

  // Determine which bundle to use
  const bundle = useDynamicData ? dynamicBundle : staticBundle

  // Show loading state for dynamic data
  if (useDynamicData && loading) {
    return (
      <Card className={`p-6 bg-orange-50 border border-orange-200 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <ShoppingCart className="w-5 h-5 text-orange-600" />
          <h2 className="text-xl font-bold text-gray-900">Frequently Bought Together</h2>
        </div>
        <p className="text-gray-600 mb-6">Customers who bought this item also bought</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="aspect-square rounded-lg mb-4" />
              <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
              <Skeleton className="h-6 w-1/2 mx-auto" />
            </div>
          ))}
        </div>
        
        <Skeleton className="h-12 w-full" />
      </Card>
    )
  }

  // Show error state for dynamic data (fallback to empty)
  if (useDynamicData && error) {
    console.warn('BundleOffer error:', error)
    return null // Gracefully hide the section on error
  }

  // Don't render if no bundle
  if (!bundle) return null

  const discountPercentage = calculateDiscountPercentage(bundle.originalTotal, bundle.bundlePrice)

  return (
    <Card className={`p-6 bg-orange-50 border border-orange-200 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <ShoppingCart className="w-5 h-5 text-orange-600" />
        <h2 className="text-xl font-bold text-gray-900">Frequently Bought Together</h2>
      </div>
      <p className="text-gray-600 mb-6">Customers who bought this item also bought</p>

      {/* Bundle Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {bundle.products.map((product, index) => (
          <div key={product.id} className="text-center">
            <div className="aspect-square rounded-lg overflow-hidden bg-white mb-4 border">
              <Image
                src={product.image || PRODUCT_CONFIG.defaultImage}
                alt={product.name}
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
              {product.name}
            </h3>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {formatPrice(product.price)}
            </div>
            {index < bundle.products.length - 1 && (
              <div className="text-gray-400 text-lg">+</div>
            )}
          </div>
        ))}
      </div>

      {/* Bundle Pricing */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-semibold text-gray-900">Bundle Price:</span>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 line-through text-lg">
            {formatPrice(bundle.originalTotal)}
          </span>
          <span className="text-3xl font-bold text-green-600">
            {formatPrice(bundle.bundlePrice)}
          </span>
        </div>
      </div>

      {/* Savings Highlight */}
      <div className="bg-green-100 border border-green-200 rounded-lg p-4 mb-6 text-center">
        <p className="text-green-800 font-medium">
          Save {discountPercentage}% when bought together! You save {formatPrice(bundle.savings)}
        </p>
      </div>

      {/* Add Bundle Button */}
      <Button
        onClick={onAddBundle}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-4 rounded-lg"
        size="lg"
      >
        Add All {bundle.products.length} Items to Cart
      </Button>
    </Card>
  )
}