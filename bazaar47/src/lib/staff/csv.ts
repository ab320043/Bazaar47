// lib/staff/csv.ts
import type { StaffAssignment } from '@/types/staff'
import { STAFF_ROLES } from '@/data/staff-roles'

// ============================================
// CSV HELPERS
// ============================================

function escapeCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return ''
  const str = String(value)
  if (str === '') return ''

  const needsQuotes =
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r') ||
    /^\s|\s$/.test(str)

  if (!needsQuotes) return str
  return `"${str.replace(/"/g, '""')}"`
}

function formatDateTime(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getRoleLabel(roleId: string): string {
  const role = STAFF_ROLES.find((r) => r.id === roleId)
  return role?.label || roleId
}

function getStatusLabel(status: StaffAssignment['status']): string {
  switch (status) {
    case 'assigned':    return 'Assigned'
    case 'confirmed':   return 'Confirmed'
    case 'checked-in':  return 'Checked In'
    case 'in-progress': return 'In Progress'
    case 'completed':   return 'Completed'
    case 'cancelled':   return 'Cancelled'
  }
}

/**
 * Break duration in hours, or null if no break was logged.
 */
function breakHours(a: StaffAssignment): number | null {
  if (!a.breakStart || !a.breakEnd) return null
  const start = new Date(a.breakStart).getTime()
  const end = new Date(a.breakEnd).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null
  return (end - start) / (1000 * 60 * 60)
}

// ============================================
// PUBLIC API
// ============================================

export interface StaffCsvMeta {
  eventName: string
  eventDate: string
  eventLocation: string
}

/**
 * Build a CSV string for a set of staff assignments.
 *
 * Columns: Staff Name, Role, Position, Shift Start, Shift End,
 *          Break, Hourly Rate, Hours Worked, Amount Owed, Status
 *
 * `Hours Worked` is already net of any logged break (the storage
 * layer computes it that way on checkout). The `Break` column shows
 * the break duration for reference.
 */
export function buildStaffAssignmentsCsv(
  assignments: StaffAssignment[],
  meta: StaffCsvMeta
): string {
  const headers = [
    'Staff Name',
    'Role',
    'Position',
    'Shift Start',
    'Shift End',
    'Break',
    'Hourly Rate',
    'Hours Worked',
    'Amount Owed',
    'Status',
  ]

  const rows = assignments.map((a) => {
    const hours = a.hoursWorked ?? 0
    const amount = hours * a.hourlyRate
    const rolesLabel = a.roles.map(getRoleLabel).join(', ')
    const brk = breakHours(a)

    return [
      a.staffName,
      rolesLabel,
      a.position,
      formatDateTime(a.shiftStart),
      formatDateTime(a.shiftEnd),
      brk !== null ? `${brk.toFixed(2)}h` : '',
      a.hourlyRate.toFixed(2),
      hours > 0 ? hours.toFixed(2) : '0.00',
      amount > 0 ? amount.toFixed(2) : '0.00',
      getStatusLabel(a.status),
    ]
  })

  const totalHours = assignments.reduce((sum, a) => sum + (a.hoursWorked ?? 0), 0)
  const totalAmount = assignments.reduce(
    (sum, a) => sum + (a.hoursWorked ?? 0) * a.hourlyRate,
    0
  )
  const totalBreak = assignments.reduce((sum, a) => {
    const b = breakHours(a)
    return sum + (b ?? 0)
  }, 0)

  const totalsRow = [
    'TOTAL',
    '',
    '',
    '',
    '',
    totalBreak > 0 ? `${totalBreak.toFixed(2)}h` : '',
    '',
    totalHours.toFixed(2),
    totalAmount.toFixed(2),
    '',
  ]

  const allRows = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((r) => r.map(escapeCsvCell).join(',')),
    totalsRow.map(escapeCsvCell).join(','),
  ]

  const metaLine = `# ${meta.eventName} — ${meta.eventDate} — ${meta.eventLocation}`

  return [metaLine, ...allRows].join('\n')
}

export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === 'undefined') return
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}