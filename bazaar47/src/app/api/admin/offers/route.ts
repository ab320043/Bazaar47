// app/api/admin/offers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import {
  getAllOffers,
  getOffersForEvent,
} from '@/lib/storage/shift-offers'
import { publishOffer } from '@/lib/staff/offer-actions'
import type { ShiftOfferCreatePayload } from '@/types/shift-offer'
import { isOfferEligibility } from '@/types/shift-offer'
import { STAFF_ROLES } from '@/data/staff-roles'
import type { StaffRole } from '@/types/staff'

function isStaffRole(v: unknown): v is StaffRole {
  return typeof v === 'string' && STAFF_ROLES.some((r) => r.id === v)
}

// ============================================
// GET — list offers
// ============================================

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = request.nextUrl
    const eventId = url.searchParams.get('eventId')
    const statusFilter = url.searchParams.get('status')

    let offers = eventId
      ? await getOffersForEvent(eventId)
      : await getAllOffers()

    if (statusFilter) {
      offers = offers.filter((o) => o.status === statusFilter)
    }

    offers.sort(
      (a, b) =>
        new Date(a.shiftStart).getTime() - new Date(b.shiftStart).getTime()
    )

    return NextResponse.json({ offers, count: offers.length })
  } catch (error) {
    console.error('Error fetching offers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    )
  }
}

// ============================================
// POST — publish a new offer
// ============================================

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ---- Validate ----
  const missing: string[] = []
  for (const field of ['eventId', 'eventName', 'eventDate', 'role', 'shiftStart', 'shiftEnd']) {
    if (typeof body[field] !== 'string' || (body[field] as string).trim() === '') {
      missing.push(field)
    }
  }
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(', ')}` },
      { status: 400 }
    )
  }

  if (!isStaffRole(body.role)) {
    return NextResponse.json(
      { error: 'Invalid role' },
      { status: 400 }
    )
  }

  if (typeof body.slotsNeeded !== 'number' || body.slotsNeeded < 1) {
    return NextResponse.json(
      { error: 'slotsNeeded must be at least 1' },
      { status: 400 }
    )
  }

  if (typeof body.hourlyRate !== 'number' || body.hourlyRate <= 0) {
    return NextResponse.json(
      { error: 'hourlyRate must be greater than 0' },
      { status: 400 }
    )
  }

  const whoCanClaim =
    body.whoCanClaim === undefined
      ? 'all'
      : body.whoCanClaim

  if (!isOfferEligibility(whoCanClaim)) {
    return NextResponse.json(
      { error: 'Invalid whoCanClaim rule' },
      { status: 400 }
    )
  }

  const payload: ShiftOfferCreatePayload = {
    eventId: String(body.eventId),
    eventName: String(body.eventName),
    eventDate: String(body.eventDate),
    role: body.role as StaffRole,
    slotsNeeded: body.slotsNeeded,
    shiftStart: String(body.shiftStart),
    shiftEnd: String(body.shiftEnd),
    hourlyRate: body.hourlyRate,
    whoCanClaim,
    minNoticeHours:
      typeof body.minNoticeHours === 'number' ? body.minNoticeHours : undefined,
    cancellationDeadline:
      typeof body.cancellationDeadline === 'string'
        ? body.cancellationDeadline
        : undefined,
    graceHours:
      typeof body.graceHours === 'number' ? body.graceHours : undefined,
    noShowMinutes:
      typeof body.noShowMinutes === 'number' ? body.noShowMinutes : undefined,
    status:
      body.status === 'draft' || body.status === 'open'
        ? body.status
        : 'open',
  }

  try {
    const offer = await publishOffer(payload, 'admin')
    return NextResponse.json({ success: true, offer }, { status: 201 })
  } catch (err) {
    console.error('Error publishing offer:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to publish offer' },
      { status: 400 }
    )
  }
}