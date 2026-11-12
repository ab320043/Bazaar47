import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import {
  getApplicationById,
  updateApplication,
} from '@/lib/storage/winter-market'

// Force Node.js runtime and disable any Next.js body parsing
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia' as Stripe.StripeConfig['apiVersion'],
})

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !secret) {
    console.error('Webhook missing signature or secret')
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  // CRITICAL: Get the raw text body, not JSON
  const body = await request.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 400 }
    )
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent
      const applicationId = intent.metadata.applicationId
      if (!applicationId) return NextResponse.json({ received: true })

      console.log('Webhook: Payment succeeded for application', applicationId)

      const app = await getApplicationById(applicationId)
      if (!app) {
        console.warn('Webhook: application not found for intent', intent.id)
        return NextResponse.json({ received: true })
      }

      await updateApplication(applicationId, {
        paymentStatus: 'paid',
        stripePaymentIntentId: intent.id,
        totalPaid: intent.amount / 100,
        holdExpiresAt: undefined,
      })
    }

    if (
      event.type === 'payment_intent.payment_failed' ||
      event.type === 'payment_intent.canceled'
    ) {
      const intent = event.data.object as Stripe.PaymentIntent
      const applicationId = intent.metadata.applicationId
      if (applicationId) {
        await updateApplication(applicationId, {
          paymentStatus: 'expired',
          holdExpiresAt: undefined,
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}