"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, ShoppingCart, Plus, Check, Truck, ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCart } from "@/components/cart-context"
import { getInitialProductData } from "@/actions/product" // Import the new Server Action

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

export default function ProductPage() {
  const { cart, addToCart, cartTotal } = useCart()
  const [showAddToCartModal, setShowAddToCartModal] = useState(false)
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null)
  const [modalAddedProducts, setModalAddedProducts] = useState<Product[]>([])

  // State to hold fetched product data
  const [mainProduct, setMainProduct] = useState<Product | null>(null)
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [isLoadingProductData, setIsLoadingProductData] = useState(true)

  // Fetch product data on component mount
  useEffect(() => {
    const fetchProductData = async () => {
      setIsLoadingProductData(true)
      const { mainProduct: fetchedMainProduct, bundle: fetchedBundle } = await getInitialProductData()
      setMainProduct(fetchedMainProduct)
      setBundles([fetchedBundle]) // Assuming only one bundle for now
      setIsLoadingProductData(false)
    }
    fetchProductData()
  }, [])

  // Static data for recommended and cross-sell products (can also be fetched from backend)
  const recommendedProducts: Product[] = [
    {
      id: "speaker",
      name: "Bluetooth Speaker",
      price: 129,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.6,
      reviews: 1543,
    },
    {
      id: "earbuds",
      name: "Wireless Earbuds",
      price: 179,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.7,
      reviews: 2156,
    },
    {
      id: "soundbar",
      name: "Smart Soundbar",
      price: 249,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.5,
      reviews: 876,
    },
    {
      id: "microphone",
      name: "USB Microphone",
      price: 89,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.4,
      reviews: 654,
    },
  ]

  const crossSellProducts: Product[] = [
    {
      id: "warranty",
      name: "2-Year Extended Warranty",
      price: 49,
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.8,
      reviews: 234,
    },
    {
      id: "cleaner",
      name: "Electronics Cleaning Kit",
      price: 19,
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.3,
      reviews: 567,
    },
    {
      id: "organizer",
      name: "Cable Organizer Set",
      price: 25,
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.5,
      reviews: 432,
    },
    {
      id: "powerbank",
      name: "Portable Power Bank",
      price: 69,
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.6,
      reviews: 789,
    },
  ]

  const freeShippingThreshold = 300
  const shippingProgress = Math.min((cartTotal / freeShippingThreshold) * 100, 100)
  const remainingForFreeShipping = Math.max(freeShippingThreshold - cartTotal, 0)

  const handleAddToCart = (product: Product, quantity = 1) => {
    addToCart(product, quantity)
    setLastAddedProduct(product)
    setShowAddToCartModal(true)
  }

  const handleModalAddToCart = (product: Product, quantity = 1) => {
    addToCart(product, quantity)
    setModalAddedProducts((prev) => [...prev, product])
  }

  const handleModalClose = (open: boolean) => {
    setShowAddToCartModal(open)
    if (!open) {
      setModalAddedProducts([])
    }
  }

  const addBundleToCart = (bundle: Bundle) => {
    bundle.products.forEach((product) => {
      addToCart(product, 1)
    })
    setLastAddedProduct(bundle.products[0])
    setShowAddToCartModal(true)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  const availableCrossSellProducts = crossSellProducts.filter(
    (product) => !modalAddedProducts.some((added) => added.id === product.id),
  )

  if (isLoadingProductData || !mainProduct || bundles.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
        <span className="sr-only">Loading product data...</span>
      </div>
    )
  }

  const currentBundle = bundles[0] // Assuming we only display one bundle

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </div>

      {/* Free Shipping Progress Bar */}
      {cartTotal > 0 && (
        <div className="fixed top-16 left-0 right-0 bg-white border-b shadow-sm z-40 p-4">
          <div className="max-w-7xl mx-auto">
            {remainingForFreeShipping > 0 ? (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Add <span className="font-semibold text-green-600">${remainingForFreeShipping}</span> more for free
                  shipping!
                </p>
                <Progress value={shippingProgress} className="h-2" />
              </div>
            ) : (
              <div className="text-center text-green-600 flex items-center justify-center gap-2">
                <Truck className="w-4 h-4" />
                <span className="font-semibold">Congratulations! Free shipping applied</span>
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`grid lg:grid-cols-2 gap-12 ${cartTotal > 0 ? "mt-20" : ""}`}>
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={mainProduct.image || "/placeholder.svg"}
              alt={mainProduct.name}
              width={600}
              height={600}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80"
              >
                <Image
                  src={`/placeholder.svg?height=150&width=150`}
                  alt={`Product view ${i}`}
                  width={150}
                  height={150}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{mainProduct.name}</h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {renderStars(mainProduct.rating)}
                <span className="text-sm text-gray-600 ml-1">
                  {mainProduct.rating} ({mainProduct.reviews.toLocaleString()} reviews)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-gray-900">${mainProduct.price}</span>
              {mainProduct.originalPrice && (
                <span className="text-xl text-gray-500 line-through">${mainProduct.originalPrice}</span>
              )}
              {mainProduct.originalPrice && (
                <Badge variant="destructive">Save ${mainProduct.originalPrice - mainProduct.price}</Badge>
              )}
            </div>
          </div>

          <div className="prose prose-sm text-gray-600">
            <p>
              Experience premium audio quality with our flagship wireless headphones. Featuring advanced noise-canceling
              technology, 30-hour battery life, and premium comfort padding for all-day wear.
            </p>
            <ul className="list-disc list-inside space-y-1 mt-4">
              <li>Active Noise Cancellation with transparency mode</li>
              <li>30-hour battery life with quick charge</li>
              <li>Premium memory foam ear cushions</li>
              <li>Bluetooth 5.0 with multipoint connection</li>
              <li>Built-in voice assistant support</li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <Button size="lg" className="w-full text-lg py-3" onClick={() => handleAddToCart(mainProduct)}>
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart - ${mainProduct.price}
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              <Truck className="w-5 h-5 text-blue-600" />
              <span>Free shipping for orders above $300</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bundle Section */}
      <div className="mt-16">
        <Card className="p-8 bg-orange-50 border-orange-200">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-orange-800">Frequently Bought Together</h2>
            </div>
            <p className="text-gray-600">Customers who bought this item also bought</p>
          </div>

          {/* Products Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {currentBundle.products.map((product, index) => (
              <div key={product.id} className="text-center">
                <div className="aspect-square rounded-lg overflow-hidden bg-white mb-4 p-4">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <h3 className="font-semibold text-sm mb-2">{product.name}</h3>
                <p className="text-2xl font-bold text-green-600">${product.price}</p>
                {index < currentBundle.products.length - 1 && (
                  <div className="mt-2">
                    <Plus className="w-6 h-6 text-gray-400 mx-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bundle Pricing */}
          <div className="border-t border-orange-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-semibold text-gray-900">Bundle Price:</span>
              <div className="text-right">
                <span className="text-lg text-gray-500 line-through mr-3">
                  ${currentBundle.originalTotal.toFixed(2)}
                </span>
                <span className="text-3xl font-bold text-green-600">${currentBundle.bundlePrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-green-100 rounded-lg p-3 mb-6">
              <p className="text-green-800 font-semibold text-center">
                Save {((currentBundle.savings / currentBundle.originalTotal) * 100).toFixed(0)}% when bought together!
                You save ${currentBundle.savings.toFixed(2)}
              </p>
            </div>

            <Button
              size="lg"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-4"
              onClick={() => addBundleToCart(currentBundle)}
            >
              Add All {currentBundle.products.length} Items to Cart
            </Button>
          </div>
        </Card>
      </div>

      {/* Recommended Products */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">You Might Also Like</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendedProducts.map((product) => (
            <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h3 className="font-semibold text-sm mb-2">{product.name}</h3>
                <div className="flex items-center gap-1 mb-2">
                  {renderStars(product.rating)}
                  <span className="text-xs text-gray-600 ml-1">({product.reviews})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold">${product.price}</span>
                  <Button size="sm" onClick={() => handleAddToCart(product)}>
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add to Cart Modal */}
      <Dialog open={showAddToCartModal} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Added to Cart!
            </DialogTitle>
          </DialogHeader>

          {lastAddedProduct && (
            <div className="space-y-6">
              {/* Show all added products in this session */}
              <div className="space-y-3">
                {/* Original product */}
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                  <Image
                    src={lastAddedProduct.image || "/placeholder.svg"}
                    alt={lastAddedProduct.name}
                    width={80}
                    height={80}
                    className="rounded-lg"
                  />
                  <div>
                    <h3 className="font-semibold">{lastAddedProduct.name}</h3>
                    <p className="text-green-600 font-semibold">${lastAddedProduct.price}</p>
                  </div>
                </div>

                {/* Additional products added during this modal session */}
                {modalAddedProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      width={80}
                      height={80}
                      className="rounded-lg"
                    />
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-blue-600 font-semibold">${product.price}</p>
                    </div>
                    <Check className="w-5 h-5 text-blue-600 ml-auto" />
                  </div>
                ))}
              </div>

              {/* Show remaining cross-sell products */}
              {availableCrossSellProducts.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">People Also Buy These Together</h3>
                  <div className="space-y-3">
                    {availableCrossSellProducts.slice(0, 3).map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          width={60}
                          height={60}
                          className="rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-gray-600">${product.price}</p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleModalAddToCart(product)}
                          className="bg-transparent"
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show message when all cross-sell products are added */}
              {availableCrossSellProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Check className="w-12 h-12 mx-auto mb-2 text-green-600" />
                  <p>Great choices! You've added all our recommended products.</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => handleModalClose(false)}>
                  Continue Shopping
                </Button>
                <Link href="/checkout" className="flex-1">
                  <Button className="w-full">
                    View Cart ({cart.reduce((sum, item) => sum + item.quantity, 0) + modalAddedProducts.length})
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
