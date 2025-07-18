import { useEffect, useCallback } from 'react'
import { AdminAuthService } from '@/lib/services/admin-auth'

interface UseSessionMonitorOptions {
  onSessionExpired?: () => void
  refreshInterval?: number
  activityEvents?: string[]
}

export function useSessionMonitor({
  onSessionExpired,
  refreshInterval = 60000, // 1 minute
  activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
}: UseSessionMonitorOptions = {}) {
  
  const handleActivity = useCallback(() => {
    if (AdminAuthService.validateSession()) {
      AdminAuthService.refreshSession()
    }
  }, [])

  const checkSession = useCallback(() => {
    if (!AdminAuthService.validateSession()) {
      onSessionExpired?.()
    }
  }, [onSessionExpired])

  useEffect(() => {
    // Set up activity listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Set up periodic session check
    const sessionInterval = setInterval(checkSession, refreshInterval)

    return () => {
      // Clean up activity listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      
      // Clean up interval
      clearInterval(sessionInterval)
    }
  }, [handleActivity, checkSession, refreshInterval, activityEvents])

  return {
    refreshSession: AdminAuthService.refreshSession,
    validateSession: AdminAuthService.validateSession,
    logout: AdminAuthService.logout,
  }
}