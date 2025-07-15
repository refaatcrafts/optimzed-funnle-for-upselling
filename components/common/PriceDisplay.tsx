import { Badge } from '@/components/ui/badge'
import { formatPrice, calculateSavings } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

interface PriceDisplayProps {
  price: number
  originalPrice?: number
  size?: 'sm' | 'md' | 'lg'
  showSavings?: boolean
  className?: string
}

const sizeClasses = {
  sm: {
    price: 'text-lg font-semibold',
    original: 'text-sm',
    badge: 'text-xs px-2 py-1',
  },
  md: {
    price: 'text-xl font-bold',
    original: 'text-lg',
    badge: 'text-sm px-2 py-1',
  },
  lg: {
    price: 'text-3xl font-bold',
    original: 'text-xl',
    badge: 'text-lg px-3 py-1',
  },
}

export function PriceDisplay({ 
  price, 
  originalPrice, 
  size = 'md', 
  showSavings = true,
  className 
}: PriceDisplayProps) {
  const hasDiscount = originalPrice && originalPrice > price
  const savings = hasDiscount ? calculateSavings(originalPrice, price) : 0

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <span className={cn('text-gray-900', sizeClasses[size].price)}>
        {formatPrice(price)}
      </span>
      
      {hasDiscount && (
        <>
          <span className={cn('text-gray-500 line-through', sizeClasses[size].original)}>
            {formatPrice(originalPrice)}
          </span>
          
          {showSavings && (
            <Badge variant="destructive" className={sizeClasses[size].badge}>
              Save {formatPrice(savings)}
            </Badge>
          )}
        </>
      )}
    </div>
  )
}