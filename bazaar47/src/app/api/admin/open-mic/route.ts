import { NextRequest, NextResponse } from 'next/server'
import { getPool, createSubmission, getAllSessions } from '@/lib/storage/open-mic'
import { isAdminAuthenticated } from '@/lib/admin/auth'

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const pool = await getPool()
  const sessions = await getAllSessions()
  
  return NextResponse.json({ pool, sessions })
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const body = await request.json()
  
  if (body.action === 'add_to_pool') {
    const newSub = await createSubmission({
      fullName: body.fullName,
      artistName: body.artistName,
      genre: body.genre,
      email: body.email,
      instagram: body.instagram,
      musicLink: body.musicLink,
      submittedAt: new Date().toISOString(),
      addedByAdmin: true,
    })
    return NextResponse.json({ success: true, submission: newSub })
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}