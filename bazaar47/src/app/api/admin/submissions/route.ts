// app/api/admin/submissions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSubmissions, saveSubmissions } from '@/lib/storage'
import { getEventBySlug } from '@/data/events'
import { VALID_TOUR_CITIES } from '@/lib/utils'
import type { SubmissionDataUnion } from '@/types'
import { isVendorData, isRSVPData, isDanceSignupData } from '@/types'

const VALID_TYPES = ['vendor', 'rsvp', 'dance-signup', 'workshop-ticket', 'workshop-rsvp']

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
      // For workshops, use the workshopId
      if (data.workshopId) {
        eventId = data.workshopId
      } else {
        return NextResponse.json(
          { error: 'Event ID is required' },
          { status: 400 }
        )
      }
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

    // Workshop-specific validation
    if (type === 'workshop-ticket' || type === 'workshop-rsvp') {
      if (!data.workshopId) {
        return NextResponse.json(
          { error: 'Workshop ID is required' },
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
      data: {
        ...submissionData,
        submissionType: type,
        isWorkshop: type === 'workshop-ticket' || type === 'workshop-rsvp',
      },
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