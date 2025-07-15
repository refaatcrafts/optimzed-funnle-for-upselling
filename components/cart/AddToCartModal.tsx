import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CartItem } from './CartItem'
import { CartSummary } from './CartSummary'
import { Product, UseCartReturn } from '@/lib/types'
import { formatPrice } from '@/lib/utils/format'
import { PRODUCT_CONFIG } from '@/lib/constants/products'

interface AddToCartModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  cart: UseCartReturn
  crossSellProducts?: Product[]
  onAddCrossSell?: (product: Product) => void
  onViewCart?: () => void
}

export function AddToCartModal({ 
  isOpen, 
  onOpenChange, 
  cart,
  crossSellProducts = [],
  onAddCrossSell,
  onViewCart
}: AddToCartModalProps) {
  const { items, removeItem, total, shippingProgress, qualifiesForFreeShipping } = cart

  const handleViewCart = () => {
    onOpenChange(false)
    onViewCart?.()
  }

  const handleAddCrossSell = (product: Product) => {
    if (onAddCrossSell) {
      onAddCrossSell(product)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby="cart-modal-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-600">
            Added to Cart!
          </DialogTitle>
          <DialogDescription id="cart-modal-description">
            Your item has been successfully added to your shopping cart. Review your items below or continue shopping.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <CartSummary
            total={total}
            shippingProgress={shippingProgress}
            qualifiesForFreeShipping={qualifiesForFreeShipping}
          />

          {/* Cart Items */}
          <div className="space-y-3">
            <h4 className="font-medium">Items in your cart:</h4>
            {items.map((item) => (
              <CartItem
                key={`${item.id}-${item.addedAt.getTime()}`}
                item={item}
                onRemove={removeItem}
                showQuantity={true}
              />
            ))}
          </div>

          {/* Cross-sell Products */}
          {crossSellProducts.length > 0 && onAddCrossSell && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">You might also like:</h4>
              <div className="space-y-2">
                {crossSellProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 p-2 border rounded">
                    <Image
                      src={product.image || PRODUCT_CONFIG.defaultImage}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-sm text-gray-600">{formatPrice(product.price)}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddCrossSell(product)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              Continue Shopping
            </Button>
            <Button 
              onClick={handleViewCart}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              View Cart ({formatPrice(total)})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}