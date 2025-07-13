"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getProductBySku, saveProductBySku, getInitialProductData } from "@/actions/product"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviews: number
}

interface Bundle {
  id: string
  name: string
  products: Product[]
  originalTotal: number
  bundlePrice: number
  savings: number
}

export default function AdminPage() {
  const [mainProductSku, setMainProductSku] = useState("SKU001")
  const [mainProduct, setMainProduct] = useState<Product | null>(null)
  const [bundleProductSkus, setBundleProductSkus] = useState(["SKU002", "SKU003"])
  const [bundleProducts, setBundleProducts] = useState<(Product | null)[]>([null, null])

  const [loadingMain, setLoadingMain] = useState(false)
  const [loadingBundles, setLoadingBundles] = useState([false, false])
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Load initial data for the main product and bundle products on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingMain(true)
      const { mainProduct: initialMain, bundle: initialBundle } = await getInitialProductData()
      setMainProduct(initialMain)
      setMainProductSku(initialMain.id) // Assuming main product ID is its SKU
      setLoadingMain(false)

      const initialBundleSkus = initialBundle.products.slice(1).map((p) => p.id) // Exclude main product
      setBundleProductSkus(initialBundleSkus)
      setBundleProducts(initialBundle.products.slice(1)) // Exclude main product
    }
    loadInitialData()
  }, [])

  const handleLoadMainProduct = async () => {
    setLoadingMain(true)
    setStatus(null)
    const product = await getProductBySku(mainProductSku)
    if (product) {
      setMainProduct(product)
      setStatus({ type: "success", message: `Main product "${product.name}" loaded.` })
    } else {
      setMainProduct(null)
      setStatus({ type: "error", message: `Main product with SKU "${mainProductSku}" not found.` })
    }
    setLoadingMain(false)
  }

  const handleLoadBundleProduct = async (index: number) => {
    const sku = bundleProductSkus[index]
    if (!sku) return

    setLoadingBundles((prev) => {
      const newLoading = [...prev]
      newLoading[index] = true
      return newLoading
    })
    setStatus(null)

    const product = await getProductBySku(sku)
    setBundleProducts((prev) => {
      const newProducts = [...prev]
      newProducts[index] = product
      return newProducts
    })

    if (product) {
      setStatus({ type: "success", message: `Bundle product "${product.name}" loaded.` })
    } else {
      setStatus({ type: "error", message: `Bundle product with SKU "${sku}" not found.` })
    }

    setLoadingBundles((prev) => {
      const newLoading = [...prev]
      newLoading[index] = false
      return newLoading
    })
  }

  const handleMainProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!mainProduct) return
    const { name, value } = e.target
    setMainProduct((prev) => ({
      ...(prev as Product),
      [name]: name === "price" || name === "originalPrice" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  const handleBundleProductChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!bundleProducts[index]) return
    const { name, value } = e.target
    setBundleProducts((prev) => {
      const newProducts = [...prev]
      newProducts[index] = {
        ...(newProducts[index] as Product),
        [name]: name === "price" ? Number.parseFloat(value) || 0 : value,
      }
      return newProducts
    })
  }

  const handleSaveAll = async () => {
    setSaving(true)
    setStatus(null)

    if (!mainProduct || bundleProducts.some((p) => p === null)) {
      setStatus({ type: "error", message: "Please load all products before saving." })
      setSaving(false)
      return
    }

    try {
      // Save main product
      await saveProductBySku(mainProduct.id, mainProduct)

      // Save bundle products
      for (const p of bundleProducts) {
        if (p) {
          await saveProductBySku(p.id, p)
        }
      }

      // Re-fetch initial data to ensure bundle calculations are correct on the product page
      // This is a workaround for the in-memory database. In a real DB, the product page would just fetch.
      const { mainProduct: updatedMain, bundle: updatedBundle } = await getInitialProductData()
      // You might want to update local state here if you were managing it more globally
      // For this demo, the product page will re-fetch on its own.

      setStatus({ type: "success", message: "All product data saved successfully!" })
    } catch (error) {
      console.error("Failed to save product data:", error)
      setStatus({ type: "error", message: "Failed to save product data. Check console." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Product Admin Panel</h1>

      {status && (
        <div
          className={`flex items-center gap-2 p-3 rounded-md mb-6 ${
            status.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {status.type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span>{status.message}</span>
        </div>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Main Product (SKU: {mainProduct?.id || "N/A"})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="mainProductSku">Product SKU</Label>
              <Input
                id="mainProductSku"
                value={mainProductSku}
                onChange={(e) => setMainProductSku(e.target.value)}
                placeholder="e.g., SKU001"
              />
            </div>
            <Button onClick={handleLoadMainProduct} disabled={loadingMain}>
              {loadingMain ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Load Product
            </Button>
          </div>

          {mainProduct && (
            <>
              <div className="space-y-2">
                <Label htmlFor="mainProductName">Name</Label>
                <Input id="mainProductName" name="name" value={mainProduct.name} onChange={handleMainProductChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mainProductPrice">Price</Label>
                  <Input
                    id="mainProductPrice"
                    name="price"
                    type="number"
                    step="0.01"
                    value={mainProduct.price}
                    onChange={handleMainProductChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mainProductOriginalPrice">Original Price (Optional)</Label>
                  <Input
                    id="mainProductOriginalPrice"
                    name="originalPrice"
                    type="number"
                    step="0.01"
                    value={mainProduct.originalPrice || ""}
                    onChange={handleMainProductChange}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Bundle Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {bundleProductSkus.map((sku, index) => (
            <div key={index} className="border p-4 rounded-md space-y-3">
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`bundleSku-${index}`}>Bundle Product {index + 1} SKU</Label>
                  <Input
                    id={`bundleSku-${index}`}
                    value={sku}
                    onChange={(e) =>
                      setBundleProductSkus((prev) => {
                        const newSkus = [...prev]
                        newSkus[index] = e.target.value
                        return newSkus
                      })
                    }
                    placeholder={`e.g., SKU00${index + 2}`}
                  />
                </div>
                <Button onClick={() => handleLoadBundleProduct(index)} disabled={loadingBundles[index]}>
                  {loadingBundles[index] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Load Product
                </Button>
              </div>

              {bundleProducts[index] && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`bundleProductName-${index}`}>Name</Label>
                    <Input
                      id={`bundleProductName-${index}`}
                      name="name"
                      value={bundleProducts[index]?.name || ""}
                      onChange={(e) => handleBundleProductChange(index, e)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`bundleProductPrice-${index}`}>Price</Label>
                    <Input
                      id={`bundleProductPrice-${index}`}
                      name="price"
                      type="number"
                      step="0.01"
                      value={bundleProducts[index]?.price || ""}
                      onChange={(e) => handleBundleProductChange(index, e)}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        onClick={handleSaveAll}
        disabled={saving || !mainProduct || bundleProducts.some((p) => p === null)}
        className="w-full"
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save All Changes
      </Button>
    </div>
  )
}
