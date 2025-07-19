// Test script to verify authentication and configuration fixes
const { AdminAuthService } = require('./lib/services/admin-auth.ts')

console.log('Testing authentication fixes...')

// Test 1: Check if AdminAuthService can create auth headers
try {
  // Simulate a login session
  const session = {
    isAuthenticated: true,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    lastActivity: new Date().toISOString()
  }
  
  // Mock localStorage for server environment
  global.window = {
    localStorage: {
      getItem: () => JSON.stringify({ session, loginAttempts: [] }),
      setItem: () => {},
      removeItem: () => {}
    }
  }
  
  const headers = AdminAuthService.getAuthHeaders()
  console.log('✓ Auth headers generated successfully:', Object.keys(headers))
  
} catch (error) {
  console.log('✗ Auth header generation failed:', error.message)
}

console.log('Authentication test completed.')