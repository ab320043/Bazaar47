// app/api/admin/winter-market/sync/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getAllApplications, updateApplication } from '@/lib/storage/winter-market'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia' as Stripe.StripeConfig['apiVersion'],
})

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Fetch all successful payment intents from Stripe
    // (We'll look at the last 100 payments to cover the outage window)
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
    })

    // 2. Filter for Winter Market payments that succeeded
    const successfulPayments = paymentIntents.data.filter(
      (pi) => pi.metadata.type === 'winter-market-vendor' && pi.status === 'succeeded'
    )

    // 3. Get all applications from our database
    const applications = await getAllApplications()
    const appMap = new Map(applications.map((a) => [a.id, a]))

    let updatedCount = 0

    // 4. Cross-reference and update
    for (const pi of successfulPayments) {
      const appId = pi.metadata.applicationId
      if (!appId) continue

      const app = appMap.get(appId)
      
      // If the app exists and is currently NOT marked as paid, update it
      if (app && app.paymentStatus !== 'paid') {
        await updateApplication(appId, {
          paymentStatus: 'paid',
          stripePaymentIntentId: pi.id,
          totalPaid: pi.amount / 100,
          holdExpiresAt: undefined,
        })
        // ADD THIS: Fire the email
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bazaar47.com'}/api/send-winter-market-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId: appId }),
        }).catch(() => {})

        updatedCount++
      }
    }

    return NextResponse.json({ 
      success: true, 
      updatedCount,
      message: `Successfully synced ${updatedCount} payments from Stripe.`
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync with Stripe' },
      { status: 500 }
    )
  }
}