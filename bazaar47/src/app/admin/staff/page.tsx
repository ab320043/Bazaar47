'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  Plus, Search, Edit, Trash2, User, Mail, Phone,
  CheckCircle, XCircle, Clock, Filter, X,
  Users, Briefcase, Calendar
} from 'lucide-react'
import type { StaffMember, StaffRole, StaffPosition } from '@/types/staff'
import { STAFF_ROLES } from '@/data/staff-roles'

// ============================================
// TYPES
// ============================================

interface StaffWithStats extends StaffMember {
  assignmentCount: number
  upcomingCount: number
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function StaffDirectoryPage() {
  const [staff, setStaff] = useState<StaffWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (roleFilter !== 'all') params.append('role', roleFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('stats', 'true')

      const response = await fetch(`/api/admin/staff?${params.toString()}`)
      const data = await response.json()
      
      // Fetch assignments for each staff member
      const staffWithAssignments = await Promise.all(
        (data.staff || []).map(async (member: StaffMember) => {
          const assignmentsRes = await fetch(`/api/admin/staff/${member.id}/assignments`)
          const assignmentsData = await assignmentsRes.json()
          const assignments = assignmentsData.assignments || []
          
          return {
            ...member,
            assignmentCount: assignments.length,
            upcomingCount: assignments.filter((a: { status?: string }) => 
              a.status === 'assigned' || a.status === 'confirmed'
            ).length,
          }
        })
      )
      
      setStaff(staffWithAssignments)
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, roleFilter, statusFilter])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchStaff()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [fetchStaff])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return
    
    try {
      const response = await fetch(`/api/admin/staff/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        await fetchStaff()
      } else {
        alert('Failed to delete staff member')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete staff member')
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

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="flex items-center gap-1 text-xs font-semibold text-chartreuse bg-chartreuse/10 px-2 py-0.5 rounded-full">
          <CheckCircle className="w-3 h-3" />
          Active
        </span>
      )
    }
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-rosewood/40 bg-rosewood/10 px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" />
        Inactive
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-plaster">
        <div className="text-rosewood/60 font-host-grotesk">Loading staff...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-plaster p-4 md:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-host-grotesk font-bold text-3xl md:text-4xl text-rosewood">
              Staff Directory
            </h1>
            <p className="font-host-grotesk text-rosewood/50">
              {staff.length} staff members • {staff.filter(s => s.isActive).length} active
            </p>
          </div>
          <button
            onClick={() => {
              setEditingStaff(null)
              setShowAddModal(true)
            }}
            className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Staff Member
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rosewood/30" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-rosewood/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-sm text-rosewood"
              />
            </div>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as StaffRole | 'all')}
            className="px-4 py-2.5 bg-white border border-rosewood/10 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
          >
            <option value="all">All Roles</option>
            {STAFF_ROLES.map(role => (
              <option key={role.id} value={role.id}>
                {role.icon} {role.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2.5 bg-white border border-rosewood/10 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setRoleFilter('all')
                setStatusFilter('all')
              }}
              className="text-rosewood/40 hover:text-rosewood transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl p-5 border border-rosewood/5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-chartreuse/10 flex items-center justify-center text-2xl">
                    {getRoleIcon(member.primaryRole)}
                  </div>
                  <div>
                    <h3 className="font-host-grotesk font-bold text-lg text-rosewood">
                      {member.name}
                    </h3>
                    <p className="font-host-grotesk text-sm text-rosewood/50">
                      {getRoleLabel(member.primaryRole)}
                    </p>
                  </div>
                </div>
                {getStatusBadge(member.isActive)}
              </div>

              <div className="space-y-2 text-sm font-host-grotesk text-rosewood/60">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{member.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{member.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span>${member.hourlyRate}/hr (${member.nonprofitRate}/hr nonprofit)</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-rosewood/5 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-host-grotesk text-rosewood/40">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    {member.assignmentCount} total
                  </span>
                  {member.upcomingCount > 0 && (
                    <span className="font-host-grotesk text-chartreuse">
                      {member.upcomingCount} upcoming
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/staff/${member.id}`}
                    className="text-rosewood/30 hover:text-chartreuse transition-colors p-1"
                  >
                    <User className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => {
                      setEditingStaff(member)
                      setShowAddModal(true)
                    }}
                    className="text-rosewood/30 hover:text-chartreuse transition-colors p-1"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="text-rosewood/30 hover:text-poppy transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {staff.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white/50 rounded-2xl p-12 border border-rosewood/5">
              <Users className="w-16 h-16 text-rosewood/20 mx-auto mb-4" />
              <h3 className="font-host-grotesk font-bold text-2xl text-rosewood">No staff found</h3>
              <p className="font-host-grotesk text-rosewood/40 mt-2">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start by adding your first staff member'}
              </p>
              {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
                <button
                  onClick={() => {
                    setEditingStaff(null)
                    setShowAddModal(true)
                  }}
                  className="mt-6 inline-flex items-center gap-2 bg-chartreuse hover:bg-chartreuse/90 text-grove px-6 py-2 rounded-xl font-host-grotesk font-semibold transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Staff Member
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <StaffFormModal
          staff={editingStaff}
          onClose={() => {
            setShowAddModal(false)
            setEditingStaff(null)
          }}
          onSuccess={fetchStaff}
        />
      )}
    </div>
  )
}

// ============================================
// STAFF FORM MODAL
// ============================================

interface StaffFormModalProps {
  staff: StaffMember | null
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

  const isEditing = !!staff

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const url = isEditing ? `/api/admin/staff/${staff.id}` : '/api/admin/staff'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save staff member')
        return
      }

      onSuccess()
      onClose()
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
            <h3 className="font-host-grotesk font-bold text-2xl text-rosewood">
              {isEditing ? 'Edit Staff Member' : 'Add Staff Member'}
            </h3>
            <p className="font-host-grotesk text-sm text-rosewood/50">
              {isEditing ? 'Update staff details and roles' : 'Add a new team member to the staff directory'}
            </p>
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
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Staff' : 'Add Staff')}
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