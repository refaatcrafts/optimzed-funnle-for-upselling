# Design Document

## Overview

This design document outlines the comprehensive refactoring approach for the e-commerce coffee shop application. The refactoring will transform the current codebase into a well-structured, maintainable, and scalable application following modern React and Next.js best practices while preserving all existing functionality.

## Architecture

### Current State Analysis

The current application has several areas for improvement:
- Mixed business logic and presentation logic in components
- Duplicated type definitions across files
- Hardcoded constants scattered throughout components
- Large, monolithic components that handle multiple responsibilities
- Inconsistent error handling and loading states
- No centralized state management patterns

### Target Architecture

The refactored application will follow a layered architecture with clear separation of concerns:

```
src/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components
│   ├── ui/                # Base UI components (shadcn/ui)
│   ├── layout/            # Layout-specific components
│   ├── product/           # Product-related components
│   └── cart/              # Cart-related components
├── lib/                   # Utility functions and configurations
│   ├── types/             # TypeScript type definitions
│   ├── constants/         # Application constants
│   ├── utils/             # Utility functions
│   ├── hooks/             # Custom React hooks
│   └── services/          # API and business logic services
├── styles/                # Global styles and theme configuration
└── public/                # Static assets
```

## Components and Interfaces

### Type System Design

**Core Types (`lib/types/index.ts`)**
```typescript
export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviews: number
  description?: string
  features?: string[]
}

export interface CartItem extends Product {
  quantity: number
  addedAt: Date
}

export interface Bundle {
  id: string
  name: string
  products: Product[]
  originalTotal: number
  bundlePrice: number
  savings: number
}

export interface CartState {
  items: CartItem[]
  total: number
  count: number
  shippingThreshold: number
}
```

### Component Architecture

**1. Layout Components (`components/layout/`)**
- `Navigation.tsx` - Simplified navigation with extracted cart logic
- `Footer.tsx` - Application footer (to be created)
- `Layout.tsx` - Main layout wrapper

**2. Product Components (`components/product/`)**
- `ProductCard.tsx` - Reusable product display card
- `ProductGallery.tsx` - Product image gallery
- `ProductDetails.tsx` - Product information display
- `ProductFeatures.tsx` - Product features list
- `BundleOffer.tsx` - Bundle promotion component
- `RecommendedProducts.tsx` - Product recommendations

**3. Cart Components (`components/cart/`)**
- `CartProvider.tsx` - Enhanced cart context provider
- `CartSheet.tsx` - Cart sidebar component
- `CartItem.tsx` - Individual cart item component
- `CartSummary.tsx` - Cart totals and shipping progress
- `AddToCartModal.tsx` - Add to cart confirmation modal

**4. Common Components (`components/common/`)**
- `LoadingSpinner.tsx` - Consistent loading indicator
- `ErrorBoundary.tsx` - Error handling component
- `StarRating.tsx` - Reusable star rating display
- `PriceDisplay.tsx` - Consistent price formatting

### Custom Hooks Design

**1. Cart Management (`lib/hooks/useCart.ts`)**
```typescript
export interface UseCartReturn {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: number
  count: number
  shippingProgress: number
  qualifiesForFreeShipping: boolean
}
```

**2. Product Management (`lib/hooks/useProduct.ts`)**
```typescript
export interface UseProductReturn {
  product: Product | null
  bundle: Bundle | null
  isLoading: boolean
  error: string | null
  updateProduct: (updates: Partial<Product>) => Promise<void>
}
```

**3. Local Storage (`lib/hooks/useLocalStorage.ts`)**
```typescript
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void]
```

## Data Models

### Product Data Model
```typescript
interface ProductData {
  // Core product information
  id: string
  name: string
  price: number
  originalPrice?: number
  
  // Media and presentation
  image: string
  images?: string[]
  
  // Social proof
  rating: number
  reviews: number
  
  // Additional information
  description?: string
  features?: string[]
  specifications?: Record<string, string>
  
  // Metadata
  createdAt?: Date
  updatedAt?: Date
}
```

### Cart Data Model
```typescript
interface CartData {
  items: CartItem[]
  metadata: {
    createdAt: Date
    updatedAt: Date
    sessionId?: string
  }
  totals: {
    subtotal: number
    shipping: number
    tax: number
    total: number
  }
  shipping: {
    threshold: number
    progress: number
    qualifies: boolean
  }
}
```

## Error Handling

### Error Boundary Implementation
```typescript
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ProductErrorBoundary extends Component<
  PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  // Catch and handle component errors gracefully
}
```

### Async Error Handling
```typescript
interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

// Consistent error handling across all async operations
function useAsyncOperation<T>(): AsyncState<T> & {
  execute: (operation: () => Promise<T>) => Promise<void>
}
```

## Testing Strategy

### Unit Testing
- **Components**: Test rendering, props handling, and user interactions
- **Hooks**: Test state management and side effects
- **Utilities**: Test pure functions and data transformations

### Integration Testing
- **Cart Flow**: Test adding/removing items, quantity updates
- **Product Display**: Test product loading and error states
- **Navigation**: Test routing and state persistence

### Testing Tools
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing utilities
- **MSW (Mock Service Worker)**: API mocking for tests

## Performance Optimizations

### React Optimizations
1. **Memoization**: Use `React.memo`, `useMemo`, and `useCallback` strategically
2. **Code Splitting**: Implement lazy loading for non-critical components
3. **Bundle Analysis**: Optimize bundle size and eliminate unused code

### Image Optimizations
1. **Next.js Image**: Use optimized Image component throughout
2. **Lazy Loading**: Implement intersection observer for below-fold images
3. **Responsive Images**: Serve appropriate sizes for different viewports

### State Management Optimizations
1. **Context Splitting**: Separate frequently changing state from stable state
2. **Selective Updates**: Minimize unnecessary re-renders
3. **Local Storage**: Persist cart state across sessions

## Configuration Management

### Constants Organization (`lib/constants/`)
```typescript
// app.ts
export const APP_CONFIG = {
  name: 'CoffeeCraft',
  description: 'Premium Italian Coffee Products',
  version: '1.0.0'
} as const

// cart.ts
export const CART_CONFIG = {
  freeShippingThreshold: 300,
  maxQuantityPerItem: 10,
  sessionStorageKey: 'coffeecraft-cart'
} as const

// products.ts
export const PRODUCT_CONFIG = {
  defaultImage: '/placeholder.svg',
  maxRecommendations: 3,
  bundleDiscountPercentage: 0.15
} as const
```

### Environment Configuration
```typescript
// lib/config/env.ts
export const env = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  imageOptimization: process.env.NODE_ENV === 'production'
} as const
```

## Styling and Theming

### Design System Enhancement
1. **Color Tokens**: Extend existing Tailwind theme with coffee-specific colors
2. **Component Variants**: Create consistent component styling patterns
3. **Responsive Design**: Ensure mobile-first responsive design
4. **Accessibility**: Implement WCAG 2.1 AA compliance

### CSS Architecture
```typescript
// styles/theme.ts
export const theme = {
  colors: {
    brand: {
      orange: {
        50: '#fff7ed',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c'
      }
    }
  },
  spacing: {
    section: '5rem',
    component: '2rem'
  }
} as const
```

## Migration Strategy

### Phase 1: Foundation
1. Set up new directory structure
2. Create type definitions
3. Extract constants and configuration

### Phase 2: Component Refactoring
1. Break down large components
2. Extract custom hooks
3. Implement error boundaries

### Phase 3: Optimization
1. Add performance optimizations
2. Implement testing
3. Add accessibility improvements

### Phase 4: Polish
1. Code review and cleanup
2. Documentation updates
3. Final testing and validation

## Security Considerations

### Input Validation
- Validate all user inputs on both client and server
- Sanitize data before processing
- Implement proper error messages without exposing sensitive information

### State Management Security
- Avoid storing sensitive data in client-side state
- Implement proper session management
- Use secure storage for persistent data

## Accessibility Compliance

### WCAG 2.1 AA Standards
1. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
2. **Screen Reader Support**: Implement proper ARIA labels and roles
3. **Color Contrast**: Maintain sufficient contrast ratios
4. **Focus Management**: Implement visible focus indicators

### Implementation Details
- Use semantic HTML elements
- Implement proper heading hierarchy
- Add alt text for all images
- Ensure form labels are properly associated