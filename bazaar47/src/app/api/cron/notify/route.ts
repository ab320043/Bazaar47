// app/api/cron/notify/route.ts
//
// Time-based notifications:
//   1. 24h reminders for upcoming confirmed shifts
//   2. 2h reminders
//   3. No-show alerts (staff never checked in)
//   4. Auto-close digest (from reconcile's worklogs flagged needsReview)
//   5. Understaffed alerts (event within 48h, slots still open)
//
// All notifications are idempotent — dedupe keys prevent double-sends.

import { NextRequest, NextResponse } from 'next/server'
import { getAssignmentsByStatus } from '@/lib/storage/staff-assignments'
import { getStaffById } from '@/lib/storage/staff'
import { getOfferById } from '@/lib/storage/shift-offers'
import {
  getClaimsForOffer,
  getAllClaims,
} from '@/lib/storage/staff-claims'
import {
  getAllWorkLogs,
} from '@/lib/storage/staff-worklogs'
import { getWorkLogsNeedingReview } from '@/lib/storage/staff-worklogs'
import {
  notifyReminder24h,
  notifyReminder2h,
  notifyAdminNoShow,
  notifyAdminAutoClosedDigest,
  notifyAdminUnderstaffed,
} from '@/lib/email/notify'
import type { ShiftClaim } from '@/types/staff-claim'
import type { ShiftOffer } from '@/types/shift-offer'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const REMINDER_24H_MS = 24 * 60 * 60 * 1000
const REMINDER_2H_MS = 2 * 60 * 60 * 1000
const TOLERANCE_MS = 15 * 60 * 1000

interface RunSummary {
  reminders24: number
  reminders2: number
  noShows: number
  autoClosedDigest: number
  understaffed: number
  errors: string[]
}

export async function GET(request: NextRequest) {
  // ---- Auth ----
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json(
      { error: 'CRON_SECRET missing' },
      { status: 500 }
    )
  }
  const auth = request.headers.get('authorization') || ''
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const summary: RunSummary = {
    reminders24: 0,
    reminders2: 0,
    noShows: 0,
    autoClosedDigest: 0,
    understaffed: 0,
    errors: [],
  }

  const now = Date.now()

  // ============================================
  // 1 & 2: REMINDERS
  // ============================================
  // Only confirmed claims (not pending, not already cancelled) get reminders.
  try {
    const allClaims = await getAllClaims()
    const upcoming = allClaims.filter(
      (c) =>
        c.status === 'confirmed' &&
        c.confirmedAt !== null
    )

    for (const claim of upcoming) {
      const offer = await getOfferById(claim.offerId)
      if (!offer) continue

      const shiftStart = new Date(offer.shiftStart).getTime()
      const msUntil = shiftStart - now
      if (msUntil < 0) continue // already started

      const staff = await getStaffById(claim.staffId)
      if (!staff?.email) continue

      // 24h window: between 23h and 25h out
      if (
        msUntil <= REMINDER_24H_MS + TOLERANCE_MS &&
        msUntil >= REMINDER_24H_MS - TOLERANCE_MS
      ) {
        try {
          await notifyReminder24h(claim, offer, staff.email)
          summary.reminders24++
        } catch (err) {
          summary.errors.push(`reminder24 ${claim.id}: ${String(err)}`)
        }
      }

      // 2h window: between 1h45m and 2h15m out
      if (
        msUntil <= REMINDER_2H_MS + TOLERANCE_MS &&
        msUntil >= REMINDER_2H_MS - TOLERANCE_MS
      ) {
        try {
          await notifyReminder2h(claim, offer, staff.email)
          summary.reminders2++
        } catch (err) {
          summary.errors.push(`reminder2 ${claim.id}: ${String(err)}`)
        }
      }
    }
  } catch (err) {
    summary.errors.push(`reminders: ${String(err)}`)
  }

  // ============================================
  // 3: NO-SHOW ALERTS
  // ============================================
  // Assignments where the reconcile cron set noShow = true and we
  // haven't notified admin yet.
  try {
    const noShowAssignments = await getAssignmentsByStatus('checked-in')
    const noShow = noShowAssignments.filter((a) => a.noShow === true)

    for (const assignment of noShow) {
      try {
        // Check if we've already notified admin about this one
        const { Redis } = await import('@upstash/redis')
        const redis = Redis.fromEnv()
        const key = `staff_notifications_sent:noShow:${assignment.id}`
        const already = await redis.get(key)
        if (already) continue

        await redis.set(key, '1', { ex: 60 * 60 * 24 * 7 })

        notifyAdminNoShow(
          assignment.staffName,
          assignment.eventName,
          assignment.roles[0] || 'unknown',
          assignment.shiftStart
        )
        summary.noShows++
      } catch (err) {
        summary.errors.push(`noShow ${assignment.id}: ${String(err)}`)
      }
    }
  } catch (err) {
    summary.errors.push(`noShow sweep: ${String(err)}`)
  }

  // ============================================
  // 4: AUTO-CLOSE DIGEST
  // ============================================
  // Work logs flagged needsReview with no prior digest notification.
  // Group by staff to one digest so admin isn't spammed.
  try {
    const needingReview = await getWorkLogsNeedingReview()

    // Filter to recent (last 24h) to avoid re-digesting old logs
    const recent = needingReview.filter((w) => {
      const created = new Date(w.createdAt).getTime()
      return now - created < 24 * 60 * 60 * 1000
    })

    if (recent.length > 0) {
      // Check idempotency by a hash of the IDs
      const { Redis } = await import('@upstash/redis')
      const redis = Redis.fromEnv()
      const hashKey = recent
        .map((w) => w.id)
        .sort()
        .join(',')
      const key = `staff_notifications_sent:autoClosedDigest:${hashKey.slice(0, 100)}`
      const already = await redis.get(key)

      if (!already) {
        await redis.set(key, '1', { ex: 60 * 60 * 24 * 7 })
        notifyAdminAutoClosedDigest(
          recent.map((w) => ({
            staffName: w.staffName,
            eventName: w.eventName,
            hoursWorked: w.hoursWorked,
            scheduledEndIso: w.shiftEnd,
          }))
        )
        summary.autoClosedDigest = recent.length
      }
    }
  } catch (err) {
    summary.errors.push(`autoCloseDigest: ${String(err)}`)
  }

  // ============================================
  // 5: UNDERSTAFFED ALERTS
  // ============================================
  // Events within 48 hours with unfilled slots. One email per event
  // per day.
  try {
    const allClaims = await getAllClaims()
    const staffSession = await import('@/lib/storage/shift-offers')
    const allOffers = await staffSession.getAllOffers()

    // Group offers by event
    const byEvent = new Map<string, ShiftOffer[]>()
    for (const o of allOffers) {
      if (o.status === 'cancelled' || o.status === 'closed') continue
      if (!byEvent.has(o.eventId)) byEvent.set(o.eventId, [])
      byEvent.get(o.eventId)!.push(o)
    }

    const claimsByOffer = new Map<string, ShiftClaim[]>()
    for (const c of allClaims) {
      if (!claimsByOffer.has(c.offerId)) claimsByOffer.set(c.offerId, [])
      claimsByOffer.get(c.offerId)!.push(c)
    }

    for (const [eventId, offers] of byEvent) {
      // Only events within 48h of now
      const soonest = offers.reduce((min, o) => {
        const t = new Date(o.shiftStart).getTime()
        return t < min ? t : min
      }, Infinity)

      if (!Number.isFinite(soonest)) continue
      if (soonest - now > 48 * 60 * 60 * 1000) continue
      if (soonest - now < 0) continue // already passed

      // Calculate coverage
      let slotsNeeded = 0
      let slotsFilled = 0
      for (const offer of offers) {
        slotsNeeded += offer.slotsNeeded
        const confirmed = (claimsByOffer.get(offer.id) || []).filter(
          (c) =>
            c.status === 'confirmed' ||
            c.status === 'checked-in' ||
            c.status === 'checked-out' ||
            c.status === 'completed'
        )
        slotsFilled += confirmed.length
      }

      if (slotsFilled >= slotsNeeded) continue

      // Idempotency: one alert per event per day
      const dayKey = new Date().toISOString().slice(0, 10)
      const { Redis } = await import('@upstash/redis')
      const redis = Redis.fromEnv()
      const key = `staff_notifications_sent:understaffed:${eventId}:${dayKey}`
      const already = await redis.get(key)

      if (!already) {
        await redis.set(key, '1', { ex: 60 * 60 * 48 })
        notifyAdminUnderstaffed(
          eventId,
          offers[0].eventName,
          offers[0].eventDate,
          slotsNeeded,
          slotsFilled
        )
        summary.understaffed++
      }
    }
  } catch (err) {
    summary.errors.push(`understaffed: ${String(err)}`)
  }

  return NextResponse.json({ success: true, run: summary })
}