"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Star, Heart, Share2, ShoppingCart, Check, Edit2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useCart } from "@/components/cart-context"
import { getInitialProductData, updateProduct } from "@/actions/product"

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

const recommendedProducts: Product[] = [
  {
    id: "coffee-cup-1",
    name: "Ceramic Coffee Mug Set",
    price: 45,
    image: "/images/coffee-cup-1.jpg",
    rating: 4.6,
    reviews: 1543,
  },
  {
    id: "coffee-cup-2",
    name: "Espresso Cup Collection",
    price: 35,
    image: "/images/coffee-cup-2.jpg",
    rating: 4.7,
    reviews: 2156,
  },
  {
    id: "coffee-cup-3",
    name: "Travel Coffee Tumbler",
    price: 28,
    image: "/images/coffee-cup-3.jpg",
    rating: 4.5,
    reviews: 987,
  },
]

export default function ProductPage() {
  const [mainProduct, setMainProduct] = useState<Product | null>(null)
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cartItems, setCartItems] = useState<Product[]>([])
  const [bundleItems, setBundleItems] = useState<Product[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedProduct, setEditedProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { addToCart } = useCart()

  useEffect(() => {
    async function loadProductData() {
      try {
        const data = await getInitialProductData()
        setMainProduct(data.mainProduct)
        setBundle(data.bundle)
        setEditedProduct(data.mainProduct)
      } catch (error) {
        console.error("Failed to load product data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProductData()
  }, [])

  const handleSaveEdit = async () => {
    if (!editedProduct) return

    try {
      const updatedProduct = await updateProduct(editedProduct.id, editedProduct)
      setMainProduct(updatedProduct)
      setIsEditMode(false)
    } catch (error) {
      console.error("Failed to update product:", error)
    }
  }

  const handleAddToCart = () => {
    if (!mainProduct) return

    const newItems = [mainProduct, ...cartItems]
    setCartItems(newItems)
    setIsModalOpen(true)
    addToCart(mainProduct)
  }

  const handleAddBundle = () => {
    if (!bundle) return

    const newBundleItems = bundle.products.filter((p) => p.id !== mainProduct?.id)
    setBundleItems(newBundleItems)
    setCartItems((prev) => [...prev, ...newBundleItems])
    addToCart(...newBundleItems)
  }

  const handleAddRecommended = (product: Product) => {
    setCartItems((prev) => [...prev, product])
    addToCart(product)
  }

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId))
    setBundleItems((prev) => prev.filter((item) => item.id !== productId))
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0)
  const shippingThreshold = 300
  const shippingProgress = Math.min((cartTotal / shippingThreshold) * 100, 100)
  const remainingForFreeShipping = Math.max(shippingThreshold - cartTotal, 0)

  const crossSellProducts = recommendedProducts
    .filter(
      (product) =>
        !cartItems.some((item) => item.id === product.id) && !bundleItems.some((item) => item.id === product.id),
    )
    .slice(0, 3)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!mainProduct || !bundle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Product not found</p>
        </div>
      </div>
    )
  }

  const productImages = [
    mainProduct.image,
    "/images/coffee-beans.jpg",
    "/images/coffee-blender.jpg",
    "/images/coffee-cup-1.jpg",
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={productImages[selectedImage] || "/placeholder.svg"}
                alt={mainProduct.name}
                width={500}
                height={500}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? "border-orange-600" : "border-gray-200"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`Product view ${index + 1}`}
                    width={120}
                    height={120}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isEditMode ? (
                  <div className="space-y-3">
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input
                      id="product-name"
                      value={editedProduct?.name || ""}
                      onChange={(e) => setEditedProduct((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                      className="text-2xl font-bold"
                    />
                  </div>
                ) : (
                  <h1 className="text-3xl font-bold text-gray-900">{mainProduct.name}</h1>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isEditMode) {
                    handleSaveEdit()
                  } else {
                    setIsEditMode(true)
                  }
                }}
                className="ml-4"
              >
                {isEditMode ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </Button>
              {isEditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditMode(false)
                    setEditedProduct(mainProduct)
                  }}
                  className="ml-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {renderStars(mainProduct.rating)}
                <span className="text-sm text-gray-600 ml-2">
                  {mainProduct.rating} ({mainProduct.reviews.toLocaleString()} reviews)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {isEditMode ? (
                <div className="space-y-3">
                  <Label htmlFor="product-price">Price</Label>
                  <Input
                    id="product-price"
                    type="number"
                    value={editedProduct?.price || 0}
                    onChange={(e) =>
                      setEditedProduct((prev) => (prev ? { ...prev, price: Number(e.target.value) } : null))
                    }
                    className="text-xl"
                  />
                  <Label htmlFor="original-price">Original Price</Label>
                  <Input
                    id="original-price"
                    type="number"
                    value={editedProduct?.originalPrice || 0}
                    onChange={(e) =>
                      setEditedProduct((prev) => (prev ? { ...prev, originalPrice: Number(e.target.value) } : null))
                    }
                    className="text-xl"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-gray-900">${mainProduct.price}</span>
                  {mainProduct.originalPrice && (
                    <>
                      <span className="text-xl text-gray-500 line-through">${mainProduct.originalPrice}</span>
                      <Badge variant="destructive">Save ${mainProduct.originalPrice - mainProduct.price}</Badge>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="text-sm text-green-600 font-medium">Free shipping for orders above $300</div>

            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-lg py-3"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart - ${mainProduct.price}
              </Button>
              <Button variant="outline" size="lg" className="px-4 bg-transparent">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="px-4 bg-transparent">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold">Product Features</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Traditional Italian stovetop brewing method</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">High-grade aluminum construction</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Ergonomic heat-resistant handle</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Compatible with all stovetop types</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bundle Section */}
        <div className="mt-16">
          <Card className="p-6 bg-orange-50 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl font-bold text-gray-900">Frequently Bought Together</h2>
            </div>
            <p className="text-gray-600 mb-6">Customers who bought this item also bought</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {bundle.products.map((product, index) => (
                <div key={product.id} className="text-center">
                  <div className="aspect-square rounded-lg overflow-hidden bg-white mb-4 border">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">{product.name}</h3>
                  <div className="text-2xl font-bold text-green-600 mb-1">${product.price}</div>
                  <div className="text-gray-400 text-lg">+</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-gray-900">Bundle Price:</span>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 line-through text-lg">${bundle.originalTotal}</span>
                <span className="text-3xl font-bold text-green-600">${bundle.bundlePrice}</span>
              </div>
            </div>

            <div className="bg-green-100 border border-green-200 rounded-lg p-4 mb-6 text-center">
              <p className="text-green-800 font-medium">
                Save {Math.round((bundle.savings / bundle.originalTotal) * 100)}% when bought together! You save $
                {bundle.savings}
              </p>
            </div>

            <Button
              onClick={handleAddBundle}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-4 rounded-lg"
              size="lg"
            >
              Add All 3 Items to Cart
            </Button>
          </Card>
        </div>

        {/* Recommended Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Complete Your Coffee Experience</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {recommendedProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      width={240}
                      height={240}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{product.name}</h3>
                  <div className="flex items-center gap-1 mb-3">
                    {renderStars(product.rating)}
                    <span className="text-sm text-gray-600 ml-1">
                      {product.rating} ({product.reviews})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">${product.price}</span>
                    <Button
                      onClick={() => handleAddRecommended(product)}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Add to Cart Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-green-600">Added to Cart!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Shipping Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Free shipping progress</span>
                <span className="font-medium">${cartTotal} / $300</span>
              </div>
              <Progress value={shippingProgress} className="h-2" />
              {remainingForFreeShipping > 0 ? (
                <p className="text-sm text-gray-600">Add ${remainingForFreeShipping} more for free shipping!</p>
              ) : (
                <p className="text-sm text-green-600 font-medium">🎉 You qualify for free shipping!</p>
              )}
            </div>

            {/* Cart Items */}
            <div className="space-y-3">
              <h4 className="font-medium">Items in your cart:</h4>
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    width={40}
                    height={40}
                    className="rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-sm text-gray-600">${item.price}</p>
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

            {/* Cross-sell Products */}
            {crossSellProducts.length > 0 && (
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium">You might also like:</h4>
                <div className="space-y-2">
                  {crossSellProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-3 p-2 border rounded">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-sm text-gray-600">${product.price}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddRecommended(product)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                Continue Shopping
              </Button>
              <Button className="flex-1 bg-orange-600 hover:bg-orange-700">View Cart (${cartTotal})</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
