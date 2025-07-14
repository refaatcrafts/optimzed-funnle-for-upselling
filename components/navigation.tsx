"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Coffee, User, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/components/cart-context"
import { useState } from "react"

export function Navigation() {
  const { cartCount, cartItems, cartTotal, removeFromCart } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Coffee className="w-8 h-8 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">CoffeeCraft</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-orange-600 transition-colors">
              Home
            </Link>
            <Link href="/product" className="text-gray-700 hover:text-orange-600 transition-colors">
              Products
            </Link>
            <Link href="/admin" className="text-gray-700 hover:text-orange-600 transition-colors">
              Admin
            </Link>
            <Link href="/checkout" className="text-gray-700 hover:text-orange-600 transition-colors">
              Checkout
            </Link>
          </div>

          {/* Cart and User Actions */}
          <div className="flex items-center gap-4">
            {/* Cart Sheet */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center rounded-full">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Shopping Cart ({cartCount} items)
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto py-4">
                    {cartItems.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Your cart is empty</p>
                        <p className="text-sm text-gray-400 mt-2">Add some coffee products to get started!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cartItems.map((item, index) => (
                          <div key={`${item.id}-${index}`} className="flex items-center gap-3 p-3 border rounded-lg">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              width={60}
                              height={60}
                              className="rounded object-cover"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <p className="text-orange-600 font-semibold">${item.price}</p>
                              {item.originalPrice && (
                                <p className="text-xs text-gray-500 line-through">${item.originalPrice}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {cartItems.length > 0 && (
                    <div className="border-t pt-4 space-y-4">
                      <Separator />
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Total:</span>
                        <span className="text-orange-600">${cartTotal}</span>
                      </div>
                      <div className="space-y-2">
                        <Link href="/checkout">
                          <Button
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            size="lg"
                            onClick={() => setIsCartOpen(false)}
                          >
                            Checkout - ${cartTotal}
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="w-full bg-transparent"
                          onClick={() => setIsCartOpen(false)}
                        >
                          Continue Shopping
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="sm">
              <User className="w-5 h-5" />
            </Button>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-gray-700 hover:text-orange-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/product"
                className="text-gray-700 hover:text-orange-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href="/admin"
                className="text-gray-700 hover:text-orange-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </Link>
              <Link
                href="/checkout"
                className="text-gray-700 hover:text-orange-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
