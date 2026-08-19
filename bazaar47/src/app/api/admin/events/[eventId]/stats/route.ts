import { NextRequest, NextResponse } from 'next/server'
import { getEventById } from '@/data/events'
import { getSubmissions } from '@/lib/storage'
import { getEventStats } from '@/lib/utils/events'
import { isVendorData, isRSVPData, type Submission } from '@/types'
import { VALID_TOUR_CITIES } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const event = getEventById(params.eventId)
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    const submissions = await getSubmissions() as Submission[]
    const eventSubmissions = submissions.filter(
      (s: Submission) => s.eventId === params.eventId
    )
    const stats = getEventStats(submissions, params.eventId)
    
    // City breakdown (for tour events)
    const cityBreakdown: Record<string, { vendors: number; rsvps: number; tickets: number }> = {}
    
    if (event.type === 'tour') {
      // Initialize with all tour cities
      VALID_TOUR_CITIES.forEach((city: string) => {
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
          // Count vendors for each city they selected
          const cities = s.data.selectedCities || []
          cities.forEach((city: string) => {
            if (city && cityBreakdown[city]) {
              cityBreakdown[city].vendors += 1
            }
          })
        }
      })
    }
    
    // Vendor breakdown
    const vendors = eventSubmissions
      .filter((s: Submission) => s.type === 'vendor')
      .map((s: Submission) => s.data)
    
    // RSVP breakdown
    const rsvps = eventSubmissions
      .filter((s: Submission) => s.type === 'rsvp')
      .map((s: Submission) => s.data)
    
    // Dance signups
    const danceSignups = eventSubmissions
      .filter((s: Submission) => s.type === 'dance-signup')
      .map((s: Submission) => s.data)
    
    return NextResponse.json({
      event,
      stats,
      cityBreakdown,
      breakdown: {
        vendors,
        rsvps,
        danceSignups,
      },
      capacity: event.capacity,
      fillRate: event.capacity ? Math.round((stats.tickets / event.capacity) * 100) : 0,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}