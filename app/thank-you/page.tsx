"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ThankYouCrossSell } from '@/components/upsell/ThankYouCrossSell'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { CROSS_SELL_GROUPS } from '@/lib/constants/upsell'
import { PurchaseData } from '@/lib/types/upsell'
import { Product } from '@/lib/types'
import { useCart } from '@/lib/hooks/useCart'

function ThankYouContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cart = useCart()
  
  const [purchaseData, setPurchaseData] = useState<PurchaseData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Get purchase data from URL params
  useEffect(() => {
    const orderId = searchParams.get('orderId')
    const total = searchParams.get('total')
    const wasUpsold = searchParams.get('upsell') === 'true'
    
    if (orderId) {
      // In a real app, you'd fetch this from your API
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
    } else {
      // Redirect to home if no order ID
      router.push('/')
    }
    
    setIsLoading(false)
  }, [searchParams, cart.items, cart.total, router])

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
      crossSellGroups={CROSS_SELL_GROUPS}
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