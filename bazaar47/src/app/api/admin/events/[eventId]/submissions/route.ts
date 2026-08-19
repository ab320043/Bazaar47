import { NextRequest, NextResponse } from 'next/server'
import { getSubmissions, saveSubmissions } from '@/lib/storage'
import { getEventBySlug } from '@/data/events'
// ✅ Import VALID_TOUR_CITIES from lib/utils
import { VALID_TOUR_CITIES } from '@/lib/utils'
import type { SubmissionDataUnion } from '@/types'
import { isVendorData, isRSVPData, isDanceSignupData } from '@/types'

const VALID_TYPES = ['vendor', 'rsvp', 'dance-signup']

function isValidEmail(email: unknown): boolean {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, type } = body

    // Validate type
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid submission type' },
        { status: 400 }
      )
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Missing submission data' },
        { status: 400 }
      )
    }

    const submissionData = data as SubmissionDataUnion

    // Determine event ID from data
    let eventId = data.eventId || data.eventSlug
    
    // If no eventId, try to find by eventName or slug
    if (!eventId && data.eventName) {
      const event = getEventBySlug(data.eventName.toLowerCase().replace(/\s+/g, '-'))
      if (event) eventId = event.id
    }
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Required fields validation
    if (!submissionData.fullName && type !== 'dance-signup') {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(submissionData.email)) {
      return NextResponse.json(
        { error: 'A valid email is required' },
        { status: 400 }
      )
    }

    // Type-specific validation
    if (type === 'rsvp' && isRSVPData(submissionData)) {
      // ✅ Validate event city using VALID_TOUR_CITIES
      if (submissionData.eventCity && !VALID_TOUR_CITIES.includes(submissionData.eventCity)) {
        return NextResponse.json(
          { error: 'Invalid event city' },
          { status: 400 }
        )
      }

      // Validate tickets
      const ticketsNum = typeof submissionData.tickets === 'number' 
        ? submissionData.tickets 
        : parseInt(String(submissionData.tickets), 10)
        
      if (!Number.isInteger(ticketsNum) || ticketsNum < 1 || ticketsNum > 10) {
        return NextResponse.json(
          { error: 'Tickets must be a whole number between 1 and 10' },
          { status: 400 }
        )
      }
      submissionData.tickets = ticketsNum
    }

    if (type === 'vendor' && isVendorData(submissionData)) {
      // ✅ Validate selectedCities using VALID_TOUR_CITIES
      if (submissionData.selectedCities && Array.isArray(submissionData.selectedCities)) {
        const validCities = submissionData.selectedCities
          .filter((city) => VALID_TOUR_CITIES.includes(city))
        
        if (validCities.length === 0) {
          return NextResponse.json(
            { error: 'At least one valid city is required' },
            { status: 400 }
          )
        }
        submissionData.selectedCities = validCities
      } else {
        return NextResponse.json(
          { error: 'Selected cities are required' },
          { status: 400 }
        )
      }
    }

    if (type === 'dance-signup' && isDanceSignupData(submissionData)) {
      if (!submissionData.firstName || !submissionData.lastName || !submissionData.dancerName) {
        return NextResponse.json(
          { error: 'All dancer fields are required' },
          { status: 400 }
        )
      }
    }

    // Get existing submissions
    const submissions = await getSubmissions()

    // Create new submission
    const newSubmission = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      eventId,
      eventSlug: data.eventSlug || 'unknown',
      data: submissionData,
    }

    submissions.push(newSubmission)
    await saveSubmissions(submissions)

    return NextResponse.json({ 
      success: true, 
      id: newSubmission.id,
      message: 'Submission saved successfully'
    })
  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    )
  }
}