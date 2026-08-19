import { NextResponse } from 'next/server'
import { allEvents, getActiveEvents, getUpcomingEvents, getPastEvents } from '@/data/events'
import { getSubmissions } from '@/lib/storage'
import { getEventStats } from '@/lib/utils/events'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') || 'all'
  
  try {
    const submissions = await getSubmissions()
    
    let events = allEvents
    
    if (filter === 'active') {
      events = getActiveEvents()
    } else if (filter === 'upcoming') {
      events = getUpcomingEvents()
    } else if (filter === 'past') {
      events = getPastEvents()
    }
    
    // Add stats to each event
    const eventsWithStats = events.map(event => ({
      ...event,
      stats: getEventStats(submissions, event.id),
    }))
    
    return NextResponse.json({ events: eventsWithStats })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}