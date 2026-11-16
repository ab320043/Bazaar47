// app/api/send-open-mic-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { OpenMicConfirmation } from '@/app/components/email/open-mic-confirmation'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY)

/**
 * Accepts either `sessionIso` (the canonical field name used by
 * /api/open-mic/submit) or `sessionDate` (the legacy name kept for
 * backward compatibility with any other caller). Whichever arrives,
 * we normalize to a plain 'YYYY-MM-DD' and derive the label from it.
 */
function resolveSessionIso(
  body: Record<string, unknown>
): string | null {
  const raw = body.sessionIso ?? body.sessionDate
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  // Accept strict YYYY-MM-DD. Anything else is a bug in the caller.
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null
}

function formatSessionLabel(iso: string): string {
  // Parse at LOCAL noon so no timezone ever shifts the day. Date-only
  // strings via `new Date(iso)` parse as UTC midnight and render as
  // the previous day on the US east coast — that's the classic
  // "Wednesday shows as Tuesday" bug.
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0)
  if (Number.isNaN(dt.getTime())) return iso
  return dt.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>

    const {
      fullName,
      artistName,
      genre,
      musicLink,
      instagram,
      email,
      confirmationNumber,
    } = body as {
      fullName?: string
      artistName?: string
      genre?: string
      musicLink?: string
      instagram?: string
      email?: string
      confirmationNumber?: string
    }

    if (typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    if (!process.env.NEXT_PUBLIC_RESEND_API_KEY) {
      console.error('NEXT_PUBLIC_RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    // ---- Resolve session date ----
    const sessionIso = resolveSessionIso(body)
    if (!sessionIso) {
      // This is a caller bug, not a user error. Fail loudly so it
      // shows up in logs instead of sending a broken email.
      console.error(
        '[send-open-mic-email] missing or invalid sessionIso/sessionDate:',
        { sessionIso: body.sessionIso, sessionDate: body.sessionDate }
      )
      return NextResponse.json(
        { error: 'A valid sessionIso (YYYY-MM-DD) is required' },
        { status: 400 }
      )
    }
    const sessionLabel = formatSessionLabel(sessionIso)

    const safeArtist = typeof artistName === 'string' ? artistName : 'there'
    const safeFullName = typeof fullName === 'string' ? fullName : ''
    const safeGenre = typeof genre === 'string' ? genre : ''
    const safeInstagram = typeof instagram === 'string' ? instagram : undefined
    const safeMusicLink = typeof musicLink === 'string' ? musicLink : undefined
    const safeConfirmation =
      typeof confirmationNumber === 'string' && confirmationNumber.trim() !== ''
        ? confirmationNumber
        : `OM-${sessionIso.replace(/-/g, '')}`

    const reachOutVia = safeInstagram ? 'Instagram DM' : 'email'

    const { data, error } = await resend.emails.send({
      from: 'Bazaar47 <info@bazaar47.com>',
      to: [email],
      subject: `🎤 Open Mic signup received — ${sessionLabel}`,
      react: OpenMicConfirmation({
        fullName: safeFullName,
        artistName: safeArtist,
        genre: safeGenre,
        musicLink: safeMusicLink,
        instagram: safeInstagram,
        email,
        sessionDate: sessionIso,
        sessionLabel,
        confirmationNumber: safeConfirmation,
      }),
      text: [
        `Thanks for signing up, ${safeArtist}.`,
        ``,
        `We've received your submission for Open Mic at Bazaar47.`,
        `This confirms your entry, not a scheduled performance slot.`,
        ``,
        `You signed up for: ${sessionLabel}`,
        ``,
        `What happens next:`,
        `Our team reviews every signup and puts together the run of show.`,
        `You'll hear from us via ${reachOutVia} with the details — your`,
        `set time, order, and anything else you need to know for the night.`,
        ``,
        `Getting this email doesn't guarantee a slot — the lineup is set`,
        `after we've reviewed all submissions for the week. If you're`,
        `selected, we'll reach out directly.`,
        ``,
        `Your submission:`,
        `  Name: ${safeFullName}`,
        `  Artist: ${safeArtist}`,
        `  Genre: ${safeGenre}`,
        safeMusicLink ? `  Music: ${safeMusicLink}` : null,
        safeInstagram ? `  Instagram: ${safeInstagram}` : null,
        `  Email: ${email}`,
        ``,
        `Heads up: keep an eye on your ${safeInstagram ? 'Instagram inbox' : 'email inbox'}.`,
        `That's where the run-of-show details will land if you're in the lineup.`,
        ``,
        `✦ Bazaar47 · A space for culture, community, and connection. ✦`,
        ``,
        `Questions? Contact us at info@bazaar47.com`,
      ]
        .filter((line): line is string => line !== null)
        .join('\n'),
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