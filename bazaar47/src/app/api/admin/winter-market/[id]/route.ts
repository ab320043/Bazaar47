// app/api/admin/winter-market/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { deleteApplication } from '@/lib/storage/winter-market'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const deleted = await deleteApplication(id)
    
    if (!deleted) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete application error:', error)
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    )
  }
}