"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, Star, ShoppingCart, Plus, Check, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviews: number
}

interface CartItem extends Product {
  quantity: number
}

interface Bundle {
  id: string
  name: string
  products: Product[]
  originalTotal: number
  bundlePrice: number
  savings: number
}

export default function Component() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showAddToCartModal, setShowAddToCartModal] = useState(false)
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null)

  const mainProduct: Product = {
    id: "wireless-headphones",
    name: "Premium Wireless Noise-Canceling Headphones",
    price: 299,
    originalPrice: 399,
    image: "/placeholder.svg?height=600&width=600",
    rating: 4.8,
    reviews: 2847,
  }

  const bundles: Bundle[] = [
    {
      id: "bundle-1",
      name: "Complete Audio Setup",
      products: [
        mainProduct,
        {
          id: "case",
          name: "Premium Carrying Case",
          price: 49,
          image: "/placeholder.svg?height=200&width=200",
          rating: 4.6,
          reviews: 892,
        },
        {
          id: "cable",
          name: "USB-C Charging Cable",
          price: 29,
          image: "/placeholder.svg?height=200&width=200",
          rating: 4.4,
          reviews: 1203,
        },
      ],
      originalTotal: 377,
      bundlePrice: 339,
      savings: 38,
    },
    {
      id: "bundle-2",
      name: "Travel Essentials",
      products: [
        mainProduct,
        {
          id: "adapter",
          name: "Universal Audio Adapter",
          price: 39,
          image: "/placeholder.svg?height=200&width=200",
          rating: 4.5,
          reviews: 654,
        },
        {
          id: "stand",
          name: "Headphone Stand",
          price: 59,
          image: "/placeholder.svg?height=200&width=200",
          rating: 4.7,
          reviews: 432,
        },
      ],
      originalTotal: 397,
      bundlePrice: 359,
      savings: 38,
    },
  ]

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
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const shippingProgress = Math.min((cartTotal / freeShippingThreshold) * 100, 100)
  const remainingForFreeShipping = Math.max(freeShippingThreshold - cartTotal, 0)

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)
      if (existingItem) {
        return prevCart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item))
      }
      return [...prevCart, { ...product, quantity }]
    })
    setLastAddedProduct(product)
    setShowAddToCartModal(true)
  }

  const addBundleToCart = (bundle: Bundle) => {
    bundle.products.forEach((product) => {
      addToCart(product, 1)
    })
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Free Shipping Progress Bar */}
      {cartTotal > 0 && (
        <div className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-40 p-4">
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

          <div className="flex gap-4">
            <Button size="lg" className="flex-1" onClick={() => addToCart(mainProduct)}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart - ${mainProduct.price}
            </Button>
            <Button size="lg" variant="outline">
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bundle Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Bought Together</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {bundles.map((bundle) => (
            <Card key={bundle.id} className="p-6">
              <CardContent className="p-0">
                <h3 className="font-semibold text-lg mb-4">{bundle.name}</h3>
                <div className="space-y-3 mb-4">
                  {bundle.products.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        width={60}
                        height={60}
                        className="rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-sm text-gray-600">${product.price}</p>
                      </div>
                      {index < bundle.products.length - 1 && <Plus className="w-4 h-4 text-gray-400" />}
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600">Individual total:</span>
                    <span className="text-sm line-through text-gray-500">${bundle.originalTotal}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold">Bundle price:</span>
                    <span className="font-semibold text-lg">${bundle.bundlePrice}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-green-600">You save:</span>
                    <span className="text-sm font-semibold text-green-600">${bundle.savings}</span>
                  </div>
                  <Button className="w-full" onClick={() => addBundleToCart(bundle)}>
                    Add Bundle to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
                  <Button size="sm" onClick={() => addToCart(product)}>
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add to Cart Modal */}
      <Dialog open={showAddToCartModal} onOpenChange={setShowAddToCartModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Added to Cart!
            </DialogTitle>
          </DialogHeader>

          {lastAddedProduct && (
            <div className="space-y-6">
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

              <div>
                <h3 className="font-semibold text-lg mb-4">People Also Buy These Together</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {crossSellProducts.slice(0, 4).map((product) => (
                    <div key={product.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        width={50}
                        height={50}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-sm text-gray-600">${product.price}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => addToCart(product)}>
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowAddToCartModal(false)}
                >
                  Continue Shopping
                </Button>
                <Button className="flex-1">View Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
