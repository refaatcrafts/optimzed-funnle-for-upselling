import { AdminAuthService } from '@/lib/services/admin-auth'

export function withAdminAuth<T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>
) {
  const AdminProtectedComponent = (props: T) => {
    // This will be handled on the client side in the component
    return <WrappedComponent {...props} />
  }

  AdminProtectedComponent.displayName = `withAdminAuth(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return AdminProtectedComponent
}

export function useAdminAuth() {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, isLoading: true }
  }

  const isAuthenticated = AdminAuthService.validateSession()
  
  return {
    isAuthenticated,
    isLoading: false,
    login: AdminAuthService.authenticate.bind(AdminAuthService),
    logout: AdminAuthService.logout.bind(AdminAuthService),
    refreshSession: AdminAuthService.refreshSession.bind(AdminAuthService),
  }
}

export function requireAuth(): boolean {
  if (typeof window === 'undefined') return false
  
  const isAuthenticated = AdminAuthService.validateSession()
  
  if (!isAuthenticated) {
    window.location.href = '/admin/login'
    return false
  }
  
  // Refresh session on activity
  AdminAuthService.refreshSession()
  return true
}