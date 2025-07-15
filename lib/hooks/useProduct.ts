import { useState, useEffect } from 'react'
import { Product, Bundle, UseProductReturn } from '@/lib/types'
import { getInitialProductData, updateProduct as updateProductAction } from '@/actions/product'
import { getErrorMessage, logError } from '@/lib/utils/errors'

export function useProduct(): UseProductReturn {
  const [product, setProduct] = useState<Product | null>(null)
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProductData() {
      try {
        setIsLoading(true)
        setError(null)
        
        const data = await getInitialProductData()
        setProduct(data.mainProduct)
        setBundle(data.bundle)
      } catch (err) {
        const errorMessage = getErrorMessage(err)
        setError(errorMessage)
        logError(err, { context: 'useProduct.loadProductData' })
      } finally {
        setIsLoading(false)
      }
    }

    loadProductData()
  }, [])

  const updateProduct = async (updates: Partial<Product>) => {
    if (!product) {
      throw new Error('No product to update')
    }

    try {
      const updatedProduct = await updateProductAction(product.id, updates)
      setProduct(updatedProduct)
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      logError(err, { context: 'useProduct.updateProduct', updates })
      throw new Error(errorMessage)
    }
  }

  return {
    product,
    bundle,
    isLoading,
    error,
    updateProduct,
  }
}