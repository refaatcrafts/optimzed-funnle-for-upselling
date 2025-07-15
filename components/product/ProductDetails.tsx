import { useState } from 'react'
import { Heart, Share2, Edit2, Save, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StarRating } from '@/components/common/StarRating'
import { PriceDisplay } from '@/components/common/PriceDisplay'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Product } from '@/lib/types'
import { formatNumber } from '@/lib/utils/format'
import { getErrorMessage } from '@/lib/utils/errors'

interface ProductDetailsProps {
  product: Product
  onUpdateProduct?: (updates: Partial<Product>) => Promise<void>
  onAddToCart?: () => void
  isEditable?: boolean
}

export function ProductDetails({ 
  product, 
  onUpdateProduct, 
  onAddToCart,
  isEditable = false 
}: ProductDetailsProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedProduct, setEditedProduct] = useState<Product>(product)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const handleSaveEdit = async () => {
    if (!onUpdateProduct) return

    try {
      setIsUpdating(true)
      setUpdateError(null)
      await onUpdateProduct(editedProduct)
      setIsEditMode(false)
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setUpdateError(errorMessage)
      // Reset to original values on error
      setEditedProduct(product)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setEditedProduct(product)
    setUpdateError(null)
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {updateError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to update product: {updateError}
          </AlertDescription>
        </Alert>
      )}

      {/* Product Name and Edit Controls */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isEditMode ? (
            <div className="space-y-3">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                value={editedProduct.name}
                onChange={(e) => setEditedProduct(prev => ({ ...prev, name: e.target.value }))}
                className="text-2xl font-bold"
                disabled={isUpdating}
              />
            </div>
          ) : (
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          )}
        </div>
        
        {isEditable && (
          <div className="flex gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={isEditMode ? handleSaveEdit : () => setIsEditMode(true)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <LoadingSpinner size="sm" />
              ) : isEditMode ? (
                <Save className="w-4 h-4" />
              ) : (
                <Edit2 className="w-4 h-4" />
              )}
            </Button>
            {isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isUpdating}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-4">
        <StarRating rating={product.rating} showValue />
        <span className="text-sm text-gray-600">
          ({formatNumber(product.reviews)} reviews)
        </span>
      </div>

      {/* Price */}
      <div className="space-y-2">
        {isEditMode ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="product-price">Price</Label>
              <Input
                id="product-price"
                type="number"
                value={editedProduct.price}
                onChange={(e) => setEditedProduct(prev => ({ 
                  ...prev, 
                  price: Number(e.target.value) 
                }))}
                className="text-xl"
                disabled={isUpdating}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="original-price">Original Price (optional)</Label>
              <Input
                id="original-price"
                type="number"
                value={editedProduct.originalPrice || ''}
                onChange={(e) => setEditedProduct(prev => ({ 
                  ...prev, 
                  originalPrice: e.target.value ? Number(e.target.value) : undefined 
                }))}
                className="text-xl"
                disabled={isUpdating}
                min="0"
                step="0.01"
              />
            </div>
          </div>
        ) : (
          <PriceDisplay 
            price={product.price} 
            originalPrice={product.originalPrice}
            size="lg"
          />
        )}
      </div>

      {/* Shipping Info */}
      <div className="text-sm text-green-600 font-medium">
        Free shipping for orders above $300
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onAddToCart && (
          <Button
            onClick={onAddToCart}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-lg py-3"
            size="lg"
            disabled={isUpdating}
          >
            Add to Cart - ${product.price}
          </Button>
        )}
        
        <Button variant="outline" size="lg" className="px-4 bg-transparent">
          <Heart className="w-5 h-5" />
        </Button>
        
        <Button variant="outline" size="lg" className="px-4 bg-transparent">
          <Share2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}