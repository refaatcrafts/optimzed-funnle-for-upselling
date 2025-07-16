import { UpsellOffer, CrossSellGroup } from '@/lib/types/upsell'
import { PRODUCT_IMAGES } from './products'

export const UPSELL_CONFIG = {
  timeLimit: 15, // minutes
  maxUpsellOffers: 2,
  discountPercentage: 25,
  urgencyMessages: [
    "⚡ Limited time offer - expires in {time}!",
    "🔥 Only available for the next {time}!",
    "⏰ Special deal ends in {time}!",
  ],
} as const

export const UPSELL_OFFERS: UpsellOffer[] = [
  {
    id: 'premium-coffee-beans-upsell',
    title: 'Upgrade Your Coffee Experience',
    subtitle: 'Add premium coffee beans to complete your setup',
    originalPrice: 45,
    upsellPrice: 29,
    savings: 16,
    product: {
      id: 'premium-coffee-beans',
      name: 'Premium Arabica Coffee Beans (2kg)',
      price: 29,
      originalPrice: 45,
      image: PRODUCT_IMAGES.coffeeBeans,
      rating: 4.8,
      reviews: 2341,
    },
    urgencyText: '⚡ Limited time offer - expires in 15 minutes!',
    features: [
      'Premium single-origin Arabica beans',
      'Freshly roasted within 48 hours',
      'Perfect for your new mocha pot',
      '2kg bag (double the standard size)',
      'Free shipping included',
    ],
    isLimitedTime: true,
    timeLeft: 15,
  },
  {
    id: 'coffee-accessories-bundle-upsell',
    title: 'Complete Your Coffee Station',
    subtitle: 'Professional barista accessories at 30% off',
    originalPrice: 89,
    upsellPrice: 59,
    savings: 30,
    product: {
      id: 'coffee-accessories-bundle',
      name: 'Professional Coffee Accessories Bundle',
      price: 59,
      originalPrice: 89,
      image: PRODUCT_IMAGES.coffeeCup1,
      rating: 4.7,
      reviews: 1876,
    },
    urgencyText: '🔥 Only available for the next 10 minutes!',
    features: [
      'Professional coffee grinder',
      'Stainless steel measuring spoons',
      'Coffee storage canister',
      'Cleaning brush set',
      'Barista guide included',
    ],
    isLimitedTime: true,
    timeLeft: 10,
  },
]

export const CROSS_SELL_GROUPS: CrossSellGroup[] = [
  {
    id: 'coffee-cups-collection',
    title: 'Complete Your Coffee Experience',
    subtitle: 'Customers who bought your items also loved these',
    products: [
      {
        id: 'ceramic-mug-set',
        name: 'Artisan Ceramic Mug Set',
        price: 35,
        originalPrice: 45,
        image: PRODUCT_IMAGES.coffeeCup1,
        rating: 4.6,
        reviews: 1543,
      },
      {
        id: 'espresso-cups',
        name: 'Italian Espresso Cup Set',
        price: 28,
        originalPrice: 35,
        image: PRODUCT_IMAGES.coffeeCup2,
        rating: 4.7,
        reviews: 2156,
      },
      {
        id: 'travel-tumbler',
        name: 'Insulated Travel Tumbler',
        price: 24,
        originalPrice: 32,
        image: PRODUCT_IMAGES.coffeeCup3,
        rating: 4.5,
        reviews: 987,
      },
    ],
    discount: 20,
  },
  {
    id: 'coffee-maintenance',
    title: 'Keep Your Equipment Perfect',
    subtitle: 'Essential maintenance products for long-lasting performance',
    products: [
      {
        id: 'cleaning-kit',
        name: 'Coffee Equipment Cleaning Kit',
        price: 19,
        originalPrice: 25,
        image: PRODUCT_IMAGES.coffeeBlender,
        rating: 4.4,
        reviews: 892,
      },
      {
        id: 'descaling-solution',
        name: 'Natural Descaling Solution',
        price: 15,
        originalPrice: 20,
        image: PRODUCT_IMAGES.coffeeBeans,
        rating: 4.3,
        reviews: 654,
      },
    ],
    discount: 15,
  },
]

export const UPSELL_MESSAGES = {
  acceptButton: 'Yes, Add This Deal!',
  declineButton: 'No Thanks, Continue',
  savingsText: (savings: number) => `Save $${savings} Today!`,
  urgencyText: (minutes: number) => `Only ${minutes} minutes left!`,
  thankYouTitle: 'Thank You for Your Purchase!',
  crossSellTitle: 'Before You Go...',
  crossSellSubtitle: 'Complete your coffee setup with these popular additions',
} as const