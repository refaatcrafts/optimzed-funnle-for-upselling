"use server"

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviews: number
}

interface Bundle {
  id: string
  name: string
  products: Product[]
  originalTotal: number
  bundlePrice: number
  savings: number
}

interface ProductData {
  mainProduct: Product
  bundle: Bundle
}

// --- Simulated In-Memory Database ---
// In a real application, this would be a persistent database (e.g., PostgreSQL, MongoDB).
// Data stored here will NOT persist across server restarts or new sessions in this v0 environment.
const _productDatabase: Record<string, Product> = {
  SKU001: {
    id: "wireless-headphones",
    name: "Premium Wireless Noise-Canceling Headphones",
    price: 299,
    originalPrice: 399,
    image: "/placeholder.svg?height=600&width=600",
    rating: 4.8,
    reviews: 2847,
  },
  SKU002: {
    id: "case",
    name: "Premium Carrying Case",
    price: 49,
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.6,
    reviews: 892,
  },
  SKU003: {
    id: "cable",
    name: "USB-C Charging Cable",
    price: 29,
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.4,
    reviews: 1203,
  },
  SKU004: {
    id: "speaker",
    name: "Bluetooth Speaker",
    price: 129,
    image: "/placeholder.svg?height=300&width=300",
    rating: 4.6,
    reviews: 1543,
  },
  SKU005: {
    id: "earbuds",
    name: "Wireless Earbuds",
    price: 179,
    image: "/placeholder.svg?height=300&width=300",
    rating: 4.7,
    reviews: 2156,
  },
}

// This is a conceptual Server Action to get product data by SKU.
export async function getProductBySku(sku: string): Promise<Product | null> {
  await new Promise((resolve) => setTimeout(resolve, 200)) // Simulate network latency
  return _productDatabase[sku] || null
}

// This is a conceptual Server Action to get the main product and its associated bundle.
export async function getInitialProductData(): Promise<ProductData> {
  await new Promise((resolve) => setTimeout(resolve, 300)) // Simulate network latency

  const mainProduct = _productDatabase["SKU001"] || {
    id: "wireless-headphones",
    name: "Premium Wireless Noise-Canceling Headphones",
    price: 299,
    originalPrice: 399,
    image: "/placeholder.svg?height=600&width=600",
    rating: 4.8,
    reviews: 2847,
  }

  const bundleProducts = [
    mainProduct,
    _productDatabase["SKU002"] || {
      id: "case",
      name: "Premium Carrying Case",
      price: 49,
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.6,
      reviews: 892,
    },
    _productDatabase["SKU003"] || {
      id: "cable",
      name: "USB-C Charging Cable",
      price: 29,
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.4,
      reviews: 1203,
    },
  ]

  const originalTotal = bundleProducts.reduce((sum, p) => sum + p.price, 0)
  const bundlePrice = Number.parseFloat((originalTotal * 0.9).toFixed(2)) // 10% discount
  const savings = Number.parseFloat((originalTotal - bundlePrice).toFixed(2))

  const bundle: Bundle = {
    id: "bundle-1",
    name: "Complete Audio Setup",
    products: bundleProducts,
    originalTotal,
    bundlePrice,
    savings,
  }

  return { mainProduct, bundle }
}

// This is a conceptual Server Action to update product data.
export async function updateProductData(data: ProductData) {
  await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network latency

  // Update main product
  _productDatabase[data.mainProduct.id] = { ..._productDatabase[data.mainProduct.id], ...data.mainProduct }

  // Update bundle products
  data.bundle.products.forEach((p) => {
    _productDatabase[p.id] = { ..._productDatabase[p.id], ...p }
  })

  console.log("Simulated database updated:", _productDatabase)

  return { success: true, message: "Product data updated successfully (simulated)." }
}

// This is a conceptual Server Action to add/update a product by SKU
export async function saveProductBySku(sku: string, product: Product) {
  await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network latency
  _productDatabase[sku] = { ..._productDatabase[sku], ...product, id: sku } // Ensure ID matches SKU for simplicity
  console.log(`Product ${sku} saved/updated:`, _productDatabase[sku])
  return { success: true, message: `Product ${sku} saved successfully.` }
}
