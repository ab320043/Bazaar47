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
  Filter,
  ChevronDown,
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

// Strict types for the grouped data to avoid 'any'
interface GroupedRole {
  role: StaffRole
  shifts: StaffAssignment[]
  totalHours: number
}

interface GroupedDay {
  type: 'day'
  key: string
  label: string
  roles: GroupedRole[]
  totalHours: number
  shiftCount: number
}

interface GroupedStaff {
  type: 'staff'
  key: string
  label: string
  shifts: StaffAssignment[]
  totalHours: number
}

type GroupedData = GroupedDay | GroupedStaff

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
  if (mins === 0) return `${hrs} hrs`
  return `${hrs} hrs ${mins} mins`
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
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all')
  const [editing, setEditing] = useState<StaffAssignment | null>(null)
  const [adding, setAdding] = useState(false)

  // Track collapsed state for headers (keys are either day strings or staff IDs)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  )

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

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

  // ---- Filtered + Sorted + Grouped ----

  const filteredAssignments = useMemo(() => {
    if (roleFilter === 'all') return assignments
    return assignments.filter((a) => a.roles.includes(roleFilter))
  }, [assignments, roleFilter])

  const sorted = useMemo(() => {
    return [...filteredAssignments].sort(
      (a, b) => new Date(a.shiftStart).getTime() - new Date(b.shiftStart).getTime()
    )
  }, [filteredAssignments])

  // Grouping logic (strictly typed, no 'any')
  const grouped = useMemo<GroupedData[]>(() => {
    if (groupBy === 'staff') {
      // Group by Staff
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
        type: 'staff',
        key,
        label: group.label,
        shifts: group.shifts,
        totalHours: Math.round(group.totalHours * 100) / 100,
      }))
    }

    // Group by Day, then by Role
    const dayMap = new Map<string, Map<StaffRole, { shifts: StaffAssignment[]; totalHours: number }>>()

    for (const a of sorted) {
      const dayKey = getDayKey(a.shiftStart)
      if (!dayMap.has(dayKey)) dayMap.set(dayKey, new Map())

      const roleMap = dayMap.get(dayKey)!

      let displayRole = a.roles[0]
      if (roleFilter !== 'all' && a.roles.includes(roleFilter)) {
        displayRole = roleFilter
      }

      if (!roleMap.has(displayRole)) {
        roleMap.set(displayRole, { shifts: [], totalHours: 0 })
      }
      const roleGroup = roleMap.get(displayRole)!
      roleGroup.shifts.push(a)
      roleGroup.totalHours += computeHours(a.shiftStart, a.shiftEnd)
    }

    // Convert to array and sort
    return Array.from(dayMap.entries())
      .map(([dayKey, roleMap]) => {
        // Safely get the first shift to derive the day label
        const firstRoleData = roleMap.values().next().value
        const firstShiftIso = firstRoleData?.shifts[0]?.shiftStart || new Date().toISOString()
        
        const roles = Array.from(roleMap.entries())
          .map(([role, data]) => ({
            role,
            shifts: data.shifts,
            totalHours: Math.round(data.totalHours * 100) / 100,
          }))
          .sort((a, b) => {
            const idxA = STAFF_ROLES.findIndex((r) => r.id === a.role)
            const idxB = STAFF_ROLES.findIndex((r) => r.id === b.role)
            return idxA - idxB
          })

        const dayTotalHours = roles.reduce((sum, r) => sum + r.totalHours, 0)
        return {
          type: 'day' as const,
          key: dayKey,
          label: getDayLabel(firstShiftIso),
          roles,
          totalHours: Math.round(dayTotalHours * 100) / 100,
          shiftCount: roles.reduce((sum, r) => sum + r.shifts.length, 0),
        }
      })
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [sorted, groupBy, roleFilter])

  // ---- Totals ----

  const totals = useMemo(() => {
    let hoursScheduled = 0
    let hoursWorked = 0
    let amount = 0
    for (const a of filteredAssignments) {
      hoursScheduled += computeHours(a.shiftStart, a.shiftEnd)
      const hw = a.hoursWorked ?? 0
      hoursWorked += hw
      amount += hw * a.hourlyRate
    }
    return {
      shifts: filteredAssignments.length,
      hoursScheduled: Math.round(hoursScheduled * 100) / 100,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      amount: Math.round(amount * 100) / 100,
    }
  }, [filteredAssignments])

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Group By Toggle */}
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

          {/* Role Filter */}
          <div className="relative flex-1 sm:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rosewood/40" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as StaffRole | 'all')}
              className="w-full sm:w-auto pl-9 pr-8 py-2 bg-white border border-rosewood/10 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40 appearance-none shadow-sm cursor-pointer"
            >
              <option value="all">All Roles</option>
              {STAFF_ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.icon} {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCsv}
            disabled={filteredAssignments.length === 0}
            className="flex-1 sm:flex-none justify-center bg-white hover:bg-white/80 text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setAdding(true)}
            className="flex-1 sm:flex-none justify-center bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Shift
          </button>
        </div>
      </div>

      {/* Summary strip */}
      {filteredAssignments.length > 0 && (
        <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-host-grotesk">
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
          <span className="font-host-grotesk font-bold text-rosewood text-sm flex items-center gap-1 w-full sm:w-auto justify-end">
            <DollarSign className="w-4 h-4" />
            {formatCurrency(totals.amount)} total owed
          </span>
        </div>
      )}

      {/* Empty state */}
      {filteredAssignments.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-rosewood/20 mx-auto mb-3" />
          <p className="font-host-grotesk text-rosewood/50">
            No shifts found for this selection.
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

      {/* Grouped Rendering */}
      <div className="space-y-6">
        {groupBy === 'day' &&
          (grouped as GroupedDay[]).map((day) => {
            const isCollapsed = collapsedSections.has(day.key)
            return (
              <div key={day.key} className="bg-white rounded-2xl border border-rosewood/5 shadow-sm overflow-hidden">
                {/* Day Header - Clickable to Collapse */}
                <button
                  onClick={() => toggleSection(day.key)}
                  className="w-full bg-plaster/40 px-4 sm:px-5 py-3 border-b border-rosewood/5 flex items-center justify-between hover:bg-plaster/60 transition-colors text-left"
                >
                  <h3 className="font-host-grotesk font-bold text-lg text-rosewood">
                    {day.label}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="font-host-grotesk text-sm text-rosewood/50 hidden sm:inline">
                      {day.shiftCount} shifts · {formatHours(day.totalHours)}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-rosewood/40 transition-transform duration-200 ${
                        isCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                  </div>
                </button>

                {/* Collapsible Content */}
                {!isCollapsed && (
                  <div className="divide-y divide-rosewood/5">
                    {day.roles.map((roleGroup) => {
                      const roleDef = STAFF_ROLES.find((r) => r.id === roleGroup.role)
                      return (
                        <div key={roleGroup.role} className="p-4 sm:p-5">
                          {/* Role Subheader */}
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-host-grotesk font-bold text-rosewood flex items-center gap-2">
                              <span className="text-lg">{roleDef?.icon || '👤'}</span>
                              {roleDef?.label || roleGroup.role}
                              <span className="text-[10px] font-semibold text-rosewood/60 bg-rosewood/10 px-2 py-0.5 rounded-full ml-1">
                                {roleGroup.shifts.length} on shift
                              </span>
                            </h4>
                          </div>

                          {/* Shift Rows */}
                          <div className="space-y-2">
                            {roleGroup.shifts.map((shift) => (
                              <ShiftListRow
                                key={shift.id}
                                assignment={shift}
                                onEdit={() => setEditing(shift)}
                                onDelete={() => handleDelete(shift.id, shift.staffName)}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

        {groupBy === 'staff' &&
          (grouped as GroupedStaff[]).map((staffGroup) => {
            const isCollapsed = collapsedSections.has(staffGroup.key)
            return (
              <div key={staffGroup.key} className="bg-white rounded-2xl border border-rosewood/5 shadow-sm overflow-hidden">
                {/* Staff Header - Clickable to Collapse */}
                <button
                  onClick={() => toggleSection(staffGroup.key)}
                  className="w-full bg-plaster/40 px-4 sm:px-5 py-3 border-b border-rosewood/5 flex items-center justify-between hover:bg-plaster/60 transition-colors text-left"
                >
                  <h3 className="font-host-grotesk font-bold text-lg text-rosewood">
                    {staffGroup.label}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="font-host-grotesk text-sm text-rosewood/50 hidden sm:inline">
                      {staffGroup.shifts.length} shifts · {formatHours(staffGroup.totalHours)}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-rosewood/40 transition-transform duration-200 ${
                        isCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                  </div>
                </button>

                {/* Collapsible Content */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-5 space-y-2">
                    {staffGroup.shifts.map((shift) => (
                      <ShiftListRow
                        key={shift.id}
                        assignment={shift}
                        onEdit={() => setEditing(shift)}
                        onDelete={() => handleDelete(shift.id, shift.staffName)}
                        hideStaffName
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
      </div>

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
// SHIFT LIST ROW (Grid Layout Design)
// ============================================

function ShiftListRow({
  assignment,
  onEdit,
  onDelete,
  hideStaffName = false,
}: {
  assignment: StaffAssignment
  onEdit: () => void
  onDelete: () => void
  hideStaffName?: boolean
}) {
  const hoursScheduled = computeHours(assignment.shiftStart, assignment.shiftEnd)
  const crossDay = isNextDay(assignment.shiftStart, assignment.shiftEnd)
  const statusStyle = getStatusStyle(assignment.status)
  const roleDef = STAFF_ROLES.find((r) => r.id === assignment.roles[0])

  return (
    <div className="group relative bg-white rounded-xl border border-rosewood/10 p-3 sm:p-4 hover:border-rosewood/20 hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        
        {/* Left Side: Name + Role (if not hidden) */}
        {!hideStaffName && (
          <div className="min-w-0 pr-4">
            <p className="font-bold text-rosewood text-base truncate">
              {assignment.staffName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm">{roleDef?.icon}</span>
              <span className="text-xs font-semibold text-rosewood/60">
                {roleDef?.label}
              </span>
            </div>
          </div>
        )}

        {/* Right Side: Grid of Details */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 flex-1 ${hideStaffName ? '' : 'mt-2 sm:mt-0'}`}>
          
          {/* Start / End Time */}
          <div>
            <p className="font-host-grotesk text-[10px] uppercase tracking-wider text-rosewood/40 font-semibold mb-0.5">
              Time
            </p>
            <p className="font-host-grotesk text-sm text-rosewood font-medium">
              {formatTime(assignment.shiftStart)} – {formatTime(assignment.shiftEnd)}
            </p>
            {crossDay && (
              <p className="font-host-grotesk text-[10px] text-rosewood/50">+1 day</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <p className="font-host-grotesk text-[10px] uppercase tracking-wider text-rosewood/40 font-semibold mb-0.5">
              Duration
            </p>
            <p className="font-host-grotesk text-sm text-rosewood font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-rosewood/40" />
              {formatHours(hoursScheduled)}
            </p>
          </div>

          {/* Rate */}
          <div>
            <p className="font-host-grotesk text-[10px] uppercase tracking-wider text-rosewood/40 font-semibold mb-0.5">
              Rate
            </p>
            <p className="font-host-grotesk text-sm text-rosewood font-medium flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-rosewood/40" />
              {assignment.hourlyRate}/hr
            </p>
          </div>

          {/* Status & Actions */}
          <div className="flex flex-col items-start sm:items-end justify-between h-full">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}
            >
              {statusStyle.label}
            </span>
            {assignment.hoursWorked !== undefined && assignment.hoursWorked > 0 && (
              <span className="text-[10px] font-semibold text-grove bg-grove/10 px-1.5 py-0.5 rounded mt-1 flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5" />
                {assignment.hoursWorked}h worked
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions (absolute positioned for desktop hover, inline for mobile) */}
      <div className="flex sm:hidden items-center justify-end gap-2 mt-3 pt-3 border-t border-rosewood/5">
        <button
          onClick={onEdit}
          className="flex-1 bg-plaster hover:bg-plaster/80 text-rosewood/60 py-1.5 rounded-lg font-host-grotesk font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 bg-poppy/5 hover:bg-poppy/10 text-poppy py-1.5 rounded-lg font-host-grotesk font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>

      <div className="hidden sm:flex absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-0.5 shadow-sm border border-rosewood/5">
        <button
          onClick={onEdit}
          className="text-rosewood/40 hover:text-chartreuse transition-colors p-1.5"
          title="Edit shift"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="text-rosewood/40 hover:text-poppy transition-colors p-1.5"
          title="Delete shift"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
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