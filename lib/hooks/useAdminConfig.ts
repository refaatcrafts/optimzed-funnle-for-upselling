import { useState, useEffect } from 'react'
import { AdminConfig } from '@/lib/types/admin'
import { ConfigurationManager } from '@/lib/services/config-manager'

export function useAdminConfigStandalone() {
  // Start with optimistic config for instant rendering
  const [config, setConfig] = useState<AdminConfig>(() => {
    return ConfigurationManager.getConfigSync()
  })
  const [isLoading, setIsLoading] = useState(false) // Start as not loading since we have optimistic config

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true)
        const loadedConfig = await ConfigurationManager.getConfig()
        setConfig(loadedConfig)
      } catch (error) {
        console.error('Failed to load admin config:', error)
        // Keep optimistic config on error
      } finally {
        setIsLoading(false)
      }
    }

    loadConfig()

    // Listen for config updates
    const handleConfigUpdate = (event: CustomEvent<AdminConfig>) => {
      setConfig(event.detail)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('configUpdated', handleConfigUpdate as EventListener)
      return () => {
        window.removeEventListener('configUpdated', handleConfigUpdate as EventListener)
      }
    }
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
    if (!config) return true // Optimistic default
    return config.upselling[featureId] ?? true // Default to enabled
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
  // Start with optimistic default (enabled) for instant rendering
  const [isEnabled, setIsEnabled] = useState(() => {
    // Try to get cached config immediately, default to enabled
    const cachedConfig = ConfigurationManager.getConfigSync()
    return cachedConfig.upselling[featureId] ?? true // Default to enabled
  })

  useEffect(() => {
    // Load actual config in background and update if different
    const loadFeatureState = async () => {
      try {
        const config = await ConfigurationManager.getConfig()
        const actualEnabled = config.upselling[featureId] ?? true
        setIsEnabled(actualEnabled)
      } catch (error) {
        console.error(`Failed to check feature ${featureId}:`, error)
        // Keep optimistic default on error
      }
    }

    loadFeatureState()

    // Listen for config updates
    const handleConfigUpdate = (event: CustomEvent<AdminConfig>) => {
      const actualEnabled = event.detail.upselling[featureId] ?? true
      setIsEnabled(actualEnabled)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('configUpdated', handleConfigUpdate as EventListener)
      return () => {
        window.removeEventListener('configUpdated', handleConfigUpdate as EventListener)
      }
    }
  }, [featureId])

  return isEnabled
}