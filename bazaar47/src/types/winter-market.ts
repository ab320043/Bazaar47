// types/winter-market.ts

export type WinterMarketPaymentStatus =
  | 'pending'
  | 'paid'
  | 'refunded'
  | 'expired'

export interface WinterMarketApplication {
  id: string
  fullName: string
  preferredName?: string
  pronouns?: string
  businessName: string
  phone: string
  email: string
  instagram: string
  city: string
  products: string
  pricePoints: string
  portfolioLink: string
  soundSensitivity: string
  accessibilityNeeds?: string
  consentHighlight: string
  consentMedia: string
  liabilityAgreement: boolean
  
  selectedDates: string[]
  paymentStatus: WinterMarketPaymentStatus
  stripePaymentIntentId?: string
  totalPaid?: number
  holdExpiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface WinterMarketAvailability {
  date: string
  spotsTaken: number
  spotsTotal: number
  spotsRemaining: number
  isFull: boolean
}

export interface WinterMarketApplyPayload {
  fullName: string
  preferredName?: string
  pronouns?: string
  businessName: string
  phone: string
  email: string
  instagram: string
  city: string
  products: string
  pricePoints: string
  portfolioLink: string
  soundSensitivity: string
  accessibilityNeeds?: string
  consentHighlight: string
  consentMedia: string
  liabilityAgreement: boolean
  selectedDates: string[]
}