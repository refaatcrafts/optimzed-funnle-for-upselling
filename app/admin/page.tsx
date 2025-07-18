"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Coffee, Settings, LogOut, Save, RotateCcw, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { AdminAuthService } from "@/lib/services/admin-auth"
import { ConfigurationManager } from "@/lib/services/config-manager"
import { FEATURE_TOGGLES } from "@/lib/constants/admin"
import { APP_CONFIG } from "@/lib/constants/app"
import { AdminConfig } from "@/lib/types/admin"
import { useSessionMonitor } from "@/lib/hooks/useSessionMonitor"
import { FeatureTestPanel } from "@/components/admin/FeatureTestPanel"

export default function AdminPage() {
  const router = useRouter()
  const [config, setConfig] = useState<AdminConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<string>("")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Set up session monitoring
  useSessionMonitor({
    onSessionExpired: () => {
      router.push('/admin/login')
    }
  })

  useEffect(() => {
    // Check authentication
    if (!AdminAuthService.validateSession()) {
      router.push('/admin/login')
      return
    }

    // Load configuration asynchronously
    const loadConfig = async () => {
      try {
        const loadedConfig = await ConfigurationManager.getConfig()
        setConfig(loadedConfig)
      } catch (error) {
        console.error('Failed to load configuration:', error)
        setSaveStatus('Failed to load configuration')
      } finally {
        setIsLoading(false)
      }
    }

    loadConfig()

    // Refresh session on activity
    AdminAuthService.refreshSession()
  }, [router])

  const handleFeatureToggle = (featureId: keyof AdminConfig['upselling'], enabled: boolean) => {
    if (!config) return

    const updatedConfig = {
      ...config,
      upselling: {
        ...config.upselling,
        [featureId]: enabled,
      },
    }

    setConfig(updatedConfig)
    setHasUnsavedChanges(true)
  }

  const handleSave = async () => {
    if (!config) return

    try {
      setSaveStatus("Saving...")
      
      // Check storage availability first
      const storageInfo = ConfigurationManager.getStorageInfo()
      if (!storageInfo.available) {
        setSaveStatus(`Storage error: ${storageInfo.error}`)
        setTimeout(() => setSaveStatus(""), 5000)
        return
      }

      const success = await ConfigurationManager.saveConfig(config)
      
      if (success) {
        setSaveStatus("Configuration saved successfully!")
        setHasUnsavedChanges(false)
        setTimeout(() => setSaveStatus(""), 3000)
      } else {
        setSaveStatus("Failed to save configuration. Please try again.")
        setTimeout(() => setSaveStatus(""), 5000)
      }
    } catch (error) {
      console.error('Save error:', error)
      setSaveStatus("An unexpected error occurred while saving.")
      setTimeout(() => setSaveStatus(""), 5000)
    }
  }

  const handleReset = async () => {
    try {
      setSaveStatus("Resetting...")
      const resetConfig = await ConfigurationManager.resetToDefaults()
      setConfig(resetConfig)
      setHasUnsavedChanges(false)
      setSaveStatus("Configuration reset to defaults")
      setTimeout(() => setSaveStatus(""), 3000)
    } catch (error) {
      console.error('Reset error:', error)
      setSaveStatus("Failed to reset configuration")
      setTimeout(() => setSaveStatus(""), 3000)
    }
  }

  const handleLogout = () => {
    AdminAuthService.logout()
    router.push('/admin/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Failed to load configuration</p>
      </div>
    )
  }

  const groupedFeatures = {
    product: FEATURE_TOGGLES.filter(f => f.category === 'product'),
    cart: FEATURE_TOGGLES.filter(f => f.category === 'cart'),
    upselling: FEATURE_TOGGLES.filter(f => f.category === 'upselling'),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coffee className="w-8 h-8 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{APP_CONFIG.name} Admin</h1>
                <p className="text-sm text-gray-600">Sales Optimization Configuration</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Unsaved Changes
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Status Messages */}
        {saveStatus && (
          <Alert className={`mb-6 ${saveStatus.includes("success") ? "border-green-200 bg-green-50" : saveStatus.includes("Failed") ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}`}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className={saveStatus.includes("success") ? "text-green-800" : saveStatus.includes("Failed") ? "text-red-800" : "text-blue-800"}>
              {saveStatus}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="text-gray-600 hover:text-gray-800"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>

        {/* Configuration Sections */}
        <div className="space-y-6 lg:space-y-8">
          {/* Product Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                <Settings className="w-5 h-5 text-orange-600" />
                Product Page Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 lg:space-y-6">
              {groupedFeatures.product.map((feature) => (
                <div key={feature.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 lg:p-4 border rounded-lg gap-3 sm:gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm lg:text-base">{feature.name}</h3>
                    <p className="text-xs lg:text-sm text-gray-600 mt-1">{feature.description}</p>
                  </div>
                  <Switch
                    checked={config.upselling[feature.id]}
                    onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked)}
                    className="self-start sm:self-center"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Cart Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                <Settings className="w-5 h-5 text-orange-600" />
                Cart & Checkout Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 lg:space-y-6">
              {groupedFeatures.cart.map((feature) => (
                <div key={feature.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 lg:p-4 border rounded-lg gap-3 sm:gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm lg:text-base">{feature.name}</h3>
                    <p className="text-xs lg:text-sm text-gray-600 mt-1">{feature.description}</p>
                  </div>
                  <Switch
                    checked={config.upselling[feature.id]}
                    onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked)}
                    className="self-start sm:self-center"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upselling Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                <Settings className="w-5 h-5 text-orange-600" />
                Upselling & Cross-selling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 lg:space-y-6">
              {groupedFeatures.upselling.map((feature) => (
                <div key={feature.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 lg:p-4 border rounded-lg gap-3 sm:gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm lg:text-base">{feature.name}</h3>
                    <p className="text-xs lg:text-sm text-gray-600 mt-1">{feature.description}</p>
                  </div>
                  <Switch
                    checked={config.upselling[feature.id]}
                    onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked)}
                    className="self-start sm:self-center"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Configuration Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Configuration Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 mb-2">Enabled Features:</p>
                <ul className="space-y-1">
                  {FEATURE_TOGGLES.filter(f => config.upselling[f.id]).map(feature => (
                    <li key={feature.id} className="text-green-600">✓ {feature.name}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-2">Disabled Features:</p>
                <ul className="space-y-1">
                  {FEATURE_TOGGLES.filter(f => !config.upselling[f.id]).map(feature => (
                    <li key={feature.id} className="text-gray-500">✗ {feature.name}</li>
                  ))}
                </ul>
              </div>
            </div>
            <Separator className="my-4" />
            <p className="text-xs text-gray-500">
              Last updated: {new Date(config.lastUpdated).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Feature Testing Panel */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Feature Testing Panel</CardTitle>
            <p className="text-sm text-gray-600">
              Test how feature toggles affect the components below. Changes apply immediately.
            </p>
          </CardHeader>
          <CardContent>
            <FeatureTestPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
