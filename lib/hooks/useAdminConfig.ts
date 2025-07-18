import { useState, useEffect } from 'react'
import { AdminConfig } from '@/lib/types/admin'
import { ConfigurationManager } from '@/lib/services/config-manager'

export function useAdminConfigStandalone() {
  const [config, setConfig] = useState<AdminConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const loadedConfig = await ConfigurationManager.getConfig()
        setConfig(loadedConfig)
      } catch (error) {
        console.error('Failed to load admin config:', error)
        // Fallback to sync version if async fails
        const defaultConfig = ConfigurationManager.getConfigSync()
        setConfig(defaultConfig)
      } finally {
        setIsLoading(false)
      }
    }

    loadConfig()
  }, [])

  const updateFeature = async (featureId: keyof AdminConfig['upselling'], enabled: boolean) => {
    if (!config) return false

    try {
      const success = await ConfigurationManager.updateFeature(featureId, enabled)
      if (success) {
        const updatedConfig = await ConfigurationManager.getConfig()
        setConfig(updatedConfig)
      }
      return success
    } catch (error) {
      console.error('Failed to update feature:', error)
      return false
    }
  }

  const saveConfig = async (configToSave?: AdminConfig): Promise<boolean> => {
    try {
      const success = await ConfigurationManager.saveConfig(configToSave)
      if (success) {
        const savedConfig = await ConfigurationManager.getConfig()
        setConfig(savedConfig)
      }
      return success
    } catch (error) {
      console.error('Failed to save config:', error)
      return false
    }
  }

  const resetToDefaults = async () => {
    try {
      const resetConfig = await ConfigurationManager.resetToDefaults()
      setConfig(resetConfig)
    } catch (error) {
      console.error('Failed to reset to defaults:', error)
    }
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
    const loadFeatureState = async () => {
      try {
        const config = await ConfigurationManager.getConfig()
        setIsEnabled(config.upselling[featureId] ?? false)
      } catch (error) {
        console.error(`Failed to check feature ${featureId}:`, error)
        // Fallback to sync version if async fails
        const enabled = ConfigurationManager.isFeatureEnabled(featureId)
        setIsEnabled(enabled)
      }
    }

    loadFeatureState()
  }, [featureId])

  return isEnabled
}