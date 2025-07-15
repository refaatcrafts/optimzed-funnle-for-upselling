import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/common/StarRating"
import { PriceDisplay } from "@/components/common/PriceDisplay"

interface HeroSectionProps {
  className?: string
}

export function HeroSection({ className }: HeroSectionProps) {
  const heroProduct = {
    name: "Classic Italian Mocha Pot",
    price: 89,
    originalPrice: 129,
    rating: 4.8,
    reviews: 2847,
    image: "/images/mocha-pot.jpg"
  }

  return (
    <section className={`bg-gradient-to-br from-amber-50 to-orange-50 py-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div>
              <Badge className="mb-4 bg-orange-100 text-orange-800">Authentic Italian</Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Classic Italian
                <span className="text-orange-600"> Mocha Pot</span>
              </h1>
              <p className="text-xl text-gray-600 mt-6 leading-relaxed">
                Experience the authentic taste of Italian espresso with our traditional stovetop mocha pot. Perfect
                for coffee enthusiasts who appreciate the ritual of brewing.
              </p>
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
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-white rounded-full p-4 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">6</div>
                <div className="text-xs text-gray-600">Cups</div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-full p-4 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">5min</div>
                <div className="text-xs text-gray-600">Brew</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}