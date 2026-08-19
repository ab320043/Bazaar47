import { NextRequest, NextResponse } from 'next/server'
import { getEventById } from '@/data/events'
import { getSubmissions } from '@/lib/storage'
import { getEventStats } from '@/lib/utils/events'
import type { Submission } from '@/types'
import { isVendorData, isRSVPData } from '@/types'

// ✅ FIX: params is now a Promise in Next.js 15+
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    // ✅ Await the params
    const { eventId } = await params
    
    // 1. Get the event from our data file
    const event = getEventById(eventId)
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // 2. Get submissions - this will use JSON file in development
    let submissions: Submission[] = []
    try {
      const rawSubmissions = await getSubmissions()
      submissions = rawSubmissions as Submission[]
    } catch (error) {
      console.error('Error fetching submissions:', error)
      submissions = []
    }

    // 3. Filter submissions for this event
    const eventSubmissions = submissions.filter(
      (s: Submission) => s.eventId === eventId
    )

    // 4. Calculate stats
    const stats = getEventStats(submissions, eventId)

    // 5. City breakdown (for tour events)
    const cityBreakdown: Record<string, { vendors: number; rsvps: number; tickets: number }> = {}
    
    if (event.type === 'tour') {
      const tourCityNames = ['Orlando', 'South Florida', 'Jacksonville', 'Gainesville | The FEST', 'Gulf Coast', 'Gainesville']
      tourCityNames.forEach((city: string) => {
        cityBreakdown[city] = { vendors: 0, rsvps: 0, tickets: 0 }
      })
      
      eventSubmissions.forEach((s: Submission) => {
        if (s.type === 'rsvp' && isRSVPData(s.data)) {
          const city = s.data.eventCity
          if (city && cityBreakdown[city]) {
            cityBreakdown[city].rsvps += 1
            if (s.data.tickets) {
              cityBreakdown[city].tickets += typeof s.data.tickets === 'number' ? s.data.tickets : 0
            }
          }
        } else if (s.type === 'vendor' && isVendorData(s.data)) {
          const cities = s.data.selectedCities || []
          cities.forEach((city: string) => {
            if (city && cityBreakdown[city]) {
              cityBreakdown[city].vendors += 1
            }
          })
        }
      })
    }

    // 6. Break down by type
    const vendors = eventSubmissions
      .filter((s: Submission) => s.type === 'vendor')
      .map((s: Submission) => s.data)

    const rsvps = eventSubmissions
      .filter((s: Submission) => s.type === 'rsvp')
      .map((s: Submission) => s.data)

    const danceSignups = eventSubmissions
      .filter((s: Submission) => s.type === 'dance-signup')
      .map((s: Submission) => s.data)

    // 7. Return response
    return NextResponse.json({
      event,
      stats: {
        total: eventSubmissions.length,
        vendors: vendors.length,
        rsvps: rsvps.length,
        danceSignups: danceSignups.length,
        tickets: stats?.tickets || 0,
      },
      submissions: eventSubmissions,
      cityBreakdown,
      breakdown: {
        vendors,
        rsvps,
        danceSignups,
      },
      capacity: event.capacity || 0,
      fillRate: event.capacity ? Math.round(((stats?.tickets || 0) / event.capacity) * 100) : 0,
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event details' },
      { status: 500 }
    )
  }
}