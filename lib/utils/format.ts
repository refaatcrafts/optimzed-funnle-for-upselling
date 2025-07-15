/**
 * Format price with currency symbol
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

/**
 * Format number with commas for thousands
 */
export function formatNumber(num: number): string {
  return num.toLocaleString()
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercentage(originalPrice: number, salePrice: number): number {
  if (originalPrice <= 0) return 0
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
}

/**
 * Calculate savings amount
 */
export function calculateSavings(originalPrice: number, salePrice: number): number {
  return Math.max(0, originalPrice - salePrice)
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}