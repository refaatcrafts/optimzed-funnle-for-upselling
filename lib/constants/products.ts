export const PRODUCT_CONFIG = {
  defaultImage: '/placeholder.svg',
  maxRecommendations: 3,
  bundleDiscountPercentage: 0.15,
  maxRating: 5,
  minRating: 1,
} as const

export const PRODUCT_FEATURES = [
  'Traditional Italian stovetop brewing method',
  'High-grade aluminum construction',
  'Ergonomic heat-resistant handle',
  'Available in multiple sizes (3, 6, 9 cup)',
  'Compatible with gas, electric, and ceramic stovetops',
  'Easy to clean and maintain',
] as const

export const PRODUCT_IMAGES = {
  mochaPot: '/images/mocha-pot.jpg',
  coffeeBeans: '/images/coffee-beans.jpg',
  coffeeBlender: '/images/coffee-blender.jpg',
  coffeeCup1: '/images/coffee-cup-1.jpg',
  coffeeCup2: '/images/coffee-cup-2.jpg',
  coffeeCup3: '/images/coffee-cup-3.jpg',
  coffeeCup4: '/images/coffee-cup-4.jpg',
} as const

export const RECOMMENDED_PRODUCTS_DATA = [
  {
    id: 'coffee-cup-1',
    name: 'Ceramic Coffee Mug Set',
    price: 45,
    image: PRODUCT_IMAGES.coffeeCup1,
    rating: 4.6,
    reviews: 1543,
  },
  {
    id: 'coffee-cup-2',
    name: 'Espresso Cup Collection',
    price: 35,
    image: PRODUCT_IMAGES.coffeeCup2,
    rating: 4.7,
    reviews: 2156,
  },
  {
    id: 'coffee-cup-3',
    name: 'Travel Coffee Tumbler',
    price: 28,
    image: PRODUCT_IMAGES.coffeeCup3,
    rating: 4.5,
    reviews: 987,
  },
] as const