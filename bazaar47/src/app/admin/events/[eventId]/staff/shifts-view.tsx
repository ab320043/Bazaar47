// app/admin/events/[eventId]/staff/shifts-view.tsx
'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Plus,
  Trash2,
  Loader2,
  Clock,
  DollarSign,
  Download,
  AlertCircle,
  Pencil,
  X,
  Check,
  User,
  Calendar,
  Briefcase,
} from 'lucide-react'
import type {
  StaffAssignment,
  StaffRole,
  AssignmentStatus,
  EventType,
} from '@/types/staff'
import { STAFF_ROLES, getRateForRole } from '@/data/staff-roles'

// ============================================
// TYPES
// ============================================

interface AvailableStaff {
  id: string
  name: string
  primaryRole: StaffRole
  email: string
  phone: string
  isActive: boolean
}

interface ShiftsViewProps {
  eventId: string
  eventType: EventType
  eventDate: string
  eventName: string
  assignments: StaffAssignment[]
  availableStaff: AvailableStaff[]
  onRefresh: () => Promise<void>
}

// ============================================
// HELPERS
// ============================================

function toDateLocalInput(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function parseLocalInput(value: string): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function getDayLabel(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function getDayLabelShort(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function getDayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTime(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function computeHours(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return 0
  if (end <= start) return 0
  return Math.round(((end - start) / (1000 * 60 * 60)) * 100) / 100
}

function formatHours(h: number): string {
  const totalMinutes = Math.round(h * 60)
  const hrs = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function isNextDay(startIso: string, endIso: string): boolean {
  const start = new Date(startIso)
  const end = new Date(endIso)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false
  return (
    start.getFullYear() !== end.getFullYear() ||
    start.getMonth() !== end.getMonth() ||
    start.getDate() !== end.getDate()
  )
}

function getStatusStyle(status: AssignmentStatus): {
  bg: string
  text: string
  label: string
} {
  switch (status) {
    case 'assigned':
      return {
        bg: 'bg-rosewood/10',
        text: 'text-rosewood/60',
        label: 'Assigned',
      }
    case 'confirmed':
      return {
        bg: 'bg-hippie/15',
        text: 'text-henna',
        label: 'Confirmed',
      }
    case 'checked-in':
      return {
        bg: 'bg-chartreuse/20',
        text: 'text-cypress',
        label: 'Checked In',
      }
    case 'in-progress':
      return {
        bg: 'bg-chartreuse/30',
        text: 'text-cypress',
        label: 'In Progress',
      }
    case 'completed':
      return {
        bg: 'bg-grove/15',
        text: 'text-grove',
        label: 'Completed',
      }
    case 'cancelled':
      return {
        bg: 'bg-poppy/15',
        text: 'text-poppy',
        label: 'Cancelled',
      }
  }
}

function computeDefaultShiftTimes(eventDateIso: string): {
  start: string
  end: string
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(eventDateIso)
  if (!match) {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 0)
    return {
      start: toDateLocalInput(start.toISOString()),
      end: toDateLocalInput(end.toISOString()),
    }
  }
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const start = new Date(year, month, day, 20, 0, 0, 0)
  const end = new Date(year, month, day, 23, 0, 0, 0)
  return {
    start: toDateLocalInput(start.toISOString()),
    end: toDateLocalInput(end.toISOString()),
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ShiftsView({
  eventId,
  eventType,
  eventDate,
  eventName,
  assignments,
  availableStaff,
  onRefresh,
}: ShiftsViewProps) {
  const [groupBy, setGroupBy] = useState<'day' | 'staff'>('day')
  const [editing, setEditing] = useState<StaffAssignment | null>(null)
  const [adding, setAdding] = useState(false)

  // ---- CSV export ----

  const handleExportCsv = useCallback(() => {
    if (assignments.length === 0) return

    const headers = [
      'Staff Name',
      'Date',
      'Start',
      'End',
      'Roles',
      'Hours Scheduled',
      'Hours Worked',
      'Rate',
      'Amount Owed',
      'Status',
    ]

    const escape = (v: string | number) => {
      const s = String(v)
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
    }

    const rows = assignments
      .slice()
      .sort((a, b) => new Date(a.shiftStart).getTime() - new Date(b.shiftStart).getTime())
      .map((a) => {
        const hoursScheduled = computeHours(a.shiftStart, a.shiftEnd)
        const hoursWorked = a.hoursWorked ?? 0
        const amount = hoursWorked * a.hourlyRate
        const rolesLabel = a.roles
          .map((r) => STAFF_ROLES.find((x) => x.id === r)?.label || r)
          .join('; ')
        return [
          a.staffName,
          getDayLabel(a.shiftStart),
          formatTime(a.shiftStart),
          formatTime(a.shiftEnd),
          rolesLabel,
          hoursScheduled.toFixed(2),
          hoursWorked.toFixed(2),
          a.hourlyRate.toFixed(2),
          amount.toFixed(2),
          getStatusStyle(a.status).label,
        ].map(escape)
      })

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shifts-${eventName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [assignments, eventName])

  // ---- Sorted + grouped ----

  const sorted = useMemo(() => {
    return [...assignments].sort(
      (a, b) => new Date(a.shiftStart).getTime() - new Date(b.shiftStart).getTime()
    )
  }, [assignments])

  const grouped = useMemo(() => {
    if (groupBy === 'day') {
      const map = new Map<string, StaffAssignment[]>()
      for (const a of sorted) {
        const key = getDayKey(a.shiftStart)
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(a)
      }
      return Array.from(map.entries()).map(([key, list]) => {
        const totalHours = list.reduce(
          (sum, a) => sum + computeHours(a.shiftStart, a.shiftEnd),
          0
        )
        return {
          label: getDayLabel(list[0].shiftStart),
          key,
          shifts: list,
          totalHours: Math.round(totalHours * 100) / 100,
        }
      })
    }

    // Group by staff
    const map = new Map<
      string,
      { label: string; shifts: StaffAssignment[]; totalHours: number }
    >()
    for (const a of sorted) {
      if (!map.has(a.staffId)) {
        map.set(a.staffId, { label: a.staffName, shifts: [], totalHours: 0 })
      }
      const group = map.get(a.staffId)!
      group.shifts.push(a)
      group.totalHours += computeHours(a.shiftStart, a.shiftEnd)
    }
    return Array.from(map.entries()).map(([key, group]) => ({
      label: group.label,
      key,
      shifts: group.shifts,
      totalHours: Math.round(group.totalHours * 100) / 100,
    }))
  }, [sorted, groupBy])

  // ---- Totals ----

  const totals = useMemo(() => {
    let hoursScheduled = 0
    let hoursWorked = 0
    let amount = 0
    for (const a of assignments) {
      hoursScheduled += computeHours(a.shiftStart, a.shiftEnd)
      const hw = a.hoursWorked ?? 0
      hoursWorked += hw
      amount += hw * a.hourlyRate
    }
    return {
      shifts: assignments.length,
      hoursScheduled: Math.round(hoursScheduled * 100) / 100,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      amount: Math.round(amount * 100) / 100,
    }
  }, [assignments])

  // ---- Delete ----

  const handleDelete = async (id: string, staffName: string) => {
    if (!confirm(`Delete this shift for ${staffName}?`)) return
    try {
      const res = await fetch(`/api/admin/staff/assignments/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) await onRefresh()
      else alert('Failed to delete shift')
    } catch {
      alert('Network error')
    }
  }

  return (
    <div className="space-y-5">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-xl p-1 border border-rosewood/10 shadow-sm">
            <button
              onClick={() => setGroupBy('day')}
              className={`px-3 py-1.5 rounded-lg font-host-grotesk font-semibold text-xs transition-all ${
                groupBy === 'day'
                  ? 'bg-rosewood text-plaster'
                  : 'text-rosewood/60 hover:text-rosewood'
              }`}
            >
              By Day
            </button>
            <button
              onClick={() => setGroupBy('staff')}
              className={`px-3 py-1.5 rounded-lg font-host-grotesk font-semibold text-xs transition-all ${
                groupBy === 'staff'
                  ? 'bg-rosewood text-plaster'
                  : 'text-rosewood/60 hover:text-rosewood'
              }`}
            >
              By Staff
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            disabled={assignments.length === 0}
            className="bg-white hover:bg-white/80 text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setAdding(true)}
            className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Shift
          </button>
        </div>
      </div>

      {/* Summary strip */}
      {assignments.length > 0 && (
        <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-sm font-host-grotesk">
            <span className="text-rosewood/60">
              <strong className="text-rosewood">{totals.shifts}</strong>{' '}
              {totals.shifts === 1 ? 'shift' : 'shifts'}
            </span>
            <span className="text-rosewood/60 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Scheduled:{' '}
              <strong className="text-rosewood">
                {formatHours(totals.hoursScheduled)}
              </strong>
            </span>
            <span className="text-rosewood/60 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Worked:{' '}
              <strong className="text-rosewood">
                {formatHours(totals.hoursWorked)}
              </strong>
            </span>
          </div>
          <span className="font-host-grotesk font-bold text-rosewood text-sm flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            {formatCurrency(totals.amount)} total owed
          </span>
        </div>
      )}

      {/* Empty state */}
      {assignments.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-rosewood/20 mx-auto mb-3" />
          <p className="font-host-grotesk text-rosewood/50">
            No shifts yet for this event.
          </p>
          <button
            onClick={() => setAdding(true)}
            className="mt-4 inline-flex items-center gap-2 bg-chartreuse hover:bg-chartreuse/90 text-grove px-6 py-2 rounded-xl font-host-grotesk font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            Add the first shift
          </button>
        </div>
      )}

      {/* Grouped shift cards */}
      {grouped.map((group) => (
        <div key={group.key}>
          {/* Group header */}
          <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b-2 border-rosewood/10">
            <h3 className="font-host-grotesk font-bold text-lg text-rosewood">
              {group.label}
            </h3>
            <span className="font-host-grotesk text-sm text-rosewood/50">
              {group.shifts.length}{' '}
              {group.shifts.length === 1 ? 'shift' : 'shifts'} ·{' '}
              {formatHours(group.totalHours)}
            </span>
          </div>

          {/* Shift cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {group.shifts.map((shift) => (
              <ShiftCard
                key={shift.id}
                assignment={shift}
                onEdit={() => setEditing(shift)}
                onDelete={() => handleDelete(shift.id, shift.staffName)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Edit modal */}
      {editing && (
        <ShiftModal
          mode="edit"
          eventId={eventId}
          eventType={eventType}
          eventDate={eventDate}
          assignment={editing}
          availableStaff={availableStaff}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await onRefresh()
          }}
        />
      )}

      {/* Add modal */}
      {adding && (
        <ShiftModal
          mode="add"
          eventId={eventId}
          eventType={eventType}
          eventDate={eventDate}
          assignment={null}
          availableStaff={availableStaff}
          onClose={() => setAdding(false)}
          onSaved={async () => {
            setAdding(false)
            await onRefresh()
          }}
        />
      )}
    </div>
  )
}

// ============================================
// SHIFT CARD
// ============================================

function ShiftCard({
  assignment,
  onEdit,
  onDelete,
}: {
  assignment: StaffAssignment
  onEdit: () => void
  onDelete: () => void
}) {
  const hoursScheduled = computeHours(assignment.shiftStart, assignment.shiftEnd)
  const hoursWorked = assignment.hoursWorked ?? 0
  const amount = hoursWorked * assignment.hourlyRate
  const crossDay = isNextDay(assignment.shiftStart, assignment.shiftEnd)
  const statusStyle = getStatusStyle(assignment.status)

  return (
    <div className="group bg-white rounded-2xl border border-rosewood/5 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-4">
        {/* Top row — staff name + status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-host-grotesk font-bold text-base text-rosewood truncate">
                {assignment.staffName}
              </h4>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}
              >
                {statusStyle.label}
              </span>
            </div>

            {/* Role chips */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {assignment.roles.map((role) => {
                const def = STAFF_ROLES.find((x) => x.id === role)
                return (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rosewood/8 text-rosewood/70"
                  >
                    {def?.icon} {def?.label || role}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={onEdit}
              className="text-rosewood/30 hover:text-chartreuse transition-colors p-1.5"
              title="Edit shift"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="text-rosewood/30 hover:text-poppy transition-colors p-1.5"
              title="Delete shift"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Time row */}
        <div className="flex items-center gap-1.5 text-sm text-rosewood/70 mb-1">
          <Calendar className="w-3.5 h-3.5 text-rosewood/40 shrink-0" />
          <span className="font-host-grotesk">
            {getDayLabelShort(assignment.shiftStart)} ·{' '}
            {formatTime(assignment.shiftStart)} → {formatTime(assignment.shiftEnd)}
            {crossDay && (
              <span className="text-rosewood/40 ml-1">(+1 day)</span>
            )}
          </span>
        </div>

        {/* Metrics row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 pt-2 border-t border-rosewood/5 text-xs text-rosewood/60">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <strong className="text-rosewood">
              {formatHours(hoursScheduled)}
            </strong>{' '}
            scheduled
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />${assignment.hourlyRate}/hr
          </span>
          {hoursWorked > 0 && (
            <span className="flex items-center gap-1 text-grove font-semibold">
              <Check className="w-3 h-3" />
              {formatHours(hoursWorked)} worked
            </span>
          )}
        </div>

        {/* Total owed row (only when worked) */}
        {amount > 0 && (
          <div className="mt-2 pt-2 border-t border-rosewood/5 flex items-center justify-between">
            <span className="font-host-grotesk text-xs text-rosewood/50">
              Total owed
            </span>
            <span className="font-host-grotesk font-bold text-sm text-rosewood">
              {formatCurrency(amount)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// SHIFT MODAL — used for both Add and Edit
// ============================================

function ShiftModal({
  mode,
  eventId,
  eventType,
  eventDate,
  assignment,
  availableStaff,
  onClose,
  onSaved,
}: {
  mode: 'add' | 'edit'
  eventId: string
  eventType: EventType
  eventDate: string
  assignment: StaffAssignment | null
  availableStaff: AvailableStaff[]
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const defaults = computeDefaultShiftTimes(eventDate)

  const [staffId, setStaffId] = useState(
    assignment?.staffId || availableStaff[0]?.id || ''
  )
  const [roles, setRoles] = useState<StaffRole[]>(assignment?.roles || [])
  const [start, setStart] = useState(
    assignment ? toDateLocalInput(assignment.shiftStart) : defaults.start
  )
  const [end, setEnd] = useState(
    assignment ? toDateLocalInput(assignment.shiftEnd) : defaults.end
  )
  const [rate, setRate] = useState(
    assignment ? String(assignment.hourlyRate) : ''
  )
  const [status, setStatus] = useState<AssignmentStatus>(
    assignment?.status || 'assigned'
  )
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Live computed values
  const rateNum = rate === '' ? 0 : parseFloat(rate) || 0
  const effectiveRate =
    rate === '' && roles.length > 0
      ? getRateForRole(roles[0], eventType)
      : rateNum

  const hoursScheduled =
    start && end
      ? computeHours(
          new Date(start).toISOString(),
          new Date(end).toISOString()
        )
      : 0

  const crossDay =
    start && end && isNextDay(start, end)

  // ---- Save ----

  const handleSave = async () => {
    setError(null)
    if (!staffId) {
      setError('Pick a staff member')
      return
    }
    if (roles.length === 0) {
      setError('Pick at least one role')
      return
    }
    const startIso = parseLocalInput(start)
    const endIso = parseLocalInput(end)
    if (!startIso || !endIso) {
      setError('Invalid start or end time')
      return
    }
    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setError('End must be after start')
      return
    }

    setSaving(true)
    try {
      if (mode === 'edit' && assignment) {
        const res = await fetch(
          `/api/admin/staff/assignments/${assignment.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roles,
              shiftStart: startIso,
              shiftEnd: endIso,
              hourlyRate: effectiveRate,
              status,
            }),
          }
        )
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Failed to save shift')
        }
      } else {
        const res = await fetch('/api/admin/staff/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            staffId,
            roles,
            shiftStart: startIso,
            shiftEnd: endIso,
            hourlyRate: effectiveRate,
            status,
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Failed to create shift')
        }
      }
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // ---- Delete ----

  const handleDelete = async () => {
    if (!assignment) return
    if (!confirm(`Delete this shift for ${assignment.staffName}?`)) return
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/admin/staff/assignments/${assignment.id}`,
        { method: 'DELETE' }
      )
      if (res.ok) await onSaved()
      else setError('Failed to delete shift')
    } catch {
      setError('Network error')
    } finally {
      setDeleting(false)
    }
  }

  // ---- Toggle role ----

  const toggleRole = (role: StaffRole) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-rosewood/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-xl sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-rosewood/10 p-5 sm:p-6 flex items-center justify-between z-10">
          <div>
            <h3 className="font-host-grotesk font-bold text-xl sm:text-2xl text-rosewood">
              {mode === 'add' ? 'Add Shift' : 'Edit Shift'}
            </h3>
            <p className="font-host-grotesk text-xs sm:text-sm text-rosewood/50 mt-0.5">
              {mode === 'add'
                ? 'Add a new shift to this event.'
                : assignment?.staffName || ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-plaster/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-rosewood/60" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSave()
          }}
          className="p-5 sm:p-6 space-y-5"
        >
          {/* Staff picker (edit mode = read-only name) */}
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 mb-1.5 flex items-center gap-2">
              <User className="w-4 h-4" />
              Staff Member <span className="text-poppy">*</span>
            </label>
            {mode === 'edit' ? (
              <div className="px-4 py-3 bg-plaster/30 border border-rosewood/10 rounded-xl font-host-grotesk text-rosewood">
                {assignment?.staffName}
              </div>
            ) : (
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                required
                className="w-full px-4 py-3 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
              >
                <option value="">Select a staff member...</option>
                {availableStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Roles — chip grid */}
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 mb-1.5 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Roles <span className="text-poppy">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STAFF_ROLES.map((role) => {
                const checked = roles.includes(role.id)
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-left ${
                      checked
                        ? 'border-chartreuse bg-chartreuse/10'
                        : 'border-rosewood/10 bg-white hover:border-rosewood/20'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        checked
                          ? 'bg-chartreuse border-chartreuse'
                          : 'border-rosewood/20'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 text-grove" />}
                    </span>
                    <span className="text-base">{role.icon}</span>
                    <span className="font-host-grotesk text-sm text-rosewood">
                      {role.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 mb-1.5 block">
                Start <span className="text-poppy">*</span>
              </label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
                className="w-full px-4 py-3 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
              />
            </div>
            <div>
              <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 mb-1.5 block">
                End <span className="text-poppy">*</span>
              </label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
                className="w-full px-4 py-3 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
              />
              {crossDay && (
                <p className="font-host-grotesk text-[11px] text-rosewood/50 mt-1">
                  Overnight shift — ends on the next day
                </p>
              )}
            </div>
          </div>

          {/* Live summary */}
          {hoursScheduled > 0 && (
            <div className="bg-chartreuse/10 border border-chartreuse/30 rounded-xl p-3 flex items-center justify-between">
              <span className="font-host-grotesk text-sm text-cypress flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Scheduled duration
              </span>
              <span className="font-host-grotesk font-bold text-cypress">
                {formatHours(hoursScheduled)}
              </span>
            </div>
          )}

          {/* Rate */}
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 mb-1.5 block">
              Hourly Rate
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rosewood/40 font-host-grotesk">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder={
                  effectiveRate > 0 ? String(effectiveRate) : '0.00'
                }
                className="w-full pl-8 pr-16 py-3 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-rosewood/40 font-host-grotesk text-sm">
                /hr
              </span>
            </div>
            {rate === '' && effectiveRate > 0 && (
              <p className="font-host-grotesk text-[11px] text-rosewood/40 mt-1">
                Leave blank to use standard rate ($
                {effectiveRate}/hr)
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 mb-1.5 block">
              Status
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as AssignmentStatus)
              }
              className="w-full px-4 py-3 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
            >
              <option value="assigned">Assigned</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked-in">Checked In</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-poppy/10 border border-poppy/20 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-poppy shrink-0 mt-0.5" />
              <p className="text-poppy text-sm font-host-grotesk">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-rosewood/10">
            {mode === 'edit' && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving || deleting}
                className="bg-poppy/10 hover:bg-poppy/20 text-poppy px-4 py-2.5 rounded-xl font-host-grotesk font-semibold text-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="bg-rosewood/10 hover:bg-rosewood/20 text-rosewood/60 px-5 py-2.5 rounded-xl font-host-grotesk font-semibold text-sm transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-6 py-2.5 rounded-xl font-host-grotesk font-semibold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'add' ? 'Add Shift' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}