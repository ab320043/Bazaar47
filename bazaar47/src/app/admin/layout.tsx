import type { Metadata } from 'next'

import { isAdminAuthenticated } from '@/lib/admin/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, BarChart3 } from 'lucide-react'
import { LogoutButton } from './components/LogoutButton'




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
  if (!isAdminAuthenticated()) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-plaster">
      <aside className="fixed left-0 top-0 h-full w-16 md:w-56 bg-rosewood text-plaster z-50 flex flex-col">
        <div className="p-4 border-b border-plaster/10">
          <h1 className="font-host-grotesk-narrow font-bold text-sm md:text-lg hidden md:block">
            Bazaar47 Admin
          </h1>
          <span className="font-host-grotesk-narrow font-bold text-sm md:hidden">B47</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            href="/admin" 
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-plaster/10 transition-all text-sm"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="hidden md:block">Dashboard</span>
          </Link>
          {/* <Link 
            href="/admin/statistics" 
            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-plaster/10 transition-all text-sm"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="hidden md:block">Statistics</span>
          </Link> */}
        </nav>
        
        <div className="p-4 border-t border-plaster/10">
          <LogoutButton />
        </div>
      </aside>
      
      <main className="ml-16 md:ml-56 min-h-screen">
        {children}
      </main>
    </div>
  )
}