// lib/big-caf-meetings/csv.ts
import type { BigCafMeetingResponse } from '@/types/big-caf-meetings'
import { formatDayLong } from '@/lib/big-caf-meetings/dates'

// ============================================
// HELPERS
// ============================================

function escapeCsvCell(value: string | number | boolean | undefined | null): string {
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

function formatTimestamp(iso: string): string {
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

// ============================================
// PUBLIC API
// ============================================

/**
 * One row per person.
 * Columns: Name, Email, Phone, # Days, Days, Confirmed, Note, Submitted
 */
export function buildBigCafMeetingsCsv(
  responses: BigCafMeetingResponse[]
): string {
  const headers = [
    'Name',
    'Email',
    'Phone',
    '# Days',
    'Days',
    'Confirmed',
    'Note',
    'Submitted',
  ]

  const rows = responses.map((r) => {
    const daysLabel = [...r.selectedDays]
      .sort()
      .map((iso) => formatDayLong(iso))
      .join('; ')

    return [
      r.fullName,
      r.email,
      r.phone,
      r.selectedDays.length,
      daysLabel,
      r.confirmed ? 'Yes' : 'No',
      r.confirmedNote || '',
      formatTimestamp(r.timestamp),
    ]
  })

  const allRows = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ]

  return allRows.join('\n')
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