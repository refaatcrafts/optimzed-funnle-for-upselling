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
    id: "mocha-pot",
    name: "Classic Italian Mocha Pot",
    price: 89,
    originalPrice: 129,
    image: "/images/mocha-pot.jpg",
    rating: 4.8,
    reviews: 2847,
  },
  SKU002: {
    id: "coffee-blender",
    name: "High-Performance Coffee Blender",
    price: 299,
    originalPrice: 399,
    image: "/images/coffee-blender.jpg",
    rating: 4.6,
    reviews: 892,
  },
  SKU003: {
    id: "coffee-beans",
    name: "Premium Arabica Coffee Beans (1kg)",
    price: 29,
    image: "/images/coffee-beans.jpg",
    rating: 4.4,
    reviews: 1203,
  },
  SKU004: {
    id: "coffee-cup-1",
    name: "Ceramic Coffee Mug Set",
    price: 45,
    image: "/images/coffee-cup-1.jpg",
    rating: 4.6,
    reviews: 1543,
  },
  SKU005: {
    id: "coffee-cup-2",
    name: "Espresso Cup Collection",
    price: 35,
    image: "/images/coffee-cup-2.jpg",
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
  try {
    // Try to fetch dynamic product data from the API
    const homePageResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products/home-page`)
    const homePageResult = await homePageResponse.json()
    
    let mainProduct: Product
    
    if (homePageResult.success && homePageResult.data) {
      // Use dynamic product data from API
      mainProduct = homePageResult.data
    } else {
      // Fallback to static data
      console.warn('Using fallback product data')
      mainProduct = _productDatabase["SKU001"] || {
        id: "mocha-pot",
        name: "Classic Italian Mocha Pot",
        price: 89,
        originalPrice: 129,
        image: "/images/mocha-pot.jpg",
        rating: 4.8,
        reviews: 2847,
      }
    }

    // Try to fetch dynamic bundle products
    const bundleResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products/frequently-bought-together`)
    const bundleResult = await bundleResponse.json()
    
    let bundleProducts: Product[]
    
    if (bundleResult.success && bundleResult.data && bundleResult.data.length > 0) {
      // Use dynamic bundle products from API
      bundleProducts = bundleResult.data
    } else {
      // Fallback to static bundle products
      console.warn('Using fallback bundle data')
      bundleProducts = [
        mainProduct,
        _productDatabase["SKU002"] || {
          id: "coffee-blender",
          name: "High-Performance Coffee Blender",
          price: 299,
          originalPrice: 399,
          image: "/images/coffee-blender.jpg",
          rating: 4.6,
          reviews: 892,
        },
        _productDatabase["SKU003"] || {
          id: "coffee-beans",
          name: "Premium Arabica Coffee Beans (1kg)",
          price: 29,
          image: "/images/coffee-beans.jpg",
          rating: 4.4,
          reviews: 1203,
        },
      ]
    }

    const originalTotal = bundleProducts.reduce((sum, p) => sum + (p.originalPrice || p.price), 0)
    const bundlePrice = bundleProducts.reduce((sum, p) => sum + p.price, 0)
    const savings = Number.parseFloat((originalTotal - bundlePrice).toFixed(2))

    const bundle: Bundle = {
      id: "bundle-1",
      name: "Complete Coffee Setup",
      products: bundleProducts,
      originalTotal,
      bundlePrice,
      savings,
    }

    return { mainProduct, bundle }
  } catch (error) {
    console.error('Failed to fetch dynamic product data, using fallback:', error)
    
    // Complete fallback to static data
    const mainProduct = _productDatabase["SKU001"] || {
      id: "mocha-pot",
      name: "Classic Italian Mocha Pot",
      price: 89,
      originalPrice: 129,
      image: "/images/mocha-pot.jpg",
      rating: 4.8,
      reviews: 2847,
    }

    const bundleProducts = [
      mainProduct,
      _productDatabase["SKU002"] || {
        id: "coffee-blender",
        name: "High-Performance Coffee Blender",
        price: 299,
        originalPrice: 399,
        image: "/images/coffee-blender.jpg",
        rating: 4.6,
        reviews: 892,
      },
      _productDatabase["SKU003"] || {
        id: "coffee-beans",
        name: "Premium Arabica Coffee Beans (1kg)",
        price: 29,
        image: "/images/coffee-beans.jpg",
        rating: 4.4,
        reviews: 1203,
      },
    ]

    const originalTotal = bundleProducts.reduce((sum, p) => sum + (p.originalPrice || p.price), 0)
    const bundlePrice = bundleProducts.reduce((sum, p) => sum + p.price, 0)
    const savings = Number.parseFloat((originalTotal - bundlePrice).toFixed(2))

    const bundle: Bundle = {
      id: "bundle-1",
      name: "Complete Coffee Setup",
      products: bundleProducts,
      originalTotal,
      bundlePrice,
      savings,
    }

    return { mainProduct, bundle }
  }
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

// This is a conceptual Server Action to update product data.
export async function updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
  await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network latency

  // Find the product in the database
  const existingProduct = Object.values(_productDatabase).find((p) => p.id === productId)
  if (!existingProduct) {
    throw new Error(`Product with id ${productId} not found`)
  }

  // Update the product
  const updatedProduct = { ...existingProduct, ...updates }

  // Find the SKU key for this product and update it
  const skuKey = Object.keys(_productDatabase).find((key) => _productDatabase[key].id === productId)
  if (skuKey) {
    _productDatabase[skuKey] = updatedProduct
  }

  console.log(`Product ${productId} updated:`, updatedProduct)
  return updatedProduct
}
