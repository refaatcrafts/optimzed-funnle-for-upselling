"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, Check, ArrowRight, Play, Shield, Truck, Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  const features = [
    {
      icon: <Coffee className="w-6 h-6" />,
      title: "Authentic Italian Design",
      description: "Traditional stovetop brewing for rich, authentic espresso",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Premium Materials",
      description: "High-grade aluminum construction for durability and heat distribution",
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Free Shipping",
      description: "Free delivery on orders over $300",
    },
  ]

  const specs = [
    "Traditional Italian stovetop brewing method",
    "High-grade aluminum construction",
    "Ergonomic heat-resistant handle",
    "Available in multiple sizes (3, 6, 9 cup)",
    "Compatible with gas, electric, and ceramic stovetops",
    "Easy to clean and maintain",
  ]

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 py-20">
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
                <div className="flex items-center gap-1">
                  {renderStars(4.8)}
                  <span className="text-sm text-gray-600 ml-2">4.8 (2,847 reviews)</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <span className="text-4xl font-bold text-gray-900">$89</span>
                  <span className="text-2xl text-gray-500 line-through ml-3">$129</span>
                </div>
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  Save $40
                </Badge>
              </div>

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
                  src="/images/mocha-pot.jpg"
                  alt="Classic Italian Mocha Pot"
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

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Why Choose Our Mocha Pot?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Crafted with tradition, designed for perfection, and built to last generations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-8 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Product Details Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">Premium Features & Specifications</h2>
              <div className="space-y-4">
                {specs.map((spec, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{spec}</span>
                  </div>
                ))}
              </div>
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
                    src="/images/mocha-pot.jpg"
                    alt="Mocha pot detail 1"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className="aspect-square rounded-xl overflow-hidden bg-white p-4">
                  <Image
                    src="/images/coffee-beans.jpg"
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
                    src="/images/coffee-blender.jpg"
                    alt="Coffee blender"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className="aspect-square rounded-xl overflow-hidden bg-white p-4">
                  <Image
                    src="/images/coffee-cup-1.jpg"
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

      {/* CTA Section */}
      <section className="py-20 bg-orange-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Ready to Brew Like an Italian?</h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Join thousands of coffee lovers who have discovered the authentic taste of Italian espresso. Free shipping
            on orders over $300.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/product">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Shop Now - $89
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-3 text-white border-white hover:bg-white hover:text-orange-600 bg-transparent"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
