// app/api/admin/winter-market/refund/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import {
  getApplicationById,
  updateApplication,
} from '@/lib/storage/winter-market'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia' as Stripe.StripeConfig['apiVersion'],
})

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { applicationId } = await request.json()
    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId required' }, { status: 400 })
    }

    const app = await getApplicationById(applicationId)
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    if (app.paymentStatus !== 'paid') {
      return NextResponse.json(
        { error: `Cannot refund: status is ${app.paymentStatus}` },
        { status: 400 }
      )
    }
    if (!app.stripePaymentIntentId) {
      return NextResponse.json(
        { error: 'No payment intent on record' },
        { status: 400 }
      )
    }

    const refund = await stripe.refunds.create({
      payment_intent: app.stripePaymentIntentId,
      reason: 'requested_by_customer',
    })

    await updateApplication(app.id, {
      paymentStatus: 'refunded',
    })

    return NextResponse.json({ success: true, refundId: refund.id })
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Refund failed' },
      { status: 500 }
    )
  }
}