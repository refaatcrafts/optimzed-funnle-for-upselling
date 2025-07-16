import { Product } from './index'

export interface UpsellOffer {
  id: string
  title: string
  subtitle: string
  originalPrice: number
  upsellPrice: number
  savings: number
  product: Product
  urgencyText?: string
  features: string[]
  isLimitedTime?: boolean
  timeLeft?: number // in minutes
}

export interface CrossSellGroup {
  id: string
  title: string
  subtitle: string
  products: Product[]
  discount?: number
  bundlePrice?: number
}

export interface PurchaseData {
  orderId: string
  items: Product[]
  total: number
  customerEmail?: string
  purchaseDate: Date
}

export interface UpsellPageProps {
  purchaseData: PurchaseData
  upsellOffers: UpsellOffer[]
  onAcceptUpsell: (offer: UpsellOffer) => void
  onDeclineUpsell: () => void
}

export interface ThankYouPageProps {
  purchaseData: PurchaseData
  crossSellGroups: CrossSellGroup[]
  onAddCrossSell: (product: Product) => void
}