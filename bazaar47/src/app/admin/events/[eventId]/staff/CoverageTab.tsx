// app/admin/events/[eventId]/staff/CoverageTab.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Clock,
  Calendar,
  DollarSign,
  Users,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import type {
  EventCoverage,
  RoleCoverage,
  OfferWithClaims,
  ShiftOffer,
} from '@/types/shift-offer'
import type { StaffAssignment, EventType } from '@/types/staff'
import { STAFF_ROLES } from '@/data/staff-roles'
import { PublishOfferModal } from './PublishOfferModal'

// ============================================
// TYPES
// ============================================

interface CoverageApiResponse {
  event: {
    id: string
    name: string
    date: string
    dateDisplay: string
    location: string
    type: EventType
    status: string
  }
  coverage: EventCoverage
  legacyAssignments: StaffAssignment[]
}

interface CoverageTabProps {
  eventId: string
  defaultShiftStart: string
  defaultShiftEnd: string
}

// ============================================
// HELPERS
// ============================================

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function getRoleDef(roleId: string) {
  return STAFF_ROLES.find((r) => r.id === roleId)
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CoverageTab({
  eventId,
  defaultShiftStart,
  defaultShiftEnd,
}: CoverageTabProps) {
  const [data, setData] = useState<CoverageApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [publishOpen, setPublishOpen] = useState(false)
  const [actionClaimId, setActionClaimId] = useState<string | null>(null)

  const fetchCoverage = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setError(null)
      try {
        const res = await fetch(
          `/api/admin/events/${eventId}/staff/coverage`
        )
        if (!res.ok) {
          if (!opts?.silent) setError('Failed to load coverage')
          return
        }
        const body = (await res.json()) as CoverageApiResponse
        setData(body)
      } catch (err) {
        console.error('Coverage fetch error:', err)
        if (!opts?.silent) setError('Network error — please try again')
      } finally {
        if (!opts?.silent) setLoading(false)
      }
    },
    [eventId]
  )

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchCoverage()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [fetchCoverage])

  const handleConfirmClaim = async (offerId: string, claimId: string) => {
    setActionClaimId(claimId)
    try {
      const res = await fetch(
        `/api/admin/offers/${offerId}/confirm-claim/${claimId}`,
        { method: 'POST' }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body.error || 'Failed to confirm claim')
        return
      }
      await fetchCoverage({ silent: true })
    } catch {
      alert('Network error')
    } finally {
      setActionClaimId(null)
    }
  }

  const handleRejectClaim = async (offerId: string, claimId: string) => {
    if (!confirm('Reject this claim? The staff member can claim again if the offer is still open.')) {
      return
    }
    setActionClaimId(claimId)
    try {
      const res = await fetch(
        `/api/admin/offers/${offerId}/reject-claim/${claimId}`,
        { method: 'POST' }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body.error || 'Failed to reject claim')
        return
      }
      await fetchCoverage({ silent: true })
    } catch {
      alert('Network error')
    } finally {
      setActionClaimId(null)
    }
  }

  const handleCancelOffer = async (offerId: string) => {
    if (!confirm('Cancel this offer? Any pending or confirmed claims will stay visible but the offer will no longer count toward coverage.')) {
      return
    }
    try {
      const res = await fetch(`/api/admin/offers/${offerId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body.error || 'Failed to cancel offer')
        return
      }
      await fetchCoverage({ silent: true })
    } catch {
      alert('Network error')
    }
  }

  const handleDeleteOffer = async (offerId: string) => {
  if (!confirm('Permanently delete this offer? This cannot be undone.')) {
    return
  }
  try {
    const res = await fetch(`/api/admin/offers/${offerId}?hard=true`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      alert(body.error || 'Failed to delete offer')
      return
    }
    await fetchCoverage({ silent: true })
  } catch {
    alert('Network error')
  }
}

  // ---- LOADING ----

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
        <Loader2 className="w-8 h-8 animate-spin text-rosewood/40 mx-auto" />
        <p className="font-host-grotesk text-rosewood/60 mt-3">
          Loading coverage...
        </p>
      </div>
    )
  }

  // ---- ERROR ----

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-poppy/40 mx-auto mb-3" />
        <p className="font-host-grotesk text-rosewood/60">
          {error || 'No coverage data'}
        </p>
        <button
          onClick={() => fetchCoverage()}
          className="mt-4 bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold hover:bg-rosewood/80 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const { coverage, legacyAssignments } = data

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-host-grotesk font-bold text-xl text-rosewood">
            Coverage
          </h2>
          <p className="font-host-grotesk text-rosewood/50 text-sm mt-0.5">
            {coverage.isFullyStaffed
              ? '✅ Fully staffed'
              : `${coverage.roles.length} role${coverage.roles.length === 1 ? '' : 's'} · not fully staffed`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchCoverage()}
            className="bg-white hover:bg-white/80 text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setPublishOpen(true)}
            className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Publish offer
          </button>
        </div>
      </div>

      {/* Empty state */}
      {coverage.roles.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
          <Users className="w-16 h-16 text-rosewood/20 mx-auto mb-4" />
          <h3 className="font-host-grotesk font-bold text-2xl text-rosewood">
            No offers yet
          </h3>
          <p className="font-host-grotesk text-rosewood/50 mt-2">
            Publish a shift offer to start staffing this event.
          </p>
          <button
            onClick={() => setPublishOpen(true)}
            className="mt-6 inline-flex items-center gap-2 bg-chartreuse hover:bg-chartreuse/90 text-grove px-6 py-2 rounded-xl font-host-grotesk font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            Publish your first offer
          </button>
        </div>
      )}

      {/* Role cards */}
      {coverage.roles.map((roleGroup) => (
        <RoleCard
          key={roleGroup.role}
          roleGroup={roleGroup}
          actionClaimId={actionClaimId}
          onConfirm={handleConfirmClaim}
          onReject={handleRejectClaim}
          onCancelOffer={handleCancelOffer}
          onDeleteOffer={handleDeleteOffer}
          onPublish={() => setPublishOpen(true)}
        />
      ))}

      {/* Legacy assignments section */}
      {legacyAssignments.length > 0 && (
        <div className="bg-white rounded-2xl border border-rosewood/10 shadow-sm overflow-hidden">
          <div className="bg-plaster/40 px-5 py-3 border-b border-rosewood/10">
            <h3 className="font-host-grotesk font-bold text-sm text-rosewood/70 uppercase tracking-wider">
              Legacy assignments ({legacyAssignments.length})
            </h3>
            <p className="font-host-grotesk text-xs text-rosewood/50 mt-0.5">
              Created before offers existed. These staff are assigned but
              aren&apos;t tracked by the offer system.
            </p>
          </div>
          <div className="divide-y divide-rosewood/5">
            {legacyAssignments.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rosewood/10 flex items-center justify-center text-sm shrink-0">
                  {getRoleDef(a.roles[0])?.icon || '👤'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-host-grotesk font-semibold text-sm text-rosewood truncate">
                    {a.staffName}
                  </p>
                  <p className="font-host-grotesk text-xs text-rosewood/50 truncate">
                    {a.roles.map((r) => getRoleDef(r)?.label || r).join(' · ')}
                    {' · '}
                    {formatTime(a.shiftStart)} – {formatTime(a.shiftEnd)}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rosewood/5 text-rosewood/50 shrink-0">
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {publishOpen && (
        <PublishOfferModal
          eventId={eventId}
          eventName={data.event.name}
          eventDate={data.event.date}
          eventType={data.event.type}
          defaultShiftStart={defaultShiftStart}
          defaultShiftEnd={defaultShiftEnd}
          onClose={() => setPublishOpen(false)}
          onPublished={() => {
            setPublishOpen(false)
            void fetchCoverage({ silent: true })
          }}
        />
      )}
    </div>
  )
}

// ============================================
// ROLE CARD
// ============================================

function RoleCard({
  roleGroup,
  actionClaimId,
  onConfirm,
  onReject,
  onCancelOffer,
  onDeleteOffer,
  onPublish,
}: {
  roleGroup: RoleCoverage
  actionClaimId: string | null
  onConfirm: (offerId: string, claimId: string) => void
  onReject: (offerId: string, claimId: string) => void
  onCancelOffer: (offerId: string) => void
  onDeleteOffer: (offerId: string) => void
  onPublish: () => void
}) {
  const roleDef = getRoleDef(roleGroup.role)
  const filledText = `${roleGroup.totalSlotsFilled} of ${roleGroup.totalSlotsNeeded} filled`

  const cardBorder = roleGroup.isFullyStaffed
    ? 'border-chartreuse/40'
    : roleGroup.totalSlotsFilled === 0
    ? 'border-poppy/30 bg-poppy/5'
    : 'border-rosewood/10'

  return (
    <div className={`bg-white rounded-2xl border-2 ${cardBorder} shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className="p-4 border-b border-rosewood/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0">
            {roleDef?.icon || '👤'}
          </span>
          <div className="min-w-0">
            <h3 className="font-host-grotesk font-bold text-lg text-rosewood">
              {roleDef?.label || roleGroup.role}
            </h3>
            <p className="font-host-grotesk text-xs text-rosewood/50 mt-0.5">
              {filledText}
              {roleGroup.totalSlotsPending > 0 && (
                <span className="text-chartreuse ml-1">
                  · {roleGroup.totalSlotsPending} pending
                </span>
              )}
            </p>
          </div>
        </div>
        {roleGroup.isFullyStaffed ? (
          <span className="text-xs font-semibold text-chartreuse bg-chartreuse/10 px-2.5 py-1 rounded-full shrink-0">
            ✅ Staffed
          </span>
        ) : roleGroup.totalSlotsFilled === 0 ? (
          <span className="text-xs font-semibold text-poppy bg-poppy/10 px-2.5 py-1 rounded-full shrink-0">
            ⚠️ Unfilled
          </span>
        ) : (
          <span className="text-xs font-semibold text-rosewood/60 bg-rosewood/10 px-2.5 py-1 rounded-full shrink-0">
            Partial
          </span>
        )}
      </div>

      {/* Offers */}
      <div className="divide-y divide-rosewood/5">
        {roleGroup.offers.map((offerWithClaims) => (
          <OfferRow
            key={offerWithClaims.offer.id}
            offerWithClaims={offerWithClaims}
            actionClaimId={actionClaimId}
            onConfirm={onConfirm}
            onReject={onReject}
            onCancelOffer={onCancelOffer}
            onDeleteOffer={onDeleteOffer}
          />
        ))}
      </div>

      {/* Add another offer for this role */}
      <div className="p-3 border-t border-rosewood/5">
        <button
          onClick={onPublish}
          className="text-xs font-host-grotesk font-semibold text-rosewood/50 hover:text-chartreuse transition-colors flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Publish another {roleDef?.label.toLowerCase() || 'offer'}
        </button>
      </div>
    </div>
  )
}

// ============================================
// OFFER ROW
// ============================================

function OfferRow({
  offerWithClaims,
  actionClaimId,
  onConfirm,
  onReject,
  onCancelOffer,
  onDeleteOffer,
}: {
  offerWithClaims: OfferWithClaims
  actionClaimId: string | null
  onConfirm: (offerId: string, claimId: string) => void
  onReject: (offerId: string, claimId: string) => void
  onCancelOffer: (offerId: string) => void
  onDeleteOffer: (offerId: string) => void
}) {
  const { offer, claims } = offerWithClaims

  const confirmed = claims.filter(
    (c) =>
      c.status === 'confirmed' ||
      c.status === 'checked-in' ||
      c.status === 'checked-out' ||
      c.status === 'completed' ||
      c.status === 'auto-closed'
  )
  const pending = claims.filter((c) => c.status === 'pending')

  return (
    <div className="p-4">
      {/* Offer header row */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-host-grotesk text-rosewood/60">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(offer.shiftStart)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(offer.shiftStart)} – {formatTime(offer.shiftEnd)}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {offer.hourlyRate}/hr
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rosewood/10 text-rosewood/60">
          {offer.slotsFilled}/{offer.slotsNeeded}
        </span>
        <div className="ml-auto flex items-center gap-2">
        {claims.length === 0 && (
            <button
            onClick={() => onDeleteOffer(offer.id)}
            className="text-xs font-host-grotesk text-rosewood/40 hover:text-poppy transition-colors flex items-center gap-1"
            title="Delete offer (permanent)"
            >
            <Trash2 className="w-3 h-3" />
                Delete
            </button>
        )}
        <button
            onClick={() => onCancelOffer(offer.id)}
            className="text-xs font-host-grotesk text-rosewood/40 hover:text-poppy transition-colors"
            title="Cancel offer"
        >
            Cancel offer
        </button>
        </div>
      </div>

      {/* Confirmed claims */}
      {confirmed.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {confirmed.map((claim) => (
            <div
              key={claim.claimId}
              className="flex items-center gap-2 bg-grove/5 rounded-lg px-3 py-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-grove shrink-0" />
              <span className="font-host-grotesk text-sm text-rosewood font-medium truncate">
                {claim.staffName}
              </span>
              <span className="text-[10px] text-rosewood/40 font-host-grotesk shrink-0 ml-auto">
                {claim.status === 'completed' || claim.status === 'auto-closed'
                  ? 'Worked'
                  : claim.status === 'checked-in'
                  ? 'On shift'
                  : 'Confirmed'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Pending claims */}
      {pending.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {pending.map((claim) => {
            const isActing = actionClaimId === claim.claimId
            return (
              <div
                key={claim.claimId}
                className="flex items-center gap-2 bg-chartreuse/10 border border-chartreuse/30 rounded-lg px-3 py-2"
              >
                <Clock className="w-4 h-4 text-cypress shrink-0" />
                <span className="font-host-grotesk text-sm text-rosewood font-medium truncate flex-1">
                  {claim.staffName}
                  <span className="text-[10px] text-rosewood/50 ml-2">
                    wants this shift
                  </span>
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onConfirm(offer.id, claim.claimId)}
                    disabled={isActing}
                    className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-2.5 py-1 rounded-lg font-host-grotesk font-semibold text-xs transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    {isActing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    Confirm
                  </button>
                  <button
                    onClick={() => onReject(offer.id, claim.claimId)}
                    disabled={isActing}
                    className="bg-white hover:bg-poppy/10 text-rosewood/50 hover:text-poppy border border-rosewood/15 px-2.5 py-1 rounded-lg font-host-grotesk font-semibold text-xs transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    <XCircle className="w-3 h-3" />
                    Reject
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty offer */}
      {confirmed.length === 0 && pending.length === 0 && (
        <p className="font-host-grotesk text-xs text-rosewood/40 italic">
          No claims yet. Staff will see this in their open shifts.
        </p>
      )}
    </div>
  )
}