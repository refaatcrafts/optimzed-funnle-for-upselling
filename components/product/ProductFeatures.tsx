import { Check } from 'lucide-react'

interface ProductFeaturesProps {
  features: readonly string[]
  title?: string
  className?: string
}

export function ProductFeatures({ 
  features, 
  title = "Product Features",
  className 
}: ProductFeaturesProps) {
  if (features.length === 0) return null

  return (
    <div className={`space-y-4 pt-6 border-t ${className}`}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}