// app/staff/(app)/events/EventCard.tsx
'use client'

import { Calendar, MapPin, ChevronRight } from 'lucide-react'
import type { ShiftOffer } from '@/types/shift-offer'
import type { ShiftClaim } from '@/types/staff-claim'
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

interface EventCardProps {
  group: EventGroup
  variant?: 'grid' | 'list'
  onClick: () => void
}

// ============================================
// HELPERS
// ============================================

function formatEventDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/**
 * Aggregate role needs. Returns "2 bartenders · 1 sound" etc., or
 * "All filled" if every offer is claimed out.
 */
function summarizeRoleNeeds(offers: OfferWithStatus[]): {
  text: string
  isEmpty: boolean
  pendingCount: number
} {
  const remainingByRole = new Map<string, number>()
  let pendingCount = 0

  for (const o of offers) {
    if (o.alreadyClaimed) {
      pendingCount += 1
      continue
    }
    if (o.slotsRemaining > 0) {
      const role = o.offer.role
      remainingByRole.set(role, (remainingByRole.get(role) || 0) + o.slotsRemaining)
    }
  }

  if (remainingByRole.size === 0) {
    return {
      text: pendingCount > 0 ? 'You have a pending claim' : 'All filled',
      isEmpty: pendingCount === 0,
      pendingCount,
    }
  }

  const parts = Array.from(remainingByRole.entries()).map(([role, count]) => {
    const label = STAFF_ROLES.find((r) => r.id === role)?.label || role
    return `${count} ${label.toLowerCase()}${count === 1 ? '' : 's'}`
  })

  return {
    text: parts.join(' · '),
    isEmpty: false,
    pendingCount,
  }
}

// ============================================
// COMPONENT
// ============================================

export function EventCard({ group, variant = 'grid', onClick }: EventCardProps) {
  const summary = summarizeRoleNeeds(group.offers)
  const hasRemaining = !summary.isEmpty
  const hasPending = summary.pendingCount > 0

  // Border color reflects state:
  //   chartreuse → offers you can claim
  //   rosewood → nothing claimable (all filled or all pending)
  const borderClass = hasRemaining
    ? 'border-chartreuse/40 hover:border-chartreuse'
    : 'border-rosewood/10 hover:border-rosewood/30'

  if (variant === 'list') {
    return (
      <button
        onClick={onClick}
        className={`w-full text-left bg-white rounded-xl border-2 ${borderClass} shadow-sm hover:shadow-md transition-all p-4 flex items-center gap-4`}
      >
        <div className="shrink-0">
          <div className="w-12 h-12 rounded-xl bg-chartreuse/15 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-cypress" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-host-grotesk font-bold text-base text-rosewood truncate">
              {group.eventName}
            </h3>
            {hasPending && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rosewood/10 text-rosewood/60">
                Pending claim
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-rosewood/50 font-host-grotesk">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatEventDate(group.eventDate)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Bazaar47
            </span>
          </div>
          <p className="font-host-grotesk text-sm mt-1.5 font-semibold text-cypress truncate">
            {summary.text}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-rosewood/40 shrink-0" />
      </button>
    )
  }

  // Grid variant
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left bg-white rounded-2xl border-2 ${borderClass} shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col`}
    >
      {/* Colored header bar */}
      <div
        className={`h-2 w-full ${
          hasRemaining ? 'bg-chartreuse' : 'bg-rosewood/20'
        }`}
      />

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-host-grotesk font-bold text-lg text-rosewood leading-tight">
            {group.eventName}
          </h3>
          {hasPending && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rosewood/10 text-rosewood/60 shrink-0">
              Pending
            </span>
          )}
        </div>

        <div className="space-y-1 text-xs text-rosewood/50 font-host-grotesk mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formatEventDate(group.eventDate)}
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Bazaar47
          </div>
        </div>

        {/* Role needs */}
        <div className="mt-auto">
          <div className="rounded-lg bg-plaster/50 px-2.5 py-1.5">
            <p
              className={`font-host-grotesk text-sm font-semibold leading-tight ${
                hasRemaining ? 'text-cypress' : 'text-rosewood/40'
              }`}
            >
              {summary.text}
            </p>
          </div>
        </div>
      </div>
    </button>
  )
}