// app/api/send-dance-signup-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { DanceSignupConfirmation } from '@/app/components/email/dance-signup-confirmation'
import { getEventById } from '@/app/tickets/UpcomingShows/events'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📧 Received dance battle sign-up email request:', body)

    const {
      firstName,
      lastName,
      dancerName,
      instagram,
      email,
      city,
      eventName,
      signupNumber,
    } = body

    if (!email) {
      console.error('❌ No email provided')
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!process.env.NEXT_PUBLIC_RESEND_API_KEY) {
      console.error('❌ NEXT_PUBLIC_RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    // Pull the Block Party's date/time/location from the same source of
    // truth the ticket page uses, instead of trusting client-sent values.
    const blockParty = getEventById('block-party')
    const eventDate = blockParty?.date || 'Saturday, August 22, 2026'
    const eventTime = blockParty?.time || '9:00 PM'
    const eventLocation = blockParty
      ? `${blockParty.location}, ${blockParty.city}, ${blockParty.state}`
      : '60 SW 2nd Street, Gainesville, FL'

    const displayName = dancerName || firstName || 'Dancer'
    const subject = `🔥 You're In: Dance Battle Sign-Up Confirmed - Bazaar47`

    console.log('📧 Attempting to send dance battle confirmation email:')
    console.log('  - From: Bazaar47 <info@bazaar47.com>')
    console.log('  - To:', email)
    console.log('  - Subject:', subject)
    console.log('  - Sign-up #:', signupNumber)

    const { data, error } = await resend.emails.send({
      from: 'Bazaar47 <info@bazaar47.com>',
      to: [email],
      subject: subject,
      react: DanceSignupConfirmation({
        firstName: firstName || 'Dancer',
        lastName: lastName || '',
        dancerName: displayName,
        instagram: instagram || '',
        city: city || 'TBA',
        eventName: eventName || 'The Big Bazaar Block Party — Dance Battle',
        eventDate,
        eventTime,
        eventLocation,
        signupNumber: signupNumber || 'N/A',
      }),
      text: `You're in, ${displayName}!\n\nYour spot in the Bazaar47 Block Party Dance Battle is confirmed.\n\nSign-up #${signupNumber}\nDancer: ${displayName}\nFrom: ${city}\n\n${eventDate} at ${eventTime}\n${eventLocation}\n\nKeep an eye on your inbox — battle order goes out closer to the date.\n\n✦ Bazaar47 • 60 SW 2nd Street, Gainesville, FL`,
      tags: [
        {
          name: 'category',
          value: 'dance-signup-confirmation',
        },
        {
          name: 'event-type',
          value: 'bazaar-event',
        },
      ],
    })

    if (error) {
      console.error('❌ Resend API Error:', {
        message: error.message,
        name: error.name,
        statusCode: error.statusCode,
      })
      return NextResponse.json(
        {
          error: 'Failed to send email',
          details: error.message,
          statusCode: error.statusCode,
        },
        { status: error.statusCode || 500 }
      )
    }

    console.log('✅ Dance battle confirmation email sent!')
    console.log('  - ID:', data?.id)

    return NextResponse.json({
      success: true,
      message: 'Dance battle sign-up confirmation email sent',
      emailId: data?.id,
    })
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: String(error) },
      { status: 500 }
    )
  }
}