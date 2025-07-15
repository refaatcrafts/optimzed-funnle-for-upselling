"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useCart as useCartHook } from "@/lib/hooks/useCart"
import { UseCartReturn } from "@/lib/types"

const CartContext = createContext<UseCartReturn | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCartHook()

  return (
    <CartContext.Provider value={cart}>
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
