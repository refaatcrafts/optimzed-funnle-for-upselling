import { Progress } from '@/components/ui/progress'
import { formatPrice } from '@/lib/utils/format'
import { CART_CONFIG, CART_MESSAGES } from '@/lib/constants/cart'

interface CartSummaryProps {
  total: number
  shippingProgress: number
  qualifiesForFreeShipping: boolean
}

export function CartSummary({ 
  total, 
  shippingProgress, 
  qualifiesForFreeShipping 
}: CartSummaryProps) {
  const remainingForFreeShipping = Math.max(CART_CONFIG.freeShippingThreshold - total, 0)

  return (
    <div className="space-y-4">
      {/* Shipping Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Free shipping progress</span>
          <span className="font-medium">
            {formatPrice(total)} / {formatPrice(CART_CONFIG.freeShippingThreshold)}
          </span>
        </div>
        <Progress value={shippingProgress} className="h-2" />
        {qualifiesForFreeShipping ? (
          <p className="text-sm text-green-600 font-medium">
            {CART_MESSAGES.freeShippingQualified}
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            {CART_MESSAGES.freeShippingProgress(remainingForFreeShipping)}
          </p>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center text-lg font-semibold pt-4 border-t">
        <span>Total:</span>
        <span className="text-orange-600">{formatPrice(total)}</span>
      </div>
    </div>
  )
}