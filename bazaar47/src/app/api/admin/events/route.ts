// app/api/admin/events/route.ts
import { NextResponse } from 'next/server'
import { allEvents, getActiveEvents, getUpcomingEvents, getPastEvents, getEventById } from '@/data/events'
import { getSubmissions } from '@/lib/storage'
import { getEventStats } from '@/lib/utils/events'
import { getWorkshopEvents } from '@/app/tickets/UpcomingShows/events'

// Helper to check if event is past due
function isEventPastDue(eventDate: string): boolean {
  const today = new Date()
  const eventDateObj = new Date(eventDate)
  return eventDateObj < today
}

// Merge workshop events with main events
function getAllEventsWithWorkshops() {
  const workshopEvents = getWorkshopEvents().map(w => ({
    id: w.id,
    slug: w.id,
    name: w.name,
    type: 'workshop' as const,
    status: isEventPastDue(w.date) ? 'completed' : 'active',
    date: w.date,
    dateDisplay: w.date,
    time: w.time,
    location: w.location,
    address: w.location,
    city: w.city,
    hasVendors: false,
    hasRSVP: true,
    hasDanceSignup: false,
    isFree: w.isFree || false,
    price: w.price,
    description: w.description,
  }))

  return [...allEvents, ...workshopEvents]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') || 'all'
  const includeArchived = searchParams.get('includeArchived') === 'true'
  
  try {
    const submissions = await getSubmissions()
    
    // Get all events including workshops
    let allEventsWithStatus = getAllEventsWithWorkshops()
    
    // Update status based on date
    allEventsWithStatus = allEventsWithStatus.map(event => {
      if (event.status === 'active' && isEventPastDue(event.date)) {
        return { ...event, status: 'completed' as const }
      }
      return event
    })
    
    let events = allEventsWithStatus
    
    if (filter === 'active') {
      events = allEventsWithStatus.filter(e => e.status === 'active')
    } else if (filter === 'upcoming') {
      events = allEventsWithStatus.filter(e => e.status === 'upcoming')
    } else if (filter === 'past' || filter === 'completed') {
      events = allEventsWithStatus.filter(e => e.status === 'completed' || e.status === 'past')
    }
    
    // If not including archived, filter out completed events
    if (!includeArchived) {
      events = events.filter(e => e.status !== 'completed' && e.status !== 'past')
    }
    
    // Add stats to each event
    const eventsWithStats = events.map(event => ({
      ...event,
      stats: getEventStats(submissions, event.id),
    }))
    
    // Sort by date
    eventsWithStats.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateA.getTime() - dateB.getTime()
    })
    
    return NextResponse.json({ events: eventsWithStats })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}