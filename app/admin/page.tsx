"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Edit2, Save, X } from "lucide-react"
import { getInitialProductData, updateProductData } from "@/actions/product"
import Image from "next/image"

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
  const [productData, setProductData] = useState<{ mainProduct: Product; bundle: Bundle } | null>(null)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editedData, setEditedData] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<string>("")

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getInitialProductData()
        setProductData(data)
      } catch (error) {
        console.error("Failed to load product data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleEdit = (product: Product) => {
    setEditingProduct(product.id)
    setEditedData({ ...product })
  }

  const handleSave = async () => {
    if (!editedData || !productData) return

    try {
      setSaveStatus("Saving...")

      // Update the product in the current data
      const updatedData = { ...productData }

      if (editedData.id === productData.mainProduct.id) {
        updatedData.mainProduct = editedData
      }

      // Update in bundle if it exists there
      updatedData.bundle.products = updatedData.bundle.products.map((p) => (p.id === editedData.id ? editedData : p))

      // Recalculate bundle totals
      const originalTotal = updatedData.bundle.products.reduce((sum, p) => sum + (p.originalPrice || p.price), 0)
      const bundlePrice = updatedData.bundle.products.reduce((sum, p) => sum + p.price, 0)
      const savings = originalTotal - bundlePrice

      updatedData.bundle = {
        ...updatedData.bundle,
        originalTotal,
        bundlePrice,
        savings,
      }

      await updateProductData(updatedData)
      setProductData(updatedData)
      setEditingProduct(null)
      setEditedData(null)
      setSaveStatus("Saved successfully!")

      setTimeout(() => setSaveStatus(""), 3000)
    } catch (error) {
      console.error("Failed to save:", error)
      setSaveStatus("Failed to save")
      setTimeout(() => setSaveStatus(""), 3000)
    }
  }

  const handleCancel = () => {
    setEditingProduct(null)
    setEditedData(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!productData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Failed to load product data</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Admin Panel</h1>
          <p className="text-gray-600">Manage your coffee products and bundles</p>
          {saveStatus && (
            <Badge
              className={`mt-2 ${saveStatus.includes("success") ? "bg-green-600" : saveStatus.includes("Failed") ? "bg-red-600" : "bg-blue-600"}`}
            >
              {saveStatus}
            </Badge>
          )}
        </div>

        {/* Main Product */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Main Product
              {editingProduct !== productData.mainProduct.id && (
                <Button variant="outline" size="sm" onClick={() => handleEdit(productData.mainProduct)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={productData.mainProduct.image || "/placeholder.svg"}
                  alt={productData.mainProduct.name}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-4">
                {editingProduct === productData.mainProduct.id && editedData ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={editedData.name}
                        onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={editedData.price}
                        onChange={(e) => setEditedData({ ...editedData, price: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="originalPrice">Original Price ($)</Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        value={editedData.originalPrice || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, originalPrice: Number(e.target.value) || undefined })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">{productData.mainProduct.name}</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold">${productData.mainProduct.price}</span>
                      {productData.mainProduct.originalPrice && (
                        <span className="text-lg text-gray-500 line-through">
                          ${productData.mainProduct.originalPrice}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      Rating: {productData.mainProduct.rating} ({productData.mainProduct.reviews} reviews)
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bundle Products */}
        <Card>
          <CardHeader>
            <CardTitle>Bundle: {productData.bundle.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-6">
                {productData.bundle.products.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      {editingProduct === product.id && editedData ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor={`name-${product.id}`}>Name</Label>
                            <Input
                              id={`name-${product.id}`}
                              value={editedData.name}
                              onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`price-${product.id}`}>Price ($)</Label>
                            <Input
                              id={`price-${product.id}`}
                              type="number"
                              value={editedData.price}
                              onChange={(e) => setEditedData({ ...editedData, price: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`originalPrice-${product.id}`}>Original Price ($)</Label>
                            <Input
                              id={`originalPrice-${product.id}`}
                              type="number"
                              value={editedData.originalPrice || ""}
                              onChange={(e) =>
                                setEditedData({ ...editedData, originalPrice: Number(e.target.value) || undefined })
                              }
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-bold">${product.price}</span>
                            {product.originalPrice && (
                              <span className="text-gray-500 line-through">${product.originalPrice}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {editingProduct === product.id ? (
                        <>
                          <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg">
                  <span>Bundle Total:</span>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 line-through">${productData.bundle.originalTotal}</span>
                    <span className="font-bold text-green-600">${productData.bundle.bundlePrice}</span>
                    <Badge className="bg-green-600">Save ${productData.bundle.savings}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
