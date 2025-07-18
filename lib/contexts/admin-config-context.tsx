"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AdminConfig } from '@/lib/types/admin'
import { ConfigurationManager } from '@/lib/services/config-manager'

interface AdminConfigContextType {
  config: AdminConfig
  isLoading: boolean
  updateFeature: (featureId: keyof AdminConfig['upselling'], enabled: boolean) => void
  saveConfig: () => boolean
  resetToDefaults: () => void
  isFeatureEnabled: (featureId: keyof AdminConfig['upselling']) => boolean
}

const AdminConfigContext = createContext<AdminConfigContextType | undefined>(undefined)

interface AdminConfigProviderProps {
  children: ReactNode
}

export function AdminConfigProvider({ children }: AdminConfigProviderProps) {
  const [config, setConfig] = useState<AdminConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const loadedConfig = ConfigurationManager.getConfig()
      setConfig(loadedConfig)
    } catch (error) {
      console.error('Failed to load admin config:', error)
      // Use default config on error
      const defaultConfig = ConfigurationManager.getConfig()
      setConfig(defaultConfig)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateFeature = (featureId: keyof AdminConfig['upselling'], enabled: boolean) => {
    if (!config) return

    const updatedConfig = {
      ...config,
      upselling: {
        ...config.upselling,
        [featureId]: enabled,
      },
    }

    setConfig(updatedConfig)
  }

  const saveConfig = (): boolean => {
    if (!config) return false

    const success = ConfigurationManager.saveConfig(config)
    if (success) {
      // Update local state with the saved config (includes updated timestamp)
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

  if (!config) {
    return null // or loading component
  }

  const contextValue: AdminConfigContextType = {
    config,
    isLoading,
    updateFeature,
    saveConfig,
    resetToDefaults,
    isFeatureEnabled,
  }

  return (
    <AdminConfigContext.Provider value={contextValue}>
      {children}
    </AdminConfigContext.Provider>
  )
}

export function useAdminConfig(): AdminConfigContextType {
  const context = useContext(AdminConfigContext)
  if (context === undefined) {
    throw new Error('useAdminConfig must be used within an AdminConfigProvider')
  }
  return context
}

export function useFeatureToggle(featureId: keyof AdminConfig['upselling']): boolean {
  const { isFeatureEnabled } = useAdminConfig()
  return isFeatureEnabled(featureId)
}