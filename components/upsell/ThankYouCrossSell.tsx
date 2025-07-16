import { useState } from 'react'
import Image from 'next/image'
import { CheckCircle, Star, ShoppingCart, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PurchaseData, CrossSellGroup } from '@/lib/types/upsell'
import { Product } from '@/lib/types'
import { formatPrice, formatNumber } from '@/lib/utils/format'
import { PRODUCT_CONFIG } from '@/lib/constants/products'

interface ThankYouCrossSellProps {
  purchaseData: PurchaseData
  crossSellGroups: CrossSellGroup[]
  onAddCrossSell: (product: Product) => void
}

export function ThankYouCrossSell({ 
  purchaseData, 
  crossSellGroups, 
  onAddCrossSell 
}: ThankYouCrossSellProps) {
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())

  const handleAddProduct = (product: Product) => {
    onAddCrossSell(product)
    setAddedItems(prev => new Set([...prev, product.id]))
    
    // Remove from added items after 2 seconds to allow re-adding
    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(product.id)
        return newSet
      })
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Thank You Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Thank You for Your Purchase!</h1>
          <p className="text-xl text-gray-600 mb-4">
            Your order #{purchaseData.orderId} has been confirmed
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
            <p className="text-green-800 font-medium">
              Order Total: {formatPrice(purchaseData.total)}
            </p>
            <p className="text-green-700 text-sm">
              Confirmation email sent to {purchaseData.customerEmail || 'your email'}
            </p>
          </div>
        </div>
      </div>

      {/* Cross-sell Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gift className="w-8 h-8 text-orange-600" />
            <h2 className="text-3xl font-bold text-gray-900">Before You Go...</h2>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Complete your coffee experience with these popular additions. 
            <span className="text-orange-600 font-semibold"> Limited-time discounts</span> just for you!
          </p>
        </div>

        {/* Cross-sell Groups */}
        <div className="space-y-12">
          {crossSellGroups.map((group) => (
            <div key={group.id} className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{group.title}</h3>
                <p className="text-gray-600">{group.subtitle}</p>
                {group.discount && (
                  <Badge className="mt-2 bg-red-500 text-white text-lg px-4 py-1">
                    {group.discount}% OFF Today Only
                  </Badge>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {group.products.map((product) => {
                  const isAdded = addedItems.has(product.id)
                  const discountedPrice = group.discount 
                    ? product.price * (1 - group.discount / 100)
                    : product.price

                  return (
                    <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-200">
                      <CardContent className="p-6">
                        <div className="relative mb-4">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={product.image || PRODUCT_CONFIG.defaultImage}
                              alt={product.name}
                              width={240}
                              height={240}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          {group.discount && (
                            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                              -{group.discount}%
                            </Badge>
                          )}
                        </div>

                        <h4 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                          {product.name}
                        </h4>

                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-3">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(product.rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            ({formatNumber(product.reviews)})
                          </span>
                        </div>

                        {/* Pricing */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                              {formatPrice(discountedPrice)}
                            </span>
                            {group.discount && (
                              <span className="text-lg text-gray-500 line-through">
                                {formatPrice(product.price)}
                              </span>
                            )}
                          </div>
                          {group.discount && (
                            <p className="text-green-600 font-medium text-sm">
                              Save {formatPrice(product.price - discountedPrice)}
                            </p>
                          )}
                        </div>

                        {/* Add Button */}
                        <Button
                          onClick={() => handleAddProduct(product)}
                          disabled={isAdded}
                          className={`w-full transition-all duration-300 ${
                            isAdded
                              ? 'bg-green-600 hover:bg-green-600'
                              : 'bg-orange-600 hover:bg-orange-700'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Added to Cart!
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Add for {formatPrice(discountedPrice)}
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="text-center mt-16 space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              🎉 Special Thank You Offer
            </h3>
            <p className="text-gray-600 mb-6">
              Use code <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded font-mono font-bold">THANKYOU20</span> 
              for an additional 20% off your next order
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => window.location.href = '/'}
              >
                Continue Shopping
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.location.href = '/account/orders'}
              >
                Track Your Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}