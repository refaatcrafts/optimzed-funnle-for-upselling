"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, Database, Eye, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { TaagerApiCredentialsForm } from './TaagerApiCredentialsForm'
import { ProductSkuConfiguration } from './ProductSkuConfiguration'

interface ProductConfigurationPanelProps {
  className?: string
}

export function ProductConfigurationPanel({ className }: ProductConfigurationPanelProps) {
  const [activeTab, setActiveTab] = useState('credentials')
  const [previewData, setPreviewData] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCredentialsUpdated = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleConfigurationUpdated = () => {
    setRefreshKey(prev => prev + 1)
  }

  const loadPreview = async () => {
    try {
      setPreviewLoading(true)
      const response = await fetch('/api/admin/product-config/preview')
      const result = await response.json()
      
      if (result.success) {
        setPreviewData(result.data)
      } else {
        console.error('Failed to load preview:', result.error)
      }
    } catch (error) {
      console.error('Preview error:', error)
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Configuration</h1>
          <p className="text-gray-600">Configure dynamic product display and API integration</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          Dynamic Product System
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            API Credentials
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            SKU Configuration
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="space-y-6">
          <TaagerApiCredentialsForm 
            key={`credentials-${refreshKey}`}
            onCredentialsUpdated={handleCredentialsUpdated} 
          />
          
          <Alert>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>
              <strong>Next Step:</strong> After configuring your API credentials, go to the "SKU Configuration" tab to set up your product displays.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <ProductSkuConfiguration 
            key={`config-${refreshKey}`}
            onConfigurationUpdated={handleConfigurationUpdated} 
          />
          
          <Alert>
            <Eye className="w-4 h-4" />
            <AlertDescription>
              <strong>Tip:</strong> Use the "Preview" tab to see how your configured products will appear on the website.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Product Configuration Preview</CardTitle>
                <Button onClick={loadPreview} disabled={previewLoading}>
                  {previewLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Refresh Preview
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Preview how your configured products will appear on the website
              </p>
            </CardHeader>
            <CardContent>
              {!previewData && !previewLoading && (
                <div className="text-center py-8">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Click "Refresh Preview" to see your configured products</p>
                </div>
              )}

              {previewLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading preview...</span>
                </div>
              )}

              {previewData && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Products:</span>
                        <span className="ml-2 font-semibold">{previewData.summary?.totalProducts || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Successfully Loaded:</span>
                        <span className="ml-2 font-semibold text-green-600">{previewData.summary?.successfullyLoaded || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Failed to Load:</span>
                        <span className="ml-2 font-semibold text-red-600">{previewData.summary?.failedToLoad || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Sections:</span>
                        <span className="ml-2 font-semibold">{previewData.summary?.sections || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Preview by Section */}
                  {Object.entries(previewData.preview || {}).map(([section, products]: [string, any]) => (
                    <div key={section} className="space-y-3">
                      <h4 className="font-medium text-lg">{section}</h4>
                      <div className="grid gap-4">
                        {products.map((item: any, index: number) => (
                          <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                            <div className="flex-shrink-0">
                              {item.product ? (
                                <img
                                  src={item.product.image}
                                  alt={item.product.name}
                                  className="w-16 h-16 object-cover rounded"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder.jpg'
                                  }}
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                  <XCircle className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{item.sku}</code>
                                {item.product ? (
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Loaded
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                              </div>
                              {item.product ? (
                                <div>
                                  <h5 className="font-medium">{item.product.name}</h5>
                                  <p className="text-sm text-gray-600">{item.product.description}</p>
                                  <p className="text-sm font-semibold text-green-600">
                                    ${item.product.price}
                                    {item.product.originalPrice && item.product.originalPrice !== item.product.price && (
                                      <span className="ml-2 text-gray-500 line-through">
                                        ${item.product.originalPrice}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-red-600 font-medium">Failed to load product</p>
                                  {item.error && (
                                    <p className="text-sm text-red-500">{item.error}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {Object.keys(previewData.preview || {}).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No products configured yet. Go to "SKU Configuration" to add products.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}