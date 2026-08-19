// app/api/admin/migrate/route.ts
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()
const KV_KEY = 'submissions'

type SubmissionData = {
  eventCity?: string
  selectedCities?: Array<string | { city?: string }>
}

type Submission = {
  eventId?: string
  eventSlug?: string
  type?: string
  data?: SubmissionData
  [key: string]: unknown
}

function getEventIdFromCity(cityName: string): string | null {
  const cityMap: Record<string, string> = {
    'Orlando': 'orlando-tour',
    'South Florida': 'south-florida-tour',
    'Jacksonville': 'jacksonville-tour',
    'Gainesville | The FEST': 'gainesville-fest-tour',
    'Gulf Coast': 'gulf-coast-tour',
    'Gainesville': 'gainesville-finale-tour',
  }
  return cityMap[cityName] || null
}

export async function GET() {
  try {
    const submissions = await redis.get<Submission[]>(KV_KEY)
    
    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ message: 'No submissions found', count: 0 })
    }
    
    let migratedCount = 0
    
    const migratedSubmissions = submissions.map((sub: Submission) => {
      if (sub.eventId) return sub
      
      let eventId = null
      let eventSlug = null
      
      if (sub.type === 'rsvp' && sub.data?.eventCity) {
        eventId = getEventIdFromCity(sub.data.eventCity)
        if (eventId) {
          const slugMap: Record<string, string> = {
            'orlando-tour': 'orlando',
            'south-florida-tour': 'south-florida',
            'jacksonville-tour': 'jacksonville',
            'gainesville-fest-tour': 'gainesville-fest',
            'gulf-coast-tour': 'gulf-coast',
            'gainesville-finale-tour': 'gainesville-finale',
          }
          eventSlug = slugMap[eventId] || null
        }
      }
      
      if (sub.type === 'vendor' && sub.data?.selectedCities) {
        const cities = sub.data.selectedCities
        if (Array.isArray(cities) && cities.length > 0) {
          const firstCity = typeof cities[0] === 'string' ? cities[0] : cities[0]?.city
          if (firstCity) {
            eventId = getEventIdFromCity(firstCity)
            if (eventId) {
              const slugMap: Record<string, string> = {
                'orlando-tour': 'orlando',
                'south-florida-tour': 'south-florida',
                'jacksonville-tour': 'jacksonville',
                'gainesville-fest-tour': 'gainesville-fest',
                'gulf-coast-tour': 'gulf-coast',
                'gainesville-finale-tour': 'gainesville-finale',
              }
              eventSlug = slugMap[eventId] || null
            }
          }
        }
      }
      
      if (eventId) {
        migratedCount++
        return {
          ...sub,
          eventId,
          eventSlug: eventSlug || 'unknown',
        }
      }
      
      return sub
    })
    
    await redis.set(KV_KEY, migratedSubmissions)
    
    return NextResponse.json({
      message: 'Migration complete',
      totalSubmissions: submissions.length,
      migratedCount,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    )
  }
}