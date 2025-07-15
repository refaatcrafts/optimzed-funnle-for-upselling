import { memo, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StarRating } from '@/components/common/StarRating'
import { PriceDisplay } from '@/components/common/PriceDisplay'
import { Product } from '@/lib/types'
import { PRODUCT_CONFIG } from '@/lib/constants/products'
import { formatNumber } from '@/lib/utils/format'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  className?: string
}

export const ProductCard = memo(function ProductCard({ product, onAddToCart, className }: ProductCardProps) {
  const handleAddToCart = useCallback(() => {
    onAddToCart?.(product)
  }, [onAddToCart, product])

  return (
    <Card className={`group hover:shadow-lg transition-shadow ${className}`}>
      <CardContent className="p-6">
        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
          <Image
            src={product.image || PRODUCT_CONFIG.defaultImage}
            alt={product.name}
            width={240}
            height={240}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-1 mb-3">
          <StarRating rating={product.rating} size="sm" showValue />
          <span className="text-sm text-gray-600 ml-1">
            ({formatNumber(product.reviews)})
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <PriceDisplay 
            price={product.price} 
            originalPrice={product.originalPrice}
            size="sm"
            showSavings={false}
          />
          
          {onAddToCart && (
            <Button
              onClick={handleAddToCart}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
            >
              Add to Cart
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
})