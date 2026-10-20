// app/staff/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bazaar47 Staff',
  manifest: '/staff.webmanifest',
}

export default function StaffRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}