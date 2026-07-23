import { NextRequest, NextResponse } from 'next/server'
import { getSubmissions, saveSubmissions } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, type } = body

    const submissions = await getSubmissions()

    const newSubmission = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: type || 'vendor',
      data: data,
    }

    submissions.push(newSubmission)
    await saveSubmissions(submissions)

    return NextResponse.json({ success: true, id: newSubmission.id })
  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    )
  }
}