// types/winter-market.ts

export type WinterMarketPaymentStatus =
  | 'pending'
  | 'paid'
  | 'refunded'
  | 'expired'

export interface WinterMarketApplication {
  id: string
  fullName: string
  email: string
  phone: string
  instagram?: string
  businessName: string
  products: string
  needsTable: boolean
  needsTent: boolean
  needsElectricity: boolean
  needsExtensionCord: boolean
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
  email: string
  phone: string
  instagram?: string
  businessName: string
  products: string
  needsTable: boolean
  needsTent: boolean
  needsElectricity: boolean
  needsExtensionCord: boolean
  selectedDates: string[]
}