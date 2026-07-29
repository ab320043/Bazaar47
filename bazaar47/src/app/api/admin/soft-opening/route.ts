import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getSubmissions } from '@/lib/storage'

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const allSubmissions = await getSubmissions()
    // Filter only soft opening RSVPs
    const softOpeningRSVPs = allSubmissions.filter(
      (s: { type?: string; data?: { eventType?: string } }) => s.type === 'rsvp' && s.data?.eventType === 'soft-opening'
    )
    return NextResponse.json({ submissions: softOpeningRSVPs })
  } catch (error) {
    console.error('Error fetching soft opening RSVPs:', error)
    return NextResponse.json({ submissions: [] }, { status: 500 })
  }
}