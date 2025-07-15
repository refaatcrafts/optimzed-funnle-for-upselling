export const env = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  imageOptimization: process.env.NODE_ENV === 'production',
  enableAnalytics: process.env.NODE_ENV === 'production',
} as const

export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') return ''
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}