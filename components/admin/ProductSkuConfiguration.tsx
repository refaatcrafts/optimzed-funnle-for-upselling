"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, X, CheckCircle, XCircle, Eye } from 'lucide-react'
import { ProductConfiguration, ValidationResult } from '@/lib/types/admin'
import { PRODUCT_CONFIG_LIMITS } from '@/lib/constants/admin'
import { AdminAuthService } from '@/lib/services/admin-auth'

interface ProductSkuConfigurationProps {
  onConfigurationUpdated?: () => void
}

export function ProductSkuConfiguration({ onConfigurationUpdated }: ProductSkuConfigurationProps) {
  const [config, setConfig] = useState<ProductConfiguration>({
    homePagePrimary: null,
    recommendations: [],
    frequentlyBoughtTogether: [],
    upsellOffers: [],
    crossSellRecommendations: []
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [newSkus, setNewSkus] = useState({
    recommendation: '',
    frequentlyBoughtTogether: '',
    upsellOffer: '',
    crossSellRecommendation: ''
  })

  useEffect(() => {
    loadConfiguration()
  }, [])

  const loadConfiguration = async () => {
    try {
      setLoading(true)
      const authHeaders = AdminAuthService.getAuthHeaders()
      const response = await fetch('/api/admin/product-config', {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      })
      const result = await response.json()
      
      console.log('Loaded configuration from server:', result.data)
      
      if (result.success) {
        setConfig(result.data)
        console.log('Set config state to:', result.data)
      } else {
        setError('Failed to load product configuration')
      }
    } catch (error) {
      console.error('Failed to load configuration:', error)
      setError('Failed to load product configuration')
    } finally {
      setLoading(false)
    }
  }

  const saveConfiguration = async () => {
    try {
      setSaving(true)
      setError(null)
      
      console.log('=== SAVE CONFIGURATION DEBUG ===')
      console.log('Current config state:', JSON.stringify(config, null, 2))
      console.log('Config recommendations:', config.recommendations)
      console.log('Config upsellOffers:', config.upsellOffers)
      console.log('Config crossSellRecommendations:', config.crossSellRecommendations)
      
      const authHeaders = AdminAuthService.getAuthHeaders()
      const response = await fetch('/api/admin/product-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(config)
      })
      
      const result = await response.json()
      console.log('Save result:', result)
      
      if (result.success) {
        setSuccess('Configuration saved successfully!')
        // Update local config with the saved data
        if (result.data) {
          console.log('Updating config with server response:', result.data)
          setConfig(result.data)
        }
        onConfigurationUpdated?.()
      } else {
        setError(result.error || 'Failed to save configuration')
      }
    } catch (error) {
      console.error('Save error:', error)
      setError('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const validateAllSkus = async () => {
    try {
      setValidating(true)
      const authHeaders = AdminAuthService.getAuthHeaders()
      const response = await fetch('/api/admin/product-config/validate', {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      })
      const result = await response.json()
      
      if (result.success) {
        setValidationResults(result.data.results)
      } else {
        setError('Failed to validate SKUs')
      }
    } catch (error) {
      console.error('Validation error:', error)
      setError('Failed to validate SKUs')
    } finally {
      setValidating(false)
    }
  }

  const validateSingleSku = async (sku: string): Promise<boolean> => {
    try {
      const authHeaders = AdminAuthService.getAuthHeaders()
      const response = await fetch('/api/admin/product-config/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({ sku })
      })
      
      const result = await response.json()
      return result.success && result.data.isValid
    } catch (error) {
      console.error('SKU validation error:', error)
      return false
    }
  }

  const updateHomePagePrimary = (sku: string) => {
    setConfig(prev => ({
      ...prev,
      homePagePrimary: sku || null
    }))
  }

  const addSku = async (section: keyof typeof newSkus, maxLimit: number) => {
    const sku = newSkus[section].trim()
    if (!sku) return

    console.log('Adding SKU:', sku, 'to section:', section)

    // Map section names to config property names
    const sectionMap = {
      recommendation: 'recommendations',
      frequentlyBoughtTogether: 'frequentlyBoughtTogether',
      upsellOffer: 'upsellOffers',
      crossSellRecommendation: 'crossSellRecommendations'
    } as const

    const configKey = sectionMap[section]
    const currentArray = config[configKey] as string[]
    
    console.log('Current array for', configKey, ':', currentArray)
    
    if (currentArray.length >= maxLimit) {
      setError(`Maximum ${maxLimit} items allowed for this section`)
      return
    }

    // Check if already exists
    if (currentArray.includes(sku)) {
      setError('SKU already exists in this section')
      return
    }

    // Add to configuration first (don't block on validation)
    const newArray = [...currentArray, sku]
    console.log('New array will be:', newArray)
    
    setConfig(prev => {
      const newConfig = {
        ...prev,
        [configKey]: newArray
      }
      console.log('Setting new config:', newConfig)
      return newConfig
    })

    // Clear input
    setNewSkus(prev => ({ ...prev, [section]: '' }))
    setError(null)

    // Validate SKU in background (non-blocking)
    try {
      const isValid = await validateSingleSku(sku)
      if (!isValid) {
        console.warn('SKU validation failed for:', sku, 'but SKU was still added')
      }
    } catch (error) {
      console.warn('SKU validation error for:', sku, error)
    }
  }

  const removeSku = (section: string, sku: string) => {
    setConfig(prev => ({
      ...prev,
      [section]: (prev[section as keyof ProductConfiguration] as string[]).filter(s => s !== sku)
    }))
  }

  const getValidationStatus = (sku: string) => {
    const result = validationResults.find(r => r.sku === sku)
    return result
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product SKU Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading configuration...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product SKU Configuration</CardTitle>
          <p className="text-sm text-gray-600">
            Configure which product SKUs appear in different sections of your website
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <XCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Home Page Primary Product */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Home Page Primary Product</Label>
            <p className="text-sm text-gray-600">The main product featured on your home page</p>
            <div className="flex gap-2">
              <Input
                value={config.homePagePrimary || ''}
                onChange={(e) => updateHomePagePrimary(e.target.value)}
                placeholder="Enter SKU (e.g., SA050201MSB799)"
                className="flex-1"
              />
              {config.homePagePrimary && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateHomePagePrimary('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {config.homePagePrimary && (
              <div className="flex items-center gap-2">
                {getValidationStatus(config.homePagePrimary) ? (
                  getValidationStatus(config.homePagePrimary)?.isValid ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Valid
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      Invalid
                    </Badge>
                  )
                ) : (
                  <Badge variant="secondary">Not validated</Badge>
                )}
              </div>
            )}
          </div>

          {/* Recommendations */}
          <SkuSection
            title="Product Recommendations"
            description={`Products shown in "You Might Also Like" sections (max ${PRODUCT_CONFIG_LIMITS.MAX_RECOMMENDATIONS})`}
            skus={config.recommendations}
            newSku={newSkus.recommendation}
            onNewSkuChange={(value) => setNewSkus(prev => ({ ...prev, recommendation: value }))}
            onAddSku={() => addSku('recommendation', PRODUCT_CONFIG_LIMITS.MAX_RECOMMENDATIONS)}
            onRemoveSku={(sku) => removeSku('recommendations', sku)}
            maxLimit={PRODUCT_CONFIG_LIMITS.MAX_RECOMMENDATIONS}
            validationResults={validationResults}
          />

          {/* Frequently Bought Together */}
          <SkuSection
            title="Frequently Bought Together"
            description={`Products shown in bundle offers (max ${PRODUCT_CONFIG_LIMITS.MAX_FREQUENTLY_BOUGHT_TOGETHER})`}
            skus={config.frequentlyBoughtTogether}
            newSku={newSkus.frequentlyBoughtTogether}
            onNewSkuChange={(value) => setNewSkus(prev => ({ ...prev, frequentlyBoughtTogether: value }))}
            onAddSku={() => addSku('frequentlyBoughtTogether', PRODUCT_CONFIG_LIMITS.MAX_FREQUENTLY_BOUGHT_TOGETHER)}
            onRemoveSku={(sku) => removeSku('frequentlyBoughtTogether', sku)}
            maxLimit={PRODUCT_CONFIG_LIMITS.MAX_FREQUENTLY_BOUGHT_TOGETHER}
            validationResults={validationResults}
          />

          {/* Upsell Offers */}
          <SkuSection
            title="Upsell Offers"
            description={`Products shown after checkout (max ${PRODUCT_CONFIG_LIMITS.MAX_UPSELL_OFFERS})`}
            skus={config.upsellOffers}
            newSku={newSkus.upsellOffer}
            onNewSkuChange={(value) => setNewSkus(prev => ({ ...prev, upsellOffer: value }))}
            onAddSku={() => addSku('upsellOffer', PRODUCT_CONFIG_LIMITS.MAX_UPSELL_OFFERS)}
            onRemoveSku={(sku) => removeSku('upsellOffers', sku)}
            maxLimit={PRODUCT_CONFIG_LIMITS.MAX_UPSELL_OFFERS}
            validationResults={validationResults}
          />

          {/* Cross-sell Recommendations */}
          <SkuSection
            title="Cross-sell Recommendations"
            description={`Products shown throughout the site (max ${PRODUCT_CONFIG_LIMITS.MAX_CROSS_SELL_RECOMMENDATIONS})`}
            skus={config.crossSellRecommendations}
            newSku={newSkus.crossSellRecommendation}
            onNewSkuChange={(value) => setNewSkus(prev => ({ ...prev, crossSellRecommendation: value }))}
            onAddSku={() => addSku('crossSellRecommendation', PRODUCT_CONFIG_LIMITS.MAX_CROSS_SELL_RECOMMENDATIONS)}
            onRemoveSku={(sku) => removeSku('crossSellRecommendations', sku)}
            maxLimit={PRODUCT_CONFIG_LIMITS.MAX_CROSS_SELL_RECOMMENDATIONS}
            validationResults={validationResults}
          />

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={validateAllSkus}
              disabled={validating}
              variant="outline"
            >
              {validating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Validate All SKUs
            </Button>
            
            <Button
              onClick={saveConfiguration}
              disabled={saving}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface SkuSectionProps {
  title: string
  description: string
  skus: string[]
  newSku: string
  onNewSkuChange: (value: string) => void
  onAddSku: () => void
  onRemoveSku: (sku: string) => void
  maxLimit: number
  validationResults: ValidationResult[]
}

function SkuSection({
  title,
  description,
  skus,
  newSku,
  onNewSkuChange,
  onAddSku,
  onRemoveSku,
  maxLimit,
  validationResults
}: SkuSectionProps) {
  const getValidationStatus = (sku: string) => {
    return validationResults.find(r => r.sku === sku)
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-base font-medium">{title}</Label>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      
      {/* Current SKUs */}
      {skus.length > 0 && (
        <div className="space-y-2">
          {skus.map((sku) => (
            <div key={sku} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <code className="flex-1 text-sm">{sku}</code>
              {getValidationStatus(sku) ? (
                getValidationStatus(sku)?.isValid ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Valid
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="w-3 h-3 mr-1" />
                    Invalid
                  </Badge>
                )
              ) : (
                <Badge variant="secondary">Not validated</Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemoveSku(sku)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {/* Add new SKU */}
      {skus.length < maxLimit && (
        <div className="flex gap-2">
          <Input
            value={newSku}
            onChange={(e) => onNewSkuChange(e.target.value)}
            placeholder="Enter SKU"
            onKeyPress={(e) => e.key === 'Enter' && onAddSku()}
          />
          <Button
            onClick={() => {
              console.log('+ Button clicked! newSku:', newSku)
              onAddSku()
            }}
            disabled={!newSku.trim()}
            size="sm"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      {skus.length >= maxLimit && (
        <p className="text-sm text-amber-600">
          Maximum limit reached ({maxLimit} items)
        </p>
      )}
    </div>
  )
}