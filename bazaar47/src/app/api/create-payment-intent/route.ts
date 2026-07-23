import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    // 1. Check if Stripe secret key is set
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not set in environment variables')
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    // 2. Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-06-24.dahlia',
    })

    // 3. Parse request body
    const body = await request.json()
    console.log('Received request body:', body)

    const { amount, city, email, fullName } = body

    // 4. Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be greater than 0.' },
        { status: 400 }
      )
    }

    // 5. Create the PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents and ensure integer
      currency: 'usd',
      receipt_email: email || undefined,
      metadata: {
        city: city || 'Unknown',
        event: 'Bazaar À La Carte - South Florida',
        customer_name: fullName || 'Guest',
      },
      description: `Tickets for ${city || 'South Florida'} - Bazaar À La Carte`,
    })

    console.log('PaymentIntent created:', paymentIntent.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error: unknown) {
    console.error('Payment intent error:', error)
    
    // Return a more specific error message
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create payment intent'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}