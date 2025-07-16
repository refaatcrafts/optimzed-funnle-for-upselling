import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Clock, Check, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { UpsellOffer as UpsellOfferType } from '@/lib/types/upsell'
import { formatPrice, formatNumber } from '@/lib/utils/format'
import { PRODUCT_CONFIG } from '@/lib/constants/products'

interface UpsellOfferProps {
  offer: UpsellOfferType
  onAccept: (offer: UpsellOfferType) => void
  onDecline: () => void
  isLoading?: boolean
}

export function UpsellOffer({ offer, onAccept, onDecline, isLoading = false }: UpsellOfferProps) {
  const [timeLeft, setTimeLeft] = useState(offer.timeLeft || 15)
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high'>('low')

  useEffect(() => {
    if (!offer.isLimitedTime) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          onDecline() // Auto-decline when time runs out
          return 0
        }
        return prev - 1
      })
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [offer.isLimitedTime, onDecline])

  useEffect(() => {
    if (timeLeft <= 3) setUrgencyLevel('high')
    else if (timeLeft <= 7) setUrgencyLevel('medium')
    else setUrgencyLevel('low')
  }, [timeLeft])

  const discountPercentage = Math.round((offer.savings / offer.originalPrice) * 100)
  const urgencyColor = {
    low: 'text-orange-600',
    medium: 'text-red-500',
    high: 'text-red-700 animate-pulse'
  }[urgencyLevel]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full shadow-2xl border-0">
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Product Image Section */}
            <div className="bg-gradient-to-br from-orange-100 to-amber-100 p-8 flex items-center justify-center">
              <div className="relative">
                <Image
                  src={offer.product.image || PRODUCT_CONFIG.defaultImage}
                  alt={offer.product.name}
                  width={400}
                  height={400}
                  className="rounded-xl shadow-lg"
                />
                <Badge 
                  className="absolute -top-4 -right-4 bg-red-500 text-white text-lg px-4 py-2"
                >
                  {discountPercentage}% OFF
                </Badge>
              </div>
            </div>

            {/* Offer Details Section */}
            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">{offer.title}</h1>
                <p className="text-lg text-gray-600">{offer.subtitle}</p>
              </div>

              {/* Urgency Timer */}
              {offer.isLimitedTime && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className={`w-5 h-5 ${urgencyColor}`} />
                    <span className={`font-semibold ${urgencyColor}`}>
                      {timeLeft} minutes left!
                    </span>
                  </div>
                  <Progress 
                    value={(timeLeft / (offer.timeLeft || 15)) * 100} 
                    className="h-2"
                  />
                </div>
              )}

              {/* Product Info */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">{offer.product.name}</h2>
                
                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(offer.product.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {offer.product.rating} ({formatNumber(offer.product.reviews)} reviews)
                  </span>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">What's included:</h3>
                  <ul className="space-y-1">
                    {offer.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-2xl text-gray-500 line-through">
                      {formatPrice(offer.originalPrice)}
                    </span>
                    <span className="text-4xl font-bold text-green-600">
                      {formatPrice(offer.upsellPrice)}
                    </span>
                  </div>
                  <p className="text-green-700 font-medium">
                    You save {formatPrice(offer.savings)} ({discountPercentage}% off)
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => onAccept(offer)}
                  disabled={isLoading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-4 rounded-lg shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  {isLoading ? 'Processing...' : `Yes, Add This Deal! - ${formatPrice(offer.upsellPrice)}`}
                </Button>
                
                <Button
                  onClick={onDecline}
                  disabled={isLoading}
                  variant="ghost"
                  className="w-full text-gray-600 hover:text-gray-800"
                >
                  No Thanks, Continue to My Order
                </Button>
              </div>

              {/* Trust Signals */}
              <div className="text-center text-sm text-gray-500 space-y-1">
                <p>✓ Free shipping included</p>
                <p>✓ 30-day money-back guarantee</p>
                <p>✓ Same-day processing</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}