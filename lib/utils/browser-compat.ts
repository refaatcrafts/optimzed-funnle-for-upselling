// Browser compatibility utilities for admin system

export function isBrowserSupported(): boolean {
  if (typeof window === 'undefined') return false

  // Check for required features
  const requiredFeatures = [
    'localStorage' in window,
    'JSON' in window,
    'Date' in window,
    'setTimeout' in window,
    'setInterval' in window,
  ]

  return requiredFeatures.every(Boolean)
}

export function getUnsupportedFeatures(): string[] {
  if (typeof window === 'undefined') return ['Server-side rendering']

  const features: { name: string; supported: boolean }[] = [
    { name: 'localStorage', supported: 'localStorage' in window },
    { name: 'JSON', supported: 'JSON' in window },
    { name: 'Date', supported: 'Date' in window },
    { name: 'setTimeout', supported: 'setTimeout' in window },
    { name: 'setInterval', supported: 'setInterval' in window },
  ]

  return features.filter(f => !f.supported).map(f => f.name)
}

export function createFallbackStorage(): Storage | null {
  if (typeof window === 'undefined') return null

  // Create in-memory storage fallback
  const memoryStorage: { [key: string]: string } = {}

  return {
    getItem: (key: string) => memoryStorage[key] || null,
    setItem: (key: string, value: string) => {
      memoryStorage[key] = value
    },
    removeItem: (key: string) => {
      delete memoryStorage[key]
    },
    clear: () => {
      Object.keys(memoryStorage).forEach(key => delete memoryStorage[key])
    },
    key: (index: number) => {
      const keys = Object.keys(memoryStorage)
      return keys[index] || null
    },
    get length() {
      return Object.keys(memoryStorage).length
    }
  }
}

export function detectBrowserIssues(): string[] {
  const issues: string[] = []

  if (typeof window === 'undefined') {
    return ['Server-side rendering environment']
  }

  // Check localStorage quota
  try {
    const testKey = '__quota_test__'
    const testData = 'x'.repeat(1024 * 1024) // 1MB test
    localStorage.setItem(testKey, testData)
    localStorage.removeItem(testKey)
  } catch (error) {
    issues.push('localStorage quota exceeded or unavailable')
  }

  // Check for private browsing mode
  try {
    const testKey = '__private_test__'
    localStorage.setItem(testKey, 'test')
    if (localStorage.getItem(testKey) !== 'test') {
      issues.push('Private browsing mode detected')
    }
    localStorage.removeItem(testKey)
  } catch (error) {
    issues.push('Private browsing mode or storage disabled')
  }

  // Check for old browser versions
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('msie') || userAgent.includes('trident')) {
    issues.push('Internet Explorer detected - limited support')
  }

  return issues
}

export function initializeBrowserCompat(): {
  supported: boolean
  issues: string[]
  storage: Storage | null
} {
  const supported = isBrowserSupported()
  const issues = detectBrowserIssues()
  
  let storage: Storage | null = null
  
  try {
    storage = window.localStorage
  } catch {
    storage = createFallbackStorage()
    issues.push('Using fallback in-memory storage')
  }

  return { supported, issues, storage }
}