"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UpsellOffer } from '@/components/upsell/UpsellOffer'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { UPSELL_OFFERS } from '@/lib/constants/upsell'
import { UpsellOffer as UpsellOfferType, PurchaseData } from '@/lib/types/upsell'
import { useCart } from '@/lib/hooks/useCart'

function UpsellContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cart = useCart()
  
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [purchaseData, setPurchaseData] = useState<PurchaseData | null>(null)

  // Get purchase data from URL params or localStorage
  useEffect(() => {
    const orderId = searchParams.get('orderId')
    const total = searchParams.get('total')
    
    if (orderId && total) {
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
        total: parseFloat(total),
        customerEmail: searchParams.get('email') || undefined,
        purchaseDate: new Date(),
      })
    } else {
      // Redirect to home if no purchase data
      router.push('/')
    }
  }, [searchParams, cart.items, router])

  const handleAcceptUpsell = async (offer: UpsellOfferType) => {
    setIsLoading(true)
    
    try {
      // Add the upsell product to cart
      cart.addItem(offer.product)
      
      // Simulate API call to process upsell
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Move to next offer or thank you page
      if (currentOfferIndex < UPSELL_OFFERS.length - 1) {
        setCurrentOfferIndex(prev => prev + 1)
      } else {
        // Go to thank you page
        router.push(`/thank-you?orderId=${purchaseData?.orderId}&upsell=true`)
      }
    } catch (error) {
      console.error('Error processing upsell:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeclineUpsell = () => {
    // Move to next offer or thank you page
    if (currentOfferIndex < UPSELL_OFFERS.length - 1) {
      setCurrentOfferIndex(prev => prev + 1)
    } else {
      // Go to thank you page
      router.push(`/thank-you?orderId=${purchaseData?.orderId}`)
    }
  }

  if (!purchaseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your special offer..." />
      </div>
    )
  }

  const currentOffer = UPSELL_OFFERS[currentOfferIndex]

  if (!currentOffer) {
    // No more offers, redirect to thank you
    router.push(`/thank-you?orderId=${purchaseData.orderId}`)
    return null
  }

  return (
    <UpsellOffer
      offer={currentOffer}
      onAccept={handleAcceptUpsell}
      onDecline={handleDeclineUpsell}
      isLoading={isLoading}
    />
  )
}

export default function UpsellPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your special offer..." />
      </div>
    }>
      <UpsellContent />
    </Suspense>
  )
}