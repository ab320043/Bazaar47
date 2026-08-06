import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia' as Stripe.StripeConfig['apiVersion'],
})

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe secret key is set
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not set in environment variables')
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    // Parse request body
    const body = await request.json()
    console.log('Received request body:', body)

    const { amount, city, email, fullName, eventId, eventName } = body

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be greater than 0.' },
        { status: 400 }
      )
    }

    // Create the PaymentIntent with dynamic event details
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents and ensure integer
      currency: 'usd',
      receipt_email: email || undefined,
      metadata: {
        city: city || 'Unknown',
        eventId: eventId || 'unknown',
        event: eventName || 'Bazaar47 Event',
        customer_name: fullName || 'Guest',
      },
      description: `Tickets for ${eventName || 'Event'} - Bazaar47`,
    })

    console.log('PaymentIntent created:', paymentIntent.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error: unknown) {
    console.error('Payment intent error:', error)
    
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create payment intent'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}