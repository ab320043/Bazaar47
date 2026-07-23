import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import fs from 'fs'
import path from 'path'

// Use a different approach for reading/writing files in Next.js App Router
const DATA_FILE = path.join(process.cwd(), 'data', 'submissions.json')

type Submission = { id: string } & Record<string, unknown>

function getSubmissions(): Submission[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return []
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(content) as Submission[]
  } catch {
    return []
  }
}

function deleteSubmission(id: string) {
  const submissions = getSubmissions()
  const filtered = submissions.filter((s: Submission) => s.id !== id)
  fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2))
}

export async function GET() {
  // Check authentication
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const submissions = getSubmissions()
    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error reading submissions:', error)
    return NextResponse.json({ submissions: [] }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  // Check authentication
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await request.json()
    deleteSubmission(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting submission:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}