import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'submissions.json')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, type } = body

    let submissions = []
    try {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf-8')
        submissions = JSON.parse(content)
      }
    } catch (e) {
      submissions = []
    }

    const newSubmission = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: type || 'vendor',
      data: data,
    }
    submissions.push(newSubmission)

    fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2))

    return NextResponse.json({ success: true, id: newSubmission.id })
  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    )
  }
}