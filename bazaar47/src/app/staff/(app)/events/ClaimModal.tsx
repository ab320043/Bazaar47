// app/staff/(app)/events/ClaimModal.tsx
'use client'

import { useState } from 'react'
import {
  X,
  Clock,
  DollarSign,
  Users,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from 'lucide-react'
import type { ShiftClaim } from '@/types/staff-claim'
import type { ShiftOffer } from '@/types/shift-offer'
import { STAFF_ROLES } from '@/data/staff-roles'

// ============================================
// TYPES
// ============================================

export interface OfferWithStatus {
  offer: ShiftOffer
  slotsRemaining: number
  alreadyClaimed: boolean
  existingClaim: ShiftClaim | null
}

export interface EventGroup {
  eventId: string
  eventName: string
  eventDate: string
  offers: OfferWithStatus[]
}

interface ClaimModalProps {
  group: EventGroup
  onClose: () => void
  onChanged: () => void
}

// ============================================
// HELPERS
// ============================================

function formatWindow(shiftStart: string, shiftEnd: string): string {
  const s = new Date(shiftStart)
  const e = new Date(shiftEnd)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '—'
  const sStr = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const eStr = e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const sameDay = s.toDateString() === e.toDateString()
  if (sameDay) return `${sStr} – ${eStr}`
  const eDay = e.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return `${sStr} – ${eDay} ${eStr}`
}

// ============================================
// COMPONENT
// ============================================

export function ClaimModal({ group, onClose, onChanged }: ClaimModalProps) {
  const [actingOfferId, setActingOfferId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)

  const handleClaim = async (offerId: string) => {
    setActingOfferId(offerId)
    setFeedback(null)
    try {
      const res = await fetch('/api/staff/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setFeedback({
          kind: 'error',
          message: body.error || 'Failed to claim shift',
        })
        return
      }

      setFeedback({
        kind: 'success',
        message: 'Claim submitted — waiting for admin confirmation.',
      })
      onChanged()
    } catch (err) {
      console.error('Claim error:', err)
      setFeedback({ kind: 'error', message: 'Network error' })
    } finally {
      setActingOfferId(null)
    }
  }

  const handleRelease = async (claimId: string, offerId: string) => {
    if (
      !confirm(
        'Release this pending claim? You can claim it again later if the slot is still open.'
      )
    ) {
      return
    }
    setActingOfferId(offerId)
    setFeedback(null)
    try {
      const res = await fetch(`/api/staff/claims/${claimId}`, {
        method: 'DELETE',
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setFeedback({
          kind: 'error',
          message: body.error || 'Failed to release claim',
        })
        return
      }

      setFeedback({ kind: 'success', message: 'Claim released.' })
      onChanged()
    } catch (err) {
      console.error('Release error:', err)
      setFeedback({ kind: 'error', message: 'Network error' })
    } finally {
      setActingOfferId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-rosewood/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-rosewood/10 p-5 flex items-center justify-between z-10">
          <div className="min-w-0">
            <h3 className="font-host-grotesk font-bold text-xl text-rosewood truncate">
              {group.eventName}
            </h3>
            <p className="font-host-grotesk text-sm text-rosewood/50 mt-0.5">
              {new Date(`${group.eventDate}T12:00:00`).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-plaster/50 rounded-full transition-colors shrink-0 ml-3"
          >
            <X className="w-5 h-5 text-rosewood/60" />
          </button>
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={`mx-5 mt-4 rounded-xl p-3 flex items-start gap-2 ${
              feedback.kind === 'success'
                ? 'bg-chartreuse/10 border border-chartreuse/30'
                : 'bg-poppy/10 border border-poppy/20'
            }`}
          >
            {feedback.kind === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-cypress shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-poppy shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm font-host-grotesk ${
                feedback.kind === 'success' ? 'text-cypress' : 'text-poppy'
              }`}
            >
              {feedback.message}
            </p>
          </div>
        )}

        {/* Offers */}
        <div className="p-5 space-y-3">
          {group.offers.map((item) => (
            <OfferRow
              key={item.offer.id}
              item={item}
              acting={actingOfferId === item.offer.id}
              onClaim={() => handleClaim(item.offer.id)}
              onRelease={() =>
                item.existingClaim
                  ? handleRelease(item.existingClaim.id, item.offer.id)
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// OFFER ROW
// ============================================

function OfferRow({
  item,
  acting,
  onClaim,
  onRelease,
}: {
  item: OfferWithStatus
  acting: boolean
  onClaim: () => void
  onRelease: () => void
}) {
  const { offer, slotsRemaining, alreadyClaimed } = item
  const roleDef = STAFF_ROLES.find((r) => r.id === offer.role)
  const isFull = slotsRemaining === 0

  return (
    <div className="bg-plaster/30 rounded-2xl p-4 border border-rosewood/5">
      {/* Role + rate */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl shrink-0">{roleDef?.icon || '👤'}</span>
          <div>
            <h4 className="font-host-grotesk font-bold text-rosewood">
              {roleDef?.label || offer.role}
            </h4>
            <p className="font-host-grotesk text-xs text-rosewood/50">
              {isFull ? 'Filled' : `${slotsRemaining} slot${slotsRemaining === 1 ? '' : 's'} left`}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-host-grotesk font-bold text-rosewood">
            ${offer.hourlyRate}/hr
          </p>
        </div>
      </div>

      {/* Time + details */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-xs text-rosewood/60 font-host-grotesk">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatWindow(offer.shiftStart, offer.shiftEnd)}
        </span>
        {offer.minNoticeHours > 0 && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {offer.minNoticeHours}h notice
          </span>
        )}
      </div>

      {/* Action */}
      {alreadyClaimed ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-chartreuse/10 border border-chartreuse/30 rounded-lg px-3 py-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cypress shrink-0" />
            <span className="font-host-grotesk text-xs text-cypress font-semibold">
              Waiting for admin confirmation
            </span>
          </div>
          <button
            onClick={onRelease}
            disabled={acting}
            className="text-xs font-host-grotesk font-semibold text-rosewood/50 hover:text-poppy px-3 py-2 rounded-lg hover:bg-poppy/5 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            {acting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Release
          </button>
        </div>
      ) : isFull ? (
        <div className="bg-rosewood/5 rounded-lg px-3 py-2 text-center">
          <span className="font-host-grotesk text-xs text-rosewood/50">
            This shift is filled
          </span>
        </div>
      ) : (
        <button
          onClick={onClaim}
          disabled={acting}
          className="w-full bg-chartreuse hover:bg-chartreuse/90 text-grove font-host-grotesk font-bold text-sm py-2.5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {acting && <Loader2 className="w-4 h-4 animate-spin" />}
          Claim this shift
        </button>
      )}
    </div>
  )
}