'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Calendar, Clock, DollarSign, Users, 
  CheckCircle, XCircle, RefreshCw, ArrowRight,
  MapPin, Briefcase, Star, AlertCircle
} from 'lucide-react'
import type { StaffMember, StaffAssignment } from '@/types/staff'
import { STAFF_ROLES } from '@/data/staff-roles'

// ============================================
// TYPES
// ============================================

interface DashboardData {
  staff: StaffMember
  upcoming: StaffAssignment[]
  past: StaffAssignment[]
  current: StaffAssignment | undefined
  stats: {
    totalHoursThisMonth: number
    totalEarnedThisMonth: number
    upcomingCount: number
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function StaffDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [staffId, setStaffId] = useState('')

  // In a real app, this would come from authentication
  // For now, we'll show a selector for demo purposes
  const fetchDashboard = useCallback(async (id: string) => {
    if (!id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/staff/dashboard?staffId=${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Staff member not found')
        } else {
          setError('Failed to load dashboard data')
        }
        setLoading(false)
        return
      }

      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
      setError('Network error - please try again')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load with first staff member
  useEffect(() => {
    // Fetch list of staff to get first one
    const loadInitialStaff = async () => {
      try {
        const response = await fetch('/api/admin/staff?status=active')
        if (response.ok) {
          const result = await response.json()
          if (result.staff && result.staff.length > 0) {
            const firstStaff = result.staff[0]
            setStaffId(firstStaff.id)
            fetchDashboard(firstStaff.id)
          } else {
            setLoading(false)
          }
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to load staff list:', error)
        setLoading(false)
      }
    }

    loadInitialStaff()
  }, [fetchDashboard])

  const handleStaffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setStaffId(id)
    fetchDashboard(id)
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
        <div className="text-rosewood/60 font-host-grotesk">Loading dashboard...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-plaster p-4">
        <div className="text-poppy text-xl font-host-grotesk font-bold mb-2">⚠️ Error</div>
        <div className="text-rosewood/60 font-host-grotesk">{error || 'No data available'}</div>
        <button
          onClick={() => fetchDashboard(staffId)}
          className="mt-6 bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold hover:bg-rosewood/80 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const { staff, upcoming, past, current, stats } = data

  return (
    <div className="min-h-screen bg-plaster p-4 md:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{getRoleIcon(staff.primaryRole)}</span>
            <div>
              <h1 className="font-host-grotesk font-bold text-3xl md:text-4xl text-rosewood">
                Welcome, {staff.name}!
              </h1>
              <p className="font-host-grotesk text-rosewood/50">
                {getRoleLabel(staff.primaryRole)} • {staff.position}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={staffId}
              onChange={handleStaffChange}
              className="px-4 py-2 bg-white border border-rosewood/10 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
            >
              <option value="">Select Staff Member</option>
              {/* This would be populated from API */}
            </select>
            <button
              onClick={() => fetchDashboard(staffId)}
              className="bg-white hover:bg-white/80 text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm">
            <p className="font-host-grotesk text-sm text-rosewood/40">This Month</p>
            <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats.totalHoursThisMonth}h</p>
            <p className="font-host-grotesk text-xs text-rosewood/30">Hours Worked</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm">
            <p className="font-host-grotesk text-sm text-rosewood/40">This Month</p>
            <p className="font-host-grotesk text-2xl font-bold text-rosewood">${stats.totalEarnedThisMonth}</p>
            <p className="font-host-grotesk text-xs text-rosewood/30">Total Earned</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm">
            <p className="font-host-grotesk text-sm text-rosewood/40">Upcoming</p>
            <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats.upcomingCount}</p>
            <p className="font-host-grotesk text-xs text-rosewood/30">Events Assigned</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm">
            <p className="font-host-grotesk text-sm text-rosewood/40">Status</p>
            <p className="font-host-grotesk text-2xl font-bold text-rosewood">
              {current ? '🟢 On Duty' : '⏸️ Off Duty'}
            </p>
            <p className="font-host-grotesk text-xs text-rosewood/30">
              {current ? 'Currently working' : 'No active shift'}
            </p>
          </div>
        </div>

        {/* Current Assignment */}
        {current && (
          <div className="bg-chartreuse/10 border-2 border-chartreuse/30 rounded-2xl p-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-chartreuse fill-chartreuse" />
                  <h2 className="font-host-grotesk font-bold text-xl text-rosewood">Currently Working</h2>
                </div>
                <h3 className="font-host-grotesk font-bold text-2xl text-rosewood mt-1">{current.eventName}</h3>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-rosewood/60">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(current.shiftStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                    {' - '}
                    {new Date(current.shiftEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {getRoleLabel(current.role)}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    ${current.hourlyRate}/hr
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-sm font-semibold text-chartreuse bg-chartreuse/20 px-3 py-1 rounded-full animate-pulse">
                  ● Active
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Assignments */}
          <div>
            <h2 className="font-host-grotesk font-bold text-xl text-rosewood mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Events
            </h2>
            {upcoming.length > 0 ? (
              <div className="space-y-3">
                {upcoming.map((assignment) => (
                  <Link 
                    key={assignment.id}
                    href={`/admin/events/${assignment.eventId}`}
                    className="block bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-host-grotesk font-bold text-rosewood">{assignment.eventName}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-rosewood/50 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(assignment.shiftStart).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(assignment.shiftStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {getRoleLabel(assignment.role)}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(assignment.status)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center border border-rosewood/5 shadow-sm">
                <AlertCircle className="w-12 h-12 text-rosewood/20 mx-auto mb-3" />
                <p className="font-host-grotesk text-rosewood/40">No upcoming events</p>
                <p className="font-host-grotesk text-sm text-rosewood/30">You Are all caught up!</p>
              </div>
            )}
          </div>

          {/* Past Assignments */}
          <div>
            <h2 className="font-host-grotesk font-bold text-xl text-rosewood mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Past Events
            </h2>
            {past.length > 0 ? (
              <div className="space-y-3">
                {past.slice(0, 5).map((assignment) => (
                  <div 
                    key={assignment.id}
                    className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-host-grotesk font-semibold text-rosewood">{assignment.eventName}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-rosewood/40 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(assignment.shiftStart).toLocaleDateString()}
                          </span>
                          {assignment.hoursWorked && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {assignment.hoursWorked}h
                            </span>
                          )}
                          {assignment.hoursWorked && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" />
                              ${(assignment.hoursWorked * assignment.hourlyRate).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(assignment.status)}
                    </div>
                  </div>
                ))}
                {past.length > 5 && (
                  <p className="text-center text-rosewood/30 font-host-grotesk text-sm">
                    +{past.length - 5} more events
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center border border-rosewood/5 shadow-sm">
                <p className="font-host-grotesk text-rosewood/40">No past events</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}