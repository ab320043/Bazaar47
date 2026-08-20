'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, UserPlus, Users, Clock, DollarSign,
  CheckCircle, XCircle, RefreshCw, Calendar,
  Plus, Trash2, Edit, Mail, Phone
} from 'lucide-react'
import type { StaffAssignment, StaffMember, StaffRole, AssignmentStatus, EventType } from '@/types/staff'
import { STAFF_ROLES, getRolesForEventTier, DEFAULT_STAFF_ASSIGNMENT } from '@/data/staff-roles'

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
// MAIN COMPONENT
// ============================================

export default function EventStaffingPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string

  const [data, setData] = useState<EventStaffingData | null>(null)
  const [availableStaff, setAvailableStaff] = useState<AvailableStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<StaffRole | ''>('')

  // ✅ Use useCallback to memoize fetch function
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch event staff
      const staffRes = await fetch(`/api/admin/events/${eventId}/staff`)
      if (!staffRes.ok) {
        setError('Failed to load event staffing data')
        setLoading(false)
        return
      }
      const staffData = await staffRes.json()
      setData(staffData)

      // Fetch available staff (not assigned to this event)
      const availableRes = await fetch('/api/admin/staff?status=active')
      if (availableRes.ok) {
        const availableData = await availableRes.json()
        const assignedIds = new Set((staffData.assignments || []).map((a: StaffAssignment) => a.staffId))
        setAvailableStaff(
          (availableData.staff || []).filter((s: AvailableStaff) => !assignedIds.has(s.id))
        )
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setError('Network error - please try again')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  // Start loading after the effect has completed so its state updates do not
  // trigger a synchronous cascading render.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchData()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [fetchData])

  const handleAssignStaff = async (staffId: string, role: StaffRole) => {
    try {
      const response = await fetch('/api/admin/staff/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          staffId,
          role,
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

  const getRoleLabel = (roleId: StaffRole) => {
    const role = STAFF_ROLES.find(r => r.id === roleId)
    return role?.label || roleId
  }

  const getRoleIcon = (roleId: StaffRole) => {
    const role = STAFF_ROLES.find(r => r.id === roleId)
    return role?.icon || '👤'
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

  // Group assignments by role
  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const role = assignment.role
    if (!acc[role]) acc[role] = []
    acc[role].push(assignment)
    return acc
  }, {} as Record<StaffRole, StaffAssignment[]>)

  // Get required roles for this event type
  const requiredRoles: StaffRole[] = (DEFAULT_STAFF_ASSIGNMENT[event.type] || [])
    .filter((role): role is StaffRole => STAFF_ROLES.some(({ id }) => id === role))

  return (
    <div className="min-h-screen bg-plaster p-4 md:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
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
              onClick={() => setShowAssignModal(true)}
              className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Assign Staff
            </button>
          </div>
        </div>

        {/* Stats Cards */}
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

        {/* Staff by Role */}
        <div className="space-y-4">
          {requiredRoles.map((roleId) => {
            const roleAssignments = groupedAssignments[roleId] || []
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
                  {isMissing && (
                    <span className="text-xs font-semibold text-poppy bg-poppy/10 px-3 py-1 rounded-full">
                      ⚠️ Missing
                    </span>
                  )}
                  {!isMissing && (
                    <span className="text-xs font-semibold text-chartreuse bg-chartreuse/10 px-3 py-1 rounded-full">
                      ✅ Staffed
                    </span>
                  )}
                </div>

                {/* Staff Members */}
                {roleAssignments.length > 0 ? (
                  <div className="space-y-3">
                    {roleAssignments.map((assignment) => (
                      <div 
                        key={assignment.id}
                        className="flex flex-wrap items-center justify-between p-3 bg-plaster/30 rounded-xl gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-rosewood/10 flex items-center justify-center text-lg">
                            {roleDef?.icon || '👤'}
                          </div>
                          <div>
                            <p className="font-host-grotesk font-semibold text-rosewood">
                              {assignment.staffName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-rosewood/40">
                              <span>{assignment.position}</span>
                              <span>•</span>
                              <span>${assignment.hourlyRate}/hr</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {getStatusBadge(assignment.status)}
                          <div className="flex items-center gap-1">
                            <select
                              value={assignment.status}
                              onChange={(e) => handleStatusUpdate(assignment.id, e.target.value as AssignmentStatus)}
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
                              onClick={() => handleRemoveAssignment(assignment.id)}
                              className="text-rosewood/30 hover:text-poppy transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
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

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignModal
          availableStaff={availableStaff}
          eventType={event.type}
          onAssign={handleAssignStaff}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  )
}

// ============================================
// ASSIGN MODAL
// ============================================

interface AssignModalProps {
  availableStaff: AvailableStaff[]
  eventType: EventType
  onAssign: (staffId: string, role: StaffRole) => void
  onClose: () => void
}

function AssignModal({ availableStaff, eventType, onAssign, onClose }: AssignModalProps) {
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [selectedRole, setSelectedRole] = useState<StaffRole | ''>('')

  const availableRoles = getRolesForEventTier(eventType)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedStaffId && selectedRole) {
      onAssign(selectedStaffId, selectedRole)
    }
  }

  return (
    <div className="fixed inset-0 bg-rosewood/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-rosewood/10 flex items-center justify-between">
          <div>
            <h3 className="font-host-grotesk font-bold text-2xl text-rosewood">Assign Staff</h3>
            <p className="font-host-grotesk text-sm text-rosewood/50">Add a staff member to this event</p>
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
          </div>

          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Role <span className="text-poppy">*</span>
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as StaffRole)}
              required
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
            >
              <option value="">Select a role...</option>
              {availableRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.icon} {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={!selectedStaffId || !selectedRole}
              className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-6 py-2 rounded-xl font-host-grotesk font-semibold transition-all disabled:opacity-50 flex-1"
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