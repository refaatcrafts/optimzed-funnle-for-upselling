"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/common/StarRating"
import { PriceDisplay } from "@/components/common/PriceDisplay"
import { Skeleton } from "@/components/ui/skeleton"
import { Product } from "@/lib/types"

interface HeroSectionProps {
  className?: string
}

export function HeroSection({ className }: HeroSectionProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Static fallback data
  const fallbackProduct = {
    name: "Classic Italian Mocha Pot",
    price: 89,
    originalPrice: 129,
    rating: 4.8,
    reviews: 2847,
    image: "/images/mocha-pot.jpg"
  }

  useEffect(() => {
    async function loadHeroProduct() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/products/home-page')
        const result = await response.json()
        
        if (result.success && result.data) {
          setProduct(result.data)
        } else {
          console.warn('No hero product configured, using fallback:', result.error)
          setProduct(null)
        }
      } catch (err) {
        console.error('Failed to load hero product:', err)
        setError('Failed to load product')
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }

    loadHeroProduct()
  }, [])

  // Use dynamic product data or fallback to static data
  const heroProduct = product || fallbackProduct

  // Show loading state
  if (loading) {
    return (
      <section className={`bg-gradient-to-br from-amber-50 to-orange-50 py-20 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-16 w-full mb-6" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-12 w-64" />
              <div className="flex gap-4">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 w-32" />
              </div>
            </div>
            <div className="relative">
              <Skeleton className="aspect-square rounded-2xl" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`bg-gradient-to-br from-amber-50 to-orange-50 py-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div>
              {product ? (
                <>
                  <Badge className="mb-4 bg-orange-100 text-orange-800">Featured Product</Badge>
                  <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    {heroProduct.name}
                  </h1>
                  {product.description && (
                    <p className="text-xl text-gray-600 mt-6 leading-relaxed">
                      {product.description}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Badge className="mb-4 bg-orange-100 text-orange-800">Authentic Italian</Badge>
                  <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    Classic Italian
                    <span className="text-orange-600"> Mocha Pot</span>
                  </h1>
                  <p className="text-xl text-gray-600 mt-6 leading-relaxed">
                    Experience the authentic taste of Italian espresso with our traditional stovetop mocha pot. Perfect
                    for coffee enthusiasts who appreciate the ritual of brewing.
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <StarRating rating={heroProduct.rating} showValue />
              <span className="text-sm text-gray-600">
                ({heroProduct.reviews.toLocaleString()} reviews)
              </span>
            </div>

            <PriceDisplay 
              price={heroProduct.price}
              originalPrice={heroProduct.originalPrice}
              size="lg"
            />

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/product">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-3 bg-orange-600 hover:bg-orange-700">
                  Shop Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-3 bg-transparent">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100 p-8">
              <Image
                src={heroProduct.image}
                alt={heroProduct.name}
                width={600}
                height={600}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            {/* Floating elements - keep static for now */}
            <div className="absolute -top-4 -right-4 bg-white rounded-full p-4 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">★</div>
                <div className="text-xs text-gray-600">Top</div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-full p-4 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{Math.round(heroProduct.rating * 10) / 10}</div>
                <div className="text-xs text-gray-600">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}