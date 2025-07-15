import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CTASectionProps {
  className?: string
}

export function CTASection({ className }: CTASectionProps) {
  return (
    <section className={`py-20 bg-orange-600 ${className}`}>
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
  )
}