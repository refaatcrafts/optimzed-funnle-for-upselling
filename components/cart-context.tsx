"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviews: number
}

interface CartContextType {
  cartItems: Product[]
  addToCart: (...products: Product[]) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  cartTotal: number
  cartCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<Product[]>([])

  const addToCart = (...products: Product[]) => {
    setCartItems((prev) => [...prev, ...products])
  }

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => {
      const itemIndex = prev.findIndex((item) => item.id === productId)
      if (itemIndex > -1) {
        const newItems = [...prev]
        newItems.splice(itemIndex, 1)
        return newItems
      }
      return prev
    })
  }

  const clearCart = () => {
    setCartItems([])
  }

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0)
  const cartCount = cartItems.length

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
