// app/api/winter-market/apply/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import {
  getAllApplications,
  createApplication,
  countOccupiedSpots,
  getApplicationById,
  updateApplication,
} from '@/lib/storage/winter-market'
import {
  WINTER_MARKET_DATES,
  MAX_VENDORS_PER_DAY,
  VENDOR_FEE_PER_DAY,
  HOLD_DURATION_MINUTES,
} from '@/data/winter-market'
import type { WinterMarketApplyPayload } from '@/types/winter-market'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia' as Stripe.StripeConfig['apiVersion'],
})

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WinterMarketApplyPayload

    // ---- Validation ----
    if (!body.fullName?.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }
    if (!isValidEmail(body.email || '')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!body.phone?.trim()) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
    }
    if (!body.businessName?.trim()) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
    }
    if (!body.products?.trim()) {
      return NextResponse.json({ error: 'Please describe what you sell' }, { status: 400 })
    }
    if (!Array.isArray(body.selectedDates) || body.selectedDates.length === 0) {
      return NextResponse.json({ error: 'Select at least one date' }, { status: 400 })
    }
    for (const d of body.selectedDates) {
      if (!WINTER_MARKET_DATES.includes(d as typeof WINTER_MARKET_DATES[number])) {
        return NextResponse.json({ error: `Invalid date: ${d}` }, { status: 400 })
      }
    }
    // Dedupe
    const selectedDates = Array.from(new Set(body.selectedDates))

    // ---- Capacity check (with a short-lived lock) ----
    // Read current state
    const applications = await getAllApplications()
    const now = Date.now()
    for (const date of selectedDates) {
      const taken = countOccupiedSpots(applications, date, now)
      if (taken >= MAX_VENDORS_PER_DAY) {
        return NextResponse.json(
          { error: `Sorry, ${date} is full. Please pick another date.` },
          { status: 409 }
        )
      }
    }

    // ---- Create the pending application ----
    const holdExpiresAt = new Date(
      now + HOLD_DURATION_MINUTES * 60 * 1000
    ).toISOString()

    const application = await createApplication({
      fullName: body.fullName.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone.trim(),
      instagram: body.instagram?.trim() || undefined,
      businessName: body.businessName.trim(),
      products: body.products.trim(),
      needsTable: !!body.needsTable,
      needsTent: !!body.needsTent,
      needsElectricity: !!body.needsElectricity,
      needsExtensionCord: !!body.needsExtensionCord,
      selectedDates,
      paymentStatus: 'pending',
      holdExpiresAt,
    })

    // ---- Create Stripe PaymentIntent ----
    const amount = selectedDates.length * VENDOR_FEE_PER_DAY * 100

    // Stripe metadata must be short strings
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      receipt_email: application.email,
      metadata: {
        applicationId: application.id,
        type: 'winter-market-vendor',
        dates: selectedDates.join(','),
      },
      description: `Downtown Winter Market — ${selectedDates.length} night${selectedDates.length === 1 ? '' : 's'}`,
    })

    // ---- Record the payment intent id ----
    await updateApplication(application.id, {
      stripePaymentIntentId: paymentIntent.id,
      totalPaid: amount / 100,
    })

    // ---- Re-check capacity after creating (defensive) ----
    // Two simultaneous requests could both pass the first check. If we
    // detect over-capacity now, void the just-created intent and mark
    // this application as expired.
    const fresh = await getAllApplications()
    for (const date of selectedDates) {
      const taken = countOccupiedSpots(fresh, date, Date.now())
      if (taken > MAX_VENDORS_PER_DAY) {
        await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => {})
        await updateApplication(application.id, {
          paymentStatus: 'expired',
          holdExpiresAt: undefined,
        })
        return NextResponse.json(
          { error: `Sorry, ${date} filled up while you were applying.` },
          { status: 409 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      clientSecret: paymentIntent.client_secret,
      amount,
    })
  } catch (error) {
    console.error('Winter Market apply error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create application' },
      { status: 500 }
    )
  }
}