// lib/utils/events.ts
import { allEvents, getEventById } from '@/data/events'
import type { EventDefinition, Submission } from '@/types'
import { isVendorData, isRSVPData, isDanceSignupData } from '@/types'

export function getEventForSubmission(submission: Submission): EventDefinition | undefined {
  return getEventById(submission.eventId)
}

export function getSubmissionsByEvent(submissions: Submission[], eventId: string): Submission[] {
  return submissions.filter(s => s.eventId === eventId)
}

export function getSubmissionsByType(submissions: Submission[], type: Submission['type']): Submission[] {
  return submissions.filter(s => s.type === type)
}

export function getEventStats(submissions: Submission[], eventId: string): {
  total: number
  vendors: number
  rsvps: number
  danceSignups: number
  tickets: number
} {
  const eventSubmissions = submissions.filter(s => s.eventId === eventId)
  
  let vendors = 0
  let rsvps = 0
  let danceSignups = 0
  let tickets = 0

  eventSubmissions.forEach(s => {
    if (s.type === 'vendor') vendors++
    if (s.type === 'rsvp' || s.type === 'workshop-rsvp') {
      rsvps++
      if (isRSVPData(s.data) && s.data.tickets) {
        tickets += typeof s.data.tickets === 'number' ? s.data.tickets : 0
      }
    }
    if (s.type === 'dance-signup') danceSignups++
    if (s.type === 'workshop-ticket') {
      tickets += 1 // Each workshop ticket is one person
      if (s.data.tickets) {
        tickets += typeof s.data.tickets === 'number' ? s.data.tickets - 1 : 0
      }
    }
  })

  return {
    total: eventSubmissions.length,
    vendors,
    rsvps,
    danceSignups,
    tickets,
  }
}

export function getAllEventStats(submissions: Submission[]): Record<string, {
  total: number
  vendors: number
  rsvps: number
  danceSignups: number
  tickets: number
}> {
  const stats: Record<string, ReturnType<typeof getEventStats>> = {}
  
  allEvents.forEach(event => {
    stats[event.id] = getEventStats(submissions, event.id)
  })
  
  return stats
}

export function getActiveEventsWithStats(submissions: Submission[]): {
  event: EventDefinition
  stats: ReturnType<typeof getEventStats>
}[] {
  const activeEvents = allEvents.filter(e => e.status === 'active' || e.status === 'upcoming')
  
  return activeEvents.map(event => ({
    event,
    stats: getEventStats(submissions, event.id),
  }))
}