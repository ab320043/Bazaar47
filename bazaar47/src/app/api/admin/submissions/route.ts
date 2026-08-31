import { NextRequest, NextResponse } from 'next/server'

import { getSubmissions, saveSubmissions } from '@/lib/storage'
import { getEventBySlug } from '@/data/events'
import { VALID_TOUR_CITIES } from '@/lib/utils'

import type { SubmissionDataUnion } from '@/types'
import {
  isVendorData,
  isRSVPData,
  isDanceSignupData,
} from '@/types'

const VALID_TYPES = ['vendor', 'rsvp', 'dance-signup']

function isValidEmail(email: unknown): boolean {
  return (
    typeof email === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data, type } = body

    // ----------------------------------------
    // Validate submission type
    // ----------------------------------------

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid submission type' },
        { status: 400 }
      )
    }

    // ----------------------------------------
    // Validate submission data
    // ----------------------------------------

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Missing submission data' },
        { status: 400 }
      )
    }

    const submissionData = data as SubmissionDataUnion

    // ----------------------------------------
    // Determine event ID(s)
    // ----------------------------------------
    // ✅ FIX: vendors can apply to multiple cities in one submission, so
    // the vendor form sends an `eventIds` array rather than a single
    // `eventId`/`eventSlug`. The old logic here only ever looked for a
    // singular event id, so every multi-city vendor submission failed
    // with "Event ID is required" even though it had valid event data.

    const rawEventIds: string[] = Array.isArray(data.eventIds)
      ? data.eventIds.filter(
          (id: unknown): id is string => typeof id === 'string' && id.length > 0
        )
      : []

    let eventId: string | undefined = data.eventId || data.eventSlug

    // If no eventId, try eventName
    if (!eventId && data.eventName) {
      const event = getEventBySlug(
        data.eventName.toLowerCase().replace(/\s+/g, '-')
      )

      if (event) {
        eventId = event.id
      }
    }

    // Fall back to the first id in eventIds (multi-city vendor apps)
    if (!eventId && rawEventIds.length > 0) {
      eventId = rawEventIds[0]
    }

    // Full list of event ids this submission applies to. For
    // single-event submissions (RSVP, dance-signup) this is just
    // [eventId].
    const eventIds = rawEventIds.length > 0 ? rawEventIds : eventId ? [eventId] : []

    if (!eventId && eventIds.length === 0) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // ----------------------------------------
    // Required fields
    // ----------------------------------------

    if (!submissionData.fullName && type !== 'dance-signup') {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      )
    }

    // ----------------------------------------
    // Validate email
    // ----------------------------------------

    if (!isValidEmail(submissionData.email)) {
      return NextResponse.json(
        { error: 'A valid email is required' },
        { status: 400 }
      )
    }

    // ========================================
    // RSVP VALIDATION
    // ========================================

    if (type === 'rsvp' && isRSVPData(submissionData)) {
      const ticketsNum =
        typeof submissionData.tickets === 'number'
          ? submissionData.tickets
          : parseInt(String(submissionData.tickets), 10)

      if (
        !Number.isInteger(ticketsNum) ||
        ticketsNum < 1 ||
        ticketsNum > 10
      ) {
        return NextResponse.json(
          {
            error: 'Tickets must be a whole number between 1 and 10',
          },
          { status: 400 }
        )
      }

      submissionData.tickets = ticketsNum
    }

    // ========================================
    // VENDOR VALIDATION
    // ========================================

    if (type === 'vendor' && isVendorData(submissionData)) {
      const selectedCities = submissionData.selectedCities

      // Must have selected cities
      if (
        !selectedCities ||
        !Array.isArray(selectedCities) ||
        selectedCities.length === 0
      ) {
        return NextResponse.json(
          { error: 'Selected cities are required' },
          { status: 400 }
        )
      }

      /*
       * Your frontend sends:
       *
       * selectedCities: [
       *   {
       *     city: "South Florida",
       *     pricing: "Outdoor Booth"
       *   }
       * ]
       *
       * So we validate the `city` property rather than
       * comparing the entire object against VALID_TOUR_CITIES.
       */

      const validCities = (
        selectedCities as unknown as Array<Record<string, unknown>>
      ).filter(
        (city): city is { city: string; pricing?: string } => {
          if (!city || typeof city !== 'object') {
            return false
          }

          const cityName = city.city

          if (typeof cityName !== 'string') {
            return false
          }

          return VALID_TOUR_CITIES.includes(cityName)
        }
      )

      if (validCities.length === 0) {
        return NextResponse.json(
          {
            error: 'At least one valid city is required',
            validCities: VALID_TOUR_CITIES,
          },
          { status: 400 }
        )
      }

      // Keep the city + pricing information while satisfying the
      // broader submission type used by the app runtime.
      submissionData.selectedCities = validCities as unknown as typeof submissionData.selectedCities
    }

    // ========================================
    // DANCE SIGNUP VALIDATION
    // ========================================

    if (
      type === 'dance-signup' &&
      isDanceSignupData(submissionData)
    ) {
      if (
        !submissionData.firstName ||
        !submissionData.lastName ||
        !submissionData.dancerName
      ) {
        return NextResponse.json(
          { error: 'All dancer fields are required' },
          { status: 400 }
        )
      }
    }

    // ========================================
    // GET EXISTING SUBMISSIONS
    // ========================================

    const submissions = await getSubmissions()

    // ========================================
    // CREATE NEW SUBMISSION
    // ========================================

    const newSubmission = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      eventId,
      // ✅ Full set of events this submission applies to (multi-city
      // vendor applications will have more than one entry here).
      eventIds,
      eventSlug: data.eventSlug || eventIds[0] || 'unknown',
      data: submissionData,
    }

    submissions.push(newSubmission)

    // ========================================
    // SAVE
    // ========================================

    await saveSubmissions(submissions)

    // ========================================
    // SUCCESS
    // ========================================

    return NextResponse.json({
      success: true,
      id: newSubmission.id,
      message: 'Submission saved successfully',
    })
  } catch (error) {
    console.error('Save error:', error)

    return NextResponse.json(
      {
        error: 'Failed to save submission',
        details:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE HANDLER
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    const submissions = await getSubmissions()

    const filtered = submissions.filter(
      (s: { id: string }) => s.id !== id
    )

    if (filtered.length === submissions.length) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    await saveSubmissions(filtered)

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully',
    })
  } catch (error) {
    console.error('Delete error:', error)

    return NextResponse.json(
      {
        error: 'Failed to delete submission',
        details:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================
// PUT HANDLER
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const { id, data } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Submission data is required' },
        { status: 400 }
      )
    }

    const submissions = await getSubmissions()

    // IMPORTANT:
    // Use ===, not !==
    const index = submissions.findIndex(
      (s: { id: string }) => s.id === id
    )

    if (index === -1) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    submissions[index] = {
      ...submissions[index],
      data: {
        ...submissions[index].data,
        ...data,
      },
    }

    await saveSubmissions(submissions)

    return NextResponse.json({
      success: true,
      submission: submissions[index],
    })
  } catch (error) {
    console.error('Update error:', error)

    return NextResponse.json(
      {
        error: 'Failed to update submission',
        details:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      },
      { status: 500 }
    )
  }
}