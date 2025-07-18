import { useState, useEffect } from 'react'
import { AdminConfig } from '@/lib/types/admin'
import { ConfigurationManager } from '@/lib/services/config-manager'
import { DEFAULT_ADMIN_CONFIG } from '@/lib/constants/admin'

/**
 * Hook that provides instant configuration with optimistic defaults
 * Components render immediately with enabled defaults, then update when server config loads
 */
export function useOptimisticConfig() {
  // Start with optimistic defaults (all features enabled)
  const [config, setConfig] = useState<AdminConfig>(() => {
    // Try to get cached config immediately, fallback to defaults
    return ConfigurationManager.getConfigSync()
  })

  useEffect(() => {
    // Listen for config updates from background loading
    const handleConfigUpdate = (event: CustomEvent<AdminConfig>) => {
      setConfig(event.detail)
    }

    window.addEventListener('configUpdated', handleConfigUpdate as EventListener)

    return () => {
      window.removeEventListener('configUpdated', handleConfigUpdate as EventListener)
    }
  }, [])

  return config
}

/**
 * Hook to check if a specific feature is enabled (with optimistic defaults)
 */
export function useFeatureEnabled(featureId: keyof AdminConfig['upselling']): boolean {
  const config = useOptimisticConfig()
  return config.upselling[featureId] ?? true // Default to enabled
}

/**
 * Hook to get all upselling features (with optimistic defaults)
 */
export function useUpsellingFeatures(): AdminConfig['upselling'] {
  const config = useOptimisticConfig()
  return config.upselling
}