// app/staff/(app)/shifts/[id]/page.tsx
'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Briefcase,
  DollarSign,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Hourglass,
  Info,
  Building2,
} from 'lucide-react'
import type { StaffAssignment, StaffRole } from '@/types/staff'
import type { WorkLog } from '@/types/staff-worklog'
import { STAFF_ROLES } from '@/data/staff-roles'

// ============================================
// TYPES
// ============================================

interface EventDetail {
  id: string
  name: string
  date: string
  dateDisplay: string
  time: string
  location: string
  address: string
  venueDetails: string | null
  highlights: string[]
  type: string
}

interface ShiftDetailResponse {
  assignment: StaffAssignment
  event: EventDetail | null
  workLog: WorkLog | null
  offer: {
    id: string
    eventName: string
    shiftStart: string
    shiftEnd: string
    hourlyRate: number
  } | null
  claim: {
    id: string
    status: string
    lockedRate: number
    lockedRole: StaffRole
    claimedAt: string
  } | null
}

// ============================================
// HELPERS
// ============================================

function getRolesLabel(roles: StaffRole[]): string {
  return roles
    .map((r) => STAFF_ROLES.find((x) => x.id === r)?.label || r)
    .join(' · ')
}

function formatWindow(startIso: string, endIso: string): string {
  const s = new Date(startIso)
  const e = new Date(endIso)
  const sameDay = s.toDateString() === e.toDateString()
  const sDate = s.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const sTime = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const eTime = e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `${sDate} · ${sTime} – ${eTime}`
  const eDate = e.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  return `${sDate} ${sTime} – ${eDate} ${eTime}`
}

function statusBadge(assignment: StaffAssignment, workLog: WorkLog | null) {
  if (assignment.status === 'cancelled') {
    return { label: 'Cancelled', cls: 'bg-rosewood/10 text-rosewood/60' }
  }
  if (workLog?.checkInTime && !workLog.checkOutTime) {
    return { label: 'On shift', cls: 'bg-chartreuse/20 text-cypress' }
  }
  if (workLog?.checkOutTime) {
    return { label: 'Completed', cls: 'bg-grove/10 text-grove' }
  }
  if (assignment.noShow) {
    return { label: 'No-show', cls: 'bg-poppy/10 text-poppy' }
  }
  if (assignment.status === 'confirmed') {
    return { label: 'Confirmed', cls: 'bg-hippie/15 text-rosewood' }
  }
  return { label: 'Assigned', cls: 'bg-rosewood/10 text-rosewood/60' }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ShiftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Next 15+ — params is a Promise.
  const { id } = use(params)

  const [data, setData] = useState<ShiftDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/staff/shifts/${id}`)
        if (res.status === 401) {
          window.location.href = '/staff/login'
          return
        }
        if (!res.ok) {
          if (!cancelled) {
            setError(
              res.status === 404
                ? 'Shift not found'
                : res.status === 403
                ? 'You do not have access to this shift'
                : 'Failed to load shift details'
            )
            setLoading(false)
          }
          return
        }
        const body = (await res.json()) as ShiftDetailResponse
        if (!cancelled) setData(body)
      } catch (err) {
        console.error('Shift detail fetch failed:', err)
        if (!cancelled) setError('Network error — please try again')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rosewood/40" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-12 h-12 text-poppy/40 mb-3" />
        <p className="font-host-grotesk text-rosewood/60">
          {error || 'Unable to load shift'}
        </p>
        <Link
          href="/staff/shifts"
          className="mt-6 bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold hover:bg-rosewood/80 transition-colors"
        >
          Back to My Shifts
        </Link>
      </div>
    )
  }

  const { assignment, event, workLog, claim } = data
  const badge = statusBadge(assignment, workLog)
  const hourlyRate = claim?.lockedRate ?? assignment.hourlyRate

  return (
    <div className="min-h-screen bg-plaster pb-20">
      <div className="p-4 sm:p-6 lg:p-10 max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/staff/shifts"
          className="inline-flex items-center gap-2 text-sm font-host-grotesk font-semibold text-rosewood/50 hover:text-rosewood mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          My Shifts
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-2xl p-6 border border-rosewood/10 shadow-sm mb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h1 className="font-host-grotesk font-bold text-2xl text-rosewood break-words">
                {assignment.eventName}
              </h1>
              {event?.venueDetails && (
                <p className="font-host-grotesk text-sm text-rosewood/60 mt-2">
                  {event.venueDetails}
                </p>
              )}
            </div>
            <span
              className={`text-xs font-host-grotesk font-semibold px-2.5 py-1 rounded-full shrink-0 ${badge.cls}`}
            >
              {badge.label}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Row icon={<Calendar className="w-4 h-4" />} label="Shift">
              {formatWindow(assignment.shiftStart, assignment.shiftEnd)}
            </Row>
            <Row icon={<Briefcase className="w-4 h-4" />} label="Role">
              {getRolesLabel(assignment.roles)}
            </Row>
            <Row icon={<DollarSign className="w-4 h-4" />} label="Rate">
              ${hourlyRate.toFixed(2)}/hr
            </Row>
            <Row icon={<Clock className="w-4 h-4" />} label="Logged hours">
              {workLog?.hoursWorked !== undefined
                ? `${workLog.hoursWorked.toFixed(2)}h`
                : workLog?.checkInTime && !workLog.checkOutTime
                ? 'On shift'
                : 'Not started'}
            </Row>
          </div>
        </div>

        {/* Location card */}
        {event && (
          <div className="bg-white rounded-2xl p-6 border border-rosewood/10 shadow-sm mb-4">
            <h2 className="font-host-grotesk font-bold text-sm uppercase tracking-wider text-rosewood/50 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </h2>
            <p className="font-host-grotesk font-semibold text-rosewood">
              {event.location}
            </p>
            <p className="font-host-grotesk text-sm text-rosewood/60 mt-1">
              {event.address}
            </p>
          </div>
        )}

        {/* Highlights */}
        {event && event.highlights.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-rosewood/10 shadow-sm mb-4">
            <h2 className="font-host-grotesk font-bold text-sm uppercase tracking-wider text-rosewood/50 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              What&apos;s happening
            </h2>
            <ul className="space-y-2">
              {event.highlights.map((h) => (
                <li
                  key={h}
                  className="flex items-center gap-2 font-host-grotesk text-sm text-rosewood/70"
                >
                  <CheckCircle2 className="w-4 h-4 text-chartreuse shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Work log / pending review */}
        {workLog?.needsReview && (
          <div className="bg-poppy/10 border border-poppy/30 rounded-2xl p-4 mb-4 flex items-start gap-3">
            <Hourglass className="w-5 h-5 text-poppy shrink-0 mt-0.5" />
            <div>
              <p className="font-host-grotesk font-semibold text-poppy text-sm">
                Pending admin review
              </p>
              <p className="font-host-grotesk text-xs text-poppy/80 mt-0.5">
                This shift was auto-closed. An admin will confirm the hours
                before they count toward pay.
              </p>
            </div>
          </div>
        )}

        {/* Staff note — read-only display. Editing lives on My Shifts. */}
        {assignment.staffNote && assignment.staffNote.trim() !== '' && (
          <div className="bg-white rounded-2xl p-6 border border-rosewood/10 shadow-sm mb-4">
            <h2 className="font-host-grotesk font-bold text-sm uppercase tracking-wider text-rosewood/50 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Your note
            </h2>
            <p className="font-host-grotesk text-sm text-rosewood/80 whitespace-pre-wrap">
              {assignment.staffNote}
            </p>
          </div>
        )}

        {/* Footer info */}
        <p className="text-center font-host-grotesk text-xs text-rosewood/40 mt-6">
          To clock in, clock out, or edit your note,{' '}
          <Link href="/staff/shifts" className="text-chartreuse hover:underline">
            go to My Shifts
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

// ============================================
// SMALL COMPONENTS
// ============================================

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="font-host-grotesk text-[10px] uppercase tracking-wider text-rosewood/40 flex items-center gap-1.5 mb-1">
        {icon}
        {label}
      </p>
      <p className="font-host-grotesk text-sm text-rosewood break-words">
        {children}
      </p>
    </div>
  )
}