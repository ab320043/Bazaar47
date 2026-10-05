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

/**
 * Whether a staff member is a permanent hire or a temporary / seasonal
 * worker. Temp staff can be bulk-archived from the admin directory
 * once their engagement ends, without deleting their records.
 */
export type StaffType = 'permanent' | 'temp'

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
  hourlyRate: number
  nonprofitRate: number
  isActive: boolean
  status: StaffStatus

  /**
   * Permanent vs. temporary. Defaults to 'permanent' for records
   * created before this field existed.
   */
  staffType: StaffType

  // ---- Staff-editable profile fields ----
  preferredName?: string
  pronouns?: string
  bio?: string
  instagram?: string
  emergencyContactName?: string
  emergencyContactPhone?: string

  // ---- Admin-only notes ----
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
  roles: StaffRole[]
  position: StaffPosition
  hourlyRate: number
  shiftStart: string
  shiftEnd: string
  hoursWorked?: number
  estimatedHours?: number
  checkInTime?: string
  checkOutTime?: string
  breakStart?: string
  breakEnd?: string
  status: AssignmentStatus
  responsibilities: {
    before: string[]
    during: string[]
    after: string[]
  }
  notes?: string
  staffNote?: string
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
  defaultHours: number
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
  staffType?: StaffType
  eventId?: string
}

// ============================================
// NOTES
// ============================================

export interface StaffNote {
  id: string
  staffId: string
  title: string
  body: string
  createdAt: string
  updatedAt: string
}

// ============================================
// CHECKLIST
// ============================================

export type ChecklistItemKind = 'text' | 'link'

export interface ChecklistItem {
  id: string
  kind: ChecklistItemKind
  title: string
  detail?: string
  done: boolean
  createdAt: string
  updatedAt: string
}

export interface StaffChecklist {
  staffId: string
  items: ChecklistItem[]
  updatedAt: string
}