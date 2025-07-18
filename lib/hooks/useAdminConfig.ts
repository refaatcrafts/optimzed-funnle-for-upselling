import { useState, useEffect } from 'react'
import { AdminConfig } from '@/lib/types/admin'
import { ConfigurationManager } from '@/lib/services/config-manager'

export function useAdminConfigStandalone() {
  const [config, setConfig] = useState<AdminConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const loadedConfig = ConfigurationManager.getConfig()
      setConfig(loadedConfig)
    } catch (error) {
      console.error('Failed to load admin config:', error)
      const defaultConfig = ConfigurationManager.getConfig()
      setConfig(defaultConfig)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateFeature = (featureId: keyof AdminConfig['upselling'], enabled: boolean) => {
    if (!config) return false

    const success = ConfigurationManager.updateFeature(featureId, enabled)
    if (success) {
      const updatedConfig = ConfigurationManager.getConfig()
      setConfig(updatedConfig)
    }
    return success
  }

  const saveConfig = (configToSave?: AdminConfig): boolean => {
    const success = ConfigurationManager.saveConfig(configToSave)
    if (success) {
      const savedConfig = ConfigurationManager.getConfig()
      setConfig(savedConfig)
    }
    return success
  }

  const resetToDefaults = () => {
    ConfigurationManager.resetToDefaults()
    const resetConfig = ConfigurationManager.getConfig()
    setConfig(resetConfig)
  }

  const isFeatureEnabled = (featureId: keyof AdminConfig['upselling']): boolean => {
    if (!config) return false
    return config.upselling[featureId] ?? false
  }

  return {
    config,
    isLoading,
    updateFeature,
    saveConfig,
    resetToDefaults,
    isFeatureEnabled,
  }
}

export function useFeatureToggleStandalone(featureId: keyof AdminConfig['upselling']): boolean {
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    try {
      const enabled = ConfigurationManager.isFeatureEnabled(featureId)
      setIsEnabled(enabled)
    } catch (error) {
      console.error(`Failed to check feature ${featureId}:`, error)
      setIsEnabled(false)
    }
  }, [featureId])

  return isEnabled
}