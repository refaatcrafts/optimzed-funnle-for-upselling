export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  images?: string[]  // Additional images from API
  rating: number
  reviews: number
  description?: string
  features?: string[]
  specifications?: Record<string, string>
  createdAt?: Date
  updatedAt?: Date
}

export interface CartItem extends Product {
  quantity: number
  addedAt: Date
}

export interface Bundle {
  id: string
  name: string
  products: Product[]
  originalTotal: number
  bundlePrice: number
  savings: number
}

export interface CartState {
  items: CartItem[]
  total: number
  count: number
  shippingThreshold: number
}

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface UseCartReturn {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: number
  count: number
  shippingProgress: number
  qualifiesForFreeShipping: boolean
}

export interface UseProductReturn {
  product: Product | null
  bundle: Bundle | null
  isLoading: boolean
  error: string | null
  updateProduct: (updates: Partial<Product>) => Promise<void>
}

export interface ProductData {
  mainProduct: Product
  bundle: Bundle
}

export interface FeatureItem {
  icon: React.ReactNode
  title: string
  description: string
}

export interface NavigationItem {
  href: string
  label: string
}