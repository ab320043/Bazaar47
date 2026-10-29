// app/api/send-open-mic-schedule/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { formatSessionLong } from '@/lib/open-mic/dates'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, artistName, sessionDate, startTime } = await request.json()

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
    if (!process.env.NEXT_PUBLIC_RESEND_API_KEY) return NextResponse.json({ error: 'No API key' }, { status: 500 })

    const sessionLabel = formatSessionLong(sessionDate)
    const timeLabel = new Date(startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

    const { data, error } = await resend.emails.send({
      from: 'Bazaar47 <info@bazaar47.com>',
      to: [email],
      subject: `🎤 You're scheduled for Open Mic — ${sessionLabel}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #EFEADE; padding: 20px;">
          <div style="background: #202912; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #EFEADE; margin: 0;">Bazaar47</h1>
            <p style="color: #CCD145; margin: 6px 0 0; letter-spacing: 2px; text-transform: uppercase;">Open Mic Schedule</p>
          </div>
          <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #D5C9B1;">
            <h2 style="color: #341B1C; margin-top: 0;">You're on the lineup, ${artistName}!</h2>
            <p style="color: #6A2630; margin-bottom: 20px;">The schedule is set. Here are your details for the upcoming Open Mic:</p>
            
            <div style="background: #F5F0E8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 4px 0;"><strong>Date:</strong> ${sessionLabel}</p>
              <p style="margin: 4px 0;"><strong>Set Time:</strong> ${timeLabel}</p>
              <p style="margin: 4px 0;"><strong>Location:</strong> Bazaar47 · 60 SW 2nd Street</p>
            </div>
            
            <p style="color: #6A2630; font-size: 13px;">Please check in with the sound tech 15 minutes before your set time.</p>
          </div>
        </div>
      `
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}