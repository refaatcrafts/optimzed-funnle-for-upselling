import { HeroSection } from "@/components/home/HeroSection"
import { FeaturesSection } from "@/components/home/FeaturesSection"
import { ProductDetailsSection } from "@/components/home/ProductDetailsSection"
import { CTASection } from "@/components/home/CTASection"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <ProductDetailsSection />
      <CTASection />
    </div>
  )
}
