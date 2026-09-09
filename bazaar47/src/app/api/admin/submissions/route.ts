// app/api/admin/submissions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSubmissions, saveSubmissions } from '@/lib/storage'
import { getEventBySlug } from '@/data/events'
import { VALID_TOUR_CITIES } from '@/lib/utils'
import type { SubmissionDataUnion, Submission } from '@/types'
import { isVendorData, isRSVPData, isDanceSignupData } from '@/types'

const VALID_TYPES = ['vendor', 'rsvp', 'dance-signup', 'workshop-ticket', 'workshop-rsvp']

function isValidEmail(email: unknown): boolean {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Helper to check if a value is a string array
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

// Helper to check if a value is an object array with city property
function isCityObjectArray(value: unknown): value is { city: string; pricing?: string }[] {
  return Array.isArray(value) && value.every(item => typeof item === 'object' && item !== null && 'city' in item)
}

// ============================================
// GET - Fetch submissions
// ============================================
export async function GET() {
  try {
    const submissions = await getSubmissions()
    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Create a new submission
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, type } = body

    // Validate type
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid submission type: ${type}. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!data || typeof data !== 'object' || data === null) {
      return NextResponse.json(
        { error: 'Missing submission data' },
        { status: 400 }
      )
    }

    const submissionData = data as Record<string, unknown>

    // ============================================
    // VENDOR SUBMISSION
    // ============================================
    if (type === 'vendor') {
      // Check for required fields
      if (!submissionData.fullName || typeof submissionData.fullName !== 'string') {
        return NextResponse.json(
          { error: 'Full name is required' },
          { status: 400 }
        )
      }
      if (!submissionData.email || typeof submissionData.email !== 'string' || !isValidEmail(submissionData.email)) {
        return NextResponse.json(
          { error: 'A valid email is required' },
          { status: 400 }
        )
      }
      if (!submissionData.businessName || typeof submissionData.businessName !== 'string') {
        return NextResponse.json(
          { error: 'Business name is required' },
          { status: 400 }
        )
      }
      if (!submissionData.phone || typeof submissionData.phone !== 'string') {
        return NextResponse.json(
          { error: 'Phone number is required' },
          { status: 400 }
        )
      }

      // Validate selectedCities
      let selectedCities: string[] = []
      const selectedCitiesRaw = submissionData.selectedCities
      
      if (isStringArray(selectedCitiesRaw)) {
        selectedCities = selectedCitiesRaw
      } else if (isCityObjectArray(selectedCitiesRaw)) {
        selectedCities = selectedCitiesRaw
          .map((item) => item.city)
          .filter((city): city is string => typeof city === 'string' && city.length > 0)
      }

      if (selectedCities.length === 0 && isStringArray(submissionData.eventIds)) {
        selectedCities = submissionData.eventIds
      }

      if (selectedCities.length === 0) {
        return NextResponse.json(
          { error: 'At least one city must be selected' },
          { status: 400 }
        )
      }

      const eventIds = isStringArray(submissionData.eventIds) ? submissionData.eventIds : []

      if (eventIds.length === 0) {
        return NextResponse.json(
          { error: 'At least one event must be selected' },
          { status: 400 }
        )
      }

      const newSubmission: Submission = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: 'vendor',
        eventId: eventIds[0],
        eventIds: eventIds,
        eventSlug: 'vendor-application',
        data: {
          ...submissionData,
          selectedCities: selectedCities,
          eventIds: eventIds,
          selectedCitiesRaw: isStringArray(selectedCitiesRaw) || isCityObjectArray(selectedCitiesRaw)
            ? selectedCitiesRaw
            : undefined,
        },
      }

      const submissions = await getSubmissions()
      submissions.push(newSubmission)
      await saveSubmissions(submissions)

      return NextResponse.json({ 
        success: true, 
        id: newSubmission.id,
        message: 'Vendor application submitted successfully',
        eventIds: eventIds,
        selectedCities: selectedCities,
      })
    }

    // ============================================
    // RSVP SUBMISSION
    // ============================================
    if (type === 'rsvp') {
      // Check for required fields
      if (!submissionData.fullName || typeof submissionData.fullName !== 'string') {
        return NextResponse.json(
          { error: 'Full name is required' },
          { status: 400 }
        )
      }
      if (!submissionData.email || typeof submissionData.email !== 'string' || !isValidEmail(submissionData.email)) {
        return NextResponse.json(
          { error: 'A valid email is required' },
          { status: 400 }
        )
      }
      if (!submissionData.eventId || typeof submissionData.eventId !== 'string') {
        return NextResponse.json(
          { error: 'Event ID is required' },
          { status: 400 }
        )
      }

      // Get the ticket count
      let ticketCount = 1
      if (submissionData.tickets) {
        const parsed = parseInt(String(submissionData.tickets), 10)
        if (!isNaN(parsed) && parsed > 0) {
          ticketCount = parsed
        }
      }

      // Create the submission
      const newSubmission: Submission = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: 'rsvp',
        eventId: String(submissionData.eventId),
        eventSlug: String(submissionData.eventSlug || submissionData.eventId),
        data: {
          ...submissionData,
          tickets: ticketCount,
        },
      }

      const submissions = await getSubmissions()
      submissions.push(newSubmission)
      await saveSubmissions(submissions)

      return NextResponse.json({ 
        success: true, 
        id: newSubmission.id,
        message: 'RSVP submitted successfully',
        eventId: newSubmission.eventId,
      })
    }

    // ============================================
    // DANCE SIGNUP SUBMISSION
    // ============================================
    if (type === 'dance-signup' && isDanceSignupData(submissionData as SubmissionDataUnion)) {
      // Check for required fields
      if (!submissionData.firstName || typeof submissionData.firstName !== 'string') {
        return NextResponse.json(
          { error: 'First name is required' },
          { status: 400 }
        )
      }
      if (!submissionData.lastName || typeof submissionData.lastName !== 'string') {
        return NextResponse.json(
          { error: 'Last name is required' },
          { status: 400 }
        )
      }
      if (!submissionData.dancerName || typeof submissionData.dancerName !== 'string') {
        return NextResponse.json(
          { error: 'Dancer name is required' },
          { status: 400 }
        )
      }
      if (!submissionData.email || typeof submissionData.email !== 'string' || !isValidEmail(submissionData.email)) {
        return NextResponse.json(
          { error: 'A valid email is required' },
          { status: 400 }
        )
      }
      if (!submissionData.eventId || typeof submissionData.eventId !== 'string') {
        return NextResponse.json(
          { error: 'Event ID is required' },
          { status: 400 }
        )
      }

      const newSubmission: Submission = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: 'dance-signup',
        eventId: String(submissionData.eventId),
        eventSlug: String(submissionData.eventSlug || submissionData.eventId),
        data: submissionData as SubmissionDataUnion,
      }

      const submissions = await getSubmissions()
      submissions.push(newSubmission)
      await saveSubmissions(submissions)

      return NextResponse.json({ 
        success: true, 
        id: newSubmission.id,
        message: 'Dance signup submitted successfully',
      })
    }

    // ============================================
    // WORKSHOP SUBMISSIONS
    // ============================================
    if (type === 'workshop-ticket' || type === 'workshop-rsvp') {
      if (!submissionData.fullName || typeof submissionData.fullName !== 'string') {
        return NextResponse.json(
          { error: 'Full name is required' },
          { status: 400 }
        )
      }
      if (!submissionData.email || typeof submissionData.email !== 'string' || !isValidEmail(submissionData.email)) {
        return NextResponse.json(
          { error: 'A valid email is required' },
          { status: 400 }
        )
      }
      if (!submissionData.workshopId && !submissionData.eventId) {
        return NextResponse.json(
          { error: 'Workshop ID is required' },
          { status: 400 }
        )
      }

      const eventId = String(submissionData.eventId || submissionData.workshopId)
      
      const newSubmission: Submission = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: type,
        eventId: eventId,
        eventSlug: String(submissionData.eventSlug || eventId),
        data: submissionData as SubmissionDataUnion,
      }

      const submissions = await getSubmissions()
      submissions.push(newSubmission)
      await saveSubmissions(submissions)

      return NextResponse.json({ 
        success: true, 
        id: newSubmission.id,
        message: `${type === 'workshop-ticket' ? 'Workshop ticket' : 'Workshop RSVP'} submitted successfully`,
      })
    }

    return NextResponse.json(
      { error: 'Invalid submission type or data' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    )
  }
}

// ============================================
// PUT - Update an existing submission
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, data } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    if (!data || typeof data !== 'object' || data === null) {
      return NextResponse.json(
        { error: 'Missing submission data' },
        { status: 400 }
      )
    }

    const submissions = await getSubmissions()
    
    const index = submissions.findIndex((s: Submission) => s.id === id)
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    const existingSubmission = submissions[index]
    const updatedSubmission: Submission = {
      ...existingSubmission,
      data: {
        ...existingSubmission.data,
        ...data,
      },
    }

    submissions[index] = updatedSubmission
    await saveSubmissions(submissions)

    return NextResponse.json({ 
      success: true, 
      message: 'Submission updated successfully',
      submission: updatedSubmission
    })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Delete a submission
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    const submissions = await getSubmissions()
    
    const index = submissions.findIndex((s: Submission) => s.id === id)
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    submissions.splice(index, 1)
    await saveSubmissions(submissions)

    return NextResponse.json({ 
      success: true, 
      message: 'Submission deleted successfully'
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    )
  }
}