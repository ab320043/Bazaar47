// lib/staff/csv.ts
import type { StaffAssignment } from '@/types/staff'
import { STAFF_ROLES } from '@/data/staff-roles'

// ============================================
// CSV HELPERS
// ============================================

/**
 * Escape a single CSV cell.
 * - Wraps in quotes if the value contains a comma, quote, newline, or leading/trailing space
 * - Doubles up embedded quotes per RFC 4180
 */
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
 * Columns:
 *   Staff Name, Role, Position, Shift Start, Shift End,
 *   Hourly Rate, Hours Worked, Amount Owed, Status
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
    'Hourly Rate',
    'Hours Worked',
    'Amount Owed',
    'Status',
  ]

  const rows = assignments.map((a) => {
    const hours = a.hoursWorked ?? 0
    const amount = hours * a.hourlyRate

    return [
      a.staffName,
      getRoleLabel(a.role),
      a.position,
      formatDateTime(a.shiftStart),
      formatDateTime(a.shiftEnd),
      a.hourlyRate.toFixed(2),
      hours > 0 ? hours.toFixed(2) : '0.00',
      amount > 0 ? amount.toFixed(2) : '0.00',
      getStatusLabel(a.status),
    ]
  })

  // Totals row
  const totalHours = assignments.reduce((sum, a) => sum + (a.hoursWorked ?? 0), 0)
  const totalAmount = assignments.reduce(
    (sum, a) => sum + (a.hoursWorked ?? 0) * a.hourlyRate,
    0
  )

  const totalsRow = [
    'TOTAL',
    '',
    '',
    '',
    '',
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

  // Prepend a comment-style meta line so the sheet has context when opened.
  // (Excel treats `#` lines as text; that's fine for a header hint.)
  const metaLine = `# ${meta.eventName} — ${meta.eventDate} — ${meta.eventLocation}`

  return [metaLine, ...allRows].join('\n')
}

/**
 * Trigger a browser download of a CSV string.
 * No-op on the server; safe to import anywhere.
 */
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