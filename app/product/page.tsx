"use client"

import { useState } from "react"
import { ProductGallery } from "@/components/product/ProductGallery"
import { ProductDetails } from "@/components/product/ProductDetails"
import { ProductFeatures } from "@/components/product/ProductFeatures"
import { BundleOffer } from "@/components/product/BundleOffer"
import { RecommendedProducts } from "@/components/product/RecommendedProducts"
import { AddToCartModal } from "@/components/cart/AddToCartModal"
import { CartSheet } from "@/components/cart/CartSheet"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"
import { useProduct } from "@/lib/hooks/useProduct"
import { useCart } from "@/lib/hooks/useCart"
import { PRODUCT_FEATURES, PRODUCT_IMAGES, RECOMMENDED_PRODUCTS_DATA } from "@/lib/constants/products"
import { Product } from "@/lib/types"

export default function ProductPage() {
  const { product, bundle, isLoading, error, updateProduct } = useProduct()
  const cart = useCart()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  const handleAddToCart = () => {
    if (!product) return
    cart.addItem(product)
    setIsModalOpen(true)
  }

  const handleAddBundle = () => {
    if (!bundle) return
    bundle.products.forEach(bundleProduct => {
      cart.addItem(bundleProduct)
    })
    setIsModalOpen(true)
  }

  const handleAddRecommended = (recommendedProduct: Product) => {
    cart.addItem(recommendedProduct)
  }

  const handleViewCart = () => {
    setIsCartOpen(true)
  }

  // Get cross-sell products (recommended products not in cart)
  const crossSellProducts = RECOMMENDED_PRODUCTS_DATA.filter(
    (recommendedProduct) => !cart.items.some((item) => item.id === recommendedProduct.id)
  ).slice(0, 3)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading product..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!product || !bundle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Product not found</p>
        </div>
      </div>
    )
  }

  const productImages = [
    product.image,
    PRODUCT_IMAGES.coffeeBeans,
    PRODUCT_IMAGES.coffeeBlender,
    PRODUCT_IMAGES.coffeeCup1,
  ]

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <ProductGallery 
              images={productImages}
              productName={product.name}
            />

            {/* Product Details */}
            <div className="space-y-6">
              <ProductDetails
                product={product}
                onUpdateProduct={updateProduct}
                onAddToCart={handleAddToCart}
                isEditable={true}
              />

              <ProductFeatures features={PRODUCT_FEATURES} />
            </div>
          </div>

          {/* Bundle Section */}
          <BundleOffer 
            onAddBundle={handleAddBundle}
            className="mt-16"
            useDynamicData={true}
            productId={product.id}
          />

          {/* Recommended Products */}
          <RecommendedProducts
            onAddToCart={handleAddRecommended}
            className="mt-16"
            featureId="youMightAlsoLike"
            useDynamicData={true}
            title="You Might Also Like"
          />
        </div>

        {/* Add to Cart Modal */}
        <AddToCartModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          cart={cart}
          crossSellProducts={crossSellProducts}
          onAddCrossSell={handleAddRecommended}
          onViewCart={handleViewCart}
        />

        {/* Cart Sheet for View Cart functionality */}
        <CartSheet
          cart={cart}
          isOpen={isCartOpen}
          onOpenChange={setIsCartOpen}
        />
      </div>
    </ErrorBoundary>
  )
}
