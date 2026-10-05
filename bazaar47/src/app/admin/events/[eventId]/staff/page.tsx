'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, UserPlus, Users, Clock, DollarSign,
  RefreshCw, Calendar, Trash2, Download, History,
  XCircle, Coffee
} from 'lucide-react'
import type {
  StaffAssignment,
  StaffRole,
  AssignmentStatus,
  EventType,
} from '@/types/staff'
import {
  STAFF_ROLES,
  getRolesForEventTier,
  DEFAULT_STAFF_ASSIGNMENT,
  getRateForRole,
} from '@/data/staff-roles'
import { buildStaffAssignmentsCsv, downloadCsv } from '@/lib/staff/csv'

// ============================================
// TYPES
// ============================================

interface EventStaffingData {
  event: {
    id: string
    name: string
    type: EventType
    date: string
    dateDisplay: string
    location: string
    status?: string
  }
  assignments: StaffAssignment[]
  stats: {
    totalStaff: number
    totalHours: number
    totalCost: number
    missingRoles: StaffRole[]
    isFullyStaffed: boolean
  }
}

interface AvailableStaff {
  id: string
  name: string
  primaryRole: StaffRole
  email: string
  phone: string
  isActive: boolean
}

// ============================================
// HELPERS
// ============================================

function isEventPast(eventDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const event = new Date(eventDate)
  event.setHours(0, 0, 0, 0)
  return event < today
}

function slugifyEventName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function formatDateTimeLocal(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatBreakSummary(a: StaffAssignment): string {
  if (!a.breakStart || !a.breakEnd) return ''
  const s = new Date(a.breakStart).getTime()
  const e = new Date(a.breakEnd).getTime()
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return ''
  const mins = Math.round((e - s) / 60000)
  if (mins < 60) return `${mins}m break`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h break` : `${h}h ${m}m break`
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function EventStaffingPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [data, setData] = useState<EventStaffingData | null>(null)
  const [availableStaff, setAvailableStaff] = useState<AvailableStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const staffRes = await fetch(`/api/admin/events/${eventId}/staff`)
      if (!staffRes.ok) {
        setError('Failed to load event staffing data')
        setLoading(false)
        return
      }
      const staffData = await staffRes.json()
      setData(staffData)

      const availableRes = await fetch('/api/admin/staff?status=active')
      if (availableRes.ok) {
        const availableData = await availableRes.json()
        setAvailableStaff(availableData.staff || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setError('Network error - please try again')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchData()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [fetchData])

  const handleAssignStaff = async (
    staffId: string,
    roles: StaffRole[],
    hourlyRateOverride?: number
  ) => {
    try {
      const response = await fetch('/api/admin/staff/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          staffId,
          roles,
          ...(hourlyRateOverride !== undefined && { hourlyRate: hourlyRateOverride }),
          shiftStart: new Date().toISOString(),
          shiftEnd: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          status: 'assigned',
        }),
      })

      if (response.ok) {
        setShowAssignModal(false)
        await fetchData()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to assign staff')
      }
    } catch (error) {
      console.error('Assign error:', error)
      alert('Failed to assign staff')
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Remove this staff member from the event?')) return
    try {
      const response = await fetch(`/api/admin/staff/assignments/${assignmentId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await fetchData()
      } else {
        alert('Failed to remove staff')
      }
    } catch (error) {
      console.error('Remove error:', error)
      alert('Failed to remove staff')
    }
  }

  const handleStatusUpdate = async (assignmentId: string, status: AssignmentStatus) => {
    try {
      const response = await fetch(`/api/admin/staff/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (response.ok) {
        await fetchData()
      } else {
        alert('Failed to update status')
      }
    } catch (error) {
      console.error('Status update error:', error)
      alert('Failed to update status')
    }
  }

  const handleHoursWorkedUpdate = async (assignmentId: string, hoursWorked: number) => {
    try {
      const response = await fetch(`/api/admin/staff/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hoursWorked }),
      })
      if (response.ok) {
        await fetchData()
      } else {
        alert('Failed to update hours')
      }
    } catch (error) {
      console.error('Hours update error:', error)
      alert('Failed to update hours')
    }
  }

  const handleBreakUpdate = async (
    assignmentId: string,
    breakStart: string | null,
    breakEnd: string | null
  ) => {
    try {
      const response = await fetch(`/api/admin/staff/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          breakStart: breakStart || '',
          breakEnd: breakEnd || '',
        }),
      })
      if (response.ok) {
        await fetchData()
      } else {
        alert('Failed to update break')
      }
    } catch (error) {
      console.error('Break update error:', error)
      alert('Failed to update break')
    }
  }

  const handleExportCsv = () => {
    if (!data || !data.assignments || data.assignments.length === 0) return
    const csv = buildStaffAssignmentsCsv(data.assignments, {
      eventName: data.event.name,
      eventDate: data.event.dateDisplay || data.event.date,
      eventLocation: data.event.location,
    })
    const filename = `${slugifyEventName(data.event.name)}-staff-${new Date().toISOString().slice(0, 10)}.csv`
    downloadCsv(filename, csv)
  }

  const getStatusBadge = (status: AssignmentStatus) => {
    const styles: Record<AssignmentStatus, { bg: string; text: string; label: string }> = {
      'assigned': { bg: 'bg-rosewood/10', text: 'text-rosewood/60', label: 'Assigned' },
      'confirmed': { bg: 'bg-hippie/10', text: 'text-hippie', label: 'Confirmed' },
      'checked-in': { bg: 'bg-chartreuse/10', text: 'text-chartreuse', label: 'Checked In' },
      'in-progress': { bg: 'bg-chartreuse/20', text: 'text-chartreuse', label: 'In Progress' },
      'completed': { bg: 'bg-grove/10', text: 'text-grove', label: 'Completed' },
      'cancelled': { bg: 'bg-poppy/10', text: 'text-poppy', label: 'Cancelled' },
    }
    const style = styles[status]
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-plaster">
        <div className="text-rosewood/60 font-host-grotesk">Loading staffing data...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-plaster p-4">
        <div className="text-poppy text-xl font-host-grotesk font-bold mb-2">⚠️ Error</div>
        <div className="text-rosewood/60 font-host-grotesk">{error || 'Event not found'}</div>
        <Link 
          href="/admin" 
          className="mt-6 bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold hover:bg-rosewood/80 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  const { event, assignments, stats } = data
  const isPastEvent =
    event.status === 'completed' ||
    event.status === 'past' ||
    isEventPast(event.date)
  const canExport = assignments.length > 0

  const assignmentsByRole = new Map<StaffRole, StaffAssignment[]>()
  for (const a of assignments) {
    for (const role of a.roles) {
      if (!assignmentsByRole.has(role)) assignmentsByRole.set(role, [])
      assignmentsByRole.get(role)!.push(a)
    }
  }

  const requiredRoles: StaffRole[] = (DEFAULT_STAFF_ASSIGNMENT[event.type] || [])
    .filter((role): role is StaffRole => STAFF_ROLES.some(({ id }) => id === role))

  return (
    <div className="min-h-screen bg-plaster p-4 md:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">

        {isPastEvent && (
          <div className="bg-rosewood/5 border border-rosewood/15 rounded-2xl px-4 py-3 mb-6 flex items-start gap-3">
            <History className="w-5 h-5 text-rosewood/50 shrink-0 mt-0.5" />
            <div>
              <p className="font-host-grotesk font-semibold text-rosewood text-sm">
                This event has passed
              </p>
              <p className="font-host-grotesk text-rosewood/60 text-xs mt-0.5">
                Staffing remains editable so you can make corrections, add
                hours, or fix roles after the fact.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <Link 
            href={`/admin/events/${eventId}`} 
            className="text-rosewood/60 hover:text-rosewood transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="font-host-grotesk font-bold text-3xl text-rosewood">
              Staffing: {event.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-rosewood/50 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {event.dateDisplay || event.date}
              </span>
              <span className="text-rosewood/20">•</span>
              <span>{event.location}</span>
              <span className="text-rosewood/20">•</span>
              <span className={stats.isFullyStaffed ? 'text-chartreuse' : 'text-poppy'}>
                {stats.isFullyStaffed ? '✅ Fully Staffed' : `⚠️ Missing ${stats.missingRoles.length} roles`}
              </span>
              {isPastEvent && (
                <>
                  <span className="text-rosewood/20">•</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rosewood/10 text-rosewood/60">
                    <History className="w-3 h-3" />
                    Past event
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="bg-white hover:bg-white/80 text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleExportCsv}
              disabled={!canExport}
              title={canExport ? 'Export staff to CSV' : 'No staff to export'}
              className="bg-white hover:bg-white/80 text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Assign Staff
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
            <p className="font-host-grotesk text-xs text-rosewood/40">Total Staff</p>
            <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats.totalStaff}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
            <p className="font-host-grotesk text-xs text-rosewood/40">Total Hours</p>
            <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats.totalHours}h</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
            <p className="font-host-grotesk text-xs text-rosewood/40">Total Cost</p>
            <p className="font-host-grotesk text-2xl font-bold text-rosewood">${stats.totalCost}</p>
          </div>
        </div>

        <div className="space-y-4">
          {requiredRoles.map((roleId) => {
            const roleAssignments = assignmentsByRole.get(roleId) || []
            const roleDef = STAFF_ROLES.find(r => r.id === roleId)
            const isMissing = roleAssignments.length === 0

            return (
              <div 
                key={roleId}
                className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
                  isMissing ? 'border-poppy/30 bg-poppy/5' : 'border-rosewood/5'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{roleDef?.icon || '👤'}</span>
                    <div>
                      <h3 className="font-host-grotesk font-bold text-lg text-rosewood">
                        {roleDef?.label || roleId}
                      </h3>
                      <p className="font-host-grotesk text-sm text-rosewood/40">
                        {roleAssignments.length} assigned
                      </p>
                    </div>
                  </div>
                  {isMissing ? (
                    <span className="text-xs font-semibold text-poppy bg-poppy/10 px-3 py-1 rounded-full">
                      ⚠️ Missing
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-chartreuse bg-chartreuse/10 px-3 py-1 rounded-full">
                      ✅ Staffed
                    </span>
                  )}
                </div>

                {roleAssignments.length > 0 ? (
                  <div className="space-y-3">
                    {roleAssignments.map((assignment) => (
                      <AssignmentRow
                        key={`${roleId}-${assignment.id}`}
                        assignment={assignment}
                        onStatusUpdate={handleStatusUpdate}
                        onHoursUpdate={handleHoursWorkedUpdate}
                        onBreakUpdate={handleBreakUpdate}
                        onRemove={handleRemoveAssignment}
                        getStatusBadge={getStatusBadge}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-rosewood/40 font-host-grotesk text-sm">
                    No staff assigned yet
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {showAssignModal && (
        <AssignModal
          availableStaff={availableStaff}
          eventType={event.type}
          existingAssignments={assignments}
          onAssign={handleAssignStaff}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  )
}

// ============================================
// ASSIGNMENT ROW
// ============================================

function AssignmentRow({
  assignment,
  onStatusUpdate,
  onHoursUpdate,
  onBreakUpdate,
  onRemove,
  getStatusBadge,
}: {
  assignment: StaffAssignment
  onStatusUpdate: (id: string, status: AssignmentStatus) => void
  onHoursUpdate: (id: string, hours: number) => void
  onBreakUpdate: (id: string, breakStart: string | null, breakEnd: string | null) => void
  onRemove: (id: string) => void
  getStatusBadge: (status: AssignmentStatus) => React.ReactNode
}) {
  const [breakOpen, setBreakOpen] = useState(false)
  const breakSummary = formatBreakSummary(assignment)
  const hasBreak = breakSummary !== ''

  return (
    <div className="flex flex-wrap items-center justify-between p-3 bg-plaster/30 rounded-xl gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-rosewood/10 flex items-center justify-center text-lg shrink-0">
          {STAFF_ROLES.find(r => r.id === assignment.roles[0])?.icon || '👤'}
        </div>
        <div className="min-w-0">
          <p className="font-host-grotesk font-semibold text-rosewood truncate">
            {assignment.staffName}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {assignment.roles.map((role) => {
              const def = STAFF_ROLES.find((r) => r.id === role)
              return (
                <span
                  key={role}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rosewood/8 text-rosewood/60"
                >
                  {def?.icon} {def?.label || role}
                </span>
              )
            })}
            <span className="text-[11px] text-rosewood/40 ml-1">
              ${assignment.hourlyRate}/hr
            </span>
            {hasBreak && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rosewood/8 text-rosewood/60">
                <Coffee className="w-3 h-3" />
                {breakSummary}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {getStatusBadge(assignment.status)}

        <HoursWorkedInput
          initialValue={assignment.hoursWorked}
          onSave={(hours) => onHoursUpdate(assignment.id, hours)}
        />

        <button
          type="button"
          onClick={() => setBreakOpen((v) => !v)}
          className={`p-1.5 rounded-lg transition-colors ${
            hasBreak
              ? 'bg-chartreuse/20 text-cypress hover:bg-chartreuse/30'
              : 'bg-white border border-rosewood/10 text-rosewood/40 hover:text-rosewood/70'
          }`}
          title={hasBreak ? 'Edit break' : 'Add a break'}
        >
          <Coffee className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1">
          <select
            value={assignment.status}
            onChange={(e) => onStatusUpdate(assignment.id, e.target.value as AssignmentStatus)}
            className="text-xs bg-white border border-rosewood/10 rounded-lg px-2 py-1 font-host-grotesk text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
          >
            <option value="assigned">Assigned</option>
            <option value="confirmed">Confirm</option>
            <option value="checked-in">Check In</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Complete</option>
            <option value="cancelled">Cancel</option>
          </select>
          <button
            onClick={() => onRemove(assignment.id)}
            className="text-rosewood/30 hover:text-poppy transition-colors p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {breakOpen && (
        <BreakEditor
          assignment={assignment}
          onSave={async (start, end) => {
            await onBreakUpdate(assignment.id, start, end)
            setBreakOpen(false)
          }}
          onCancel={() => setBreakOpen(false)}
        />
      )}
    </div>
  )
}

// ============================================
// BREAK EDITOR (inline)
// ============================================

function BreakEditor({
  assignment,
  onSave,
  onCancel,
}: {
  assignment: StaffAssignment
  onSave: (start: string | null, end: string | null) => Promise<void>
  onCancel: () => void
}) {
  const [start, setStart] = useState(
    assignment.breakStart ? formatDateTimeLocal(assignment.breakStart) : ''
  )
  const [end, setEnd] = useState(
    assignment.breakEnd ? formatDateTimeLocal(assignment.breakEnd) : ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setError(null)

    // Both empty → clear break
    if (start === '' && end === '') {
      setSaving(true)
      try {
        await onSave(null, null)
      } finally {
        setSaving(false)
      }
      return
    }

    // One-sided breaks aren't allowed — require both or neither
    if ((start === '') !== (end === '')) {
      setError('Enter both break start and end, or leave both empty')
      return
    }

    const startMs = new Date(start).getTime()
    const endMs = new Date(end).getTime()
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      setError('Invalid date/time')
      return
    }
    if (endMs <= startMs) {
      setError('Break end must be after break start')
      return
    }

    setSaving(true)
    try {
      await onSave(new Date(start).toISOString(), new Date(end).toISOString())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full mt-2 p-3 bg-white border border-rosewood/10 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <Coffee className="w-3.5 h-3.5 text-rosewood/50" />
        <span className="font-host-grotesk font-semibold text-xs text-rosewood/70">
          Break window
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="font-host-grotesk text-[10px] uppercase tracking-wider text-rosewood/40 block mb-1">
            Break start
          </label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full px-2 py-1.5 text-xs bg-plaster/40 border border-rosewood/15 rounded-lg font-host-grotesk text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
          />
        </div>
        <div>
          <label className="font-host-grotesk text-[10px] uppercase tracking-wider text-rosewood/40 block mb-1">
            Break end
          </label>
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full px-2 py-1.5 text-xs bg-plaster/40 border border-rosewood/15 rounded-lg font-host-grotesk text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
          />
        </div>
      </div>

      {error && (
        <p className="font-host-grotesk text-[11px] text-poppy mt-2">{error}</p>
      )}

      <div className="flex gap-2 mt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-3 py-1.5 rounded-lg font-host-grotesk font-semibold text-xs transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="bg-rosewood/10 hover:bg-rosewood/20 text-rosewood/60 px-3 py-1.5 rounded-lg font-host-grotesk font-semibold text-xs transition-all"
        >
          Cancel
        </button>
        {(assignment.breakStart || assignment.breakEnd) && (
          <button
            onClick={async () => {
              setSaving(true)
              try {
                await onSave(null, null)
              } finally {
                setSaving(false)
              }
            }}
            disabled={saving}
            className="ml-auto text-poppy/70 hover:text-poppy font-host-grotesk font-semibold text-xs px-2 transition-colors"
          >
            Clear break
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================
// HOURS WORKED INPUT
// ============================================

function HoursWorkedInput({
  initialValue,
  onSave,
}: {
  initialValue: number | undefined
  onSave: (hours: number) => void
}) {
  const [value, setValue] = useState(
    initialValue !== undefined ? String(initialValue) : ''
  )
  const [lastSaved, setLastSaved] = useState(initialValue)

  const handleBlur = () => {
    if (value === '') return
    const parsed = parseFloat(value)
    if (Number.isNaN(parsed) || parsed < 0) {
      setValue(lastSaved !== undefined ? String(lastSaved) : '')
      return
    }
    if (parsed === lastSaved) return
    onSave(parsed)
    setLastSaved(parsed)
  }

  return (
    <input
      type="number"
      min="0"
      step="0.25"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      placeholder="hrs"
      title="Hours worked — saved on blur"
      className="w-20 px-2 py-1 text-xs bg-white border border-rosewood/10 rounded-lg font-host-grotesk text-rosewood placeholder:text-rosewood/30 focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
    />
  )
}

// ============================================
// ASSIGN MODAL
// ============================================

interface AssignModalProps {
  availableStaff: AvailableStaff[]
  eventType: EventType
  existingAssignments: StaffAssignment[]
  onAssign: (staffId: string, roles: StaffRole[], hourlyRateOverride?: number) => void
  onClose: () => void
}

function AssignModal({
  availableStaff,
  eventType,
  existingAssignments,
  onAssign,
  onClose,
}: AssignModalProps) {
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<Set<StaffRole>>(new Set())
  const [rateOverride, setRateOverride] = useState('')
  const [rateOverridden, setRateOverridden] = useState(false)

  const availableRoles = getRolesForEventTier(eventType)

  const existingAssignment = useMemo(
    () => existingAssignments.find((a) => a.staffId === selectedStaffId),
    [existingAssignments, selectedStaffId]
  )

  const firstSelectedRole = selectedRoles.size > 0
    ? Array.from(selectedRoles)[0]
    : null
  const autoRate = firstSelectedRole
    ? getRateForRole(firstSelectedRole, eventType)
    : null

  const toggleRole = (role: StaffRole) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev)
      if (next.has(role)) next.delete(role)
      else next.add(role)
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaffId || selectedRoles.size === 0 || existingAssignment) return

    let override: number | undefined
    if (rateOverridden && rateOverride.trim() !== '') {
      const parsed = parseFloat(rateOverride)
      if (!Number.isNaN(parsed) && parsed >= 0) override = parsed
    }

    onAssign(selectedStaffId, Array.from(selectedRoles), override)
  }

  return (
    <div className="fixed inset-0 bg-rosewood/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-rosewood/10 p-6 flex items-center justify-between">
          <div>
            <h3 className="font-host-grotesk font-bold text-2xl text-rosewood">Assign Staff</h3>
            <p className="font-host-grotesk text-sm text-rosewood/50">
              One assignment per staff member. Pick all roles they&apos;ll cover.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-plaster/50 rounded-full transition-colors"
          >
            <XCircle className="w-5 h-5 text-rosewood/60" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Staff Member <span className="text-poppy">*</span>
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              required
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
            >
              <option value="">Select a staff member...</option>
              {availableStaff.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} - {STAFF_ROLES.find(r => r.id === staff.primaryRole)?.label || staff.primaryRole}
                </option>
              ))}
            </select>
            {existingAssignment && (
              <p className="font-host-grotesk text-xs text-poppy mt-1.5">
                ⚠️ Already assigned to this event as:{' '}
                {existingAssignment.roles
                  .map((r) => STAFF_ROLES.find((x) => x.id === r)?.label || r)
                  .join(', ')}
                . Edit their existing assignment instead.
              </p>
            )}
          </div>

          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-2">
              Roles <span className="text-poppy">*</span>
            </label>
            <p className="font-host-grotesk text-xs text-rosewood/50 mb-2">
              Tick every role this person will cover. Rate stays the same
              regardless of how many roles.
            </p>
            <div className="space-y-1.5 max-h-56 overflow-y-auto p-1">
              {availableRoles.map((role) => {
                const checked = selectedRoles.has(role.id)
                return (
                  <label
                    key={role.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                      checked
                        ? 'bg-chartreuse/15 border border-chartreuse/40'
                        : 'bg-plaster/30 border border-transparent hover:bg-plaster/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRole(role.id)}
                      className="w-4 h-4 accent-chartreuse shrink-0"
                    />
                    <span className="text-lg">{role.icon}</span>
                    <span className="font-host-grotesk text-sm text-rosewood">
                      {role.label}
                    </span>
                  </label>
                )
              })}
            </div>
            {selectedRoles.size === 0 && (
              <p className="font-host-grotesk text-xs text-poppy mt-1.5">
                Select at least one role.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-host-grotesk font-semibold text-sm text-rosewood/80">
                Hourly Rate
              </label>
              {rateOverridden && (
                <button
                  type="button"
                  onClick={() => {
                    setRateOverride('')
                    setRateOverridden(false)
                  }}
                  className="font-host-grotesk text-xs text-rosewood/40 hover:text-rosewood transition-colors"
                >
                  Use auto rate
                </button>
              )}
            </div>
            <input
              type="number"
              min="0"
              step="0.5"
              value={rateOverride}
              onChange={(e) => {
                setRateOverride(e.target.value)
                setRateOverridden(true)
              }}
              placeholder={
                autoRate !== null ? `Auto: $${autoRate}/hr` : 'Select a role first'
              }
              disabled={selectedRoles.size === 0}
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-rosewood/30"
            />
            {!rateOverridden && autoRate !== null && (
              <p className="font-host-grotesk text-xs text-rosewood/40 mt-1">
                Leave blank to use the standard rate (${autoRate}/hr).
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-rosewood/10">
            <button
              type="submit"
              disabled={
                !selectedStaffId ||
                selectedRoles.size === 0 ||
                !!existingAssignment
              }
              className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-6 py-2 rounded-xl font-host-grotesk font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1"
            >
              Assign Staff
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-rosewood/10 hover:bg-rosewood/20 text-rosewood/60 px-6 py-2 rounded-xl font-host-grotesk font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}