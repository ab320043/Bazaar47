// app/api/winter-market/apply/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import {
  getAllApplications,
  createApplication,
  countOccupiedSpots,
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

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WinterMarketApplyPayload

    // ---- Validation ----
    if (!body.fullName?.trim()) return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    if (!body.businessName?.trim()) return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
    if (!body.phone?.trim()) return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
    if (!isValidEmail(body.email || '')) return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    if (!body.instagram?.trim()) return NextResponse.json({ error: 'Instagram is required' }, { status: 400 })
    if (!body.city?.trim()) return NextResponse.json({ error: 'City is required' }, { status: 400 })
    if (!body.products?.trim()) return NextResponse.json({ error: 'Products description is required' }, { status: 400 })
    if (!body.pricePoints?.trim()) return NextResponse.json({ error: 'Price points are required' }, { status: 400 })
    
    if (!body.portfolioLink?.trim()) {
      return NextResponse.json({ error: 'Portfolio link is required' }, { status: 400 })
    }
    if (!isValidUrl(body.portfolioLink)) {
      return NextResponse.json({ error: 'Please provide a valid URL for your portfolio' }, { status: 400 })
    }

    if (!body.soundSensitivity) return NextResponse.json({ error: 'Sound sensitivity answer is required' }, { status: 400 })
    if (!body.consentHighlight) return NextResponse.json({ error: 'Highlight consent is required' }, { status: 400 })
    if (!body.consentMedia) return NextResponse.json({ error: 'Media consent is required' }, { status: 400 })
    if (!body.liabilityAgreement) return NextResponse.json({ error: 'You must agree to the liability waiver' }, { status: 400 })

    if (!Array.isArray(body.selectedDates) || body.selectedDates.length === 0) {
      return NextResponse.json({ error: 'Select at least one date' }, { status: 400 })
    }
    for (const d of body.selectedDates) {
      if (!WINTER_MARKET_DATES.includes(d as typeof WINTER_MARKET_DATES[number])) {
        return NextResponse.json({ error: `Invalid date: ${d}` }, { status: 400 })
      }
    }
    const selectedDates = Array.from(new Set(body.selectedDates))

    // ---- Capacity check ----
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

    // ---- Create Pending Application ----
    const holdExpiresAt = new Date(now + HOLD_DURATION_MINUTES * 60 * 1000).toISOString()

    const application = await createApplication({
      fullName: body.fullName.trim(),
      preferredName: body.preferredName?.trim() || undefined,
      pronouns: body.pronouns?.trim() || undefined,
      businessName: body.businessName.trim(),
      phone: body.phone.trim(),
      email: body.email.trim().toLowerCase(),
      instagram: body.instagram.trim(),
      city: body.city.trim(),
      products: body.products.trim(),
      pricePoints: body.pricePoints.trim(),
      portfolioLink: body.portfolioLink.trim(),
      soundSensitivity: body.soundSensitivity,
      accessibilityNeeds: body.accessibilityNeeds?.trim() || undefined,
      consentHighlight: body.consentHighlight,
      consentMedia: body.consentMedia,
      liabilityAgreement: body.liabilityAgreement,
      selectedDates,
      paymentStatus: 'pending',
      holdExpiresAt,
    })

    // ---- Create Stripe Intent ----
    const amount = selectedDates.length * VENDOR_FEE_PER_DAY * 100
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

    await updateApplication(application.id, {
      stripePaymentIntentId: paymentIntent.id,
      totalPaid: amount / 100,
    })

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