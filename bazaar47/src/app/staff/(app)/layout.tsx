// app/staff/(app)/layout.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getStaffSession } from '@/lib/staff/auth'

export const metadata: Metadata = {
  title: 'Staff Portal — Bazaar47',
  description: 'Sign in to view your shifts and clock in or out.',
  openGraph: {
    title: 'Staff Portal — Bazaar47',
    description: 'Sign in to view your shifts and clock in or out.',
    url: 'https://bazaar47.com/staff/login',
    siteName: 'Bazaar47',
    type: 'website',
    images: [
      {
        url: '/images/thumbnail.png',
        width: 1200,
        height: 630,
        alt: 'Bazaar47 — Staff Portal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Staff Portal — Bazaar47',
    description: 'Sign in to view your shifts and clock in or out.',
    images: ['/images/thumbnail.png'],
  },
}

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