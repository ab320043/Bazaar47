import { NextResponse } from 'next/server'
import { getSubmissions } from '@/lib/storage'

export async function GET() {
  try {
    const submissions = await getSubmissions()
    
    return NextResponse.json({
      total: Array.isArray(submissions) ? submissions.length : 'not an array',
      sample: Array.isArray(submissions) && submissions.length > 0 ? submissions[0] : null,
      allIds: Array.isArray(submissions) ? submissions.map((s) => s.id) : [],
      hasEventId: Array.isArray(submissions) ? submissions.some((s) => s.eventId) : false,
      firstFew: Array.isArray(submissions) ? submissions.slice(0, 3) : null,
    })
  } catch (error: unknown) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}