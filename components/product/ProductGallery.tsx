import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { PRODUCT_CONFIG } from '@/lib/constants/products'

interface ProductGalleryProps {
  images: string[]
  productName: string
  className?: string
}

export function ProductGallery({ images, productName, className }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  
  // Ensure we have at least one image
  const galleryImages = images.length > 0 ? images : [PRODUCT_CONFIG.defaultImage]

  return (
    <div className={cn('space-y-4', className)} role="region" aria-label="Product images">
      {/* Main Image */}
      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={galleryImages[selectedImage]}
          alt={`${productName} - Main product image showing view ${selectedImage + 1} of ${galleryImages.length}`}
          width={500}
          height={500}
          className="w-full h-full object-cover"
          priority
        />
      </div>
      
      {/* Thumbnail Grid */}
      {galleryImages.length > 1 && (
        <div 
          className="grid grid-cols-4 gap-3" 
          role="tablist" 
          aria-label="Product image thumbnails"
        >
          {galleryImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={cn(
                'aspect-square rounded-lg overflow-hidden border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
                selectedImage === index 
                  ? 'border-orange-600' 
                  : 'border-gray-200 hover:border-gray-300'
              )}
              role="tab"
              aria-selected={selectedImage === index}
              aria-label={`View image ${index + 1} of ${productName}`}
              tabIndex={selectedImage === index ? 0 : -1}
            >
              <Image
                src={image}
                alt={`${productName} - Thumbnail ${index + 1}`}
                width={120}
                height={120}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}