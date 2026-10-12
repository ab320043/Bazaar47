// app/api/send-reopening-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { ReopeningConfirmation } from '@/app/components/email/reopening-confirmation'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, email, instagram, guestCount, orderNumber } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!process.env.NEXT_PUBLIC_RESEND_API_KEY) {
      console.error('NEXT_PUBLIC_RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    const { data, error } = await resend.emails.send({
      from: 'Bazaar47 <info@bazaar47.com>',
      to: [email],
      subject: "🎉 You're invited: Bazaar47 Grand (Re)Opening",
      react: ReopeningConfirmation({
        fullName: fullName || 'Guest',
        email,
        instagram: instagram || '',
        guestCount: guestCount || 1,
        orderNumber: orderNumber || 'N/A',
      }),
      text: `You're in!\n\n${fullName}, thanks for RSVPing to the Bazaar47 Grand (Re)Opening.\n\nAlso Laila's birthday party — two celebrations, one night.\n\nThursday, October 15, 2026\n8:00 PM – 11:00 PM\nBazaar47 · 60 SW 2nd Street, Gainesville, FL\n\nGuests: ${guestCount}\nRSVP #: ${orderNumber}\n\nSee you there.\n\n✦ Bazaar47 · A space for culture, community, and connection. ✦`,
      tags: [
        { name: 'category', value: 'reopening-rsvp' },
        { name: 'event-type', value: 'grand-reopening' },
      ],
    })

    if (error) {
      console.error('Resend API Error:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Reopening confirmation sent',
      emailId: data?.id,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: String(error) },
      { status: 500 }
    )
  }
}