import { memo } from 'react'
import { ProductCard } from './ProductCard'
import { Product } from '@/lib/types'

interface RecommendedProductsProps {
  products: readonly Product[]
  onAddToCart?: (product: Product) => void
  title?: string
  className?: string
}

export const RecommendedProducts = memo(function RecommendedProducts({ 
  products, 
  onAddToCart, 
  title = "Complete Your Coffee Experience",
  className 
}: RecommendedProductsProps) {
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