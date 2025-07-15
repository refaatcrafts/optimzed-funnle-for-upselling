import Link from 'next/link'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { CartItem } from './CartItem'
import { CartSummary } from './CartSummary'
import { UseCartReturn } from '@/lib/types'
import { CART_MESSAGES } from '@/lib/constants/cart'
import { formatPrice } from '@/lib/utils/format'

interface CartSheetProps {
  cart: UseCartReturn
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function CartSheet({ cart, isOpen, onOpenChange }: CartSheetProps) {
  const { items, removeItem, clearCart, total, count, shippingProgress, qualifiesForFreeShipping } = cart

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          aria-label={`Shopping cart with ${count} items`}
        >
          <ShoppingCart className="w-5 h-5" aria-hidden="true" />
          {count > 0 && (
            <Badge
              className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center rounded-full"
              aria-label={`${count} items in cart`}
            >
              {count}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg" aria-describedby="cart-description">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" aria-hidden="true" />
            Shopping Cart ({count} items)
          </SheetTitle>
          <p id="cart-description" className="sr-only">
            Your shopping cart contains {count} items with a total of {formatPrice(total)}
          </p>
        </SheetHeader>

        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-4" role="region" aria-label="Cart items">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                <p className="text-gray-500">{CART_MESSAGES.empty}</p>
                <p className="text-sm text-gray-400 mt-2">{CART_MESSAGES.emptySubtext}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItem
                    key={`${item.id}-${item.addedAt.getTime()}`}
                    item={item}
                    onRemove={removeItem}
                    showQuantity={true}
                  />
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t pt-4 space-y-4" role="region" aria-label="Cart summary and actions">
              <CartSummary
                total={total}
                shippingProgress={shippingProgress}
                qualifiesForFreeShipping={qualifiesForFreeShipping}
              />

              <div className="space-y-2">
                <Link href="/checkout">
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    size="lg"
                    onClick={() => onOpenChange(false)}
                  >
                    Checkout - {formatPrice(total)}
                  </Button>
                </Link>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    onClick={() => onOpenChange(false)}
                  >
                    Continue Shopping
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="Clear all items from cart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}