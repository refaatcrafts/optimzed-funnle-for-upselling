"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BundleOffer } from '@/components/product/BundleOffer'
import { RecommendedProducts } from '@/components/product/RecommendedProducts'
import { CartSummary } from '@/components/cart/CartSummary'
import { UpsellOfferWrapper } from '@/components/upsell/UpsellOfferWrapper'
import { useFeatureToggleStandalone } from '@/lib/hooks/useAdminConfig'
import { Product, Bundle } from '@/lib/types'
import { UpsellOffer } from '@/lib/types/upsell'

// Mock data for testing
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Ceramic Coffee Mug Set',
    price: 45,
    image: '/images/coffee-cup-1.jpg',
    rating: 4.6,
    reviews: 1543,
    description: 'Premium ceramic mugs'
  },
  {
    id: '2',
    name: 'Espresso Cup Collection',
    price: 35,
    image: '/images/coffee-cup-2.jpg',
    rating: 4.7,
    reviews: 2156,
    description: 'Professional espresso cups'
  },
  {
    id: '3',
    name: 'Travel Coffee Tumbler',
    price: 28,
    image: '/images/coffee-cup-3.jpg',
    rating: 4.5,
    reviews: 987,
    description: 'Insulated travel tumbler'
  }
]

const mockBundle: Bundle = {
  id: 'bundle-1',
  name: 'Coffee Starter Kit',
  products: mockProducts,
  originalTotal: 108,
  bundlePrice: 89,
  savings: 19
}

const mockUpsellOffer: UpsellOffer = {
  id: 'upsell-1',
  title: 'Upgrade Your Coffee Experience',
  subtitle: 'Add premium coffee beans to complete your setup',
  product: {
    id: 'beans-1',
    name: 'Premium Arabica Coffee Beans (2kg)',
    price: 29,
    image: '/images/coffee-beans.jpg',
    rating: 4.8,
    reviews: 2341,
    description: 'Premium single-origin Arabica beans'
  },
  originalPrice: 45,
  upsellPrice: 29,
  savings: 16,
  features: [
    'Premium single-origin Arabica beans',
    'Freshly roasted within 48 hours',
    'Perfect for your new mocha pot',
    '2kg bag (double the standard size)',
    'Free shipping included'
  ],
  isLimitedTime: true,
  timeLeft: 15
}

export function FeatureTestPanel() {
  const [showUpsell, setShowUpsell] = useState(false)
  
  const frequentlyBoughtTogether = useFeatureToggleStandalone('frequentlyBoughtTogether')
  const youMightAlsoLike = useFeatureToggleStandalone('youMightAlsoLike')
  const freeShippingProgressBar = useFeatureToggleStandalone('freeShippingProgressBar')
  const postCartUpsellOffers = useFeatureToggleStandalone('postCartUpsellOffers')
  const crossSellRecommendations = useFeatureToggleStandalone('crossSellRecommendations')

  const handleAddBundle = () => {
    console.log('Bundle added to cart')
  }

  const handleAddToCart = (product: Product) => {
    console.log('Product added to cart:', product.name)
  }

  const handleUpsellAccept = (offer: UpsellOffer) => {
    console.log('Upsell accepted:', offer.product.name)
    setShowUpsell(false)
  }

  const handleUpsellDecline = () => {
    console.log('Upsell declined')
    setShowUpsell(false)
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Feature Toggle Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded">
              <span className="text-sm">Frequently Bought Together</span>
              <Badge variant={frequentlyBoughtTogether ? "default" : "secondary"}>
                {frequentlyBoughtTogether ? "ON" : "OFF"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span className="text-sm">You Might Also Like</span>
              <Badge variant={youMightAlsoLike ? "default" : "secondary"}>
                {youMightAlsoLike ? "ON" : "OFF"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span className="text-sm">Free Shipping Progress</span>
              <Badge variant={freeShippingProgressBar ? "default" : "secondary"}>
                {freeShippingProgressBar ? "ON" : "OFF"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span className="text-sm">Post-Cart Upsells</span>
              <Badge variant={postCartUpsellOffers ? "default" : "secondary"}>
                {postCartUpsellOffers ? "ON" : "OFF"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span className="text-sm">Cross-sell Recommendations</span>
              <Badge variant={crossSellRecommendations ? "default" : "secondary"}>
                {crossSellRecommendations ? "ON" : "OFF"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Bundle Offer */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Bundle Offer Test</h3>
        <BundleOffer
          bundle={mockBundle}
          onAddBundle={handleAddBundle}
        />
        {!frequentlyBoughtTogether && (
          <p className="text-sm text-gray-500 mt-2">
            ↑ This component is hidden when "Frequently Bought Together" is disabled
          </p>
        )}
      </div>

      {/* Test Recommended Products */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recommended Products Test</h3>
        <RecommendedProducts
          products={mockProducts}
          onAddToCart={handleAddToCart}
          title="You Might Also Like"
          featureId="youMightAlsoLike"
        />
        {!youMightAlsoLike && (
          <p className="text-sm text-gray-500 mt-2">
            ↑ This component is hidden when "You Might Also Like" is disabled
          </p>
        )}
      </div>

      {/* Test Cross-sell Recommendations */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Cross-sell Recommendations Test</h3>
        <RecommendedProducts
          products={mockProducts}
          onAddToCart={handleAddToCart}
          title="Complete Your Coffee Experience"
          featureId="crossSellRecommendations"
        />
        {!crossSellRecommendations && (
          <p className="text-sm text-gray-500 mt-2">
            ↑ This component is hidden when "Cross-sell Recommendations" is disabled
          </p>
        )}
      </div>

      {/* Test Cart Summary */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Cart Summary Test</h3>
        <Card className="max-w-md">
          <CardContent className="p-4">
            <CartSummary
              total={178}
              shippingProgress={59.3}
              qualifiesForFreeShipping={false}
            />
          </CardContent>
        </Card>
        {!freeShippingProgressBar && (
          <p className="text-sm text-gray-500 mt-2">
            ↑ Free shipping progress bar is hidden when disabled
          </p>
        )}
      </div>

      {/* Test Upsell Offer */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Upsell Offer Test</h3>
        <Button onClick={() => setShowUpsell(true)}>
          Show Upsell Offer
        </Button>
        {!postCartUpsellOffers && (
          <p className="text-sm text-gray-500 mt-2">
            ↑ Upsell offers are disabled and will auto-decline
          </p>
        )}
      </div>

      {/* Upsell Modal */}
      {showUpsell && (
        <div className="fixed inset-0 z-50">
          <UpsellOfferWrapper
            offer={mockUpsellOffer}
            onAccept={handleUpsellAccept}
            onDecline={handleUpsellDecline}
          />
        </div>
      )}
    </div>
  )
}