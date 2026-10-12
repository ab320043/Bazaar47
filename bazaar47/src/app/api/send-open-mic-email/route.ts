// app/api/send-open-mic-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { OpenMicConfirmation } from '@/app/components/email/open-mic-confirmation'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fullName,
      artistName,
      genre,
      instagram,
      email,
      sessionDate,
      confirmationNumber,
    } = body

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

    // Human-readable session date, resolved server-side
    const session = new Date(`${sessionDate}T12:00:00`)
    const sessionLabel = session.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    const { data, error } = await resend.emails.send({
      from: 'Bazaar47 <info@bazaar47.com>',
      to: [email],
      subject: `🎤 You're on for Open Mic — ${sessionLabel}`,
      react: OpenMicConfirmation({
        fullName,
        artistName,
        genre,
        instagram,
        email,
        sessionDate,
        sessionLabel,
        confirmationNumber,
      }),
      text: `You're on for Open Mic!\n\nHey ${artistName},\n\nThanks for signing up. We'll see you on ${sessionLabel} at Bazaar47.\n\nArtist: ${artistName}\nGenre: ${genre}\nEmail: ${email}\nConfirmation #: ${confirmationNumber}\n\nCheck-in at 7:30 PM. Bring whatever you need for your set.\n\n✦ Bazaar47 · A space for culture, community, and connection. ✦`,
      tags: [
        { name: 'category', value: 'open-mic-confirmation' },
        { name: 'program', value: 'open-mic' },
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