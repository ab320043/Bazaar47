import { NextRequest, NextResponse } from 'next/server'
import { getEventById } from '@/data/events'
import { getSubmissions } from '@/lib/storage'
import { getEventStats } from '@/lib/utils/events'

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const event = getEventById(params.eventId)
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    const submissions = await getSubmissions()
    const eventSubmissions = submissions.filter(
      (s: { eventId: string }) => s.eventId === params.eventId
    )
    const stats = getEventStats(submissions, params.eventId)
    
    return NextResponse.json({
      event,
      stats,
      submissions: eventSubmissions,
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}