"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ThankYouCrossSell } from '@/components/upsell/ThankYouCrossSell'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { CROSS_SELL_GROUPS } from '@/lib/constants/upsell'
import { PurchaseData, CrossSellGroup } from '@/lib/types/upsell'
import { Product } from '@/lib/types'
import { useCart } from '@/lib/hooks/useCart'
import { productDataService } from '@/lib/services/product-data-service'
import { useFeatureToggleStandalone } from '@/lib/hooks/useAdminConfig'

function ThankYouContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cart = useCart()
  const isUpsellEnabled = useFeatureToggleStandalone('postCartUpsellOffers')
  
  const [purchaseData, setPurchaseData] = useState<PurchaseData | null>(null)
  const [crossSellGroups, setCrossSellGroups] = useState<CrossSellGroup[]>(CROSS_SELL_GROUPS)
  const [isLoading, setIsLoading] = useState(true)

  // Get purchase data from URL params and load dynamic upsell data
  useEffect(() => {
    async function loadData() {
      const orderId = searchParams.get('orderId')
      const total = searchParams.get('total')
      const wasUpsold = searchParams.get('upsell') === 'true'
      
      if (orderId) {
        // Set purchase data
        setPurchaseData({
          orderId,
          items: cart.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            originalPrice: item.originalPrice,
            image: item.image,
            rating: item.rating,
            reviews: item.reviews,
          })),
          total: total ? parseFloat(total) : cart.total,
          customerEmail: searchParams.get('email') || 'customer@example.com',
          purchaseDate: new Date(),
        })

        // Load dynamic upsell offers if enabled
        if (isUpsellEnabled) {
          try {
            const response = await fetch('/api/products/upsell-offers')
            const result = await response.json()
            
            if (result.success && result.data && result.data.length > 0) {
              const upsellProducts = result.data
              
              // Create dynamic cross-sell group from configured upsell products
              const dynamicCrossSellGroup: CrossSellGroup = {
                id: 'dynamic-upsell',
                title: 'Complete Your Order',
                subtitle: 'Customers who bought similar items also purchased these',
                discount: 15, // 15% discount for upsell offers
                products: upsellProducts
              }
              
              // Use dynamic data instead of static
              setCrossSellGroups([dynamicCrossSellGroup])
            } else {
              console.warn('No upsell offers configured:', result.error)
              // Use static data as fallback
              setCrossSellGroups(CROSS_SELL_GROUPS)
            }
          } catch (error) {
            console.error('Failed to load upsell offers:', error)
            // Fallback to static data on error
            setCrossSellGroups(CROSS_SELL_GROUPS)
          }
        }
      } else {
        // Redirect to home if no order ID
        router.push('/')
      }
      
      setIsLoading(false)
    }

    loadData()
  }, [searchParams, cart.items, cart.total, router, isUpsellEnabled])

  const handleAddCrossSell = (product: Product) => {
    cart.addItem(product)
    
    // Optional: Track cross-sell conversion
    console.log('Cross-sell added:', product.name)
    
    // You could also show a mini confirmation or update the UI
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Preparing your confirmation..." />
      </div>
    )
  }

  if (!purchaseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Order not found</p>
        </div>
      </div>
    )
  }

  return (
    <ThankYouCrossSell
      purchaseData={purchaseData}
      crossSellGroups={crossSellGroups}
      onAddCrossSell={handleAddCrossSell}
    />
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Preparing your confirmation..." />
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  )
}