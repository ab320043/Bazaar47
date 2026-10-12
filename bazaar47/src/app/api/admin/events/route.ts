// app/api/admin/events/route.ts
import { NextResponse } from 'next/server'
import { allEvents } from '@/data/events'
import { getSubmissions } from '@/lib/storage'
import { getEventStats } from '@/lib/utils/events'

// Helper to check if event is past due
function isEventPastDue(eventDate: string): boolean {
  const today = new Date()
  const eventDateObj = new Date(eventDate)
  return eventDateObj < today
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') || 'all'
  const includeArchived = searchParams.get('includeArchived') === 'true'

  try {
    const submissions = await getSubmissions()

    // Update status based on date
    let events = allEvents.map((event) => {
      if (event.status === 'active' && isEventPastDue(event.date)) {
        return { ...event, status: 'completed' as const }
      }
      return event
    })

    // Status filter
    if (filter === 'active') {
      events = events.filter((e) => e.status === 'active')
    } else if (filter === 'upcoming') {
      events = events.filter((e) => e.status === 'upcoming')
    } else if (filter === 'past' || filter === 'completed') {
      events = events.filter(
        (e) => e.status === 'completed' || e.status === 'past'
      )
    }

    // If not including archived, filter out completed events
    if (!includeArchived) {
      events = events.filter(
        (e) => e.status !== 'completed' && e.status !== 'past'
      )
    }

    // Add stats to each event
    const eventsWithStats = events.map((event) => ({
      ...event,
      stats: getEventStats(submissions, event.id),
    }))

    // Sort by date ascending
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