import type { Metadata } from 'next'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { redirect } from 'next/navigation'
import { AdminSidebar } from './components/AdminSidebar'

export const metadata: Metadata = {
  title: 'Bazaar 47 Admin',
  icons: {
    icon: '/icons/favicon.ico',
  },
  openGraph: {
    title: 'Bazaar 47',
    description: 'Where Palestinian heritage meets Florida warmth',
    url: 'https://bazaar47.com',
    siteName: 'Bazaar 47',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication - redirect to /login if not authenticated
  if (!isAdminAuthenticated()) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-plaster">
      <AdminSidebar />
      <main className="ml-16 md:ml-56 min-h-screen">
        {children}
      </main>
    </div>
  )
}