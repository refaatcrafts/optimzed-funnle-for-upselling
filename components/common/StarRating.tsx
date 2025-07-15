import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  showValue = false,
  className 
}: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: maxRating }, (_, i) => (
        <Star
          key={i}
          className={cn(
            sizeClasses[size],
            i < Math.floor(rating) 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-gray-300'
          )}
        />
      ))}
      {showValue && (
        <span className="text-sm text-gray-600 ml-1">
          {rating}
        </span>
      )}
    </div>
  )
}