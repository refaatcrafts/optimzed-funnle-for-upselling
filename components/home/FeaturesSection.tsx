import { Shield, Truck, Coffee } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { FeatureItem } from "@/lib/types"

interface FeaturesSectionProps {
  className?: string
}

const features: FeatureItem[] = [
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

export function FeaturesSection({ className }: FeaturesSectionProps) {
  return (
    <section className={`py-20 bg-white ${className}`}>
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
  )
}