// types/staff.ts

// ============================================
// STAFF ROLES
// ============================================

export type StaffRole = 
  | 'house-manager' 
  | 'sound-tech' 
  | 'bartender' 
  | 'door-security' 
  | 'setup-staff' 
  | 'breakdown-cleanup' 
  | 'event-coordinator'

export type StaffPosition = 'manager' | 'team-member' | 'lead'

export type StaffStatus = 'active' | 'inactive' | 'on-call' | 'terminated'

// ============================================
// STAFF MEMBER
// ============================================

export interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  primaryRole: StaffRole
  position: StaffPosition
  hourlyRate: number // Base rate
  nonprofitRate: number // Reduced rate for nonprofit events
  isActive: boolean
  status: StaffStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// STAFF ASSIGNMENT
// ============================================

export type AssignmentStatus = 
  | 'assigned' 
  | 'confirmed' 
  | 'checked-in' 
  | 'in-progress' 
  | 'completed' 
  | 'cancelled'

export type EventType = 'private' | 'nonprofit' | 'community' | 'tour'

export interface StaffAssignment {
  id: string
  eventId: string
  eventName: string
  eventType: EventType
  staffId: string
  staffName: string
  role: StaffRole
  position: StaffPosition
  hourlyRate: number // Rate for this specific event
  shiftStart: string // ISO datetime
  shiftEnd: string // ISO datetime
  hoursWorked?: number
  estimatedHours?: number
  checkInTime?: string
  checkOutTime?: string
  status: AssignmentStatus
  responsibilities: {
    before: string[]
    during: string[]
    after: string[]
  }
  notes?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// ROLE DEFINITION
// ============================================

export interface RoleDefinition {
  id: StaffRole
  label: string
  icon: string
  standardRate: number
  nonprofitRate: number
  defaultHours: number // Minimum hours per shift
  responsibilities: {
    before: string[]
    during: string[]
    after: string[]
  }
  requirements: string[]
  eventTiers: EventType[]
}

// ============================================
// STAFF DASHBOARD
// ============================================

export interface StaffDashboardData {
  staff: StaffMember
  upcomingAssignments: StaffAssignment[]
  pastAssignments: StaffAssignment[]
  currentAssignment?: StaffAssignment
  totalHoursThisMonth: number
  totalEarnedThisMonth: number
  upcomingEvents: {
    date: string
    eventName: string
    role: string
    shiftStart: string
    shiftEnd: string
  }[]
}

// ============================================
// EVENT STAFFING
// ============================================

export interface EventStaffing {
  eventId: string
  eventName: string
  eventType: EventType
  assignments: StaffAssignment[]
  totalStaff: number
  totalHours: number
  totalCost: number
  isFullyStaffed: boolean
  missingRoles: StaffRole[]
}

// ============================================
// STAFF FILTERS
// ============================================

export interface StaffFilters {
  search?: string
  role?: StaffRole
  position?: StaffPosition
  status?: StaffStatus
  eventId?: string
}