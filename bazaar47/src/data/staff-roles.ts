// data/staff-roles.ts
import type { RoleDefinition, StaffRole, EventType } from '@/types/staff'

// ============================================
// ROLE DEFINITIONS WITH RESPONSIBILITIES
// ============================================

export const STAFF_ROLES: RoleDefinition[] = [
  // ==========================================
  // 1. HOUSE MANAGER
  // ==========================================
  {
    id: 'house-manager',
    label: 'House Manager',
    icon: '🏠',
    standardRate: 30,
    nonprofitRate: 20,
    defaultHours: 6,
    eventTiers: ['private', 'nonprofit', 'community', 'tour'],
    responsibilities: {
      before: [
        'Open venue and prepare the space for client arrival',
        'Confirm event setup is complete according to approved floor plan',
        'Ensure all event staff have arrived and checked in',
        'Address any last-minute setup issues before guests arrive',
      ],
      during: [
        'Serve as primary point of contact for client and event staff',
        'Maintain consistent communication with client',
        'Monitor event flow and proactively resolve issues',
        'Respond promptly to client requests and staff needs',
        'Step into staff positions as needed for coverage',
        'Keep venue clean, organized, and operating efficiently',
      ],
      after: [
        'Oversee guest departure and ensure staff completes breakdown',
        'Complete venue closing procedure',
        'Verify all clients and vendors have exited',
        'Ensure venue is clean and reset as required',
        'Secure building: lock doors, turn off lights, turn off AC',
        'Report any damages, maintenance issues, or incidents',
        'Record event feedback',
      ],
    },
    requirements: [
      'Excellent communication skills',
      'Leadership experience',
      'Problem-solving skills',
      'Ability to work under pressure',
    ],
  },

  // ==========================================
  // 2. SOUND TECHNICIAN
  // ==========================================
  {
    id: 'sound-tech',
    label: 'Sound Technician',
    icon: '🔊',
    standardRate: 30,
    nonprofitRate: 15,
    defaultHours: 6,
    eventTiers: ['private', 'tour'],
    responsibilities: {
      before: [
        'Arrive early to set up all sound equipment',
        'Test microphones, speakers, mixer, music playback',
        'Coordinate with House Manager and client on event timeline',
        'Resolve any technical issues before guests arrive',
      ],
      during: [
        'Operate sound system throughout the event',
        'Manage audio cues according to event schedule',
        'Monitor sound quality and adjust audio levels',
        'Respond quickly to technical issues or client requests',
        'Coordinate with House Manager for smooth transitions',
        'Remain near stage for duration of event',
      ],
      after: [
        'Power down, disconnect, and safely pack sound equipment',
        'Ensure all equipment is accounted for and stored properly',
        'Report any equipment malfunctions, damage, or missing items',
        'Leave sound area clean and organized',
      ],
    },
    requirements: [
      'Audio equipment knowledge',
      'Technical troubleshooting skills',
      'Attention to detail',
      'Experience with PA systems',
    ],
  },

  // ==========================================
  // 3. BARTENDER
  // ==========================================
  {
    id: 'bartender',
    label: 'Bartender',
    icon: '🍸',
    standardRate: 25,
    nonprofitRate: 10,
    defaultHours: 5,
    eventTiers: ['private', 'nonprofit', 'tour'],
    responsibilities: {
      before: [
        'Arrive early to set up bar according to event requirements',
        'Stock all beverages, mixers, garnishes, ice, cups, napkins',
        'Prep ingredients and batch drinks for specialty cocktails',
        'Ensure drink menu is up to date and clearly displayed',
        'Confirm specialty drink menus or client requests are ready',
        'Coordinate with House Manager on event timeline and service expectations',
      ],
      during: [
        'Provide friendly, efficient, and professional beverage service',
        'Monitor inventory and restock supplies as needed',
        'Keep bar area clean, organized, and free of clutter',
        'Verify legal drinking age with wristbands or IDs',
        'Serve alcohol responsibly in accordance with applicable laws',
        'Communicate with House Manager regarding any issues',
      ],
      after: [
        'Close bar according to venue procedures',
        'Dispose of trash, empty ice, clean all bar equipment and surfaces',
        'Return remaining inventory and supplies to storage locations',
        'Report any damaged, missing, or low-stock items',
        'Leave bar clean, organized, and ready for next event',
      ],
    },
    requirements: [
      'Bartending experience',
      'Knowledge of drink recipes',
      'Customer service skills',
      'Ability to work in fast-paced environment',
    ],
  },

  // ==========================================
  // 4. DOOR + SECURITY
  // ==========================================
  {
    id: 'door-security',
    label: 'Door + Security',
    icon: '🚪',
    standardRate: 15,
    nonprofitRate: 15,
    defaultHours: 4,
    eventTiers: ['private', 'nonprofit', 'community', 'tour'],
    responsibilities: {
      before: [
        'Arrive on time and check in with House Manager',
        'Set up door area with table and chair',
        'Organize cash box, guest counter, under-21 clicker, sharpie, wristbands, POS system',
        'Count starting cash in cash box and record opening amount',
        'Test walkie talkies or communication devices',
        'Review guest list, ticketing procedures, and event-specific instructions',
      ],
      during: [
        'Welcome guests in a friendly and professional manner',
        'Check tickets and verify IDs as required',
        'Issue wristbands to guests 21+ and mark "X" on hands of guests under 21',
        'Monitor entrances and exits throughout the event',
        'Prevent unauthorized entry and notify manager of concerns',
        'Use guest counter to track total attendance',
        'Use separate clicker to track guests under 21',
        'Assist guests with directions and general questions',
        'Observe guest behavior and report safety or security concerns',
        'Communicate with House Manager regarding incidents or assistance',
      ],
      after: [
        'Monitor guest exits for safe and orderly departure',
        'Return cash box to House Manager',
        'Report final attendance count (total and under-21)',
        'Report any incidents, lost and found items, or maintenance concerns',
        'Leave entrance area clean and ready for next event',
      ],
    },
    requirements: [
      'Excellent communication skills',
      'Security awareness',
      'Attention to detail',
      'Ability to handle difficult situations',
    ],
  },

  // ==========================================
  // 5. SETUP STAFF
  // ==========================================
  {
    id: 'setup-staff',
    label: 'Set-Up Staff',
    icon: '🪑',
    standardRate: 20,
    nonprofitRate: 0, // Not included in nonprofit model
    defaultHours: 2,
    eventTiers: ['private', 'community'],
    responsibilities: {
      before: [
        'Arrive on time and check in with House Manager',
        'Review event floor plan and setup instructions',
        'Set up tables, chairs, and furniture according to floor plan',
        'Arrange decor, signage, and event materials as directed',
        'Set up stage, vendor areas, or other event-specific spaces',
        'Ensure trash cans are lined and placed in designated locations',
        'Stock restrooms with supplies',
        'Sweep, mop, and spot clean all event spaces',
        'Wipe down and sanitize tables, chairs, counters, and high-touch surfaces',
        'Check that walkways, entrances, and exits are clean and free of hazards',
        'Verify all setup is complete and event spaces are guest-ready',
        'Report any maintenance issues or setup concerns',
      ],
      during: [],
      after: [
        'Return to venue after event if needed for breakdown',
        'Assist with furniture reset and cleanup',
      ],
    },
    requirements: [
      'Physical stamina',
      'Attention to detail',
      'Ability to follow instructions',
      'Ability to lift heavy objects',
    ],
  },

  // ==========================================
  // 6. BREAKDOWN & CLEANUP
  // ==========================================
  {
    id: 'breakdown-cleanup',
    label: 'Breakdown & Cleanup',
    icon: '🧹',
    standardRate: 20,
    nonprofitRate: 15,
    defaultHours: 2,
    eventTiers: ['private', 'nonprofit', 'community'],
    responsibilities: {
      before: [],
      during: [],
      after: [
        'Complete post-event breakdown and cleanup',
        'Reset furniture to original configuration',
        'Remove trash and recycling',
        'Clean all event spaces',
        'Wipe down and sanitize surfaces',
        'Sweep and mop floors as needed',
        'Restock restrooms with supplies',
        'Report any damages, maintenance issues, or missing items',
        'Leave venue clean and ready for normal operations',
      ],
    },
    requirements: [
      'Physical stamina',
      'Attention to detail',
      'Efficiency',
      'Ability to work independently',
    ],
  },

  // ==========================================
  // 7. EVENT COORDINATOR
  // ==========================================
  {
    id: 'event-coordinator',
    label: 'Event Coordinator',
    icon: '📋',
    standardRate: 30,
    nonprofitRate: 20,
    defaultHours: 6,
    eventTiers: ['private', 'nonprofit', 'community', 'tour'],
    responsibilities: {
      before: [
        'Review event details and requirements with client',
        'Coordinate with all staff on roles and timeline',
        'Ensure all permits and documentation are in order',
        'Confirm vendor arrival and setup schedules',
        'Prepare event run sheet and distribute to staff',
        'Verify all equipment and supplies are available',
      ],
      during: [
        'Oversee entire event operation',
        'Serve as main point of contact for all parties',
        'Troubleshoot issues and make quick decisions',
        'Ensure timeline is followed',
        'Coordinate with venue operations',
        'Handle any emergencies or unexpected situations',
      ],
      after: [
        'Conduct post-event walkthrough',
        'Collect feedback from client and staff',
        'Document any incidents or issues',
        'Complete final check with House Manager',
        'Prepare event report for management',
      ],
    },
    requirements: [
      'Event planning experience',
      'Strong leadership skills',
      'Excellent communication skills',
      'Ability to multitask',
    ],
  },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getRoleById(id: StaffRole | string): RoleDefinition | undefined {
  return STAFF_ROLES.find(r => r.id === id)
}

export function getRolesForEventTier(tier: EventType): RoleDefinition[] {
  return STAFF_ROLES.filter(r => r.eventTiers.includes(tier))
}

export function getRateForRole(roleId: StaffRole, eventType: EventType): number {
  const role = getRoleById(roleId)
  if (!role) return 0
  return eventType === 'nonprofit' ? role.nonprofitRate : role.standardRate
}

export function getStaffRoleLabel(roleId: StaffRole): string {
  const role = getRoleById(roleId)
  return role?.label || roleId
}

export function getStaffRoleIcon(roleId: StaffRole): string {
  const role = getRoleById(roleId)
  return role?.icon || '👤'
}

export function getResponsibilitiesForRole(roleId: StaffRole): { before: string[]; during: string[]; after: string[] } {
  const role = getRoleById(roleId)
  return role?.responsibilities || { before: [], during: [], after: [] }
}

// Map of staff roles to their default assignment
export const DEFAULT_STAFF_ASSIGNMENT: Record<string, string[]> = {
  'private': ['house-manager', 'bartender', 'door-security', 'event-coordinator'],
  'nonprofit': ['house-manager', 'bartender', 'door-security', 'breakdown-cleanup'],
  'community': ['house-manager', 'door-security', 'event-coordinator'],
  'tour': ['house-manager', 'sound-tech', 'bartender', 'door-security', 'event-coordinator'],
}