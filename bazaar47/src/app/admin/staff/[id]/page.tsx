'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Calendar, Clock, Mail, Phone, Briefcase,
  CheckCircle, XCircle, Edit, Trash2, RefreshCw,
  Users, DollarSign
} from 'lucide-react'
import type { StaffMember, StaffAssignment, StaffPosition, StaffRole } from '@/types/staff'
import { STAFF_ROLES } from '@/data/staff-roles'

// ============================================
// TYPES
// ============================================

interface StaffDetailData {
  staff: StaffMember
  assignments: StaffAssignment[]
  stats: {
    totalAssignments: number
    completedAssignments: number
    upcomingAssignments: number
    totalHours: number
    totalEarned: number
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function StaffDetailPage() {
  const params = useParams()
  const router = useRouter()
  const staffId = params.id as string

  const [data, setData] = useState<StaffDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'assignments' | 'info'>('assignments')
  const [showEditModal, setShowEditModal] = useState(false)

  const fetchStaffData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch staff details
      const staffRes = await fetch(`/api/admin/staff/${staffId}`)
      if (!staffRes.ok) {
        if (staffRes.status === 404) {
          setError('Staff member not found')
        } else {
          setError('Failed to load staff data')
        }
        setLoading(false)
        return
      }
      const staffData = await staffRes.json()

      // Fetch assignments
      const assignmentsRes = await fetch(`/api/admin/staff/${staffId}/assignments`)
      const assignmentsData = await assignmentsRes.json()
      const assignments = assignmentsData.assignments || []

      // Calculate stats
      const totalAssignments = assignments.length
      const completedAssignments = assignments.filter((a: StaffAssignment) => a.status === 'completed').length
      const upcomingAssignments = assignments.filter((a: StaffAssignment) => 
        a.status === 'assigned' || a.status === 'confirmed'
      ).length
      const totalHours = assignments.reduce((sum: number, a: StaffAssignment) => sum + (a.hoursWorked || 0), 0)
      const totalEarned = assignments.reduce((sum: number, a: StaffAssignment) => {
        const hours = a.hoursWorked || 0
        return sum + (hours * a.hourlyRate)
      }, 0)

      setData({
        staff: staffData.staff,
        assignments,
        stats: {
          totalAssignments,
          completedAssignments,
          upcomingAssignments,
          totalHours: Math.round(totalHours * 100) / 100,
          totalEarned: Math.round(totalEarned * 100) / 100,
        },
      })
    } catch (error) {
      console.error('Failed to fetch staff:', error)
      setError('Network error - please try again')
    } finally {
      setLoading(false)
    }
  }, [staffId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchStaffData()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [fetchStaffData])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this staff member?')) return
    
    try {
      const response = await fetch(`/api/admin/staff/${staffId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        router.push('/admin/staff')
      } else {
        alert('Failed to delete staff member')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete staff member')
    }
  }

  const handleEdit = () => {
    setShowEditModal(true)
  }

  const handleEditSuccess = () => {
    setShowEditModal(false)
    fetchStaffData()
  }

  const getRoleLabel = (roleId: string) => {
    const role = STAFF_ROLES.find(r => r.id === roleId)
    return role?.label || roleId
  }

  const getRoleIcon = (roleId: string) => {
    const role = STAFF_ROLES.find(r => r.id === roleId)
    return role?.icon || '👤'
  }

  const getStatusBadge = (status: StaffAssignment['status']) => {
    const styles: Record<StaffAssignment['status'], { bg: string; text: string; label: string }> = {
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
        <div className="text-rosewood/60 font-host-grotesk">Loading staff details...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-plaster p-4">
        <div className="text-poppy text-xl font-host-grotesk font-bold mb-2">⚠️ Error</div>
        <div className="text-rosewood/60 font-host-grotesk">{error || 'Staff member not found'}</div>
        <Link 
          href="/admin/staff" 
          className="mt-6 bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold hover:bg-rosewood/80 transition-colors"
        >
          ← Back to Staff Directory
        </Link>
      </div>
    )
  }

  const { staff, assignments, stats } = data

  return (
    <>
      <div className="min-h-screen bg-plaster p-4 md:p-6 lg:p-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link 
              href="/admin/staff" 
              className="text-rosewood/60 hover:text-rosewood transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{getRoleIcon(staff.primaryRole)}</span>
                <div>
                  <h1 className="font-host-grotesk font-bold text-3xl text-rosewood">
                    {staff.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-rosewood/50 mt-1">
                    <span>{getRoleLabel(staff.primaryRole)}</span>
                    <span className="text-rosewood/20">•</span>
                    <span>{staff.position.charAt(0).toUpperCase() + staff.position.slice(1)}</span>
                    <span className="text-rosewood/20">•</span>
                    <span>${staff.hourlyRate}/hr (${staff.nonprofitRate}/hr nonprofit)</span>
                    <span className="text-rosewood/20">•</span>
                    {staff.isActive ? (
                      <span className="flex items-center gap-1 text-chartreuse">
                        <CheckCircle className="w-4 h-4" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rosewood/40">
                        <XCircle className="w-4 h-4" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchStaffData}
                className="bg-white hover:bg-white/80 text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handleEdit}
                className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="bg-poppy/10 hover:bg-poppy/20 text-poppy px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
              <p className="font-host-grotesk text-xs text-rosewood/40">Total Assignments</p>
              <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats.totalAssignments}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
              <p className="font-host-grotesk text-xs text-rosewood/40">Completed</p>
              <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats.completedAssignments}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
              <p className="font-host-grotesk text-xs text-rosewood/40">Upcoming</p>
              <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats.upcomingAssignments}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
              <p className="font-host-grotesk text-xs text-rosewood/40">Total Earned</p>
              <p className="font-host-grotesk text-2xl font-bold text-rosewood">${stats.totalEarned}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-rosewood/10 mb-6">
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-4 py-2 font-host-grotesk font-semibold text-sm transition-all ${
                activeTab === 'assignments' 
                  ? 'text-rosewood border-b-2 border-rosewood' 
                  : 'text-rosewood/40 hover:text-rosewood/60'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 font-host-grotesk font-semibold text-sm transition-all ${
                activeTab === 'info' 
                  ? 'text-rosewood border-b-2 border-rosewood' 
                  : 'text-rosewood/40 hover:text-rosewood/60'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1" />
              Contact Info
            </button>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'assignments' && (
              <AssignmentsTab assignments={assignments} />
            )}
            {activeTab === 'info' && (
              <InfoTab staff={staff} />
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <StaffFormModal
          staff={staff}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  )
}

// ============================================
// ASSIGNMENTS TAB
// ============================================

function AssignmentsTab({ assignments }: { assignments: StaffAssignment[] }) {
  const [filter, setFilter] = useState<StaffAssignment['status'] | 'all'>('all')

  const filtered = filter === 'all' 
    ? assignments 
    : assignments.filter(a => a.status === filter)

  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm p-8">
        <div className="text-center py-12 text-rosewood/40 font-host-grotesk">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-rosewood/20" />
          <p>No assignments yet</p>
          <p className="text-sm mt-1">This staff member has not been assigned to any events</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-rosewood/10 flex flex-wrap items-center gap-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as StaffAssignment['status'] | 'all')}
          className="px-4 py-2 bg-white border border-rosewood/10 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
        >
          <option value="all">All Status</option>
          <option value="assigned">Assigned</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked-in">Checked In</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="text-sm text-rosewood/40 ml-auto">
          {filtered.length} of {assignments.length} shown
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-plaster/30">
            <tr>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Event</th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Role</th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Shift</th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Hours</th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((assignment) => {
              const role = STAFF_ROLES.find(r => r.id === assignment.role)
              return (
                <tr key={assignment.id} className="border-t border-rosewood/5 hover:bg-plaster/20 transition-colors">
                  <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood">
                    <Link 
                      href={`/admin/events/${assignment.eventId}`}
                      className="hover:text-chartreuse transition-colors"
                    >
                      {assignment.eventName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/60">
                    {role?.icon} {role?.label || assignment.role}
                  </td>
                  <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/50">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(assignment.shiftStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(assignment.shiftEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/50">
                    {assignment.hoursWorked ? `${assignment.hoursWorked}h` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(assignment.status)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function getStatusBadge(status: StaffAssignment['status']) {
  const styles: Record<StaffAssignment['status'], { bg: string; text: string; label: string }> = {
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

// ============================================
// INFO TAB
// ============================================

function InfoTab({ staff }: { staff: StaffMember }) {
  return (
    <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-host-grotesk font-bold text-lg text-rosewood mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-rosewood/60">
              <Mail className="w-5 h-5" />
              <span className="font-host-grotesk">{staff.email}</span>
            </div>
            <div className="flex items-center gap-3 text-rosewood/60">
              <Phone className="w-5 h-5" />
              <span className="font-host-grotesk">{staff.phone}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-host-grotesk font-bold text-lg text-rosewood mb-4">Role Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-rosewood/60">
              <Briefcase className="w-5 h-5" />
              <span className="font-host-grotesk">{STAFF_ROLES.find(r => r.id === staff.primaryRole)?.label || staff.primaryRole}</span>
            </div>
            <div className="flex items-center gap-3 text-rosewood/60">
              <Users className="w-5 h-5" />
              <span className="font-host-grotesk">{staff.position.charAt(0).toUpperCase() + staff.position.slice(1)}</span>
            </div>
            <div className="flex items-center gap-3 text-rosewood/60">
              <DollarSign className="w-5 h-5" />
              <span className="font-host-grotesk">${staff.hourlyRate}/hr (${staff.nonprofitRate}/hr nonprofit)</span>
            </div>
          </div>
        </div>
      </div>

      {staff.notes && (
        <div className="mt-6 pt-6 border-t border-rosewood/5">
          <h3 className="font-host-grotesk font-bold text-lg text-rosewood mb-2">Notes</h3>
          <p className="font-host-grotesk text-rosewood/60">{staff.notes}</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// STAFF FORM MODAL (Reuse from staff/page.tsx)
// ============================================

import { X } from 'lucide-react'

interface StaffFormModalProps {
  staff: StaffMember
  onClose: () => void
  onSuccess: () => void
}

function StaffFormModal({ staff, onClose, onSuccess }: StaffFormModalProps) {
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    primaryRole: staff?.primaryRole || 'house-manager',
    position: staff?.position || 'team-member',
    hourlyRate: staff?.hourlyRate || 20,
    nonprofitRate: staff?.nonprofitRate || 15,
    isActive: staff?.isActive ?? true,
    notes: staff?.notes || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/staff/${staff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update staff member')
        return
      }

      onSuccess()
    } catch (error) {
      setError('Network error - please try again')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-rosewood/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-rosewood/10 p-6 flex items-center justify-between">
          <div>
            <h3 className="font-host-grotesk font-bold text-2xl text-rosewood">Edit Staff Member</h3>
            <p className="font-host-grotesk text-sm text-rosewood/50">Update staff details and roles</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-plaster/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-rosewood/60" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Full Name <span className="text-poppy">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
              placeholder="e.g. Jill Diaz"
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                Email <span className="text-poppy">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                placeholder="jill@example.com"
              />
            </div>
            <div>
              <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                Phone <span className="text-poppy">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                placeholder="(352) 123-4567"
              />
            </div>
          </div>

          {/* Role & Position */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                Primary Role <span className="text-poppy">*</span>
              </label>
              <select
                value={formData.primaryRole}
                onChange={(e) => setFormData({ ...formData, primaryRole: e.target.value as StaffRole })}
                required
                className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
              >
                {STAFF_ROLES.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.icon} {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                Position
              </label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value as StaffPosition })}
                className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
              >
                <option value="team-member">Team Member</option>
                <option value="lead">Lead</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>

          {/* Rates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                Standard Rate ($/hr) <span className="text-poppy">*</span>
              </label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                required
                min="0"
                step="0.5"
                className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                placeholder="e.g. 25"
              />
            </div>
            <div>
              <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                Nonprofit Rate ($/hr) <span className="text-poppy">*</span>
              </label>
              <input
                type="number"
                value={formData.nonprofitRate}
                onChange={(e) => setFormData({ ...formData, nonprofitRate: parseFloat(e.target.value) })}
                required
                min="0"
                step="0.5"
                className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                placeholder="e.g. 15"
              />
            </div>
          </div>

          {/* Active Status */}
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Status
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isActive: true })}
                className={`px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm transition-all ${
                  formData.isActive
                    ? 'bg-chartreuse text-grove'
                    : 'bg-plaster/30 text-rosewood/40 hover:bg-plaster/50'
                }`}
              >
                ✅ Active
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isActive: false })}
                className={`px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm transition-all ${
                  !formData.isActive
                    ? 'bg-rosewood/20 text-rosewood'
                    : 'bg-plaster/30 text-rosewood/40 hover:bg-plaster/50'
                }`}
              >
                ⛔ Inactive
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
              placeholder="Additional notes about this staff member..."
            />
          </div>

          {error && (
            <div className="text-poppy text-sm font-host-grotesk bg-poppy/10 p-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-rosewood/10">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-6 py-2 rounded-xl font-host-grotesk font-semibold transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Update Staff'}
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