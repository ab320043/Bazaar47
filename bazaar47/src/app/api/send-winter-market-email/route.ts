import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { WinterMarketConfirmation } from '@/app/components/email/winter-market-confirmation'
import { getApplicationById } from '@/lib/storage/winter-market'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { applicationId } = await request.json()
    if (!applicationId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    if (!process.env.NEXT_PUBLIC_RESEND_API_KEY) return NextResponse.json({ error: 'No API key' }, { status: 500 })

    const app = await getApplicationById(applicationId)
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    // Prevent sending multiple emails if clicked multiple times
    if (app.paymentStatus !== 'paid') {
      return NextResponse.json({ error: 'Application not paid yet' }, { status: 400 })
    }

    const { error } = await resend.emails.send({
      from: 'Bazaar47 <info@bazaar47.com>',
      to: [app.email],
      subject: `🎉 You're confirmed for the Downtown Winter Market!`,
      react: WinterMarketConfirmation({ application: app }),
      text: `Thank you ${app.businessName}! Your payment has been received and your spot(s) are locked in for:\n\n${app.selectedDates.join(', ')}\n\nLocation: The Streatery (106 SW 1st Ave)\nSetup: 3:00 PM\nMarket: 4:00 PM - 10:00 PM\n\nSee you there!`,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}