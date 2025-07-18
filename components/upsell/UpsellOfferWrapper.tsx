import { UpsellOffer } from './UpsellOffer'
import { UpsellOffer as UpsellOfferType } from '@/lib/types/upsell'
import { useFeatureToggleStandalone } from '@/lib/hooks/useAdminConfig'

interface UpsellOfferWrapperProps {
  offer: UpsellOfferType
  onAccept: (offer: UpsellOfferType) => void
  onDecline: () => void
  isLoading?: boolean
}

export function UpsellOfferWrapper({ offer, onAccept, onDecline, isLoading }: UpsellOfferWrapperProps) {
  const isEnabled = useFeatureToggleStandalone('postCartUpsellOffers')
  
  // Don't render if feature is disabled
  if (!isEnabled) {
    // Auto-decline if feature is disabled
    onDecline()
    return null
  }

  return (
    <UpsellOffer
      offer={offer}
      onAccept={onAccept}
      onDecline={onDecline}
      isLoading={isLoading}
    />
  )
}