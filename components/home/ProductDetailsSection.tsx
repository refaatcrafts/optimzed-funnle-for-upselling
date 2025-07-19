"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductFeatures } from "@/components/product/ProductFeatures"
import { PRODUCT_FEATURES, PRODUCT_IMAGES } from "@/lib/constants/products"
import { Product } from "@/lib/types"
import { productDataService } from "@/lib/services/product-data-service"
import { Skeleton } from "@/components/ui/skeleton"

interface ProductDetailsSectionProps {
  className?: string
}

export function ProductDetailsSection({ className }: ProductDetailsSectionProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadHomePageProduct() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/products/home-page')
        const result = await response.json()
        
        if (result.success && result.data) {
          setProduct(result.data)
        } else {
          console.warn('No home page product configured or API error:', result.error)
          setProduct(null)
        }
      } catch (err) {
        console.error('Failed to load home page product:', err)
        setError('Failed to load product details')
      } finally {
        setLoading(false)
      }
    }

    loadHomePageProduct()
  }, [])

  // Show loading state
  if (loading) {
    return (
      <section className={`py-20 bg-gray-50 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Skeleton className="h-12 w-3/4 mb-8" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <Skeleton className="h-12 w-48 mt-8" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="aspect-square rounded-xl" />
              </div>
              <div className="space-y-4 mt-8">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="aspect-square rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Show error state or fallback to static content
  if (error || !product) {
    return (
      <section className={`py-20 bg-gray-50 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">Premium Features & Specifications</h2>
              <ProductFeatures 
                features={PRODUCT_FEATURES} 
                title=""
                className="pt-0 border-t-0"
              />
              <div className="mt-8">
                <Link href="/product">
                  <Button size="lg" className="text-lg px-8 py-3 bg-orange-600 hover:bg-orange-700">
                    View Full Details
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-square rounded-xl overflow-hidden bg-white p-4">
                  <Image
                    src={PRODUCT_IMAGES.mochaPot}
                    alt="Mocha pot detail 1"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className="aspect-square rounded-xl overflow-hidden bg-white p-4">
                  <Image
                    src={PRODUCT_IMAGES.coffeeBeans}
                    alt="Coffee beans"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="aspect-square rounded-xl overflow-hidden bg-white p-4">
                  <Image
                    src={PRODUCT_IMAGES.coffeeBlender}
                    alt="Coffee blender"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className="aspect-square rounded-xl overflow-hidden bg-white p-4">
                  <Image
                    src={PRODUCT_IMAGES.coffeeCup1}
                    alt="Coffee cup"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Show dynamic product content
  // Use additional images from the API response, fallback to static images if needed
  const productImages = [
    product.image,
    ...(product.images || []),
    // Fallback to static images if we don't have enough
    PRODUCT_IMAGES.coffeeBeans,
    PRODUCT_IMAGES.coffeeBlender,
    PRODUCT_IMAGES.coffeeCup1
  ].filter(Boolean).slice(0, 4) // Limit to 4 images for the grid

  return (
    <section className={`py-20 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">
              {product.name}
            </h2>
            
            {product.description && (
              <p className="text-lg text-gray-600 mb-6">
                {product.description}
              </p>
            )}
            
            <ProductFeatures 
              features={product.features || PRODUCT_FEATURES} 
              title=""
              className="pt-0 border-t-0"
            />
            
            <div className="mt-8">
              <Link href="/product">
                <Button size="lg" className="text-lg px-8 py-3 bg-orange-600 hover:bg-orange-700">
                  View Full Details
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="aspect-square rounded-xl overflow-hidden bg-white p-4">
                <Image
                  src={productImages[0] || PRODUCT_IMAGES.mochaPot}
                  alt={`${product.name} detail 1`}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="aspect-square rounded-xl overflow-hidden bg-white p-4">
                <Image
                  src={productImages[1] || PRODUCT_IMAGES.coffeeBeans}
                  alt={`${product.name} detail 2`}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-4 mt-8">
              <div className="aspect-square rounded-xl overflow-hidden bg-white p-4">
                <Image
                  src={productImages[2] || PRODUCT_IMAGES.coffeeBlender}
                  alt={`${product.name} detail 3`}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="aspect-square rounded-xl overflow-hidden bg-white p-4">
                <Image
                  src={productImages[3] || PRODUCT_IMAGES.coffeeCup1}
                  alt={`${product.name} detail 4`}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}