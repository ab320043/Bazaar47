// app/staff/(app)/layout.tsx
import { redirect } from 'next/navigation'
import { getStaffSession } from '@/lib/staff/auth'

export default async function StaffAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getStaffSession()

  if (!session) {
    redirect('/staff/login')
  }

  return (
    <div className="min-h-screen bg-plaster">
      {children}
    </div>
  )
}