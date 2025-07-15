import { useMemo, useCallback, useState, useEffect } from 'react'
import { Product, CartItem, UseCartReturn } from '@/lib/types'
import { CART_CONFIG } from '@/lib/constants/cart'

// Custom hook for cart items that handles Date serialization
function useCartStorage(): [CartItem[], (items: CartItem[]) => void] {
  const [items, setItems] = useState<CartItem[]>([])

  // Load items from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = window.localStorage.getItem(CART_CONFIG.sessionStorageKey)
      if (stored) {
        const parsedItems = JSON.parse(stored) as CartItem[]
        // Convert addedAt strings back to Date objects
        const itemsWithDates = parsedItems.map(item => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }))
        console.log('Loading cart items from localStorage:', itemsWithDates)
        setItems(itemsWithDates)
      } else {
        console.log('No cart items found in localStorage')
      }
    } catch (error) {
      console.warn('Error loading cart from localStorage:', error)
    }
  }, [])

  // Save items to localStorage whenever items change
  const setItemsWithStorage = useCallback((newItems: CartItem[]) => {
    setItems(newItems)
    
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(CART_CONFIG.sessionStorageKey, JSON.stringify(newItems))
      } catch (error) {
        console.warn('Error saving cart to localStorage:', error)
      }
    }
  }, [])

  return [items, setItemsWithStorage]
}

export function useCart(): UseCartReturn {
  const [items, setItems] = useCartStorage()

  const addItem = useCallback((product: Product, quantity: number = CART_CONFIG.defaultQuantity) => {
    console.log('Adding item to cart:', product.name, 'quantity:', quantity)
    setItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(item => item.id === product.id)
      
      if (existingItemIndex > -1) {
        // Update quantity of existing item
        const updatedItems = [...currentItems]
        const newQuantity = Math.min(
          updatedItems[existingItemIndex].quantity + quantity,
          CART_CONFIG.maxQuantityPerItem
        )
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: newQuantity,
        }
        console.log('Updated existing item quantity:', updatedItems[existingItemIndex])
        return updatedItems
      } else {
        // Add new item
        const newItem: CartItem = {
          ...product,
          quantity: Math.min(quantity, CART_CONFIG.maxQuantityPerItem),
          addedAt: new Date(),
        }
        console.log('Added new item to cart:', newItem)
        return [...currentItems, newItem]
      }
    })
  }, [setItems])

  const removeItem = useCallback((productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== productId))
  }, [setItems])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setItems(currentItems => {
      return currentItems.map(item => {
        if (item.id === productId) {
          return {
            ...item,
            quantity: Math.min(quantity, CART_CONFIG.maxQuantityPerItem),
          }
        }
        return item
      })
    })
  }, [setItems, removeItem])

  const clearCart = useCallback(() => {
    setItems([])
  }, [setItems])

  // Memoized calculations
  const { total, count, shippingProgress, qualifiesForFreeShipping } = useMemo(() => {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const count = items.reduce((sum, item) => sum + item.quantity, 0)
    const shippingProgress = Math.min((total / CART_CONFIG.freeShippingThreshold) * 100, 100)
    const qualifiesForFreeShipping = total >= CART_CONFIG.freeShippingThreshold

    return {
      total: Number(total.toFixed(2)),
      count,
      shippingProgress,
      qualifiesForFreeShipping,
    }
  }, [items])

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    count,
    shippingProgress,
    qualifiesForFreeShipping,
  }
}