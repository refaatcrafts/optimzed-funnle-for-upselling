import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductFeatures } from "@/components/product/ProductFeatures"
import { PRODUCT_FEATURES, PRODUCT_IMAGES } from "@/lib/constants/products"

interface ProductDetailsSectionProps {
  className?: string
}

export function ProductDetailsSection({ className }: ProductDetailsSectionProps) {
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