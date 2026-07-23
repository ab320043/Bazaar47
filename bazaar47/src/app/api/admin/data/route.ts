import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getSubmissions, saveSubmissions } from '@/lib/storage'

type Submission = { id: string }

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const submissions = await getSubmissions()
    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ submissions: [] }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = (await request.json()) as { id: string }
    const submissions = (await getSubmissions()) as Submission[]
    const filtered = submissions.filter((s: Submission) => s.id !== id)
    await saveSubmissions(filtered)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting submission:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}