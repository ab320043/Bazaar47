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
        { error: 'Invalid submission type' },
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

    // Vendor validation
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

      // Validate selectedCities - handle both array of strings and array of objects
      let selectedCities: string[] = []
      const selectedCitiesRaw = submissionData.selectedCities
      
      if (isStringArray(selectedCitiesRaw)) {
        selectedCities = selectedCitiesRaw
      } else if (isCityObjectArray(selectedCitiesRaw)) {
        selectedCities = selectedCitiesRaw
          .map((item) => item.city)
          .filter((city): city is string => typeof city === 'string' && city.length > 0)
      }

      // If no selectedCities but we have eventIds, use those
      if (selectedCities.length === 0 && isStringArray(submissionData.eventIds)) {
        selectedCities = submissionData.eventIds
      }

      if (selectedCities.length === 0) {
        return NextResponse.json(
          { error: 'At least one city must be selected' },
          { status: 400 }
        )
      }

      // Validate eventIds
      const eventIds = isStringArray(submissionData.eventIds) ? submissionData.eventIds : []

      if (eventIds.length === 0) {
        return NextResponse.json(
          { error: 'At least one event must be selected' },
          { status: 400 }
        )
      }

      // Create a clean submission with all data
      const newSubmission: Submission = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: 'vendor',
        eventId: eventIds[0], // Primary event for display
        eventIds: eventIds, // All selected events
        eventSlug: 'vendor-application',
        data: {
          ...submissionData,
          selectedCities: selectedCities,
          eventIds: eventIds,
          selectedCitiesRaw: isStringArray(selectedCitiesRaw) || isCityObjectArray(selectedCitiesRaw)
            ? selectedCitiesRaw
            : undefined, // Keep original for reference
        },
      }

      // Get existing submissions and save
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

    // RSVP validation
    if (type === 'rsvp' && isRSVPData(submissionData as SubmissionDataUnion)) {
      // Existing RSVP logic here
    }

    // Dance signup validation
    if (type === 'dance-signup' && isDanceSignupData(submissionData as SubmissionDataUnion)) {
      // Existing dance signup logic here
    }

    // Workshop validation
    if (type === 'workshop-ticket' || type === 'workshop-rsvp') {
      // Existing workshop logic here
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

    // Get existing submissions
    const submissions = await getSubmissions()
    
    // Find the submission to update
    const index = submissions.findIndex((s: Submission) => s.id === id)
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Update the submission data
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

    // Get existing submissions
    const submissions = await getSubmissions()
    
    // Find the submission to delete
    const index = submissions.findIndex((s: Submission) => s.id === id)
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Remove the submission
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