import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AdminSidebar } from './components/AdminSidebar'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: 'Bazaar 47 Admin',
  icons: {
    icon: '/icons/favicon.ico',
  },
}

async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('admin_session')
    return session?.value === 'authenticated'
  } catch {
    return false
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
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