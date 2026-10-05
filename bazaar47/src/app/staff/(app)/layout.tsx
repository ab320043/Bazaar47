// app/staff/(app)/layout.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentStaff } from '@/lib/staff/auth'
import { StaffSidebar } from '@/app/staff/components/StaffSidebar'
import { StaffMobileTopBar } from '@/app/staff/components/StaffMobileTopBar'

export const metadata: Metadata = {
  title: 'Staff Portal — Bazaar47',
  description: 'View your shifts, payroll, checklist, and notes.',
  robots: { index: false, follow: false },
}

export default async function StaffAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const current = await getCurrentStaff({ refresh: false })

  if (!current) {
    redirect('/staff/login')
  }

  return (
    <div className="min-h-screen bg-plaster">
      <StaffSidebar staff={current.staff} />
      <StaffMobileTopBar staff={current.staff} />
      <main className="ml-16 md:ml-56 min-h-screen">
        {children}
      </main>
    </div>
  )
}