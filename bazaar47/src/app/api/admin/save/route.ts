import { NextRequest, NextResponse } from 'next/server'
import { getSubmissions, saveSubmissions } from '@/lib/storage'
import { tourData } from '@/data/tour-data'

// Single source of truth for valid tour cities — derived directly from
// tourData so this list can never drift out of sync with the actual tour.
const VALID_TOUR_CITIES = tourData.map((c) => c.city)
const VALID_TYPES = ['vendor', 'rsvp']

function isValidEmail(email: unknown): boolean {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, type } = body

    // Never silently default the type — an unrecognized/missing type is rejected.
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid submission type' }, { status: 400 })
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Missing submission data' }, { status: 400 })
    }

    if (!data.fullName || typeof data.fullName !== 'string' || !data.fullName.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }
    if (!isValidEmail(data.email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }

    // This block is what actually stops the 33796-style ticket blowups and
    // the phantom-city entries — it runs no matter what the form sends.
    if (type === 'rsvp') {
      if (!VALID_TOUR_CITIES.includes(data.eventCity)) {
        return NextResponse.json({ error: 'Invalid event city' }, { status: 400 })
      }
      const ticketsNum = parseInt(String(data.tickets), 10)
      if (!Number.isInteger(ticketsNum) || ticketsNum < 1 || ticketsNum > 10) {
        return NextResponse.json(
          { error: 'Tickets must be a whole number between 1 and 10' },
          { status: 400 }
        )
      }
      // Normalize to a real number before saving, so "3", " 3", "3.0" etc.
      // can never end up stored as an unpredictable string.
      data.tickets = ticketsNum
    }

    const submissions = await getSubmissions()

    const newSubmission = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      data,
    }

    submissions.push(newSubmission)
    await saveSubmissions(submissions)

    return NextResponse.json({ success: true, id: newSubmission.id })
  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    )
  }
}