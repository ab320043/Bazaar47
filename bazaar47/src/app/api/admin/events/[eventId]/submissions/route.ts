import { NextRequest, NextResponse } from 'next/server'
import { getEventById } from '@/data/events'
import { getSubmissions } from '@/lib/storage'

type Submission = {
  eventId: string
  type: string
  data?: {
    fullName?: string
    businessName?: string
    email?: string
    dancerName?: string
    city?: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const event = getEventById(params.eventId)
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    
    let submissions = await getSubmissions()
    
    // Filter by event
    submissions = submissions.filter((s: Submission) => s.eventId === params.eventId)
    
    // Filter by type
    if (type && type !== 'all') {
      submissions = submissions.filter((s: Submission) => s.type === type)
    }
    
    // Search
    if (search) {
      const searchLower = search.toLowerCase()
      submissions = submissions.filter((s: Submission) => {
        const data = s.data || {}
        const searchable = [
          data.fullName,
          data.businessName,
          data.email,
          data.dancerName,
          data.city,
        ].filter(Boolean).join(' ').toLowerCase()
        return searchable.includes(searchLower)
      })
    }
    
    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}