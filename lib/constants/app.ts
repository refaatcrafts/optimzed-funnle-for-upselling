export const APP_CONFIG = {
  name: 'CoffeeCraft',
  description: 'Premium Italian Coffee Products',
  version: '1.0.0',
  tagline: 'Discover authentic Italian coffee products including mocha pots, coffee blenders, and premium beans.',
} as const

export const NAVIGATION_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/product', label: 'Products' },
  { href: '/admin', label: 'Admin' },
  { href: '/checkout', label: 'Checkout' },
] as const

export const SOCIAL_LINKS = {
  twitter: '#',
  facebook: '#',
  instagram: '#',
} as const