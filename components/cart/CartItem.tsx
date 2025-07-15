import Image from 'next/image'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PriceDisplay } from '@/components/common/PriceDisplay'
import { CartItem as CartItemType } from '@/lib/types'
import { PRODUCT_CONFIG } from '@/lib/constants/products'

interface CartItemProps {
  item: CartItemType
  onRemove: (productId: string) => void
  onUpdateQuantity?: (productId: string, quantity: number) => void
  showQuantity?: boolean
}

export function CartItem({ 
  item, 
  onRemove, 
  onUpdateQuantity, 
  showQuantity = false 
}: CartItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <Image
        src={item.image || PRODUCT_CONFIG.defaultImage}
        alt={item.name}
        width={60}
        height={60}
        className="rounded object-cover flex-shrink-0"
      />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{item.name}</h4>
        <PriceDisplay 
          price={item.price} 
          originalPrice={item.originalPrice}
          size="sm"
          showSavings={false}
        />
        {showQuantity && item.quantity > 1 && (
          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(item.id)}
        className="text-red-600 hover:text-red-700 flex-shrink-0"
        aria-label={`Remove ${item.name} from cart`}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}