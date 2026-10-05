// app/staff/(app)/shifts/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Calendar, Clock, DollarSign, Briefcase,
  RefreshCw, Star, AlertCircle, LogIn, LogOut,
  Loader2, Bell, Users, MessageSquare,
  CheckCircle2
} from 'lucide-react'
import type { StaffMember, StaffAssignment, StaffRole } from '@/types/staff'
import { STAFF_ROLES } from '@/data/staff-roles'

// ============================================
// TYPES
// ============================================

interface CoworkerOnShift {
  staffId: string
  staffName: string
  roles: StaffRole[]
}

interface ShiftWithCoworkers {
  assignment: StaffAssignment
  coworkers: CoworkerOnShift[]
}

interface DashboardStats {
  hoursThisPeriod: number
  earnedThisPeriod: number
  hoursThisMonth: number
  earnedThisMonth: number
  hoursAllTime: number
  earnedAllTime: number
  upcomingCount: number
}

interface DashboardData {
  staff: StaffMember
  mustChangePassword: boolean
  upcoming: StaffAssignment[]
  upcomingWithCoworkers: ShiftWithCoworkers[]
  past: StaffAssignment[]
  current: StaffAssignment | undefined
  currentWithCoworkers?: ShiftWithCoworkers
  stats: DashboardStats
}

type ShiftState =
  | 'upcoming-far'
  | 'open'
  | 'late-window'
  | 'in-progress'
  | 'clocked-in'
  | 'ended'

// ============================================
// CONSTANTS
// ============================================

const CLOCK_IN_EARLY_MS = 10 * 60 * 1000
const CLOCK_IN_LATE_MS = 30 * 60 * 1000
const LIVE_TICK_MS = 60 * 1000

// ============================================
// HELPERS
// ============================================

function getRoleLabel(roleId: string): string {
  const role = STAFF_ROLES.find((r) => r.id === roleId)
  return role?.label || roleId
}

function getRolesLabel(roles: StaffRole[]): string {
  return roles.map(getRoleLabel).join(' · ')
}

function getShiftState(a: StaffAssignment, now: number): ShiftState {
  if (a.status === 'cancelled' || a.status === 'completed') return 'ended'
  if (a.checkOutTime) return 'ended'
  if (a.checkInTime) return 'clocked-in'

  const start = new Date(a.shiftStart).getTime()
  const end = new Date(a.shiftEnd).getTime()

  if (now > end) return 'ended'
  if (now >= start && now <= start + CLOCK_IN_LATE_MS) return 'late-window'
  if (now >= start - CLOCK_IN_EARLY_MS && now < start) return 'open'
  if (now >= start && now <= end) return 'in-progress'
  return 'upcoming-far'
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'now'
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60
  if (hours < 24) {
    return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`
  }
  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function isToday(iso: string, referenceNow: number): boolean {
  const d = new Date(iso)
  const today = new Date(referenceNow)
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  )
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function StaffShiftsPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [now, setNow] = useState<number>(0)

  const tickRef = useRef<number | null>(null)

  const fetchDashboard = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setError(null)
    try {
      const response = await fetch('/api/staff/dashboard')

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/staff/login'
          return
        }
        if (!opts?.silent) setError('Failed to load shifts')
        return
      }

      const result = (await response.json()) as DashboardData
      setData(result)
    } catch (err) {
      console.error('Failed to fetch shifts:', err)
      if (!opts?.silent) setError('Network error — please try again')
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setNow(Date.now())
      void fetchDashboard()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [fetchDashboard])

  useEffect(() => {
    tickRef.current = window.setInterval(() => {
      setNow(Date.now())
      void fetchDashboard({ silent: true })
    }, LIVE_TICK_MS)
    return () => {
      if (tickRef.current !== null) {
        window.clearInterval(tickRef.current)
        tickRef.current = null
      }
    }
  }, [fetchDashboard])

  const handleCheckIn = async (assignmentId: string) => {
    setActionId(assignmentId)
    setActionError(null)
    try {
      const res = await fetch(
        `/api/staff/assignments/${assignmentId}/checkin`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      )
      const body = await res.json()
      if (!res.ok) {
        setActionError(body.error || 'Failed to check in')
        return
      }
      await fetchDashboard({ silent: true })
      window.setTimeout(() => setNow(Date.now()), 0)
    } catch {
      setActionError('Network error while checking in')
    } finally {
      setActionId(null)
    }
  }

  const handleCheckOut = async (assignmentId: string) => {
    setActionId(assignmentId)
    setActionError(null)
    try {
      const res = await fetch(
        `/api/staff/assignments/${assignmentId}/checkout`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      )
      const body = await res.json()
      if (!res.ok) {
        setActionError(body.error || 'Failed to check out')
        return
      }
      await fetchDashboard({ silent: true })
      window.setTimeout(() => setNow(Date.now()), 0)
    } catch {
      setActionError('Network error while checking out')
    } finally {
      setActionId(null)
    }
  }

  const handleStaffNoteSave = async (assignmentId: string, note: string) => {
    try {
      const res = await fetch(
        `/api/staff/assignments/${assignmentId}/staff-note`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffNote: note }),
        }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setActionError(body.error || 'Failed to save note')
        return
      }
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          upcoming: prev.upcoming.map((a) =>
            a.id === assignmentId ? { ...a, staffNote: note } : a
          ),
          upcomingWithCoworkers: prev.upcomingWithCoworkers.map((s) =>
            s.assignment.id === assignmentId
              ? { ...s, assignment: { ...s.assignment, staffNote: note } }
              : s
          ),
          current:
            prev.current?.id === assignmentId
              ? { ...prev.current, staffNote: note }
              : prev.current,
          currentWithCoworkers: prev.currentWithCoworkers
            ? prev.currentWithCoworkers.assignment.id === assignmentId
              ? {
                  ...prev.currentWithCoworkers,
                  assignment: {
                    ...prev.currentWithCoworkers.assignment,
                    staffNote: note,
                  },
                }
              : prev.currentWithCoworkers
            : undefined,
        }
      })
    } catch {
      setActionError('Network error while saving note')
    }
  }

  const handleManualRefresh = () => {
    window.setTimeout(() => setNow(Date.now()), 0)
    void fetchDashboard()
  }

  const todayAssignments = (() => {
    if (!data) return []
    const all: StaffAssignment[] = [
      ...data.upcoming,
      ...(data.current ? [data.current] : []),
    ]
    return all.filter(
      (a) => isToday(a.shiftStart, now) && a.status !== 'cancelled'
    )
  })()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-rosewood/60 font-host-grotesk">Loading shifts...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-poppy text-xl font-host-grotesk font-bold mb-2">⚠️ Error</div>
        <div className="text-rosewood/60 font-host-grotesk">{error || 'No data available'}</div>
        <button
          onClick={handleManualRefresh}
          className="mt-6 bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold hover:bg-rosewood/80 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const { upcomingWithCoworkers, past, currentWithCoworkers, stats } = data
  const current = currentWithCoworkers?.assignment ?? data.current

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto">

      {/* Page title + refresh */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-host-grotesk font-bold text-3xl text-rosewood">
            My Shifts
          </h1>
          <p className="font-host-grotesk text-rosewood/50 text-sm mt-0.5">
            {stats.upcomingCount} upcoming · {past.length} past
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          className="bg-white hover:bg-white/80 text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Today banner */}
      {todayAssignments.length > 0 && (
        <div className="bg-chartreuse/15 border border-chartreuse/40 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Bell className="w-5 h-5 text-cypress shrink-0 mt-0.5" />
          <div>
            <p className="font-host-grotesk font-semibold text-cypress text-sm">
              You have a shift today
            </p>
            <p className="font-host-grotesk text-cypress/70 text-sm mt-0.5">
              {todayAssignments
                .map((a) => `${a.eventName} at ${formatTime(a.shiftStart)}`)
                .join(' · ')}
            </p>
          </div>
        </div>
      )}

      {data.mustChangePassword && (
        <div className="bg-chartreuse/10 border border-chartreuse/30 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-cypress shrink-0 mt-0.5" />
          <div>
            <p className="font-host-grotesk font-semibold text-cypress text-sm">
              You&apos;re using a temporary password
            </p>
            <p className="font-host-grotesk text-cypress/70 text-sm mt-0.5">
              Ask an admin to reset it to something only you know.
            </p>
          </div>
        </div>
      )}

      {actionError && (
        <div className="bg-poppy/10 border border-poppy/20 rounded-xl p-3 mb-6">
          <p className="text-poppy text-sm font-host-grotesk">{actionError}</p>
        </div>
      )}

      {/* Stats — compact, all four in a row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
        <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
          <p className="font-host-grotesk text-[10px] text-rosewood/40 uppercase tracking-wider">
            This Period
          </p>
          <p className="font-host-grotesk text-xl font-bold text-rosewood mt-1">
            {formatCurrency(stats.earnedThisPeriod)}
          </p>
          <p className="font-host-grotesk text-xs text-rosewood/40 mt-0.5">
            {stats.hoursThisPeriod}h
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
          <p className="font-host-grotesk text-[10px] text-rosewood/40 uppercase tracking-wider">
            This Month
          </p>
          <p className="font-host-grotesk text-xl font-bold text-rosewood mt-1">
            {formatCurrency(stats.earnedThisMonth)}
          </p>
          <p className="font-host-grotesk text-xs text-rosewood/40 mt-0.5">
            {stats.hoursThisMonth}h
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
          <p className="font-host-grotesk text-[10px] text-rosewood/40 uppercase tracking-wider">
            Upcoming
          </p>
          <p className="font-host-grotesk text-xl font-bold text-rosewood mt-1">
            {stats.upcomingCount}
          </p>
          <p className="font-host-grotesk text-xs text-rosewood/40 mt-0.5">
            {stats.upcomingCount === 1 ? 'shift' : 'shifts'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
          <p className="font-host-grotesk text-[10px] text-rosewood/40 uppercase tracking-wider">
            Status
          </p>
          <p className="font-host-grotesk text-xl font-bold text-rosewood mt-1">
            {current ? '🟢 On Duty' : '⏸️ Off Duty'}
          </p>
          <p className="font-host-grotesk text-xs text-rosewood/40 mt-0.5">
            {current ? 'Working' : 'No active shift'}
          </p>
        </div>
      </div>

      <p className="font-host-grotesk text-xs text-rosewood/40 mb-8 text-right">
        Lifetime: {formatCurrency(stats.earnedAllTime)} · {stats.hoursAllTime}h
      </p>

      {/* Current shift */}
      {current && currentWithCoworkers && (() => {
        const state = getShiftState(current, now)
        const isActing = actionId === current.id
        const { coworkers } = currentWithCoworkers
        return (
          <div className="bg-chartreuse/10 border-2 border-chartreuse/30 rounded-2xl p-6 mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-chartreuse fill-chartreuse" />
                  <h2 className="font-host-grotesk font-bold text-xl text-rosewood">
                    {state === 'clocked-in' ? 'Currently Working' : 'Shift In Progress'}
                  </h2>
                </div>
                <h3 className="font-host-grotesk font-bold text-2xl text-rosewood mt-1">
                  {current.eventName}
                </h3>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-rosewood/60">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(current.shiftStart)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(current.shiftStart)} – {formatTime(current.shiftEnd)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {getRolesLabel(current.roles)}
                  </span>
                </div>

                {coworkers.length > 0 && (
                  <div className="flex items-start gap-1.5 mt-2 text-sm text-rosewood/60">
                    <Users className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Also on this shift:{' '}
                      <span className="text-rosewood/80 font-medium">
                        {coworkers.map((c) => c.staffName).join(', ')}
                      </span>
                    </span>
                  </div>
                )}

                {state === 'clocked-in' && current.checkInTime && (
                  <p className="font-host-grotesk text-sm text-cypress mt-2 font-semibold">
                    Clocked in at {formatTime(current.checkInTime)}
                  </p>
                )}

                <div className="mt-3">
                  <StaffNoteEditor
                    initialValue={current.staffNote || ''}
                    onSave={(note) => handleStaffNoteSave(current.id, note)}
                  />
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {state === 'clocked-in' ? (
                  <>
                    <span className="text-sm font-semibold text-chartreuse bg-chartreuse/20 px-3 py-1 rounded-full animate-pulse">
                      ● Active
                    </span>
                    <button
                      onClick={() => handleCheckOut(current.id)}
                      disabled={isActing}
                      className="bg-rosewood hover:bg-rosewood/90 text-plaster px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                    >
                      {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                      Clock Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleCheckIn(current.id)}
                    disabled={isActing}
                    className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                  >
                    {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                    Clock In
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming */}
        <div>
          <h2 className="font-host-grotesk font-bold text-xl text-rosewood mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming
          </h2>
          {upcomingWithCoworkers.length > 0 ? (
            <div className="space-y-3">
              {upcomingWithCoworkers.map(({ assignment, coworkers }) => {
                const state = getShiftState(assignment, now)
                const isActing = actionId === assignment.id
                const startMs = new Date(assignment.shiftStart).getTime()
                const opensAtMs = startMs - CLOCK_IN_EARLY_MS
                const msUntilOpen = opensAtMs - now

                let buttonLabel = 'Clock In'
                let buttonDisabled = false
                let buttonTitle: string | undefined

                if (state === 'upcoming-far') {
                  buttonLabel = msUntilOpen > 0 ? `Opens in ${formatCountdown(msUntilOpen)}` : 'Clock In'
                  buttonDisabled = true
                  buttonTitle = 'Clock In opens 10 minutes before shift start'
                } else if (state === 'clocked-in') {
                  buttonLabel = 'Clocked In'
                  buttonDisabled = true
                  buttonTitle = assignment.checkInTime ? `You clocked in at ${formatTime(assignment.checkInTime)}` : undefined
                } else if (state === 'ended') {
                  buttonLabel = 'Ended'
                  buttonDisabled = true
                }

                return (
                  <div
                    key={assignment.id}
                    className={`bg-white rounded-xl p-4 border shadow-sm ${
                      state === 'open' || state === 'late-window'
                        ? 'border-chartreuse/40 ring-1 ring-chartreuse/20'
                        : 'border-rosewood/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-host-grotesk font-bold text-rosewood truncate">
                          {assignment.eventName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-rosewood/50 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(assignment.shiftStart)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(assignment.shiftStart)} – {formatTime(assignment.shiftEnd)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5" />
                            {getRolesLabel(assignment.roles)}
                          </span>
                        </div>

                        {coworkers.length > 0 && (
                          <div className="flex items-start gap-1.5 mt-2 text-xs text-rosewood/50">
                            <Users className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>
                              Also on this shift:{' '}
                              <span className="text-rosewood/70 font-medium">
                                {coworkers.map((c) => c.staffName).join(', ')}
                              </span>
                            </span>
                          </div>
                        )}

                        {state === 'upcoming-far' && msUntilOpen > 0 && (
                          <p className="font-host-grotesk text-xs text-rosewood/40 mt-2">
                            Starts in {formatCountdown(startMs - now)} · Clock In opens in {formatCountdown(msUntilOpen)}
                          </p>
                        )}
                        {(state === 'open' || state === 'late-window') && (
                          <p className="font-host-grotesk text-xs text-cypress font-semibold mt-2">
                            Shift starts in {formatCountdown(Math.max(0, startMs - now))} — you can clock in now
                          </p>
                        )}

                        <StaffNoteEditor
                          initialValue={assignment.staffNote || ''}
                          onSave={(note) => handleStaffNoteSave(assignment.id, note)}
                        />
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            assignment.status === 'confirmed'
                              ? 'bg-hippie/10 text-hippie'
                              : 'bg-rosewood/10 text-rosewood/60'
                          }`}
                        >
                          {assignment.status === 'confirmed' ? 'Confirmed' : 'Assigned'}
                        </span>
                        <button
                          onClick={() => handleCheckIn(assignment.id)}
                          disabled={buttonDisabled || isActing}
                          title={buttonTitle}
                          className={`px-3 py-1.5 rounded-lg font-host-grotesk font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                            buttonDisabled
                              ? 'bg-rosewood/10 text-rosewood/40 cursor-not-allowed'
                              : 'bg-chartreuse hover:bg-chartreuse/90 text-grove'
                          } disabled:opacity-60`}
                        >
                          {isActing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <LogIn className="w-3.5 h-3.5" />
                          )}
                          {buttonLabel}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center border border-rosewood/5 shadow-sm">
              <AlertCircle className="w-12 h-12 text-rosewood/20 mx-auto mb-3" />
              <p className="font-host-grotesk text-rosewood/40">No upcoming shifts</p>
              <p className="font-host-grotesk text-sm text-rosewood/30">You&apos;re all caught up!</p>
            </div>
          )}
        </div>

        {/* Past */}
        <div>
          <h2 className="font-host-grotesk font-bold text-xl text-rosewood mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Past Shifts
          </h2>
          {past.length > 0 ? (
            <div className="space-y-3">
              {past.slice(0, 10).map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-host-grotesk font-semibold text-rosewood truncate">
                        {assignment.eventName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-rosewood/40 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(assignment.shiftStart)}
                        </span>
                        {assignment.hoursWorked !== undefined && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {assignment.hoursWorked}h
                          </span>
                        )}
                        {assignment.hoursWorked !== undefined && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            ${(assignment.hoursWorked * assignment.hourlyRate).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {assignment.staffNote && (
                        <p className="font-host-grotesk text-xs text-rosewood/50 mt-2 italic">
                          &ldquo;{assignment.staffNote}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {past.length > 10 && (
                <p className="text-center text-rosewood/30 font-host-grotesk text-sm">
                  +{past.length - 10} more — see the Payroll page for the full ledger
                </p>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center border border-rosewood/5 shadow-sm">
              <p className="font-host-grotesk text-rosewood/40">No past shifts yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// STAFF NOTE EDITOR (per-shift note)
// ============================================

function StaffNoteEditor({
  initialValue,
  onSave,
}: {
  initialValue: string
  onSave: (note: string) => void
}) {
  const [expanded, setExpanded] = useState(initialValue.length > 0)
  const [value, setValue] = useState(initialValue)
  const [lastSaved, setLastSaved] = useState(initialValue)
  const [isSaving, setIsSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const handleBlur = async () => {
    if (value === lastSaved) return
    setIsSaving(true)
    await onSave(value)
    setLastSaved(value)
    setIsSaving(false)
    setJustSaved(true)
    window.setTimeout(() => setJustSaved(false), 2000)
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mt-2 inline-flex items-center gap-1 text-xs text-rosewood/40 hover:text-rosewood/70 transition-colors"
      >
        <MessageSquare className="w-3 h-3" />
        Add a note
      </button>
    )
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1.5 text-xs text-rosewood/50 mb-1">
        <MessageSquare className="w-3 h-3" />
        <span>Shift note</span>
        {isSaving && <Loader2 className="w-3 h-3 animate-spin text-rosewood/40" />}
        {justSaved && !isSaving && (
          <span className="inline-flex items-center gap-0.5 text-chartreuse">
            <CheckCircle2 className="w-3 h-3" />
            Saved
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        rows={2}
        maxLength={500}
        placeholder="How was your shift? Anything to note?"
        className="w-full px-3 py-2 bg-plaster/40 border border-rosewood/10 rounded-lg font-host-grotesk text-xs text-rosewood placeholder:text-rosewood/30 focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:bg-white transition-all resize-none"
      />
    </div>
  )
}