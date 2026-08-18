// app/api/send-dance-signup-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { DanceSignupConfirmation } from '@/app/components/email/dance-signup-confirmation'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📧 Received dance sign-up email request:', body)
    
    const { 
      firstName,
      lastName,
      dancerName,
      email,
      city,
      eventId,
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

    const fullName = `${firstName} ${lastName}`

    console.log('📧 Attempting to send dance confirmation email:')
    console.log('  - From: Bazaar47 <info@bazaar47.com>')
    console.log('  - To:', email)
    console.log('  - Subject: 🎤 Dance Battle Confirmation - Big Bazaar Block Party')
    console.log('  - Dancer:', dancerName)

    const { data, error } = await resend.emails.send({
      from: 'Bazaar47 <info@bazaar47.com>',
      to: [email],
      subject: '🎤 Dance Battle Confirmation - Big Bazaar Block Party',
      react: DanceSignupConfirmation({
        firstName: firstName,
        lastName: lastName,
        dancerName: dancerName || fullName,
        email: email,
        city: city || 'TBA',
        eventDate: 'Saturday, August 22, 2026',
        eventTime: '9:00 PM - 1:00 AM',
        eventLocation: '60 SW 2nd Street, Gainesville, FL',
        signupNumber: signupNumber || `DB-${Date.now().toString(36).toUpperCase()}`,
      }),
      text: `🔥 You're In the Battle, ${dancerName || fullName}! 🔥\n\nYour spot in the Red Bull Dance Your Style Showcase has been confirmed.\n\nDancer: ${dancerName}\nFull Name: ${fullName}\nCity: ${city || 'TBA'}\n\nEvent: The Big Bazaar Block Party\nDate: Saturday, August 22, 2026\nTime: 9:00 PM - 1:00 AM\nLocation: 60 SW 2nd Street, Gainesville, FL\n\n🏆 $200 Cash Prize - Red Bull Dance Your Style Showcase\n\nCheck-in: 8:30 PM at the main stage\nPlease arrive early to confirm your spot.\n\nSign-Up #: ${signupNumber}\n\n✦ Bazaar47 • A space for culture, community, and connection. ✦`,
      tags: [
        { 
          name: 'category', 
          value: 'dance-signup'
        },
        { 
          name: 'event-type', 
          value: 'block-party-dance'
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
          statusCode: error.statusCode 
        },
        { status: error.statusCode || 500 }
      )
    }

    console.log('✅ Dance confirmation email sent successfully!')
    console.log('  - ID:', data?.id)

    return NextResponse.json({ 
      success: true, 
      message: 'Dance confirmation email sent',
      emailId: data?.id 
    })
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: String(error) },
      { status: 500 }
    )
  }
}