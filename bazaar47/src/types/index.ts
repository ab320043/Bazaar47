// types/index.ts

// ===== EVENT TYPES =====
export interface EventDefinition {
  id: string
  slug: string
  name: string
  type: 'tour' | 'block-party' | 'concert' | 'custom'
  status: 'upcoming' | 'active' | 'past' | 'completed'
  date: string
  dateDisplay: string
  time: string
  location: string
  address: string
  city?: string
  capacity?: number
  hasVendors: boolean
  hasRSVP: boolean
  hasDanceSignup: boolean
  isFree: boolean
  price?: number
  description: string
  image?: unknown
  ticketUrl?: string
  rsvpUrl?: string
  parentEventId?: string
}

// ===== SUBMISSION TYPES =====
export type SubmissionDataUnion = Record<string, string | number | string[] | boolean | undefined>

export interface VendorData {
  [key: string]: string | number | string[] | boolean | undefined
  fullName: string
  email: string
  businessName: string
  phone: string
  selectedCities: string[]
  city: string
  instagram: string
  instagramLink: string
  products: string
  pricePoints: string
  bio: string
  vendorHighlight: string
  photography: string
  promotion: string
  bringItems: string
  noiseSensitive: string
  payFee: string
  recommendVendors?: string
  additionalInfo?: string
  preferredName?: string
  pronouns?: string
}

export interface RSVPData {
  [key: string]: string | number | string[] | boolean | undefined
  fullName: string
  email: string
  tickets: number
  eventCity: string
  city: string
  instagram?: string
  zipCode?: string
  eventId?: string
  venue?: string
  date?: string
  paymentStatus?: string
  totalPrice?: string
}

export interface DanceSignupData {
  [key: string]: string | number | string[] | boolean | undefined
  firstName: string
  lastName: string
  dancerName: string
  instagram: string
  email: string
  city: string
  eventId: string
  eventName: string
  signupNumber: string
}

export interface Submission {
  id: string
  timestamp: string
  type: 'vendor' | 'rsvp' | 'dance-signup' | 'ticket'
  eventId: string
  eventSlug: string
  data: SubmissionDataUnion
}

export interface VendorSubmission extends Submission {
  type: 'vendor'
  data: VendorData
}

export interface RSVPSubmission extends Submission {
  type: 'rsvp'
  data: RSVPData
}

export interface DanceSignupSubmission extends Submission {
  type: 'dance-signup'
  data: DanceSignupData
}

// ===== STATS TYPES =====
export interface CityStats {
  name: string
  total: number
  vendors: number
  rsvps: number
  totalTickets: number
  capacity?: number
  percentage?: number
}

export interface EventStats {
  totalSubmissions: number
  totalVendors: number
  totalRSVPs: number
  totalDanceSignups: number
  totalTickets: number
  uniqueCities: number
  conversionRate: number
  fillRate?: number
}

export interface EventOverviewStats {
  eventId: string
  eventName: string
  eventType: string
  status: string
  totalSubmissions: number
  totalVendors: number
  totalRSVPs: number
  totalDanceSignups: number
  totalTickets: number
}

// ===== STAFF TYPES =====
export interface StaffMember {
  id: string
  name: string
  email: string
  phone?: string
  primaryRole: 'house' | 'sound' | 'bar' | 'door' | 'setup' | 'manager'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface StaffAssignment {
  id: string
  eventId: string
  staffId: string
  role: string
  responsibilities: string[]
  shiftStart: string
  shiftEnd: string
  hourlyRate: number
  hoursWorked?: number
  checkInTime?: string
  checkOutTime?: string
  status: 'assigned' | 'confirmed' | 'checked-in' | 'completed'
}

// ===== TYPE GUARDS =====
export function isVendorData(data: SubmissionDataUnion): data is VendorData {
  return 'businessName' in data && 'selectedCities' in data && Array.isArray(data.selectedCities)
}

export function isRSVPData(data: SubmissionDataUnion): data is RSVPData {
  return 'tickets' in data && 'eventCity' in data
}

export function isDanceSignupData(data: SubmissionDataUnion): data is DanceSignupData {
  return 'firstName' in data && 'lastName' in data && 'dancerName' in data
}